import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from '@/components/ui/MotiView';
import { ActionButton } from '@/components/ui/ActionButton';
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

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
      onPress={onPress}
    >
      <View style={styles.settingsIconCircle}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CarrierProfileScreen() {
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false);
        },
      },
    ]);
  };

  const completedTrips = __DEV__
    ? MOCK_ORDERS.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length
    : 0;

  const initials =
    ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'ن';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Section ── */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.avatarSection}
        >
          {/* Gradient border ring */}
          <LinearGradient
            colors={GRADIENTS.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userPhone}>{user?.phone ?? '—'}</Text>

          {/* Role badge */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ناقل فرد</Text>
          </View>
        </MotiView>

        {/* ── Stats Row ── */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 80 }}
          style={styles.statsRow}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{completedTrips}</Text>
            <Text style={styles.statLabel}>الرحلات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>4.8 ★</Text>
            <Text style={styles.statLabel}>التقييم</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>8,013</Text>
            <Text style={styles.statLabel}>الأرباح (ر.س)</Text>
          </View>
        </MotiView>

        {/* ── Info Card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 120 }}
          style={styles.card}
        >
          <InfoRow label="رقم الجوال" value={user?.phone ?? '—'} />
          <InfoRow label="البريد الإلكتروني" value={(user as any)?.email ?? '—'} />
          <InfoRow label="الدور" value="ناقل فرد" />
        </MotiView>

        {/* ── Settings Card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 180 }}
          style={styles.card}
        >
          <SettingsRow icon="business-outline"   label="معلومات الشركة" />
          <SettingsRow icon="document-text-outline" label="الوثائق والتراخيص" />
          <SettingsRow icon="notifications-outline" label="الإشعارات" />
          <SettingsRow icon="lock-closed-outline"   label="تغيير كلمة المرور" />
          <SettingsRow icon="headset-outline"        label="الدعم الفني" />
        </MotiView>

        {/* ── Logout ── */}
        <ActionButton
          label="تسجيل الخروج"
          onPress={handleLogout}
          variant="danger"
          loading={loggingOut}
          icon="log-out-outline"
        />

        <Text style={styles.version}>نقلة · v1.0.0</Text>
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
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  avatarRing: {
    width: 98,
    height: 98,
    borderRadius: 49,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...(SHADOW.primary as object),
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bgCard,
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.white,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.title,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  userPhone: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 5,
    marginTop: 2,
  },
  roleBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.caption,
    color: COLORS.primary,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.micro,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(SHADOW.sm as object),
  },

  // InfoRow
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  infoValue: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginStart: SPACING.sm,
  },

  // SettingsRow
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingsRowPressed: {
    opacity: 0.7,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
    flex: 1,
  },

  // Version
  version: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
