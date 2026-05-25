import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from '@/components/ui/MotiView';
import { COLORS, RADIUS, SHADOW, GRADIENTS } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  gradient?: string[];
  style?: ViewStyle;
  delay?: number;
  noPad?: boolean;
};

export function GradientCard({
  children,
  gradient = GRADIENTS.card,
  style,
  delay = 0,
  noPad,
}: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay }}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, !noPad && styles.pad, style]}
      >
        {children}
      </LinearGradient>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...(SHADOW.md as object),
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pad: {
    padding: 16,
  },
});
