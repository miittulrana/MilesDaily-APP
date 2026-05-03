import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Animated, PanResponder,
    Dimensions, LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/Colors';

interface SlideToConfirmProps {
    label: string;
    onConfirm: () => void;
    disabled?: boolean;
}

const THUMB_SIZE = 56;
const TRACK_PADDING = 4;

export default function SlideToConfirm({ label, onConfirm, disabled = false }: SlideToConfirmProps) {
    const translateX = useRef(new Animated.Value(0)).current;
    const [trackWidth, setTrackWidth] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const maxSlide = trackWidth - THUMB_SIZE - TRACK_PADDING * 2;
    const hasTriggeredHaptic = useRef(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !disabled && !confirmed,
            onMoveShouldSetPanResponder: (_, g) => !disabled && !confirmed && Math.abs(g.dx) > 5,
            onPanResponderGrant: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                hasTriggeredHaptic.current = false;
            },
            onPanResponderMove: (_, gestureState) => {
                const clamped = Math.max(0, Math.min(gestureState.dx, maxSlide));
                translateX.setValue(clamped);

                if (clamped >= maxSlide * 0.85 && !hasTriggeredHaptic.current) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    hasTriggeredHaptic.current = true;
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const clamped = Math.max(0, Math.min(gestureState.dx, maxSlide));

                if (clamped >= maxSlide * 0.85) {
                    Animated.spring(translateX, {
                        toValue: maxSlide,
                        useNativeDriver: true,
                        bounciness: 0,
                        speed: 20,
                    }).start(() => {
                        setConfirmed(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onConfirm();
                    });
                } else {
                    hasTriggeredHaptic.current = false;
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                    }).start();
                }
            },
        })
    ).current;

    const handleLayout = (e: LayoutChangeEvent) => {
        setTrackWidth(e.nativeEvent.layout.width);
    };

    const labelOpacity = trackWidth > 0
        ? translateX.interpolate({
            inputRange: [0, maxSlide * 0.4, maxSlide * 0.7],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
        })
        : 1;

    const thumbScale = confirmed
        ? new Animated.Value(1)
        : translateX.interpolate({
            inputRange: [0, maxSlide * 0.85, maxSlide],
            outputRange: [1, 1.05, 1.1],
            extrapolate: 'clamp',
        });

    return (
        <View
            style={[styles.track, disabled && styles.trackDisabled]}
            onLayout={handleLayout}
        >
            {/* Label */}
            <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
                <Text style={styles.label}>{label}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </Animated.View>

            {/* Thumb */}
            <Animated.View
                style={[
                    styles.thumb,
                    confirmed && styles.thumbConfirmed,
                    {
                        transform: [
                            { translateX },
                            { scale: thumbScale },
                        ],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                {confirmed ? (
                    <Ionicons name="checkmark" size={28} color={colors.primary} />
                ) : (
                    <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        height: THUMB_SIZE + TRACK_PADDING * 2,
        backgroundColor: colors.primary,
        borderRadius: (THUMB_SIZE + TRACK_PADDING * 2) / 2,
        justifyContent: 'center',
        padding: TRACK_PADDING,
        overflow: 'hidden',
    },
    trackDisabled: {
        backgroundColor: '#9ca3af',
    },
    labelContainer: {
        position: 'absolute',
        left: THUMB_SIZE + 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    thumbConfirmed: {
        backgroundColor: '#dcfce7',
    },
});