import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from '@/components/ui/MotiView';
import { useAuthStore } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { ActionButton } from '@/components/ui/ActionButton';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  GRADIENTS,
  RADIUS,
  SHADOW,
  SPACING,
} from '@/constants/theme';

// ─── Stagger helper ──────────────────────────────────────────────────────────

function stagger(index: number) {
  return { delay: index * 100 };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shake animation key: incrementing triggers re-animate
  const [shakeKey, setShakeKey] = useState(0);

  const passwordRef = useRef<TextInput>(null);

  const triggerShake = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setShakeKey((k) => k + 1);
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      setError('أدخل رقم الجوال وكلمة المرور');
      triggerShake();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      const msg = apiError(err);
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo area ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180, ...stagger(0) }}
          style={styles.logoWrap}
        >
          <LinearGradient
            colors={GRADIENTS.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBubble}
          >
            <Text style={styles.logoGlyph}>ن</Text>
          </LinearGradient>
        </MotiView>

        {/* ── App name ── */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, ...stagger(1) }}
          style={styles.nameWrap}
        >
          <Text style={styles.appName}>نقلة</Text>
          <Text style={styles.appSubtitle}>للسائقين والناقلين</Text>
        </MotiView>

        {/* ── Form card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, ...stagger(2) }}
          style={styles.card}
        >
          {/* Phone field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>رقم الجوال</Text>
            <View style={styles.phoneRow}>
              {/* Flag chip */}
              <View style={styles.flagChip}>
                <Text style={styles.flagEmoji}>🇸🇦</Text>
                <Text style={styles.countryCode}>+966</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                onChangeText={setPhone}
                placeholder="5xxxxxxxx"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                textAlign="right"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>كلمة المرور</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                textAlign="right"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* Error shake area */}
          {error !== '' && (
            <MotiView
              key={shakeKey}
              from={{ translateX: 0 }}
              animate={{
                translateX: [
                  { value: -8, type: 'timing', duration: 55 },
                  { value: 8,  type: 'timing', duration: 55 },
                  { value: -6, type: 'timing', duration: 55 },
                  { value: 6,  type: 'timing', duration: 55 },
                  { value: 0,  type: 'timing', duration: 55 },
                ],
              }}
              style={styles.errorBubble}
            >
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </MotiView>
          )}

          {/* Login button */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, ...stagger(3) }}
          >
            <ActionButton
              label="تسجيل الدخول"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={loading}
              icon="log-in-outline"
              style={styles.loginBtn}
            />
          </MotiView>
        </MotiView>

        {/* ── Register link ── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, ...stagger(4) }}
          style={styles.registerWrap}
        >
          <Link href="/(auth)/register" asChild>
            <Pressable hitSlop={12}>
              <Text style={styles.registerText}>
                ناقل فرد؟{' '}
                <Text style={styles.registerCta}>أنشئ حساباً</Text>
              </Text>
            </Pressable>
          </Link>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['5xl'],
    paddingBottom: SPACING['3xl'],
    alignItems: 'center',
    gap: SPACING.xl,
  },

  // Logo
  logoWrap: {
    ...SHADOW.primary,
    borderRadius: RADIUS.full,
  },
  logoBubble: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlyph: {
    fontFamily: FONTS.bold,
    fontSize: 40,
    color: COLORS.white,
  },

  // App name
  nameWrap: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.display,
    color: COLORS.text,
  },
  appSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    gap: SPACING.lg,
    ...SHADOW.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Fields
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },

  // Phone row
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
  },
  phoneInput: {
    flex: 1,
  },

  // Password row
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    height: '100%',
    paddingHorizontal: 0,
  },
  eyeBtn: {
    padding: SPACING.xs,
  },

  // Base input
  input: {
    height: 52,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
  },

  // Error
  errorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.danger,
    flex: 1,
    textAlign: 'right',
  },

  loginBtn: {
    width: '100%',
  },

  // Register
  registerWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  registerText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  registerCta: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});
