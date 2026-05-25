import React, { useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView } from '@/components/ui/MotiView';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { fetcher } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { MOCK_ORDERS, type MockOrder } from '@/lib/mockData';
import { GradientCard } from '@/components/ui/GradientCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { AnimatedStatusBadge } from '@/components/ui/AnimatedStatusBadge';
import { OrderProgressBar } from '@/components/ui/OrderProgressBar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  RADIUS,
  SHADOW,
  SPACING,
  STATUS_LABEL,
} from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = MockOrder;

// ─── Constants ───────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.40);

const ACTIVE_STATUSES = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'الرياض':         { lat: 24.7136, lng: 46.6753 },
  'جدة':            { lat: 21.3891, lng: 39.8579 },
  'الدمام':         { lat: 26.4207, lng: 50.0888 },
  'مكة المكرمة':    { lat: 21.3891, lng: 39.8579 },
  'المدينة المنورة':{ lat: 24.4672, lng: 39.6151 },
  'أبها':           { lat: 18.2164, lng: 42.5053 },
  'تبوك':           { lat: 28.3998, lng: 36.5715 },
  'الطائف':         { lat: 21.2854, lng: 40.4152 },
};

const SAUDI_DEFAULT_REGION = {
  latitude: 24.0,
  longitude: 45.0,
  latitudeDelta: 14,
  longitudeDelta: 14,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCoords(city: string) {
  return CITY_COORDS[city] ?? { lat: 24.7136, lng: 46.6753 };
}

function getMapRegion(originCity: string, destCity: string) {
  const origin = getCoords(originCity);
  const dest   = getCoords(destCity);
  const midLat = (origin.lat + dest.lat) / 2;
  const midLng = (origin.lng + dest.lng) / 2;
  const latDelta = Math.abs(origin.lat - dest.lat) * 1.8 + 0.5;
  const lngDelta = Math.abs(origin.lng - dest.lng) * 1.8 + 0.5;
  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OriginMarkerView() {
  return (
    <View style={markerStyles.originContainer}>
      <Ionicons name="location" size={18} color={COLORS.white} />
    </View>
  );
}

function DestMarkerView() {
  return (
    <View style={markerStyles.destContainer}>
      <Ionicons name="flag" size={16} color={COLORS.white} />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  originContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  destContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
});

// ─── Map section ─────────────────────────────────────────────────────────────

function ActiveOrderMap({ order }: { order: Order }) {
  const origin = getCoords(order.originCity);
  const dest   = getCoords(order.destinationCity);
  const region = getMapRegion(order.originCity, order.destinationCity);

  return (
    <MapView
      style={{ width: '100%', height: MAP_HEIGHT }}
      provider={PROVIDER_DEFAULT}
      initialRegion={region}
      mapType="standard"
      userInterfaceStyle="dark"
      showsUserLocation
      showsCompass={false}
      showsPointsOfInterest={false}
    >
      <Marker
        coordinate={{ latitude: origin.lat, longitude: origin.lng }}
        title={`الاستلام: ${order.originCity}`}
        description={order.originAddress}
      >
        <OriginMarkerView />
      </Marker>
      <Marker
        coordinate={{ latitude: dest.lat, longitude: dest.lng }}
        title={`التسليم: ${order.destinationCity}`}
        description={order.destinationAddress}
      >
        <DestMarkerView />
      </Marker>
    </MapView>
  );
}

function EmptyMap() {
  return (
    <MapView
      style={{ width: '100%', height: MAP_HEIGHT }}
      provider={PROVIDER_DEFAULT}
      initialRegion={SAUDI_DEFAULT_REGION}
      mapType="standard"
      userInterfaceStyle="dark"
      showsUserLocation
      showsCompass={false}
    />
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <MotiView
        from={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1.05, opacity: 1 }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 1800,
          repeatReverse: true,
        }}
        style={styles.emptyIconContainer}
      >
        <Text style={styles.emptyEmoji}>🚛</Text>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 200 }}
      >
        <Text style={styles.emptyTitle}>لا يوجد طلب حالياً</Text>
        <Text style={styles.emptyHint}>ستُخطر عند وصول طلب جديد</Text>
      </MotiView>
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Active order action label ────────────────────────────────────────────────

