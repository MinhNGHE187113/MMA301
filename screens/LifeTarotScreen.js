import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { tarotData as allCards } from '../data/tarotData';

// --- Bắt đầu: Hàm xáo bài và lấy ngẫu nhiên ---
// (Bạn có thể tách hàm này ra file utils nếu muốn)
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

const getRandomCards = (deck, num) => {
    const shuffledDeck = shuffleArray([...deck]);
    return shuffledDeck.slice(0, num);
}
// --- Kết thúc: Hàm xáo bài ---


export default function LifeTarotScreen({ navigation }) {
    const [selectedCards, setSelectedCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]); // Lưu index của các lá đã lật

    // Mảng lưu trữ các giá trị animation cho 3 lá bài
    const animatedValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

    // Hiệu ứng interpolate cho từng lá bài
    const cardAnimations = animatedValues.map(animValue => {
        const frontInterpolate = animValue.interpolate({
            inputRange: [0, 180],
            outputRange: ['0deg', '180deg'],
        });
        const backInterpolate = animValue.interpolate({
            inputRange: [0, 180],
            outputRange: ['180deg', '360deg'],
        });
        return { front: frontInterpolate, back: backInterpolate };
    });

    // Chọn 3 lá bài ngẫu nhiên khi màn hình được tải
    useEffect(() => {
        const randomCards = getRandomCards(allCards, 3);
        setSelectedCards(randomCards);
    }, []);

    // Hàm xử lý khi lật 1 lá bài
    const handleFlip = (index) => {
        if (flippedIndices.includes(index) || flippedIndices.length === 3) {
            return; // Đã lật rồi hoặc đã lật đủ 3 lá thì không làm gì
        }

        // Cập nhật state để biết lá này đã lật
        setFlippedIndices([...flippedIndices, index]);

        // Chạy animation lật
        Animated.spring(animatedValues[index], {
            toValue: 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    };

    // Hàm xem kết quả
    const handleViewResult = () => {
        navigation.navigate('TarotResult', {
            selectedCards: selectedCards, // Truyền 3 lá bài đã chọn
            topic: 'Cuộc sống' // Truyền chủ đề
        });
    };

    const allCardsFlipped = flippedIndices.length === 3;

    return (
        <BackgroundWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>Đọc bài bất ngờ 3 lá</Text>
                <Text style={styles.subtitle}>Quá khứ - Hiện tại - Tương lai</Text>

                {/* Khu vực 3 lá bài */}
                <View style={styles.cardContainer}>
                    {selectedCards.map((card, index) => {
                        const { front, back } = cardAnimations[index];
                        return (
                            <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => handleFlip(index)}>
                                {/* Mặt sau (Card Back) */}
                                <Animated.View style={[styles.card, { transform: [{ rotateY: front }] }]}>
                                    <Image
                                        // 2. THAY THẾ BẰNG HÌNH MẶT SAU CỦA BẠN
                                        source={require('../assets/Back.jpg')}
                                        style={styles.cardImage}
                                    />
                                </Animated.View>

                                {/* Mặt trước (Card Face) */}
                                <Animated.View style={[styles.card, styles.cardFace, { transform: [{ rotateY: back }] }]}>
                                    <Image
                                        source={card.image} // Lấy từ data
                                        style={styles.cardImage}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Nút xem kết quả (chỉ hiện khi đã lật đủ 3 lá) */}
                {allCardsFlipped ? (
                    <TouchableOpacity style={styles.resultButton} onPress={handleViewResult}>
                        <Text style={styles.resultButtonText}>Xem kết quả</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.promptText}>Nhấn để mở thẻ!</Text>
                )}
            </View>
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#E0E0E0',
        marginBottom: 40,
    },
    cardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 40,
    },
    card: {
        width: 100,
        height: 170,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        backfaceVisibility: 'hidden', // Quan trọng cho hiệu ứng lật
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    cardFace: {
        position: 'absolute', // Nằm đè lên mặt sau
        top: 0,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    promptText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFD700', // Màu vàng gold
        marginTop: 20,
    },
    resultButton: {
        backgroundColor: '#FFD700', // Màu vàng gold
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginTop: 20,
        shadowColor: "#FFD700",
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    resultButtonText: {
        fontSize: 18,
        color: '#333',
        fontWeight: 'bold',
    }
});