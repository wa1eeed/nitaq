import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from '@/components/ui/MotiView';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type Props = {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
};

// ─── Config maps ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<ToastType, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  error:   'close-circle',
  info:    'information-circle',
  warning: 'warning',
};

const COLOR_MAP: Record<ToastType, string> = {
  success: COLORS.success,
  error:   COLORS.danger,
  info:    COLORS.info,
  warning: COLORS.warning,
};

// ─── Toast component ─────────────────────────────────────────────────────────

export function Toast({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
}: Props) {
  const iconName  = ICON_MAP[type];
  const accentColor = COLOR_MAP[type];
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && duration > 0) {
      timerRef.current = setTimeout(() => {
        onHide();
      }, duration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, duration, onHide]);

  if (!visible) {
    return null;
  }

  return (
    <MotiView
      from={{ translateY: -120, opacity: 0 }}
      animate={{ translateY: 0,    opacity: 1 }}
      exit={{ translateY: -120,    opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={styles.container}
    >
      <View style={[styles.card, { borderLeftColor: accentColor }]}>
        <Ionicons
          name={iconName}
          size={22}
          color={accentColor}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </MotiView>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

const DEFAULT_STATE: ToastState = { message: '', type: 'info', visible: false };

export function useToast(defaultDuration = 3000) {
  const [state, setState] = useState<ToastState>(DEFAULT_STATE);
  const durationRef = useRef(defaultDuration);

  const show = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    if (duration !== undefined) {
      durationRef.current = duration;
    } else {
      durationRef.current = defaultDuration;
    }
    // Reset first so re-triggering the same message replays animation
    setState({ message: '', type, visible: false });
    // Defer to next tick so moti re-animates
    setTimeout(() => {
      setState({ message, type, visible: true });
    }, 16);
  }, [defaultDuration]);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const ToastComponent = (
    <Toast
      message={state.message}
      type={state.type}
      visible={state.visible}
      onHide={hide}
      duration={durationRef.current}
    />
  );

  return { show, hide, ToastComponent };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    gap: SPACING.md,
    ...(SHADOW.lg as object),
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
