import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { View, Text, Image, FlatList, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem("tarot_history");
        if (stored) setHistory(JSON.parse(stored));
      } catch (error) {
        console.log("Lỗi khi tải lịch sử:", error);
      }
    };
    loadHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕰 Lịch sử xem bài</Text>

      {history.length === 0 ? (
        <Text style={styles.empty}>Chưa có lượt rút bài nào.</Text>
      ) : (
        <FlatList
          data={history.reverse()}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.topic}>Chủ đề: {item.topic}</Text>
                <Text style={styles.date}>📅 {item.date}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF4FF", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#7209B7", marginBottom: 15, textAlign: "center" },
  empty: { textAlign: "center", color: "#888", fontSize: 16, marginTop: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    padding: 10,
  },
  image: { width: 70, height: 100, borderRadius: 8, marginRight: 10 },
  info: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "bold", color: "#5A189A" },
  topic: { color: "#7A7A7A", marginTop: 4 },
  date: { color: "#9D4EDD", marginTop: 4, fontSize: 12 },
});
