import React, { useRef, useState } from "react";
import {
    Animated,
    PanResponder,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
} from "react-native";

export default function FloatingChatButton({ onPress }) {
    const { width, height } = Dimensions.get("window");
    const pan = useRef(new Animated.ValueXY({ x: width - 80, y: height - 160 })).current;
    const [opacity] = useState(new Animated.Value(1));

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.extractOffset?.();
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: false,
                }).start();
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                const currentX = pan.x._value + pan.x._offset;
                const currentY = pan.y._value + pan.y._offset;

                const finalX = currentX > width / 2 ? width - 80 : 20;
                const finalY = Math.min(Math.max(currentY, 80), height - 140);

                pan.flattenOffset();
                Animated.spring(pan, {
                    toValue: { x: finalX, y: finalY },
                    useNativeDriver: false,
                    bounciness: 8,
                }).start();

                setTimeout(() => {
                    Animated.timing(opacity, {
                        toValue: 0.6,
                        duration: 400,
                        useNativeDriver: false,
                    }).start();
                }, 10000);
            },
        })
    ).current;

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.container,
                {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    opacity: opacity,
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.button}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Image
                    source={require("../assets/ChatboxAIImage.png")}
                    style={styles.image}
                    resizeMode="contain"
                />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 9999,
        elevation: 9999,
    },
    button: {
        backgroundColor: "transparent",
        width: 80,
        height: 80,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
    },
    image: {
        width: 90,
        height: 90,
    },
});
