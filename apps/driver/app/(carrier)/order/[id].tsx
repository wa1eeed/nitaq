import {
  Alert, Linking, ScrollView, StyleSheet, Text, View,
  Pressable, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetcher, apiError } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { COLORS, FONTS, RADIUS, SHADOW } from '@/constants/theme';
import { MOCK_ORDERS } from '@/lib/mockData';

type TrackingEvent = { id: string; event: string; notes?: string; createdAt: string };
type Order = {
  id: string; orderNumber: string; status: string;
  originCity: string; destinationCity: string;
  originAddress?: string; destinationAddress?: string;
  scheduledAt?: string; totalPrice: number; commissionAmount?: number;
  weight?: number; cargoDescription?: string;
  trackingEvents?: TrackingEvent[];
  bids?: { id: string; price: number; notes?: string; status: string; carrierId: string }[];
};

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

const STEPS = [
  { key: 'ASSIGNED',   label: 'مُسند' },
  { key: 'CONFIRMED',  label: 'مؤكَّد' },
  { key: 'IN_TRANSIT', label: 'في الطريق' },
  { key: 'DELIVERED',  label: 'تم التسليم' },
];
const STEP_INDEX: Record<string, number> = {
  ASSIGNED: 0, CONFIRMED: 1, IN_TRANSIT: 2, DELIVERED: 3, COMPLETED: 3,
};

