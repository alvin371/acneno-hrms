import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '@/ui/Button';
import { useErrorModalStore } from '@/store/errorModalStore';

const DEFAULT_TITLE = 'Something went wrong';

const Illustration = () => (
  <View style={styles.illustration}>
    <View style={styles.illustrationRing} />
    <View style={styles.illustrationPulse} />
    <Text style={styles.illustrationMark}>!</Text>
  </View>
);

export const ErrorModal = () => {
  const { isVisible, title, message, hide, clear } = useErrorModalStore();
  const [rendered, setRendered] = useState(false);

  const backdropOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(24);
  const cardScale = useSharedValue(0.98);

  const displayTitle = useMemo(() => title ?? DEFAULT_TITLE, [title]);

  useEffect(() => {
    if (isVisible) {
      setRendered(true);
      backdropOpacity.value = withTiming(1, { duration: 180 });
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      cardScale.value = withTiming(1, { duration: 180 });
      return;
    }

    if (rendered) {
      backdropOpacity.value = withTiming(0, { duration: 140 });
      cardTranslateY.value = withTiming(24, { duration: 140 });
      cardScale.value = withTiming(0.98, { duration: 140 }, () => {
        runOnJS(setRendered)(false);
        runOnJS(clear)();
      });
    }
  }, [
    backdropOpacity,
    cardScale,
    cardTranslateY,
    clear,
    isVisible,
    rendered,
  ]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      const nextTranslate = Math.max(0, event.translationY);
      cardTranslateY.value = nextTranslate;
      backdropOpacity.value = interpolate(
        nextTranslate,
        [0, 140],
        [1, 0.4],
        Extrapolate.CLAMP
      );
      cardScale.value = interpolate(
        nextTranslate,
        [0, 140],
        [1, 0.97],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 900) {
        runOnJS(hide)();
        return;
      }
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      backdropOpacity.value = withTiming(1, { duration: 160 });
      cardScale.value = withTiming(1, { duration: 160 });
    });

  if (!rendered) {
    return null;
  }

  return (
    <Modal transparent visible={rendered} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.backdropPressable} onPress={hide} />
      </Animated.View>
      <View style={styles.center}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            <View style={styles.handle} />
            <Illustration />
            <Text style={styles.title}>{displayTitle}</Text>
            <ScrollView
              style={styles.messageContainer}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.message}>{message ?? ''}</Text>
            </ScrollView>
            <Button label="Okay" onPress={hide} className="w-full" />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  illustration: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  illustrationRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  illustrationPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fca5a5',
    opacity: 0.5,
  },
  illustrationMark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#b91c1c',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e2a3a',
    textAlign: 'center',
    marginBottom: 6,
  },
  messageContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  messageContent: {
    paddingBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#435066',
    textAlign: 'left',
    lineHeight: 20,
  },
});
