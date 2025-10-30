import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackgroundWrapper from '../components/BackgroundWrapper';

const lifePositions = ['Quá khứ', 'Hiện tại', 'Tương lai'];
const lifeMeaningKeys = ['past', 'present', 'future'];

export default function TarotResultScreen({ route, navigation }) {
  // 💡 Sửa: Đổi tên 'entry' thành 'historyEntry' cho rõ nghĩa
  const { entry: historyEntry, topic, selectedCards } = route.params;

  let entry;

  if (historyEntry) {
    entry = historyEntry;
  } else if (topic && selectedCards && topic === 'Cuộc sống') {
    // Logic dự phòng này có thể không bao giờ chạy nếu TarotScreen luôn gửi 'entry'
    const processedCards = selectedCards.map((card, index) => {
      const position = lifePositions[index];
      const meaningKey = lifeMeaningKeys[index];

      let meaning = 'Không tìm thấy ý nghĩa.';
      if (card.meanings && card.meanings[topic] && card.meanings[topic][meaningKey]) {
        meaning = card.meanings[topic][meaningKey];
      }

      return {
        name: card.name,
        image: card.image,
        position: position,
        meaning: meaning
      };
    });

    entry = {
      topic: topic,
      cards: processedCards,
      date: new Date().toLocaleDateString('vi-VN'),
      // 💡 Lưu ý: 'mode' có thể bị thiếu ở đây nếu logic này được sử dụng
      // Tuy nhiên, TarotScreen đang gửi 'entry' (historyEntry) đã bao gồm 'mode'
      mode: selectedCards.length === 1 ? 'one' : 'three', // Suy đoán mode
    };

  } else {
    // Màn hình lỗi
    return (
      <BackgroundWrapper>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <Text style={styles.title}>Lỗi</Text>
          <Text style={[styles.meaning, { color: 'white', textAlign: 'center' }]}>
            Không nhận được dữ liệu bài.
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { width: '100%', marginTop: 20 }]}
            onPress={() => navigation.navigate('Home_Main')}>
            <Text style={styles.backText}>🏠 Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </BackgroundWrapper>
    );
  }

  // Màn hình kết quả chính
  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔮 Kết quả rút bài</Text>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>Chủ đề: {entry.topic}</Text>
          </View>
        </View>

        {/* Cards Display */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {entry.cards.map((card, idx) => (
            <View key={idx} style={styles.cardBox}>
              {/* Position Badge */}
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{card.position}</Text>
              </View>

              {/* Card Image */}
              <Image source={card.image} style={styles.image} />

              {/* Card Name */}
              <Text style={styles.cardName}>{card.name}</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Meaning */}
              <View style={styles.meaningContainer}>
                <Text style={styles.meaningLabel}>✨ Ý nghĩa:</Text>
                <Text style={styles.meaning}>{card.meaning}</Text>
              </View>
            </View>
          ))}

          {/* Date Info */}
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>📅 {entry.date}</Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Home_Main')}>
            <Text style={styles.backText}>🏠 Về trang chủ</Text>
          </TouchableOpacity>

          {/* === 💡 NÚT ĐÃ ĐƯỢC SỬA === */}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.replace('Tarot', {
              topic: entry.topic,
              mode: entry.mode
            })}
          >
            <Text style={styles.retryText}>🔄 Rút lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrapper>
  );
}

// ... (styles giữ nguyên)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  topicBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  topicText: {
    fontSize: 15,
    color: '#FFD700',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  positionBadge: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  positionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  image: {
    width: 180,
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3A0CA3',
    marginBottom: 12,
    textAlign: 'center',
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 12,
    borderRadius: 1,
  },
  meaningContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  meaningLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B2CBF',
    marginBottom: 10,
  },
  meaning: {
    fontSize: 15,
    color: '#333',
    textAlign: 'justify',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  dateContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 13,
    color: '#f0e6ff',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  backText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  retryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  retryText: {
    color: '#3A0CA3',
    fontSize: 15,
    fontWeight: '700',
  },
});