function getActionProps(status: string): {
  label: string;
  variant: 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
  icon: React.ComponentProps<typeof Ionicons>['name'];
} {
  switch (status) {
    case 'ASSIGNED':
      return { label: 'تأكيد الاستلام', variant: 'success', icon: 'checkmark-circle' };
    case 'CONFIRMED':
      return { label: 'بدأت الرحلة', variant: 'primary', icon: 'navigate' };
    case 'IN_TRANSIT':
      return { label: 'تأكيد التسليم', variant: 'success', icon: 'flag' };
    default:
      return { label: 'عرض التفاصيل', variant: 'outline', icon: 'eye' };
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DriverHomeScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['driver-orders'],
    queryFn: async () => {
      if (__DEV__) return MOCK_ORDERS as Order[];
      const res = await fetcher<Order[] | { items?: Order[] }>('/orders?mine=true&limit=20');
      return Array.isArray(res) ? res : (res as any).items ?? [];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const orders = data ?? [];
  const active    = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completed = orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status));
  const history   = completed.slice(0, 3);

  // Primary active order: prefer IN_TRANSIT, else first active
  const activeOrder =
    active.find((o) => o.status === 'IN_TRANSIT') ?? active[0] ?? null;

  if (isLoading) return <LoadingScreen label="جارٍ تحميل طلباتك..." />;

  const firstName = user?.firstName ?? 'السائق';
  const actionProps = activeOrder ? getActionProps(activeOrder.status) : null;

  const handleAction = (order: Order) => {
    if (__DEV__) {
      Alert.alert('✅ تم', `تم في وضع التطوير\nالطلب: ${order.orderNumber}`);
      return;
    }
    // Production: navigate to detail where full action logic lives
    router.push(`/(driver)/order/${order.id}`);
  };

  return (
    <View style={styles.root}>
      {/* ── Map hero ── */}
      <View style={{ height: MAP_HEIGHT }}>
        {activeOrder ? <ActiveOrderMap order={activeOrder} /> : <EmptyMap />}
      </View>

      {/* ── Scrollable bottom content ── */}
      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Greeting row */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
                </Text>
              </View>
              <View>
                <Text style={styles.greetingName}>مرحباً، {firstName}</Text>
                <Text style={styles.greetingSub}>سائق معتمد</Text>
              </View>
            </View>
            <View style={styles.availablePill}>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>متاح</Text>
            </View>
          </View>

          {/* Active order card */}
          {activeOrder ? (
            <GradientCard delay={80}>
              {/* Order header */}
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderNumber}>{activeOrder.orderNumber}</Text>
                <AnimatedStatusBadge status={activeOrder.status} />
              </View>

              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.routeCity}>
                  <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.routeCityText} numberOfLines={1}>
                    {activeOrder.originCity}
                  </Text>
                </View>
                <Ionicons name="arrow-back" size={16} color={COLORS.textMuted} style={styles.routeArrow} />
                <View style={styles.routeCity}>
                  <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.routeCityText} numberOfLines={1}>
                    {activeOrder.destinationCity}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressWrap}>
                <OrderProgressBar status={activeOrder.status} />
              </View>

              {/* Cargo info */}
              {activeOrder.cargoDescription && (
                <View style={styles.cargoRow}>
                  <Ionicons name="cube-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.cargoText} numberOfLines={1}>
                    {activeOrder.cargoDescription}
                  </Text>
                  {activeOrder.weight && (
                    <Text style={styles.weightChip}>{activeOrder.weight} كغ</Text>
                  )}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.detailBtn}
                  onPress={() => router.push(`/(driver)/order/${activeOrder.id}`)}
                >
                  <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.detailBtnText}>عرض التفاصيل</Text>
                </Pressable>

                {actionProps && (
                  <View style={styles.actionBtnWrap}>
                    <ActionButton
                      label={actionProps.label}
                      variant={actionProps.variant}
                      icon={actionProps.icon}
                      size="sm"
                      onPress={() => handleAction(activeOrder)}
                    />
                  </View>
                )}
              </View>
            </GradientCard>
          ) : (
            <EmptyState />
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard
              label="نشطة"
              value={active.length}
              color={COLORS.primary}
              icon="flash"
            />
            <StatCard
              label="مكتملة"
              value={completed.length}
              color={COLORS.success}
              icon="checkmark-circle"
            />
            <StatCard
              label="الإجمالي"
              value={orders.length}
              color={COLORS.warning}
              icon="cube"
            />
          </View>

          {/* History */}
          {history.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={15} color={COLORS.textMuted} />
                <Text style={styles.sectionTitle}>آخر الرحلات</Text>
              </View>
              {history.map((order) => (
                <Pressable
                  key={order.id}
                  style={styles.historyCard}
                  onPress={() => router.push(`/(driver)/order/${order.id}`)}
                >
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIconWrap}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyOrderNum}>{order.orderNumber}</Text>
                      <Text style={styles.historyRoute} numberOfLines={1}>
                        {order.originCity} ← {order.destinationCity}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyPrice}>
                      {order.totalPrice.toLocaleString('ar-SA')} ر.س
                    </Text>
                    <View style={styles.historyStatusChip}>
                      <Text style={styles.historyStatusText}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeBottom: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING['2xl'] + 8,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  greetingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.label,
    color: COLORS.primary,
  },
  greetingName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
  },
  greetingSub: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  availableText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.success,
  },

  // Active order card internals
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  routeCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  routeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  routeCityText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.text,
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: 2,
  },
  progressWrap: {
    marginVertical: SPACING.xs,
  },
  cargoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: SPACING.xs,
  },
  cargoText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    flex: 1,
  },
  weightChip: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  detailBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.micro,
    color: COLORS.primary,
  },
  actionBtnWrap: { flex: 1 },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING['2xl'],
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS['2xl'],
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Section / history
  section: { gap: SPACING.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22,163,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyOrderNum: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.text,
  },
  historyRoute: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyPrice: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.primary,
  },
  historyStatusChip: {
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  historyStatusText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.micro,
    color: COLORS.success,
  },
});
