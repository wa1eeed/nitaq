import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from '@/components/ui/MotiView';
import { COLORS, FONTS, RADIUS, FONT_SIZE, STATUS_LABEL, STATUS_COLOR } from '@/constants/theme';

type Props = {
  status: string;
  size?: 'sm' | 'md';
};

// States that get an animated pulse ring
const ACTIVE_STATES = new Set(['IN_TRANSIT', 'ASSIGNED', 'CONFIRMED']);

export function AnimatedStatusBadge({ status, size = 'md' }: Props) {
  const colorConfig = STATUS_COLOR[status] ?? { bg: COLORS.bgSurface, text: COLORS.textMuted };
  const label       = STATUS_LABEL[status] ?? status;
  const isPulsing   = ACTIVE_STATES.has(status);

  const fontSize    = size === 'sm' ? FONT_SIZE.micro : FONT_SIZE.caption;
  const padH        = size === 'sm' ? 8  : 12;
  const padV        = size === 'sm' ? 3  : 5;

  const badgeContent = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorConfig.bg,
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderColor: colorConfig.text,
        },
      ]}
    >
      {isPulsing && (
        <View style={[styles.dot, { backgroundColor: colorConfig.text }]} />
      )}
      <Text
        style={[
          styles.label,
          { color: colorConfig.text, fontSize },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (!isPulsing) {
    return <View style={styles.wrapper}>{badgeContent}</View>;
  }

  return (
    <View style={styles.wrapper}>
      {/* Outer pulse ring */}
      <MotiView
        from={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.05, opacity: 0 }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 1500,
          repeatReverse: false,
        }}
        style={[
          styles.pulseRing,
          {
            borderColor: colorConfig.glow ?? colorConfig.text,
          },
        ]}
      />

      {/* Badge itself with subtle scale pulse */}
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 1500,
          repeatReverse: true,
        }}
      >
        {badgeContent}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
