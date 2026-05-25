import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from '@/components/ui/MotiView';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, FONT_SIZE } from '@/constants/theme';

type Props = {
  status: string;
};

const STEPS = [
  { key: 'ASSIGNED',  label: 'مُسند' },
  { key: 'CONFIRMED', label: 'مؤكَّد' },
  { key: 'IN_TRANSIT', label: 'في الطريق' },
  { key: 'DELIVERED', label: 'تم التسليم' },
];

const STATUS_INDEX: Record<string, number> = {
  ASSIGNED:  0,
  CONFIRMED: 1,
  IN_TRANSIT: 2,
  DELIVERED: 3,
  COMPLETED: 3,
};

export function OrderProgressBar({ status }: Props) {
  const activeIndex = STATUS_INDEX[status] ?? -1;

  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => {
        const isDone   = i < activeIndex;
        const isActive = i === activeIndex;
        const isPending = i > activeIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Step node */}
            <View style={styles.stepWrapper}>
              <View style={styles.circleContainer}>
                {/* Pulse ring for active step */}
                {isActive && (
                  <MotiView
                    from={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{
                      loop: true,
                      type: 'timing',
                      duration: 1200,
                      repeatReverse: false,
                    }}
                    style={styles.pulseRing}
                  />
                )}

                {/* Circle */}
                <MotiView
                  from={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'timing', duration: 300, delay: i * 80 }}
                  style={[
                    styles.circle,
                    isDone   && styles.circleDone,
                    isActive && styles.circleActive,
                    isPending && styles.circlePending,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  ) : isActive ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </MotiView>
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isDone    && styles.labelDone,
                  isActive  && styles.labelActive,
                  isPending && styles.labelPending,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line between steps */}
            {i < STEPS.length - 1 && (
              <View style={styles.connectorTrack}>
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: isDone ? '100%' : '0%' }}
                  transition={{ type: 'timing', duration: 400, delay: i * 80 + 200 }}
                  style={styles.connectorFill}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 36;
const PULSE_SIZE  = CIRCLE_SIZE + 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepWrapper: {
    alignItems: 'center',
    width: CIRCLE_SIZE + 20,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: COLORS.primaryGlow,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleDone: {
    backgroundColor: COLORS.primary,
  },
  circleActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  circlePending: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  connectorTrack: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.full,
    marginTop: CIRCLE_SIZE / 2 - 1.5,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  label: {
    marginTop: 6,
    fontSize: FONT_SIZE.micro,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  labelDone: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  labelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  labelPending: {
    color: COLORS.textMuted,
  },
});
