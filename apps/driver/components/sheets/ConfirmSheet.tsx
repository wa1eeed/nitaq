import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from '@/components/ui/MotiView';
import { ActionButton } from '@/components/ui/ActionButton';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  RADIUS,
  SPACING,
} from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConfirmVariant = 'primary' | 'success' | 'danger';

type Props = {
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  icon?: string;
  iconColor?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SNAP_POINTS = ['40%'];

const VARIANT_ICON_COLOR: Record<ConfirmVariant, string> = {
  primary: COLORS.primary,
  success: COLORS.success,
  danger:  COLORS.danger,
};

// ─── Component ───────────────────────────────────────────────────────────────

const ConfirmSheet = forwardRef<BottomSheet, Props>(
  (
    {
      title,
      body,
      confirmLabel,
      confirmVariant = 'primary',
      onConfirm,
      onCancel,
      loading = false,
      icon,
      iconColor,
    },
    ref,
  ) => {
    const resolvedIconColor =
      iconColor ?? VARIANT_ICON_COLOR[confirmVariant];

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.75}
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.content}>
          {/* Icon */}
          {icon && (
            <MotiView
              from={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              style={styles.iconWrap}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${resolvedIconColor}18` },
                ]}
              >
                <Ionicons
                  name={icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={52}
                  color={resolvedIconColor}
                />
              </View>
            </MotiView>
          )}

          {/* Text */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 250, delay: 80 }}
            style={styles.textBlock}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </MotiView>

          {/* Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 250, delay: 160 }}
            style={styles.buttonsWrap}
          >
            <ActionButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={confirmVariant}
              loading={loading}
              size="lg"
              style={styles.confirmBtn}
            />
            <ActionButton
              label="إلغاء"
              onPress={onCancel}
              variant="outline"
              disabled={loading}
              size="md"
              style={styles.cancelBtn}
            />
          </MotiView>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

ConfirmSheet.displayName = 'ConfirmSheet';

export default ConfirmSheet;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.bgCard,
  },
  handleIndicator: {
    backgroundColor: COLORS.border,
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    gap: SPACING.lg,
  },

  // Icon
  iconWrap: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text
  textBlock: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Buttons
  buttonsWrap: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  confirmBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