export default function CarrierOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmModal, setConfirmModal] = useState(false);
  const [locating, setLocating] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['carrier-order', id],
    queryFn: async () => {
      if (__DEV__) {
        const found = MOCK_ORDERS.find((o) => o.id === id);
        return (found ?? MOCK_ORDERS[0]) as unknown as Order;
      }
      return fetcher(`/orders/${id}`);
    },
    refetchInterval: __DEV__ ? false : 15_000,
  });

  const confirmMutation = useMutation({
    mutationFn: () => fetcher(`/orders/${id}/confirm`, { method: 'POST' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carrier-order', id] });
      queryClient.invalidateQueries({ queryKey: ['carrier-my-orders'] });
      setConfirmModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => Alert.alert('خطأ', apiError(err)),
  });

  const trackingMutation = useMutation({
    mutationFn: (event: string) =>
      fetcher(`/orders/${id}/tracking`, { method: 'POST', data: { event } } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carrier-order', id] });
      queryClient.invalidateQueries({ queryKey: ['carrier-my-orders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => Alert.alert('خطأ', apiError(err)),
  });

  const deliverMutation = useMutation({
    mutationFn: () => fetcher(`/orders/${id}/deliver`, { method: 'POST' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carrier-order', id] });
      queryClient.invalidateQueries({ queryKey: ['carrier-my-orders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ تم التسليم', 'تم تأكيد تسليم الشحنة بنجاح.');
    },
    onError: (err) => Alert.alert('خطأ', apiError(err)),
  });

  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('تنبيه', 'يحتاج التطبيق إذن الموقع للملاحة'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setMyLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { Alert.alert('خطأ', 'تعذّر تحديد موقعك'); }
    finally { setLocating(false); }
  };

  const openInMaps = (city: string, address?: string) => {
    const query = encodeURIComponent(`${address ? address + '، ' : ''}${city}، المملكة العربية السعودية`);
    Linking.canOpenURL('maps:?q=test').then((can) =>
      Linking.openURL(can ? `maps:?q=${query}` : `https://www.google.com/maps/search/?api=1&query=${query}`)
    );
  };

  const openNavigation = (city: string, address?: string) => {
    const dest = encodeURIComponent(`${address ? address + '، ' : ''}${city}، المملكة العربية السعودية`);
    Linking.openURL(
      myLocation
        ? `https://www.google.com/maps/dir/${myLocation.lat},${myLocation.lng}/${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    );
  };

  if (isLoading || !order) return <LoadingScreen label="جارٍ التحميل..." />;

  const stepIdx = STEP_INDEX[order.status] ?? 0;
  const showActions = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status);
  const events = [...(order.trackingEvents ?? [])].reverse();
  const myBid = order.bids?.find((b) => b.status === 'ACCEPTED') ?? order.bids?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-forward" size={22} color={COLORS.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{order.orderNumber}</Text>
          <Text style={styles.headerSub}>{order.originCity} ← {order.destinationCity}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Progress ── */}
        <View style={styles.progressCard}>
          {STEPS.map((step, idx) => {
            const done = idx < stepIdx;
            const active = idx === stepIdx;
            return (
              <View key={step.key} style={styles.stepWrapper}>
                {idx > 0 && (
                  <View style={[styles.stepConnector, (done || active) && styles.stepConnectorActive]} />
                )}
                <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                  {done
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{idx + 1}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Route & Maps ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>مسار الشحنة</Text>

          <View style={styles.locationRow}>
            <View style={[styles.locDot, { backgroundColor: COLORS.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>نقطة الاستلام</Text>
              <Text style={styles.locCity}>{order.originCity}</Text>
              {order.originAddress && <Text style={styles.locAddr}>{order.originAddress}</Text>}
            </View>
            <Pressable style={styles.mapChip} onPress={() => openInMaps(order.originCity, order.originAddress)}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.mapChipText}>خريطة</Text>
            </Pressable>
          </View>

          <View style={styles.routeVertLine} />

          <View style={styles.locationRow}>
            <View style={[styles.locDot, { backgroundColor: COLORS.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>نقطة التسليم</Text>
              <Text style={styles.locCity}>{order.destinationCity}</Text>
              {order.destinationAddress && <Text style={styles.locAddr}>{order.destinationAddress}</Text>}
            </View>
            <Pressable style={styles.mapChip} onPress={() => openInMaps(order.destinationCity, order.destinationAddress)}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.mapChipText}>خريطة</Text>
            </Pressable>
          </View>

          <Pressable style={styles.navigateBtn} onPress={() => openNavigation(order.destinationCity, order.destinationAddress)}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.navigateBtnText}>ابدأ التنقل للوجهة</Text>
          </Pressable>

          <Pressable style={styles.locateBtn} onPress={getMyLocation} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons name="locate" size={15} color={COLORS.primary} />}
            <Text style={styles.locateBtnText}>
              {myLocation ? `موقعي: ${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}` : 'تحديد موقعي الحالي'}
            </Text>
          </Pressable>
        </View>

        {/* ── Financial ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>التفاصيل المالية</Text>
          {order.cargoDescription && (
            <InfoRow icon="cube-outline" label="البضاعة" value={order.cargoDescription} />
          )}
          {order.weight != null && (
            <InfoRow icon="barbell-outline" label="الوزن" value={`${order.weight} كغ`} />
          )}
          <InfoRow
            icon="cash-outline"
            label="قيمة الطلب"
            value={`${order.totalPrice.toLocaleString('ar-SA')} ر.س`}
            highlight
          />
          {order.commissionAmount != null && (
            <InfoRow
              icon="remove-circle-outline"
              label="عمولة المنصة"
              value={`${order.commissionAmount.toLocaleString('ar-SA')} ر.س`}
            />
          )}
          {myBid && (
            <InfoRow
              icon="pricetag-outline"
              label="سعر عرضك"
              value={`${myBid.price.toLocaleString('ar-SA')} ر.س`}
            />
          )}
          {order.commissionAmount != null && myBid && (
            <InfoRow
              icon="wallet-outline"
              label="صافي الأرباح"
              value={`${(myBid.price - order.commissionAmount).toLocaleString('ar-SA')} ر.س`}
              highlight
            />
          )}
        </View>

        {/* ── Tracking ── */}
        {events.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>سجل التتبع</Text>
            {events.map((ev, idx) => (
              <View key={ev.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, idx === 0 && styles.timelineDotActive]}>
                    <Ionicons name={EVENT_ICON[ev.event] ?? 'ellipse'} size={idx === 0 ? 9 : 7} color="#fff" />
                  </View>
                  {idx < events.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, idx === 0 && { color: COLORS.primary }]}>
                    {EVENT_LABEL[ev.event] ?? ev.event}
                  </Text>
                  {ev.notes && <Text style={styles.timelineNotes}>{ev.notes}</Text>}
                  <Text style={styles.timelineDate}>
                    {new Date(ev.createdAt).toLocaleString('ar-SA', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Actions ── */}
        {showActions && (
          <View style={styles.actions}>
            {order.status === 'ASSIGNED' && (
              <Button label="تأكيد استلام الشحنة" onPress={() => setConfirmModal(true)} />
            )}
            {order.status === 'CONFIRMED' && (
              <Button
                label="بدأت الرحلة 🚚"
                variant="success"
                loading={trackingMutation.isPending}
                onPress={() => Alert.alert(
                  'بدء الرحلة', 'هل انطلقت فعلاً بالشحنة؟',
                  [
                    { text: 'إلغاء', style: 'cancel' },
                    { text: 'نعم، ابدأ', onPress: () => trackingMutation.mutate('PICKED_UP') },
                  ]
                )}
              />
            )}
            {order.status === 'IN_TRANSIT' && (
              <Button
                label="تأكيد التسليم 📦"
                variant="success"
                loading={deliverMutation.isPending}
                onPress={() => Alert.alert(
                  'تأكيد التسليم', 'هل تم تسليم الشحنة للعميل؟',
                  [
                    { text: 'إلغاء', style: 'cancel' },
                    { text: 'نعم، تم', onPress: () => deliverMutation.mutate() },
                  ]
                )}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Confirm Pickup Modal */}
      <Modal visible={confirmModal} transparent animationType="slide" onRequestClose={() => setConfirmModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setConfirmModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.sheetTitle}>تأكيد استلام الشحنة</Text>
          <Text style={styles.sheetBody}>
            بالضغط على تأكيد، أنت تُقر باستلام الشحنة وستصبح مسؤولاً عنها حتى التسليم.
          </Text>
          <View style={styles.sheetActions}>
            <Button label="تأكيد الاستلام" onPress={() => confirmMutation.mutate()} loading={confirmMutation.isPending} />
            <Button label="إلغاء" variant="outline" onPress={() => setConfirmModal(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, highlight }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={iStyles.row}>
      <Ionicons name={icon} size={16} color={highlight ? COLORS.primary : COLORS.textMuted} />
      <Text style={iStyles.label}>{label}</Text>
      <Text style={[iStyles.value, highlight && iStyles.highlight]}>{value}</Text>
    </View>
  );
}
const iStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  label: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, flex: 1 },
  value: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text, textAlign: 'right' },
  highlight: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.primary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
  headerSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  progressCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    paddingVertical: 20, paddingHorizontal: 12,
    flexDirection: 'row', ...SHADOW.sm,
  },
  stepWrapper: { flex: 1, alignItems: 'center', position: 'relative' },
  stepConnector: {
    position: 'absolute', top: 15, right: '50%',
    width: '100%', height: 2, backgroundColor: COLORS.border,
  },
  stepConnectorActive: { backgroundColor: COLORS.primary },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, zIndex: 1,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  stepDone: { backgroundColor: COLORS.primary },
  stepActive: { backgroundColor: COLORS.primary },
  stepNum: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.textMuted },
  stepLabel: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary, fontFamily: FONTS.semiBold },

  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.sm },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text, marginBottom: 12 },

  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  locDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  locLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  locCity: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginTop: 1 },
  locAddr: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  routeVertLine: { width: 2, height: 20, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 2 },

  mapChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  mapChipText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.primary },

  navigateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 13, marginTop: 14,
  },
  navigateBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },

  locateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingVertical: 10, marginTop: 8,
  },
  locateBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.primary },

  timelineRow: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  timelineDotActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4, minHeight: 24 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
  timelineNotes: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  timelineDate: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  actions: { gap: 10 },

  overlay: { flex: 1, backgroundColor: COLORS.overlay },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: 28, gap: 12, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 8,
  },
  sheetTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, textAlign: 'center' },
  sheetBody: {
    fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },
  sheetActions: { gap: 8, marginTop: 8 },
});
