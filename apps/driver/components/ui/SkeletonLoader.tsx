import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { MotiView } from '@/components/ui/MotiView';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

// ─── Single shimmer line ──────────────────────────────────────────────────────

type LineProps = {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
};

export function SkeletonLine({ width = '100%', height = 14, style }: LineProps) {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{
        loop: true,
        type: 'timing',
        duration: 800,
        easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      }}
      style={[
        styles.line,
        { width: width as any, height, borderRadius: RADIUS.sm },
        style,
      ]}
    />
  );
}

// ─── Full card skeleton ───────────────────────────────────────────────────────

type CardProps = {
  style?: ViewStyle;
};

export function SkeletonCard({ style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Top row: icon placeholder + title line */}
      <View style={styles.topRow}>
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 800,
            easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
          }}
          style={styles.iconPlaceholder}
        />
        <View style={styles.topLines}>
          <SkeletonLine width="65%" height={16} />
          <SkeletonLine width="40%" height={12} style={{ marginTop: SPACING.xs }} />
        </View>
      </View>

      {/* Body lines */}
      <SkeletonLine width="90%" height={13} style={{ marginTop: SPACING.md }} />
      <SkeletonLine width="75%" height={13} style={{ marginTop: SPACING.sm }} />
      <SkeletonLine width="50%" height={13} style={{ marginTop: SPACING.sm }} />
    </View>
  );
}

// ─── Three stacked card skeletons ─────────────────────────────────────────────

export function SkeletonOrderList() {
  return (
    <View style={styles.list}>
      <SkeletonCard />
      <SkeletonCard style={{ marginTop: SPACING.md }} />
      <SkeletonCard style={{ marginTop: SPACING.md }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  line: {
    backgroundColor: COLORS.bgSurface,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSurface,
    flexShrink: 0,
  },
  topLines: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
});
