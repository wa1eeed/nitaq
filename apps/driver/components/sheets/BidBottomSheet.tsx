import React, {
  forwardRef,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from '@/components/ui/MotiView';
import { ActionButton } from '@/components/ui/ActionButton';
import { api, apiError } from '@/lib/api';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  RADIUS,
  SHADOW,
  SPACING,
} from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type Order = {
  id: string;
  orderNumber: string;
  originCity: string;
  destinationCity: string;
  totalPrice: number;
};

type Props = {
  order: Order | null;
  onSuccess: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

const COMMISSION_RATE = 0.05;
const SNAP_POINTS = ['60%', '85%'];

const BidBottomSheet = forwardRef<BottomSheet, Props>(
  ({ order, onSuccess }, ref) => {
    const minPrice = order ? Math.round(order.totalPrice * 0.5) : 0;
    const maxPrice = order ? Math.round(order.totalPrice * 1.5) : 0;
    const defaultPrice = order ? order.totalPrice : 0;

    const [bidPrice, setBidPrice] = useState<number>(defaultPrice);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Reset state when sheet opens with a new order
    const lastOrderId = useRef<string | null>(null);
    if (order && order.id !== lastOrderId.current) {
      lastOrderId.current = order.id;
      // Synchronous state reset is safe here during render of a new order
      if (bidPrice !== order.totalPrice) {
        setBidPrice(order.totalPrice);
      }
      if (notes !== '') setNotes('');
      if (error !== '') setError('');
      if (submitted) setSubmitted(false);
      if (loading) setLoading(false);
    }

    const commission = Math.round(bidPrice * COMMISSION_RATE);
    const netExpected = bidPrice - commission;

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

    const handleSubmit = async () => {
      if (!order) return;
      Keyboard.dismiss();
      setError('');
      setLoading(true);

      try {
        if (__DEV__) {
          // Simulate a brief network delay in dev
          await new Promise((r) => setTimeout(r, 800));
          setSubmitted(true);
          setTimeout(() => {
            onSuccess();
            (ref as React.RefObject<BottomSheet>)?.current?.close();
          }, 1200);
        } else {
          await api.post(`/orders/${order.id}/bid`, {
            price: bidPrice,
            notes: notes.trim() || undefined,
          });
          setSubmitted(true);
          setTimeout(() => {
            onSuccess();
            (ref as React.RefObject<BottomSheet>)?.current?.close();
          }, 1200);
        }
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    };

    const formatPrice = (v: number) =>
      v.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>تقديم عرض سعر</Text>
            {order && (
              <Text style={styles.subtitle}>
                طلب رقم {order.orderNumber}
              </Text>
            )}
          </View>

          {order && (
            <>
              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.cityChip}>
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                  <Text style={styles.cityText}>{order.destinationCity}</Text>
                </View>
                <View style={styles.routeArrowWrap}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.textMuted} />
                </View>
                <View style={styles.cityChip}>
                  <Ionicons name="radio-button-on" size={14} color={COLORS.success} />
                  <Text style={styles.cityText}>{order.originCity}</Text>
                </View>
              </View>

              {/* Price display */}
              <View style={styles.priceDisplayWrap}>
                <Text style={styles.priceLabel}>سعر عرضك</Text>
                <MotiView
                  key={bidPrice}
                  from={{ opacity: 0.6, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 150 }}
                >
                  <Text style={styles.priceValue}>{formatPrice(bidPrice)}</Text>
                </MotiView>
              </View>

              {/* Slider */}
              <View style={styles.sliderWrap}>
                <Slider
                  style={styles.slider}
                  minimumValue={minPrice}
                  maximumValue={maxPrice}
                  step={50}
                  value={bidPrice}
                  onValueChange={(v) => setBidPrice(Math.round(v))}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.border}
                  thumbTintColor={COLORS.primary}
                />
                <View style={styles.sliderLimits}>
                  <Text style={styles.sliderLimitText}>{formatPrice(maxPrice)}</Text>
                  <Text style={styles.sliderLimitText}>{formatPrice(minPrice)}</Text>
                </View>
              </View>

              {/* Commission & net */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>
                    {formatPrice(commission)}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    العمولة التقديرية ({Math.round(COMMISSION_RATE * 100)}%)
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryValue, styles.netValue]}>
                    {formatPrice(netExpected)}
                  </Text>
                  <Text style={styles.summaryLabel}>صافي المتوقع</Text>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.notesWrap}>
                <Text style={styles.notesLabel}>ملاحظات (اختياري)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="أضف أي تفاصيل إضافية..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              {/* Error */}
              {error !== '' && (
                <MotiView
                  from={{ opacity: 0, translateY: -4 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={styles.errorWrap}
                >
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </MotiView>
              )}

              {/* Submit */}
              {submitted ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.successWrap}
                >
                  <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                  <Text style={styles.successText}>تم إرسال العرض بنجاح!</Text>
                </MotiView>
              ) : (
                <ActionButton
                  label="إرسال العرض"
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  loading={loading}
                  icon="send"
                  style={styles.submitBtn}
                />
              )}
            </>
          )}

          {!order && (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

BidBottomSheet.displayName = 'BidBottomSheet';

export default BidBottomSheet;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.bgCard,
  },
  handleIndicator: {
    backgroundColor: COLORS.border,
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Route
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    justifyContent: 'center',
  },
  cityText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.text,
  },
  routeArrowWrap: {
    paddingHorizontal: SPACING.xs,
  },

  // Price display
  priceDisplayWrap: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  priceLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: COLORS.primary,
    textAlign: 'center',
  },

  // Slider
  sliderWrap: {
    gap: SPACING.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  sliderLimitText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
  },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.label,
    color: COLORS.textMuted,
  },
  netValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Notes
  notesWrap: {
    gap: SPACING.xs,
  },
  notesLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.label,
    color: COLORS.textSecondary,
  },
  notesInput: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    minHeight: 80,
  },

  // Error
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.label,
    color: COLORS.danger,
    flex: 1,
    textAlign: 'right',
  },

  // Success
  successWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.3)',
  },
  successText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.body,
    color: COLORS.success,
  },

  submitBtn: {
    marginTop: SPACING.xs,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
});
