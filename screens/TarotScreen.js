import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { tarotData } from '../data/tarotData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = 100;
const CARD_HEIGHT = 160;
const PLACEHOLDER_WIDTH = 100;
const PLACEHOLDER_HEIGHT = 160;

// Khoảng cách giữa các lá bài (đè lên nhau 1/3)
const CARD_OVERLAP = CARD_WIDTH / 3;

// 🎴 Component lá bài dealer (lá bài đầu tiên) - Nằm sát trái
const DealerCard = ({ dealerAnim, onDealingComplete }) => {
  const cardScale = dealerAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.8, 1.1, 1],
  });

  useEffect(() => {
    // Animation xuất hiện lá bài dealer
    Animated.timing(dealerAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start(() => {
      if (onDealingComplete) {
        // Bắt đầu chia bài ngay lập tức
        onDealingComplete();
      }
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.dealerCardContainer,
        {
          opacity: dealerAnim,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <Image
        source={require('../assets/Back2.jpg')}
        style={styles.dealerCardImage}
      />
      <View style={styles.dealerCardGlow} />
    </Animated.View>
  );
};

// Component DeckCard
const DeckCard = React.memo(({ item, index, onSelectCard, isSelected, isMoving, deckCardAnim }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (isSelected || isMoving) {
      deckCardAnim.opacity.stopAnimation();
      deckCardAnim.opacity.setValue(0);
    }
  }, [isSelected, isMoving, deckCardAnim.opacity]);

  const handlePress = () => {
    if (cardRef.current) {
      onSelectCard(item, index, cardRef);
    }
  };

  return (
    <Animated.View
      style={[
        styles.deckCardContainer,
        {
          opacity: deckCardAnim.opacity,
          transform: [{ translateX: deckCardAnim.translateX }],
        },
      ]}
    >
      <TouchableOpacity
        ref={cardRef}
        activeOpacity={0.8}
        disabled={isSelected || isMoving}
        onPress={handlePress}
      >
        <Image source={require('../assets/Back2.jpg')} style={styles.deckCardImage} />
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function TarotScreen({ route }) {
  const { topic, mode } = route.params;
  const navigation = useNavigation();
  const [deck, setDeck] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [movingCard, setMovingCard] = useState(null);
  const [placeholderLayouts, setPlaceholderLayouts] = useState({});
  const [isDeckReady, setIsDeckReady] = useState(false);
  const [showDealer, setShowDealer] = useState(true);
  const [isDealingCards, setIsDealingCards] = useState(false);

  const flipAnim = useRef({}).current;
  const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const placeholderRefs = useRef([]);
  const deckCardEntryAnims = useRef([]).current;
  const dealerAnim = useRef(new Animated.Value(0)).current;

  const limit = mode === 'one' ? 1 : 3;
  const positions = ['Quá khứ', 'Hiện tại', 'Tương lai'];
  const positionKeys = ['past', 'present', 'future'];

  useEffect(() => {
    const shuffled = [...tarotData].sort(() => Math.random() - 0.5);
    setDeck(shuffled);

    shuffled.forEach((_, i) => {
      flipAnim[i] = new Animated.Value(0);
      deckCardEntryAnims[i] = {
        opacity: new Animated.Value(0),
        translateX: new Animated.Value(-SCREEN_WIDTH),
      };
    });

    placeholderRefs.current = Array(limit)
      .fill(null)
      .map((_, i) => placeholderRefs.current[i] || React.createRef());
  }, []);

  // 🎴 Bắt đầu chia bài ngay khi dealer card xuất hiện
  const handleDealingComplete = () => {
    setIsDealingCards(true);
    // Bắt đầu chia bài ngay lập tức
    animateDeckEntry(deck.length);
  };

  // Animation chia bài từ trái sang phải (bắt đầu từ lá thứ 2, vì lá đầu là dealer)
  const animateDeckEntry = (totalCards) => {
    const animations = deckCardEntryAnims.slice(1).map((anim, i) => {
      const actualIndex = i + 1;
      return Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 100,
          delay: actualIndex * 20, // Nhanh hơn để chia hết 78 lá
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.quad),
          delay: actualIndex * 20,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      setIsDeckReady(true);
    });
  };

  const handlePlaceholderLayout = (index) => {
    placeholderRefs.current[index]?.current?.measure(
      (x, y, width, height, pageX, pageY) => {
        setPlaceholderLayouts((prev) => ({
          ...prev,
          [index]: { x: pageX, y: pageY, width, height },
        }));
      }
    );
  };

  const handleSelectCard = useCallback((card, index, ref) => {
    if (
      selectedCards.length >= limit ||
      selectedCards.some((item) => item.index === index)
    ) {
      return;
    }

    ref.current.measureInWindow((x, y, width, height) => {
      const startLayout = { x, y, width, height };
      moveAnim.setValue({ x: 0, y: 0 });
      setMovingCard({ card, index, startLayout });
    });
  },
    [limit, selectedCards.length]
  );

  useEffect(() => {
    if (!movingCard) return;

    const targetIndex = selectedCards.length;
    const targetLayout = placeholderLayouts[targetIndex];

    if (!targetLayout) return;

    const { x: startX, y: startY } = movingCard.startLayout;
    const targetX = targetLayout.x + (targetLayout.width - CARD_WIDTH) / 2;
    const targetY = targetLayout.y + (targetLayout.height - CARD_HEIGHT) / 2;

    const translateX = targetX - startX;
    const translateY = targetY - startY;

    Animated.timing(moveAnim, {
      toValue: { x: translateX, y: translateY },
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSelectedCards((prev) => [
        ...prev,
        { card: movingCard.card, index: movingCard.index },
      ]);

      Animated.spring(flipAnim[movingCard.index], {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();

      setMovingCard(null);
    });
  }, [movingCard, placeholderLayouts]);

  const handleShowResult = async () => {
    const cardsToSave = selectedCards.map((item) => item.card);

    try {
      const existing = await AsyncStorage.getItem('tarot_history');
      const history = existing ? JSON.parse(existing) : [];

      const newEntry = {
        topic,
        mode,
        cards: cardsToSave.map((card, i) => ({
          name: card.name,
          position: mode === 'one' ? 'Thông điệp chính' : positions[i],
          image: card.image,
          meaning:
            mode === 'one'
              ? card.energy ||
              card.meanings?.[topic]?.main ||
              card.meanings?.[topic]?.present ||
              'Chưa có ý nghĩa.'
              : card.meanings?.[topic]?.[positionKeys[i]] || 'Chưa có ý nghĩa.',
        })),
        date: new Date().toLocaleString('vi-VN'),
      };

      await AsyncStorage.setItem(
        'tarot_history',
        JSON.stringify([...history, newEntry])
      );
      navigation.navigate('TarotResult', { entry: newEntry });
    } catch (error) {
      console.log('Lỗi khi lưu lịch sử:', error);
    }
  };

  const renderPlaceholder = (index) => {
    const selectedCard = selectedCards[index];
    let cardData = null;
    let cardIndex = -1;
    if (selectedCard) {
      cardData = selectedCard.card;
      cardIndex = selectedCard.index;
    }

    const flip = flipAnim[cardIndex] || new Animated.Value(0);

    const frontRotate = flip.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });
    const backRotate = flip.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <View
        key={`placeholder-${index}`}
        ref={placeholderRefs.current[index]}
        style={styles.placeholder}
        onLayout={() => handlePlaceholderLayout(index)}
      >
        {!cardData ? (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>{index + 1}</Text>
          </View>
        ) : (
          <View style={{ width: PLACEHOLDER_WIDTH, height: PLACEHOLDER_HEIGHT }}>
            <Animated.View
              style={[
                styles.cardFace,
                styles.absoluteFace,
                { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
              ]}
            >
              <Image
                source={require('../assets/Back2.jpg')}
                style={styles.placeholderCardImage}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.cardFace,
                styles.absoluteFace,
                { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
              ]}
            >
              <Image
                source={cardData.image}
                style={styles.placeholderCardImage}
              />
            </Animated.View>
          </View>
        )}
      </View>
    );
  };

  const renderMovingCard = () => {
    if (!movingCard) return null;

    return (
      <Animated.View
        style={[
          styles.movingCard,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            left: movingCard.startLayout.x,
            top: movingCard.startLayout.y,
            transform: moveAnim.getTranslateTransform(),
          },
        ]}
      >
        <Image
          source={require('../assets/Back2.jpg')}
          style={styles.placeholderCardImage}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.rootContainer}>
      <Image
        source={require('../assets/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.container}>
        <Text style={styles.title}>🔮 Chủ đề: {topic}</Text>
        <Text style={styles.subtitle}>
          {mode === 'one'
            ? 'Hãy chọn 1 lá bài mà bạn cảm thấy được "vũ trụ gọi tên" ✋'
            : 'Hãy chọn 3 lá bài mà bạn cảm thấy được "vũ trụ gọi tên" ✋'}
        </Text>

        <View style={styles.placeholderWrapper}>
          <View style={styles.placeholderContainer}>
            {Array(limit)
              .fill(0)
              .map((_, i) => renderPlaceholder(i))}
          </View>
        </View>

        <View style={styles.deckSection}>
          {/* 🎴 Container cho dealer + deck cards */}
          <View style={styles.cardsContainer}>
            {/* 🎴 Dealer Card - Lá bài đầu tiên nằm sát trái */}
            {showDealer && (
              <DealerCard
                dealerAnim={dealerAnim}
                onDealingComplete={handleDealingComplete}
              />
            )}

            {/* 🎴 Deck Cards - Bộ bài chính chia ra từ dealer card */}
            {isDealingCards && (
              <FlatList
                data={deck.slice(1)} // Bỏ lá đầu vì đó là dealer card
                renderItem={({ item, index }) => {
                  const actualIndex = index + 1; // Index thực trong deck gốc
                  const isSelected = selectedCards.some((c) => c.index === actualIndex);
                  const isMoving = movingCard?.index === actualIndex;
                  return (
                    <DeckCard
                      item={item}
                      index={actualIndex}
                      onSelectCard={handleSelectCard}
                      isSelected={isSelected}
                      isMoving={isMoving}
                      deckCardAnim={deckCardEntryAnims[actualIndex] || {
                        opacity: new Animated.Value(0),
                        translateX: new Animated.Value(-SCREEN_WIDTH)
                      }}
                    />
                  );
                }}
                keyExtractor={(_, index) => (index + 1).toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.deckListContent}
                getItemLayout={(data, index) => ({
                  length: CARD_OVERLAP,
                  offset: CARD_OVERLAP * index,
                  index,
                })}
                initialNumToRender={15}
                windowSize={20}
                maxToRenderPerBatch={10}
              />
            )}
          </View>
        </View>

        {selectedCards.length === limit && isDeckReady && (
          <Animated.View style={styles.viewResultButtonContainer}>
            <TouchableOpacity
              style={styles.viewResultBtn}
              onPress={handleShowResult}
            >
              <Text style={styles.viewResultText}>🔍 Xem kết quả của bạn</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {renderMovingCard()}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    zIndex: 0,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5A189A',
    textShadowColor: 'rgba(90, 24, 154, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#7A7A7A',
    marginBottom: 20,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  placeholderWrapper: {
    width: '100%',
    height: PLACEHOLDER_HEIGHT + 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  placeholder: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: 'bold',
  },
  placeholderCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  cardFace: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT,
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  absoluteFace: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  deckSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  // 🎴 Container cho cả dealer và deck cards
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CARD_HEIGHT,
    paddingLeft: 20,
  },
  // 🎴 Styles cho Dealer Card
  dealerCardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -CARD_WIDTH * 2 / 3,
    zIndex: 100,
  },
  dealerCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  dealerCardGlow: {
    position: 'absolute',
    width: CARD_WIDTH + 15,
    height: CARD_HEIGHT + 15,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 44, 191, 0.3)',
    zIndex: -1,
  },
  deckListContent: {
    paddingHorizontal: 0,
    paddingRight: 100,
    alignItems: 'center',
    paddingLeft: 90,
  },
  deckCardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: -CARD_WIDTH * 2 / 3,
  },
  deckCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  movingCard: {
    position: 'absolute',
    zIndex: 9999,
  },
  viewResultButtonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  viewResultBtn: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    shadowColor: '#7B2CBF',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  viewResultText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});