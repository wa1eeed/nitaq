import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { fetcher, apiError } from '@/lib/api';
import { AnimatedStatusBadge } from '@/components/ui/AnimatedStatusBadge';
import { OrderProgressBar } from '@/components/ui/OrderProgressBar';
import { ActionButton } from '@/components/ui/ActionButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MOCK_ORDERS } from '@/lib/mockData';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  GRADIENTS,
  RADIUS,
  SHADOW,
  SPACING,
} from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackingEvent = {
  id: string;
  event: string;
  notes?: string;
  createdAt: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  originAddress?: string;
  destinationAddress?: string;
  scheduledAt?: string;
  totalPrice: number;
  weight?: number;
  cargoDescription?: string;
  trackingEvents?: TrackingEvent[];
};

// ─── City coordinates lookup ─────────────────────────────────────────────────

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'الرياض':          { lat: 24.7136, lng: 46.6753 },
  'جدة':             { lat: 21.3891, lng: 39.8579 },
  'الدمام':          { lat: 26.4207, lng: 50.0888 },
  'مكة المكرمة':     { lat: 21.3891, lng: 39.8579 },
  'المدينة المنورة': { lat: 24.4672, lng: 39.6151 },
  'أبها':            { lat: 18.2164, lng: 42.5053 },
  'تبوك':            { lat: 28.3998, lng: 36.5715 },
  'الطائف':          { lat: 21.2854, lng: 40.4152 },
};

function getCoords(city: string) {
  return CITY_COORDS[city] ?? { lat: 24.7136, lng: 46.6753 };
}

// ─── Marker views ─────────────────────────────────────────────────────────────

function OriginMarker() {
  return (
    <View style={mStyles.origin}>
      <Ionicons name="location" size={16} color={COLORS.white} />
    </View>
  );
}
function DestMarker() {
  return (
    <View style={mStyles.dest}>
      <Ionicons name="flag" size={14} color={COLORS.white} />
    </View>
  );
}
const mStyles = StyleSheet.create({
  origin: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 6, elevation: 5,
  },
  dest: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 6, elevation: 5,
  },
});

// ─── Info row helper ──────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>
        <Ionicons
          name={icon}
          size={16}
          color={highlight ? COLORS.primary : COLORS.textMuted}
        />
      </View>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, highlight && infoStyles.highlight]}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  iconWrap: { width: 24 },
  label: {
    fontFamily: FONTS.regular, fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted, flex: 1,
  },
  value: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZE.caption,
    color: COLORS.text, textAlign: 'right',
  },
  highlight: {
    fontFamily: FONTS.bold, fontSize: FONT_SIZE.body,
    color: COLORS.primary,
  },
});

// ─── Tracking event labels / icons ───────────────────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  PICKED_UP:      'تم الاستلام من المرسل',
  IN_TRANSIT:     'الشحنة في الطريق',
  DELIVERED:      'تم التسليم للمستلم',
  COMPLETED:      'اكتمل الطلب',
  ISSUE_REPORTED: 'تم الإبلاغ عن مشكلة',
};

const EVENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  PICKED_UP:      'checkmark-circle',
  IN_TRANSIT:     'navigate',
  DELIVERED:      'flag',
  COMPLETED:      'trophy',
  ISSUE_REPORTED: 'warning',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DriverOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [locating, setLocating] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['driver-order', id],
    queryFn: async () => {
      if (__DEV__) {
        const found = MOCK_ORDERS.find((o) => o.id === id);
        return (found ?? MOCK_ORDERS[0]) as unknown as Order;
      }
      return fetcher(`/orders/${id}`);
    },
    refetchInterval: __DEV__ ? false : 15_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const onDevSuccess = (label: string) => {
    Alert.alert('✅ تم', `${label} — تم في وضع التطوير`);
  };

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (__DEV__) return Promise.resolve();
      return fetcher(`/orders/${id}/confirm`, { method: 'POST' } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-order', id] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (__DEV__) onDevSuccess('تأكيد الاستلام');
    },
    onError: (err) => Alert.alert('خطأ', __DEV__ ? String(err) : apiError(err)),
  });

  const trackingMutation = useMutation({
    mutationFn: (event: string) => {
      if (__DEV__) return Promise.resolve();
      return fetcher(`/orders/${id}/tracking`, { method: 'POST', data: { event } } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-order', id] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (__DEV__) onDevSuccess('بدء الرحلة');
    },
    onError: (err) => Alert.alert('خطأ', __DEV__ ? String(err) : apiError(err)),
  });

  const deliverMutation = useMutation({
    mutationFn: () => {
      if (__DEV__) return Promise.resolve();
      return fetcher(`/orders/${id}/deliver`, { method: 'POST' } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-order', id] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ تم التسليم', 'تم تأكيد تسليم الشحنة بنجاح.');
    },
    onError: (err) => Alert.alert('خطأ', __DEV__ ? String(err) : apiError(err)),
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    Alert.alert(
      'تأكيد الاستلام',
      `هل استلمت الشحنة من ${order?.originCity}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', onPress: () => confirmMutation.mutate() },
      ],
    );
  };

  const handleStartTrip = () => {
    Alert.alert(
      'بدء الرحلة',
      'هل انطلقت فعلاً بالشحنة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'نعم، ابدأ', onPress: () => trackingMutation.mutate('PICKED_UP') },
      ],
    );
  };

  const handleDeliver = () => {
    Alert.alert(
      'تأكيد التسليم',
      `هل سلّمت الشحنة للمستلم في ${order?.destinationCity}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'نعم، تم التسليم', onPress: () => deliverMutation.mutate() },
      ],
    );
  };

  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'يحتاج التطبيق إذن الموقع للملاحة');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setMyLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert('خطأ', 'تعذّر تحديد موقعك الحالي');
    } finally {
      setLocating(false);
    }
  };

  const openNavigation = () => {
    if (!order) return;
    const dest = getCoords(order.destinationCity);
    const destStr = order.destinationAddress
      ? encodeURIComponent(`${order.destinationAddress}، ${order.destinationCity}`)
      : encodeURIComponent(`${order.destinationCity}، المملكة العربية السعودية`);

    const url = myLocation
      ? `https://www.google.com/maps/dir/${myLocation.lat},${myLocation.lng}/${destStr}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destStr}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('خطأ', 'تعذّر فتح تطبيق الخرائط'),
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading || !order) return <LoadingScreen label="جارٍ التحميل..." />;

  // ── Map computation ────────────────────────────────────────────────────────

  const origin = getCoords(order.originCity);
  const dest   = getCoords(order.destinationCity);
  const midLat = (origin.lat + dest.lat) / 2;
  const midLng = (origin.lng + dest.lng) / 2;

  const mapRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.abs(origin.lat - dest.lat) * 1.5 + 0.5,
    longitudeDelta: Math.abs(origin.lng - dest.lng) * 1.5 + 0.5,
  };

  const polylineCoords = [
    { latitude: origin.lat, longitude: origin.lng },
    { latitude: dest.lat,   longitude: dest.lng },
  ];

  const showActions = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status);
  const events      = [...(order.trackingEvents ?? [])].reverse().slice(0, 2);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* ── Full-screen map hero ── */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={mapRegion}
          mapType="standard"
          userInterfaceStyle="dark"
          showsUserLocation
          showsCompass={false}
          showsPointsOfInterest={false}
        >
          <Polyline
            coordinates={polylineCoords}
            strokeColor={COLORS.primary}
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
          <Marker
            coordinate={{ latitude: origin.lat, longitude: origin.lng }}
            title={`الاستلام: ${order.originCity}`}
            description={order.originAddress}
          >
            <OriginMarker />
          </Marker>
          <Marker
            coordinate={{ latitude: dest.lat, longitude: dest.lng }}
            title={`التسليم: ${order.destinationCity}`}
            description={order.destinationAddress}
          >
            <DestMarker />
          </Marker>
        </MapView>

        {/* Back button overlay */}
        <Pressable
          style={[styles.backBtn, { top: insets.top + 16 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-forward" size={22} color={COLORS.text} />
        </Pressable>

        {/* Status badge overlay */}
        <View style={[styles.statusOverlay, { top: insets.top + 16 }]}>
          <AnimatedStatusBadge status={order.status} />
        </View>
      </View>

      {/* ── Bottom info panel ── */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient
          colors={GRADIENTS.card as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.panelGradient}
        >
          {/* Order number + progress */}
          <View style={styles.panelHeader}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          </View>

          <OrderProgressBar status={order.status} />

          {/* Route mini */}
          <View style={styles.routeMini}>
            <View style={styles.routeMiniCity}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeMiniLabel}>الانطلاق</Text>
                <Text style={styles.routeMiniCity2} numberOfLines={1}>
                  {order.originCity}
                </Text>
                {order.originAddress && (
                  <Text style={styles.routeMiniAddr} numberOfLines={1}>
                    {order.originAddress}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.routeVertLine} />

            <View style={styles.routeMiniCity}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeMiniLabel}>الوجهة</Text>
                <Text style={styles.routeMiniCity2} numberOfLines={1}>
                  {order.destinationCity}
                </Text>
                {order.destinationAddress && (
                  <Text style={styles.routeMiniAddr} numberOfLines={1}>
                    {order.destinationAddress}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Key info row */}
          <View style={styles.keyInfoRow}>
            {order.weight != null && (
              <View style={styles.keyInfoChip}>
                <Ionicons name="barbell-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.keyInfoText}>{order.weight} كغ</Text>
              </View>
            )}
            <View style={styles.keyInfoChip}>
              <Ionicons name="cash-outline" size={13} color={COLORS.primary} />
              <Text style={[styles.keyInfoText, { color: COLORS.primary }]}>
                {order.totalPrice.toLocaleString('ar-SA')} ر.س
              </Text>
            </View>
            {order.cargoDescription && (
              <View style={[styles.keyInfoChip, { flex: 1 }]}>
                <Ionicons name="cube-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.keyInfoText} numberOfLines={1}>
                  {order.cargoDescription}
                </Text>
              </View>
            )}
          </View>

          {/* Mini tracking timeline (last 2 events) */}
          {events.length > 0 && (
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>آخر أحداث التتبع</Text>
              {events.map((ev, idx) => (
                <View key={ev.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, idx === 0 && styles.timelineDotActive]}>
                      <Ionicons
                        name={EVENT_ICON[ev.event] ?? 'ellipse'}
                        size={idx === 0 ? 8 : 6}
                        color={COLORS.white}
                      />
                    </View>
                    {idx < events.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, idx === 0 && { color: COLORS.primary }]}>
                      {EVENT_LABEL[ev.event] ?? ev.event}
                    </Text>
                    {ev.notes && (
                      <Text style={styles.timelineNotes} numberOfLines={1}>{ev.notes}</Text>
                    )}
                    <Text style={styles.timelineDate}>
                      {new Date(ev.createdAt).toLocaleString('ar-SA', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Navigation buttons */}
          <View style={styles.navButtons}>
            <Pressable style={styles.navBtn} onPress={openNavigation}>
              <Ionicons name="navigate" size={16} color={COLORS.white} />
              <Text style={styles.navBtnText}>ابدأ التنقل</Text>
            </Pressable>

            <Pressable style={styles.locateBtn} onPress={getMyLocation} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="locate" size={16} color={COLORS.primary} />
              )}
              <Text style={styles.locateBtnText}>
                {myLocation
                  ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}`
                  : 'تحديد موقعي'}
              </Text>
            </Pressable>
          </View>

          {/* Action buttons */}
          {showActions && (
            <View style={styles.actions}>
              {order.status === 'ASSIGNED' && (
                <ActionButton
                  label="تأكيد الاستلام"
                  variant="success"
                  icon="checkmark-circle"
                  size="lg"
                  loading={confirmMutation.isPending}
                  onPress={handleConfirm}
                />
              )}
              {order.status === 'CONFIRMED' && (
                <ActionButton
                  label="بدأت الرحلة"
                  variant="primary"
                  icon="navigate"
                  size="lg"
                  loading={trackingMutation.isPending}
                  onPress={handleStartTrip}
                />
              )}
              {order.status === 'IN_TRANSIT' && (
                <ActionButton
                  label="تأكيد التسليم"
                  variant="success"
                  icon="flag"
                  size="lg"
                  loading={deliverMutation.isPending}
                  onPress={handleDeliver}
                />
              )}
            </View>
          )}
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Map
  mapContainer: {
    flex: 1,
    minHeight: 300,
  },
  map: {
    flex: 1,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.md as object),
  },
  statusOverlay: {
    position: 'absolute',
    right: 16,
  },

  // Panel
  panel: {
    flexShrink: 0,
    maxHeight: '55%',
  },
  panelContent: {
    flexGrow: 1,
  },
  panelGradient: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: SPACING['2xl'],
  },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  orderNumber: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
  },

  // Route mini
  routeMini: {
    gap: 0,
    marginVertical: SPACING.xs,
  },
  routeMiniCity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 14,
  },
  routeMiniLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
  },
  routeMiniCity2: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
    marginTop: 1,
  },
  routeMiniAddr: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  routeVertLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 2,
  },

  // Key info
  keyInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  keyInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keyInfoText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textSecondary,
  },

  // Tracking timeline
  timelineSection: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: 2,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginTop: 3,
    minHeight: 16,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: SPACING.sm,
  },
  timelineLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.text,
  },
  timelineNotes: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  timelineDate: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  // Navigation buttons
  navButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    ...(SHADOW.primary as object),
  },
  navBtnText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.white,
  },
  locateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
  },
  locateBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.micro,
    color: COLORS.primary,
  },

  // Action button
  actions: {
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
});
