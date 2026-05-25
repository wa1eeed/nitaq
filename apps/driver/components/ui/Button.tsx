import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOW } from '@/constants/theme';

type Variant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
};

const BG: Record<Variant, string> = {
  primary: COLORS.primary,
  success: COLORS.success,
  danger:  COLORS.danger,
  outline: 'transparent',
  ghost:   'transparent',
};
const FG: Record<Variant, string> = {
  primary: COLORS.white,
  success: COLORS.white,
  danger:  COLORS.white,
  outline: COLORS.primary,
  ghost:   COLORS.textSecondary,
};
const BORDER: Record<Variant, string> = {
  primary: 'transparent',
  success: 'transparent',
  danger:  'transparent',
  outline: COLORS.primary,
  ghost:   'transparent',
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, size = 'lg' }: Props) {
  const height = size === 'lg' ? 54 : size === 'md' ? 44 : 36;
  const fontSize = size === 'lg' ? 16 : size === 'md' ? 14 : 13;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: BG[variant], borderColor: BORDER[variant] },
        variant !== 'ghost' && variant !== 'outline' && SHADOW.sm,
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={FG[variant]} />
        : <Text style={[styles.label, { color: FG[variant], fontSize }]}>{label}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  label: { fontFamily: FONTS.bold, textAlign: 'center' },
});
