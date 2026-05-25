import React from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from '@/components/ui/MotiView';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { fetcher } from '@/lib/api';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  GRADIENTS,
  RADIUS,
  SHADOW,
  SPACING,
} from '@/constants/theme';

// ─── Mock data ────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'COMMISSION';
  amount: number;
  description: string;
  date: string;
};

type WalletSummary = {
  balance: number;
  pendingPayout: number;
  totalEarned: number;
  transactions?: Transaction[];
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'CREDIT',     amount: 2800, description: 'دفعة طلب ORD-1042',  date: '2026-05-22' },
  { id: 't2', type: 'COMMISSION', amount: 140,  description: 'عمولة المنصة',       date: '2026-05-22' },
  { id: 't3', type: 'CREDIT',     amount: 1950, description: 'دفعة طلب ORD-1038',  date: '2026-05-19' },
  { id: 't4', type: 'COMMISSION', amount: 97,   description: 'عمولة المنصة',       date: '2026-05-19' },
  { id: 't5', type: 'CREDIT',     amount: 3400, description: 'دفعة طلب ORD-1031',  date: '2026-05-15' },
];

const MOCK_WALLET: WalletSummary = {
  balance:        8013,
  pendingPayout:  2800,
  totalEarned:   21450,
  transactions:  MOCK_TRANSACTIONS,
};

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ item }: { item: Transaction }) {
  const isCredit = item.type === 'CREDIT';

  const iconName: React.ComponentProps<typeof Ionicons>['name'] = isCredit
    ? 'arrow-up-circle'
    : item.type === 'DEBIT'
    ? 'arrow-down-circle'
    : 'remove-circle';

  const iconColor   = isCredit ? COLORS.success : COLORS.danger;
  const amountColor = isCredit ? COLORS.success : COLORS.danger;
  const sign        = isCredit ? '+' : '-';

  const dateLabel = new Date(item.date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconCircle, { backgroundColor: isCredit ? COLORS.successLight : COLORS.dangerLight }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc}>{item.description}</Text>
        <Text style={styles.txDate}>{dateLabel}</Text>
      </View>
      <Text style={[styles.txAmount, { color: amountColor }]}>
        {sign}{item.amount.toLocaleString('ar-SA')} ر.س
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const { data: wallet, isLoading, refetch, isRefetching } = useQuery<WalletSummary>({
    queryKey: ['carrier-wallet'],
    queryFn: async () => {
      if (__DEV__) return MOCK_WALLET;
      return fetcher<WalletSummary>('/wallet');
    },
    retry: false,
  });

  if (isLoading) return <LoadingScreen label="جارٍ تحميل المحفظة..." />;

  const balance       = wallet?.balance       ?? 0;
  const pending       = wallet?.pendingPayout ?? 0;
  const total         = wallet?.totalEarned   ?? 0;
  const txs: Transaction[] = wallet?.transactions ?? [];

  // Header component for FlashList
  const ListHeader = (
    <View style={styles.listHeaderWrap}>
      {/* ── Balance GradientCard ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 450 }}
        style={styles.balanceMotiWrap}
      >
        <LinearGradient
          colors={GRADIENTS.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>الرصيد المتاح</Text>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14, delay: 150 }}
          >
            <Text style={styles.balanceAmount}>
              {balance.toLocaleString('ar-SA')}
              <Text style={styles.balanceCurrency}> ر.س</Text>
            </Text>
          </MotiView>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceStats}>
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatValue}>
                {pending.toLocaleString('ar-SA')} ر.س
              </Text>
              <Text style={styles.balanceStatLabel}>قيد الصرف</Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatValue}>
                {total.toLocaleString('ar-SA')} ر.س
              </Text>
              <Text style={styles.balanceStatLabel}>إجمالي الأرباح</Text>
            </View>
          </View>
        </LinearGradient>
      </MotiView>

      {/* ── Coming Soon notice ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={styles.noticeCard}
      >
        <Text style={styles.noticeEmoji}>🚀</Text>
        <Text style={styles.noticeTitle}>ميزة السحب قيد التطوير</Text>
        <Text style={styles.noticeText}>
          قريباً ستتمكن من سحب أرباحك ومتابعة مدفوعاتك مباشرةً من هذه الشاشة.
        </Text>
      </MotiView>

      {txs.length > 0 ? (
        <Text style={styles.sectionTitle}>آخر المعاملات</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient
        colors={GRADIENTS.dark as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>المحفظة</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="wallet-outline" size={22} color={COLORS.primary} />
        </View>
      </LinearGradient>

      <FlashList
        data={txs}
        keyExtractor={(item) => item.id}
        estimatedItemSize={64}
        renderItem={({ item }) => <TransactionRow item={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: SPACING['3xl'] }} />}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.title,
    color: COLORS.text,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // List
  listContent: {
    padding: SPACING.lg,
  },
  listHeaderWrap: {
    gap: SPACING.lg,
    paddingBottom: SPACING.sm,
  },

  // Balance card
  balanceMotiWrap: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...(SHADOW.primary as object),
  },
  balanceCard: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING['2xl'],
    gap: SPACING.sm,
  },
  balanceLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.display,
    color: COLORS.white,
    marginTop: 2,
  },
  balanceCurrency: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.heading,
    color: 'rgba(255,255,255,0.75)',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: SPACING.sm,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  balanceStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceStatValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.white,
  },
  balanceStatLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: 'rgba(255,255,255,0.7)',
  },

  // Notice card
  noticeCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
  },
  noticeEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  noticeTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  noticeText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Section title
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Transaction row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.lg,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
  },
  txDate: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
  },
  txAmount: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.label,
  },

});
