"use client"

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackgroundWrapper from "../components/BackgroundWrapper";
import FloatingChatButton from "../components/FloatingChatButton";
import { tarotData as allCards } from '../data/tarotData';
import { auth, db } from "../firebaseConfig";


const { width } = Dimensions.get("window")


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


export default function HomeScreen({ route, navigation }) {
  const [userName, setUserName] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);

  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  const [selectedCards, setSelectedCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const flipAnimatedValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const cardAnimations = flipAnimatedValues.map(animValue => {
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

  const [userEmail, setUserEmail] = useState(null);


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cachedName = await AsyncStorage.getItem('userFullName');
        if (cachedName) {
          setUserName(cachedName);
          setLoading(false);
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = userData.fullName || userData.email || "Người dùng";

            setUserName(fullName);
            await AsyncStorage.setItem('userFullName', fullName);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        setUserName("Người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const randomCards = getRandomCards(allCards, 3);
    setSelectedCards(randomCards);
  }, []);

  const handleFlip = (index) => {
    if (flippedIndices.includes(index) || flippedIndices.length === 3) {
      return;
    }
    setFlippedIndices([...flippedIndices, index]);
    Animated.spring(flipAnimatedValues[index], {
      toValue: 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleViewResult = () => {
    navigation.navigate('TarotResult', {
      selectedCards: selectedCards,
      topic: 'Cuộc sống'
    });
  };

  const allCardsFlipped = flippedIndices.length === 3;

  const handleSelect = (topic, mode = "three") => {
    if (topic === "Cuộc sống") {
      navigation.navigate("LifeTarot");
    } else {
      navigation.navigate("Tarot", { topic, mode });
    }
  }

  // 🔥 HÀM MỞ LINK APP STORE
  const handleOpenApp = async (appUrl) => {
    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        Alert.alert("Lỗi", "Không thể mở ứng dụng này");
      }
    } catch (error) {
      console.error("Error opening app:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi mở ứng dụng");
    }
  };

  const handlePressIn = (index) => {
    Animated.spring(animatedValues[index], {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8,
    }).start()
  }

  const handlePressOut = (index) => {
    Animated.spring(animatedValues[index], {
      toValue: 0,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8,
    }).start()
  }

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;

    // Nếu chưa có user (chưa đăng nhập) thì không cần lắng nghe thông báo
    if (!currentUser?.email) return;

    const userEmail = currentUser.email;

    // 🔥 Lắng nghe thông báo trong Firestore
    // Giả sử notifications/{userEmail}/messages/{notificationId}
    const q = collection(db, "notifications", userEmail, "messages");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unread = snapshot.docs.filter((doc) => doc.data().read === false);
      setUnreadCount(unread.length);
    });

    // Dọn dẹp listener khi component unmount
    return () => unsubscribe();
  }, []);


  const cards = [
    {
      id: 0,
      title: "📅 Nhận Đọc hàng ngày của bạn",
      desc: `${new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}, ${new Date().toLocaleDateString('vi-VN')} 
Nhận lá bài hàng ngày từ vũ trụ`,
      topic: "Thông điệp vũ trụ",
      mode: "one",
      imageSource: require("../assets/background.jpg"),
      isDaily: true,
    },
    {
      id: 1,
      title: "💖 Tình duyên",
      desc: "Hiểu rõ cảm xúc, kết nối và trái tim bạn đang muốn gì.",
      topic: "Tình duyên",
      imageSource: require("../assets/tinhyeu.jpg"),
    },
    {
      id: 2,
      title: "💼 Công việc",
      desc: "Hướng đi sự nghiệp, cơ hội và thử thách phía trước.",
      topic: "Công việc",
      imageSource: require("../assets/congviec.jpg"),
    },
    {
      id: 3,
      title: "🌿 Sức khỏe",
      desc: "Cân bằng năng lượng, chữa lành tâm hồn và cơ thể.",
      topic: "Sức khỏe",
      imageSource: require("../assets/suckhoe.jpg"),
    },
  ]

  // 🔥 DANH SÁCH CÁC APP QUẢNG CÁO
  const sponsoredApps = [
    {
      id: 1,
      name: "Bói Bài Tarot",
      description: "Bói tình yêu- Future Card App",
      iosUrl: "https://apps.apple.com/vn/app/b%C3%B3i-b%C3%A0i-tarot-t%E1%BB%AD-vi-h%C3%A0ng-ng%C3%A0y/id491892796?l=vi",
      androidUrl: "https://play.google.com/store/apps/details?id=com.example.meditation",
      imageSource: require("../assets/qc1.png"),
    },
    {
      id: 2,
      name: "Tử vi cung hoàng đạo",
      description: "Thần số học, âm lịch, bói bài",
      iosUrl: "https://apps.apple.com/vn/app/t%E1%BB%AD-vi-cung-ho%C3%A0ng-%C4%91%E1%BA%A1o-tarot/id909048916?l=vi",
      androidUrl: "https://play.google.com/store/apps/details?id=com.example.astrology",
      imageSource: require("../assets/qc2.png"),
    },
    {
      id: 3,
      name: "Bói Bài Tarot và Oracle",
      description: "Bói Bài Tarot và Oracle",
      iosUrl: "https://apps.apple.com/vn/app/b%C3%B3i-b%C3%A0i-tarot-v%C3%A0-oracle/id1298371239?l=vi",
      androidUrl: "https://play.google.com/store/apps/details?id=com.example.crystal",
      imageSource: require("../assets/qc3.png"),
    },
  ];

  const dailyCard = cards[0]
  const otherCards = cards.slice(1)

  const renderCard = (card, isHorizontal = false, isSpecial = false) => {
    const scale = animatedValues[card.id].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.95],
    })

    const opacity = animatedValues[card.id].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.9],
    })

    return (
      <Animated.View
        key={card.id}
        style={[
          isHorizontal ? styles.animatedCardHorizontal : styles.animatedCard,
          isSpecial && styles.animatedCardSpecial,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            isHorizontal ? styles.cardHorizontal : styles.card,
            isSpecial && styles.cardSpecial,
          ]}
          onPress={() => handleSelect(card.topic, card.mode)}
          onPressIn={() => handlePressIn(card.id)}
          onPressOut={() => handlePressOut(card.id)}
          activeOpacity={1}
        >
          <Image
            source={card.imageSource}
            style={isHorizontal ? styles.cardImageHorizontal : styles.cardImage}
          />
          <View style={isHorizontal ? styles.cardTextBoxHorizontal : styles.cardTextBox}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
            {isSpecial && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>
                  {card.isDaily ? "🎁 Kiểm tra Đọc của bạn" : "🎲 Nhấn để mở thẻ!"}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // 🔥 RENDER CARD QUẢNG CÁO
  const renderSponsoredApp = (app) => {
    const appUrl = Platform.OS === 'ios' ? app.iosUrl : app.androidUrl;

    return (
      <TouchableOpacity
        key={app.id}
        style={styles.sponsoredCardHorizontal}
        onPress={() => handleOpenApp(appUrl)}
        activeOpacity={0.8}
      >
        <View style={styles.sponsoredImageContainer}>
          <Image
            source={app.imageSource}
            style={styles.sponsoredImage}
          />
          <View style={styles.adBadgeOnImage}>
            <Text style={styles.adBadgeOnImageText}>Ad</Text>
          </View>
        </View>
        <View style={styles.sponsoredTextBox}>
          <Text style={styles.sponsoredCardTitle}>{app.name}</Text>
          <Text style={styles.sponsoredCardDesc}>{app.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BackgroundWrapper>
      <FloatingChatButton onPress={() => navigation.navigate("TarotChat")} />
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <View style={styles.headerCard}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingLabel}>Chào</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#FFD700" style={{ marginHorizontal: 8 }} />
              ) : (
                <Text style={styles.userName}>{userName}</Text>
              )}
              <Text style={styles.mysticalIcon}>🔮</Text>
            </View>

            {/* 🔔 BIỂU TƯỢNG THÔNG BÁO */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("NotificationsUser")}
            >
              <Ionicons name="notifications-outline" size={28} color="#FFD700" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.subtitle}>Hôm nay bạn muốn khám phá điều gì?</Text>
          </View>
        </View>

        {/* Nút mở Chatbot Tarot AI - dùng emoji thay icon */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Card */}
          <View style={styles.featuredContainer}>
            {renderCard(dailyCard, false, true)}
          </View>

          {/* 3 lá bài lật */}
          <View style={styles.surpriseContainer}>
            <Text style={styles.flipTitle}>Đọc bài bất ngờ 3 lá</Text>
            <Text style={styles.flipSubtitle}>Quá khứ - Hiện tại - Tương lai</Text>

            <View style={styles.flipCardContainer}>
              {selectedCards.map((card, index) => {
                const { front, back } = cardAnimations[index];
                return (
                  <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => handleFlip(index)}>
                    <Animated.View style={[styles.flipCard, { transform: [{ rotateY: front }] }]}>
                      <Image
                        source={require('../assets/Back2.jpg')}
                        style={styles.flipCardImage}
                      />
                    </Animated.View>

                    <Animated.View style={[styles.flipCard, styles.flipCardFace, { transform: [{ rotateY: back }] }]}>
                      <Image
                        source={card.image}
                        style={styles.flipCardImage}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {allCardsFlipped ? (
              <TouchableOpacity style={styles.resultButton} onPress={handleViewResult}>
                <Text style={styles.resultButtonText}>Xem kết quả</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.promptText}>Nhấn để mở thẻ!</Text>
            )}
          </View>

          {/* Section title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Khám phá các chủ đề khác</Text>
          </View>

          {/* Other cards - horizontal scroll */}
          <View style={styles.horizontalSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              scrollEventThrottle={16}
            >
              {otherCards.map((card) => renderCard(card, true))}
            </ScrollView>
          </View>

          {/* 🔥 SPONSORED APPS SECTION */}
          <View style={styles.sponsoredSection}>
            <View style={styles.sponsoredHeader}>
              <Text style={styles.sponsoredTitle}>Các ứng dụng đề xuất</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sponsoredScrollContent}
              scrollEventThrottle={16}
            >
              {sponsoredApps.map((app) => renderSponsoredApp(app))}
            </ScrollView>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </BackgroundWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  notificationButton: {
    position: "absolute",
    right: -10,
    // left: 1,
    top: 5,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",

  },
  notificationBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  headerSection: {
    width: "100%",
    paddingTop: 50,
    paddingHorizontal: '5%',
    paddingBottom: 15,
    alignItems: "center",
    backgroundColor: 'transparent',
    marginLeft: 30,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  greetingLabel: {
    fontSize: 26,
    fontWeight: "600",
    color: "#f0e6ff",
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFD700",
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginRight: 8,
  },
  mysticalIcon: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#f0e6ff",
    textAlign: "center",
    lineHeight: 22,
  },
  featuredContainer: {
    width: "90%",
    marginBottom: 16,
  },
  surpriseContainer: {
    width: "90%",
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  animatedCard: {
    width: "100%",
  },
  animatedCardSpecial: {
    width: "100%",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },
  cardSpecial: {
    backgroundColor: "rgba(123, 44, 191, 0.2)",
    borderWidth: 3,
    borderColor: "#FFD700",
    shadowRadius: 15,
    elevation: 10,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    marginRight: 14,
  },
  cardTextBox: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  cardDesc: {
    fontSize: 13,
    color: "#f8f8f8",
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  specialBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.25)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
    alignSelf: "flex-start",
  },
  specialBadgeText: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "700",
  },
  sectionTitleContainer: {
    width: "90%",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f0e6ff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  horizontalSection: {
    width: "100%",
    marginBottom: 20,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  animatedCardHorizontal: {
    width: 280,
  },
  cardHorizontal: {
    flexDirection: "column",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
    justifyContent: "space-between",
    minHeight: 200,
  },
  cardImageHorizontal: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTextBoxHorizontal: {
    width: "100%",
  },
  bottomPadding: {
    height: 20,
  },
  flipTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  flipSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 25,
  },
  flipCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  flipCard: {
    width: width / 3 - 30,
    height: (width / 3 - 30) * 1.7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  flipCardFace: {
    position: 'absolute',
    top: 0,
  },
  flipCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 10,
  },
  resultButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  resultButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  // 🔥 SPONSORED APPS STYLES
  sponsoredSection: {
    width: "100%",
    marginTop: 10,
    marginBottom: 20,
  },
  sponsoredHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sponsoredTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f0e6ff",
  },
  sponsoredScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sponsoredCardHorizontal: {
    width: 280,
    flexDirection: "column",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
    justifyContent: "space-between",
    minHeight: 170,
  },
  sponsoredImageContainer: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  sponsoredImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  adBadgeOnImage: {
    position: "absolute",
    top: -2,
    right: -5,
    backgroundColor: "#000000ff",
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ rotate: '35deg' }]
  },
  adBadgeOnImageText: {
    fontSize: 14,
    color: "#ffffffff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sponsoredTextBox: {
    width: "100%",
  },
  sponsoredCardTitle: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sponsoredCardDesc: {
    fontSize: 12,
    color: "#f8f8f8",
    lineHeight: 16,
    fontWeight: "500",
  },
})