import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from '@/components/ui/MotiView';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  RADIUS,
  SHADOW,
  GRADIENTS,
} from '@/constants/theme';

type Variant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
};

const GRADIENT_MAP: Record<string, string[]> = {
  primary: GRADIENTS.primary,
  success: GRADIENTS.success,
  danger:  GRADIENTS.danger,
};

const HEIGHT_MAP = { sm: 44, md: 52, lg: 60 };
const FONT_MAP   = { sm: FONT_SIZE.caption, md: FONT_SIZE.label, lg: FONT_SIZE.body };
const ICON_MAP   = { sm: 16, md: 18, lg: 20 };

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  size = 'md',
}: Props) {
  const [pressed, setPressed] = useState(false);

  const isGradient = variant === 'primary' || variant === 'success' || variant === 'danger';
  const isOutline  = variant === 'outline';

  const height   = HEIGHT_MAP[size];
  const fontSize = FONT_MAP[size];
  const iconSize = ICON_MAP[size];

  const fgColor = isGradient
    ? COLORS.white
    : isOutline
    ? COLORS.primary
    : COLORS.textMuted;

  const handlePressIn = () => setPressed(true);

  const handlePressOut = () => setPressed(false);

  const handlePress = async () => {
    if (isGradient) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const innerContent = loading ? (
    <ActivityIndicator color={fgColor} size="small" />
  ) : (
    <View style={styles.row}>
      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={fgColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: fgColor, fontSize }]}>{label}</Text>
    </View>
  );

  const containerStyle: ViewStyle[] = [
    styles.base,
    { height },
    style ?? {},
    (disabled || loading) ? styles.disabled : {},
  ];

  if (isGradient) {
    const shadow = variant === 'primary' ? SHADOW.primary : SHADOW.md;
    return (
      <MotiView
        animate={{ scale: pressed ? 0.96 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
        style={[{ borderRadius: RADIUS.lg }, shadow as object]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[{ borderRadius: RADIUS.lg, overflow: 'hidden' }, style]}
        >
          <LinearGradient
            colors={GRADIENT_MAP[variant] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientInner, { height }, (disabled || loading) && styles.disabled]}
          >
            {innerContent}
          </LinearGradient>
        </Pressable>
      </MotiView>
    );
  }

  return (
    <MotiView
      animate={{ scale: pressed ? 0.96 : 1 }}
      transition={{ type: 'timing', duration: 100 }}
      style={{ borderRadius: RADIUS.lg }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          containerStyle,
          isOutline && styles.outlineBorder,
        ]}
      >
        {innerContent}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  gradientInner: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    // icon is shown to the right of the label in RTL (row-reverse pushes it to visual left)
  },
  label: {
    fontFamily: FONTS.bold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  disabled: {
    opacity: 0.5,
  },
});
