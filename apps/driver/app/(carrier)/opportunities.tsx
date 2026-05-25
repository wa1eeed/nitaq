import React, { useRef, useState, useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from '@/components/ui/MotiView';
import BidBottomSheet from '@/components/sheets/BidBottomSheet';
import { AnimatedStatusBadge } from '@/components/ui/AnimatedStatusBadge';
import { SkeletonOrderList } from '@/components/ui/SkeletonLoader';
import { fetcher } from '@/lib/api';
import { MOCK_OPPORTUNITIES } from '@/lib/mockData';
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

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  originAddress?: string;
  destinationAddress?: string;
  scheduledAt?: string;
  pickupDate: string;
  totalPrice: number;
  clientBudget?: number | null;
  weight?: number;
  cargoDescription?: string;
  requiredTruckType?: string;
  bids?: { id: string; price: number; carrierId: string; status: string }[];
};

// ─── Cargo icon helper ────────────────────────────────────────────────────────

function cargoIcon(description?: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (!description) return 'cube-outline';
  if (description.includes('إلكترون') || description.includes('حاسب') || description.includes('شاش'))
    return 'laptop-outline';
  if (description.includes('طب') || description.includes('صيدل'))
    return 'medkit-outline';
  if (
    description.includes('بناء') ||
    description.includes('حديد') ||
    description.includes('أسمنت') ||
    description.includes('بلاط') ||
    description.includes('خشب') ||
    description.includes('ألمنيوم')
  )
    return 'construct-outline';
  if (description.includes('أثاث') || description.includes('ديكور'))
    return 'home-outline';
  if (
    description.includes('غذا') ||
    description.includes('عطور') ||
    description.includes('توابل')
  )
    return 'nutrition-outline';
  if (description.includes('ملابس') || description.includes('أقمشة'))
    return 'shirt-outline';
  return 'cube-outline';
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

type CardProps = {
  order: Order;
  onBid: (order: Order) => void;
};

function OpportunityCard({ order, onBid }: CardProps) {
  const budget = order.clientBudget ?? order.totalPrice;
  const icon = cargoIcon(order.cargoDescription);
  const bidCount = order.bids?.length ?? 0;

  const scheduledDate = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleDateString('ar-SA', {
        day: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={GRADIENTS.card as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <AnimatedStatusBadge status={order.status} size="sm" />
          <View style={styles.cardHeaderRight}>
            {bidCount > 0 && (
              <View style={styles.bidsChip}>
                <Ionicons name="people" size={11} color={COLORS.warning} />
                <Text style={styles.bidsChipText}>{bidCount} عروض</Text>
              </View>
            )}
            <Text style={styles.orderNum}>{order.orderNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routeEndpoint}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.routeCity}>{order.originCity}</Text>
          </View>
          <Ionicons name="arrow-back" size={18} color={COLORS.textMuted} />
          <View style={styles.routeEndpoint}>
            <Ionicons name="flag" size={16} color={COLORS.success} />
            <Text style={styles.routeCity}>{order.destinationCity}</Text>
          </View>
        </View>

        {/* Cargo */}
        {order.cargoDescription ? (
          <View style={styles.cargoRow}>
            <Ionicons name={icon} size={15} color={COLORS.textMuted} />
            <Text style={styles.cargoText} numberOfLines={1}>
              {order.cargoDescription}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          {order.weight ? (
            <View style={styles.metaItem}>
              <Ionicons name="scale-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{order.weight.toLocaleString('ar')} كغ</Text>
            </View>
          ) : null}
          {scheduledDate ? (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{scheduledDate}</Text>
            </View>
          ) : null}
          {order.requiredTruckType ? (
            <View style={styles.truckChip}>
              <Text style={styles.truckChipText}>{order.requiredTruckType}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Budget */}
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>السعر المقترح</Text>
          <Text style={styles.budgetValue}>
            {budget.toLocaleString('ar-SA')}{' '}
            <Text style={styles.budgetCurrency}>ر.س</Text>
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onBid(order);
          }}
        >
          <Ionicons name="send" size={15} color={COLORS.primary} />
          <Text style={styles.ctaText}>اعرض سعرك</Text>
          <Ionicons name="chevron-back" size={15} color={COLORS.primary} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function OpportunitiesScreen() {
  const queryClient = useQueryClient();
  const bidSheetRef = useRef<BottomSheet>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);

  const { data: orders, isLoading, refetch, isRefetching } = useQuery<Order[]>({
    queryKey: ['carrier-opportunities'],
    queryFn: async () => {
      if (__DEV__) return MOCK_OPPORTUNITIES as unknown as Order[];
      const res = await fetcher<any>('/orders?status=PENDING&limit=30');
      return Array.isArray(res) ? res : (res as any)?.items ?? [];
    },
    refetchInterval: __DEV__ ? false : 30_000,
  });

  const list = orders ?? [];

  // Build unique city filter list
  const cities = Array.from(
    new Set(list.flatMap((o) => [o.originCity, o.destinationCity])),
  ).sort();

  const filtered =
    filterCity === null
      ? list
      : list.filter(
          (o) => o.originCity === filterCity || o.destinationCity === filterCity,
        );

  const handleBid = useCallback((order: Order) => {
    setSelectedOrder(order);
    bidSheetRef.current?.snapToIndex(0);
  }, []);

  const handleBidSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['carrier-opportunities'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient
        colors={GRADIENTS.dark as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>الفرص المتاحة</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filtered.length}</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>اختر وقدّم عرض سعر</Text>
        </View>
      </LinearGradient>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          style={[styles.chip, filterCity === null && styles.chipActive]}
          onPress={() => setFilterCity(null)}
        >
          <Text style={[styles.chipText, filterCity === null && styles.chipTextActive]}>
            الكل
          </Text>
        </Pressable>
        {cities.map((city) => (
          <Pressable
            key={city}
            style={[styles.chip, filterCity === city && styles.chipActive]}
            onPress={() => setFilterCity(filterCity === city ? null : city)}
          >
            <Text
              style={[styles.chipText, filterCity === city && styles.chipTextActive]}
            >
              {city}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── List ── */}
      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonOrderList />
        </View>
      ) : filtered.length === 0 ? (
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.emptyWrap}
        >
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>لا توجد فرص</Text>
          <Text style={styles.emptyHint}>اسحب للأسفل لتحديث القائمة</Text>
        </MotiView>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          estimatedItemSize={140}
          renderItem={({ item }) => (
            <OpportunityCard order={item} onBid={handleBid} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Bid Bottom Sheet ── */}
      <BidBottomSheet
        ref={bidSheetRef}
        order={selectedOrder}
        onSuccess={handleBidSuccess}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.title,
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Filter chips
  filterScroll: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // List
  skeletonWrap: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  listContent: {
    padding: SPACING.sm,
    paddingBottom: SPACING['3xl'],
  },

  // Opportunity Card
  card: {
    margin: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.md as object),
  },
  cardGradient: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  orderNum: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },
  bidsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  bidsChipText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.micro,
    color: COLORS.warning,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Route
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  routeEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  routeCity: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
  },

  // Cargo
  cargoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cargoText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },
  truckChip: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  truckChipText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textSecondary,
  },

  // Budget
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
  },
  budgetValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.primary,
  },
  budgetCurrency: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  ctaPressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(10,126,164,0.08)',
  },
  ctaText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING['3xl'],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
