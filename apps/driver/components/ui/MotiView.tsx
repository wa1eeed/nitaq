/**
 * Drop-in replacement for MotiView from '@/components/ui/MotiView'.
 * Uses React Native's built-in Animated API — no react-native-reanimated required.
 * Supports: entrance animations, loop/breathe, dynamic animate changes, shake sequences.
 */
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type Step = { value: number; type?: string; duration?: number };

type AnimVals = {
  opacity?: number;
  scale?: number;
  translateY?: number;
  translateX?: number | Step[];
};

type Trans = {
  type?: string;
  duration?: number;
  delay?: number;
  loop?: boolean;
  repeatReverse?: boolean;
  damping?: number;
  stiffness?: number;
  easing?: (t: number) => number;
};

type Props = {
  from?: AnimVals;
  animate?: AnimVals;
  transition?: Trans;
  style?: any;
  children?: React.ReactNode;
  [key: string]: any;
};

function t(ref: Animated.Value, toValue: number, duration: number, delay = 0) {
  return Animated.timing(ref, { toValue, duration, delay, useNativeDriver: true });
}

export function MotiView({
  from = {},
  animate = {},
  transition = {},
  style,
  children,
  ...rest
}: Props) {
  const dur = transition.duration ?? 300;
  const del = transition.delay ?? 0;
  const isLoop = !!transition.loop;
  const isRepeat = !!transition.repeatReverse;

  const opacity = useRef(new Animated.Value(from.opacity ?? animate.opacity ?? 1)).current;
  const scale   = useRef(new Animated.Value(from.scale   ?? animate.scale   ?? 1)).current;
  const transY  = useRef(new Animated.Value(from.translateY ?? animate.translateY ?? 0)).current;
  const transX  = useRef(new Animated.Value(
    typeof from.translateX === 'number' ? from.translateX :
    typeof animate.translateX === 'number' ? animate.translateX : 0
  )).current;

  // ── Loop animations (mount only) ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoop) return;

    const animations: Animated.CompositeAnimation[] = [];

    const addLoop = (ref: Animated.Value, fromVal: number, toVal: number) => {
      ref.setValue(fromVal);
      if (isRepeat) {
        animations.push(Animated.loop(Animated.sequence([
          t(ref, toVal, dur, del),
          t(ref, fromVal, dur),
        ])));
      } else {
        // Shimmer: go to toVal, instant reset, repeat
        animations.push(Animated.loop(Animated.sequence([
          t(ref, toVal, dur, del),
          t(ref, fromVal, 0),
        ])));
      }
    };

    if (animate.opacity !== undefined)
      addLoop(opacity, from.opacity ?? animate.opacity, animate.opacity);
    if (animate.scale !== undefined)
      addLoop(scale, from.scale ?? animate.scale, animate.scale);
    if (animate.translateY !== undefined)
      addLoop(transY, from.translateY ?? animate.translateY, animate.translateY);
    if (typeof animate.translateX === 'number')
      addLoop(transX, typeof from.translateX === 'number' ? from.translateX : animate.translateX, animate.translateX);

    if (animations.length === 0) return;
    const composite = animations.length === 1 ? animations[0] : Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Non-loop animations (runs on mount + whenever animate values change) ──
  useEffect(() => {
    if (isLoop) return;

    const animations: Animated.CompositeAnimation[] = [];

    if (animate.opacity !== undefined)
      animations.push(t(opacity, animate.opacity, dur, del));
    if (animate.scale !== undefined)
      animations.push(t(scale, animate.scale, dur, del));
    if (animate.translateY !== undefined)
      animations.push(t(transY, animate.translateY, dur, del));

    if (animate.translateX !== undefined) {
      if (Array.isArray(animate.translateX)) {
        animations.push(Animated.sequence(
          (animate.translateX as Step[]).map(s => t(transX, s.value, s.duration ?? 55))
        ));
      } else {
        animations.push(t(transX, animate.translateX, dur, del));
      }
    }

    if (animations.length === 0) return;
    const composite = animations.length === 1 ? animations[0] : Animated.parallel(animations);
    composite.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate.opacity, animate.scale, animate.translateY, JSON.stringify(animate.translateX)]);

  // ── Build animated style ─────────────────────────────────────────────────
  const transform: any[] = [];
  if (from.translateY !== undefined || animate.translateY !== undefined)
    transform.push({ translateY: transY });
  if (from.translateX !== undefined || animate.translateX !== undefined)
    transform.push({ translateX: transX });
  if (from.scale !== undefined || animate.scale !== undefined)
    transform.push({ scale });

  const animStyle: any = {};
  if (from.opacity !== undefined || animate.opacity !== undefined)
    animStyle.opacity = opacity;
  if (transform.length > 0)
    animStyle.transform = transform;

  return (
    <Animated.View style={[style, animStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
