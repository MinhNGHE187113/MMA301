import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackgroundWrapper from '../components/BackgroundWrapper'; // 🌌 Thêm background dùng chung
import { tarotData } from '../data/tarotData';

export default function TarotScreen({ route }) {
  const { topic, mode } = route.params; // 👈 mode: "one" hoặc "three"
  const navigation = useNavigation();
  const [deck, setDeck] = useState([]);
  const [selected, setSelected] = useState([]);
  const [previewCard, setPreviewCard] = useState(null);
  const flipAnim = useRef({}).current;

  const positions = ['Quá khứ', 'Hiện tại', 'Tương lai'];
  const positionKeys = ['past', 'present', 'future'];

  // 🔄 Khởi tạo bộ bài và animation
  useEffect(() => {
    const shuffled = [...tarotData].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    shuffled.forEach((_, i) => {
      flipAnim[i] = new Animated.Value(0);
    });
  }, []);

  const confirmSelect = (index) => {
    Animated.timing(flipAnim[index], {
      toValue: 180,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setSelected([...selected, index]);
    setPreviewCard(null);
  };

  const handleSelect = (index) => {
    const limit = mode === 'one' ? 1 : 3;
    if (selected.length >= limit || selected.includes(index)) return;
    setPreviewCard({ ...deck[index], index });
  };

  const handleShowResult = async () => {
    const selectedCards = selected.map((i) => deck[i]);
    const limit = mode === 'one' ? 1 : 3;

    try {
      const existing = await AsyncStorage.getItem('tarot_history');
      const history = existing ? JSON.parse(existing) : [];

      const newEntry = {
        topic,
        mode,
        cards: selectedCards.map((card, i) => ({
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

  const renderCard = ({ item, index }) => {
    if (!flipAnim[index]) flipAnim[index] = new Animated.Value(0);

    const frontRotate = flipAnim[index].interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });
    const backRotate = flipAnim[index].interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    const isFlipped = selected.includes(index);

    return (
      <TouchableOpacity
        onPress={() => handleSelect(index)}
        activeOpacity={0.8}
        disabled={isFlipped}>
        <View
          style={[
            styles.cardWrapper,
            mode === 'one' && { width: 100, height: 160 },
          ]}>
          <View style={{ width: '100%', height: mode === 'one' ? 140 : 100 }}>
            {/* Mặt sau */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
                styles.absoluteFace,
              ]}>
              <Image
                source={require('../assets/Back.jpg')}
                style={[styles.image, mode === 'one' && { borderRadius: 10 }]}
              />
            </Animated.View>

            {/* Mặt trước */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
                styles.absoluteFace,
              ]}>
              <Image
                source={item.image}
                style={[styles.image, mode === 'one' && { borderRadius: 10 }]}
              />
            </Animated.View>
          </View>

          {isFlipped && (
            <Text style={[styles.cardLabel, mode === 'one' && { fontSize: 12 }]}>
              {item.name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const limit = mode === 'one' ? 1 : 3;

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>🔮 Chủ đề: {topic}</Text>
        <Text style={styles.subtitle}>
          {mode === 'one'
            ? 'Hãy chọn 1 lá bài mà bạn cảm thấy được “vũ trụ gọi tên” ✋'
            : 'Hãy chọn 3 lá bài mà bạn cảm thấy được “vũ trụ gọi tên” ✋'}
        </Text>

        {/* Bộ bài */}
        <View style={{ flex: 1, width: '100%' }}>
          <FlatList
            data={deck}
            renderItem={renderCard}
            keyExtractor={(_, index) => index.toString()}
            numColumns={mode === 'one' ? 3 : 5}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{
              justifyContent: 'space-evenly',
            }}
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingBottom: 30,
            }}
          />
        </View>

        {/* Nút xem kết quả */}
        {selected.length === limit && (
          <TouchableOpacity
            style={styles.viewResultBtn}
            onPress={handleShowResult}>
            <Text style={styles.viewResultText}>🔍 Xem kết quả của bạn</Text>
          </TouchableOpacity>
        )}

        {/* Modal xác nhận chọn bài */}
        <Modal visible={!!previewCard} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Image
                source={require('../assets/Back.jpg')}
                style={styles.previewImage}
              />
              <Text style={styles.modalText}>
                Bạn có chắc chắn chọn lá bài này không?
              </Text>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                  onPress={() => setPreviewCard(null)}>
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#7B2CBF' }]}
                  onPress={() => confirmSelect(previewCard.index)}>
                  <Text style={styles.modalButtonText}>Chọn</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </BackgroundWrapper>
  );
}

// 🌙 CSS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ❗ để không che background
    paddingTop: 40,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5A189A' },
  subtitle: {
    color: '#7A7A7A',
    marginBottom: 10,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardWrapper: {
    alignItems: 'center',
    marginVertical: 10,
    width: 70,
    height: 120,
  },
  card: {
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  absoluteFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  cardLabel: {
    fontSize: 10,
    color: '#FEE227',
    textAlign: 'center',
    marginTop: 4,
    width: 70,
  },
  viewResultBtn: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 15,
  },
  viewResultText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  previewImage: { width: 120, height: 200, borderRadius: 10, marginBottom: 15 },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#3A0CA3',
    fontWeight: '600',
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontWeight: '600' },
});
