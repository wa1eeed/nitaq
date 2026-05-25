import React from 'react';
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from '@/components/ui/MotiView';
import { GradientCard } from '@/components/ui/GradientCard';
import { AnimatedStatusBadge } from '@/components/ui/AnimatedStatusBadge';
import { SkeletonOrderList } from '@/components/ui/SkeletonLoader';
import { fetcher } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
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

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  totalPrice: number;
  agreedPrice?: number | null;
  clientBudget?: number | null;
  weight?: number;
  cargoDescription?: string;
  pickupDate: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || 'ن ق';
}

const ACTIVE_STATUSES = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'];

// ─── Active Order Card ────────────────────────────────────────────────────────

function ActiveOrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const price = order.agreedPrice ?? order.clientBudget ?? order.totalPrice;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
    >
      {/* Header row */}
      <View style={styles.orderCardHeader}>
        <AnimatedStatusBadge status={order.status} size="sm" />
        <Text style={styles.orderNum}>{order.orderNumber}</Text>
      </View>

      {/* Divider */}
      <View style={styles.dividerThin} />

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routeEndpoint}>
          <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.routeCity}>{order.originCity}</Text>
        </View>
        <Ionicons name="arrow-back" size={16} color={COLORS.textMuted} />
        <View style={styles.routeEndpoint}>
          <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.routeCity}>{order.destinationCity}</Text>
        </View>
      </View>

      {/* Cargo */}
      {order.cargoDescription ? (
        <Text style={styles.orderCargo} numberOfLines={1}>
          {order.cargoDescription}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.orderCardFooter}>
        <Text style={styles.orderPrice}>
          {price.toLocaleString('ar-SA')}{' '}
          <Text style={styles.orderPriceCurrency}>ر.س</Text>
        </Text>
        {order.weight ? (
          <View style={styles.weightChip}>
            <Ionicons name="scale-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.weightText}>{order.weight.toLocaleString('ar')} كغ</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CarrierHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: myOrders, isLoading, refetch, isRefetching } = useQuery<Order[]>({
    queryKey: ['carrier-my-orders'],
    queryFn: async () => {
      if (__DEV__) return MOCK_ORDERS as unknown as Order[];
      const res = await fetcher<any>('/orders?mine=true&limit=10');
      return Array.isArray(res) ? res : (res as any)?.items ?? [];
    },
  });

  const orders = myOrders ?? [];
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completed = orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length;
  const initials = getInitials(user?.firstName, user?.lastName);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient
        colors={GRADIENTS.dark as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={GRADIENTS.primary as [string, string]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userRole}>ناقل فرد</Text>
          </View>
        </View>
        <Pressable
          style={styles.notifBtn}
          onPress={() => Haptics.selectionAsync()}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
        </Pressable>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {/* نشطة */}
          <GradientCard gradient={GRADIENTS.card} style={styles.statCardInner} delay={0}>
            <Ionicons name="flash" size={18} color={COLORS.warning} />
            <Text style={[styles.statNum, { color: COLORS.warning }]}>{active.length}</Text>
            <Text style={styles.statLabel}>نشطة</Text>
          </GradientCard>

          {/* مكتملة */}
          <GradientCard gradient={GRADIENTS.card} style={styles.statCardInner} delay={60}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={[styles.statNum, { color: COLORS.success }]}>{completed}</Text>
            <Text style={styles.statLabel}>مكتملة</Text>
          </GradientCard>

          {/* إجمالي */}
          <GradientCard gradient={GRADIENTS.card} style={styles.statCardInner} delay={120}>
            <Ionicons name="layers" size={18} color={COLORS.primary} />
            <Text style={[styles.statNum, { color: COLORS.primary }]}>{orders.length}</Text>
            <Text style={styles.statLabel}>إجمالي</Text>
          </GradientCard>
        </View>

        {/* ── Active Orders ── */}
        {isLoading ? (
          <SkeletonOrderList />
        ) : active.length > 0 ? (
          <View style={styles.section}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الطلبات النشطة</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{active.length}</Text>
              </View>
            </View>

            {active.map((order) => (
              <ActiveOrderCard
                key={order.id}
                order={order}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/(carrier)/order/${order.id}` as any);
                }}
              />
            ))}
          </View>
        ) : (
          /* Empty State */
          <MotiView
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.emptyCard}
          >
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ loop: true, type: 'timing', duration: 1600, repeatReverse: true }}
            >
              <Text style={styles.emptyEmoji}>📭</Text>
            </MotiView>
            <Text style={styles.emptyTitle}>لا يوجد طلب نشط</Text>
            <Text style={styles.emptyHint}>استعرض الفرص واعرض سعرك</Text>
          </MotiView>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.white,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
  },
  userRole: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Content
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },

  // Stats row — three equal GradientCards
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCardInner: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  statNum: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
  },

  // Section
  section: {
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.micro,
    color: COLORS.primary,
  },

  // Active Order Card
  orderCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.md as object),
  },
  orderCardPressed: {
    opacity: 0.88,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNum: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },
  dividerThin: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  routeEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeCity: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
  },
  orderCargo: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
    marginTop: 2,
  },
  orderPrice: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.primary,
  },
  orderPriceCurrency: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },
  weightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  weightText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING['4xl'],
    paddingHorizontal: SPACING['3xl'],
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
    marginTop: SPACING.sm,
  },
  emptyEmoji: {
    fontSize: 52,
    lineHeight: 60,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
