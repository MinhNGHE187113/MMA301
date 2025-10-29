import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askAI } from '../apiAI';

export default function TarotChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Xin chào! Tôi là AI Tarot, bạn muốn hỏi gì về các lá bài hoặc ý nghĩa tarot?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // ScrollView ref for auto-scroll
  const scrollViewRef = useRef(null);
  // Load history from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('tarot_chat_history');
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch {}
    })();
  }, []);
  // Save history to AsyncStorage on change
  useEffect(() => {
    AsyncStorage.setItem('tarot_chat_history', JSON.stringify(messages));
    // Auto scroll to bottom when messages change
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const aiReply = await askAI(input);
      setMessages(prev => [...prev, { role: "bot", text: aiReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "(AI lỗi hoặc không trả lời được, thử lại sau!)" }]);
    }
    setLoading(false);
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có chắc muốn xóa toàn bộ cuộc hội thoại?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: async () => {
            await AsyncStorage.removeItem('tarot_chat_history');
            setMessages([{ role: "bot", text: "Xin chào! Tôi là AI Tarot, bạn muốn hỏi gì về các lá bài hoặc ý nghĩa tarot?" }]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={styles.container}>
          <View style={styles.headerBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation && navigation.goBack && navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Tarot Chatbot</Text>
            </View>
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
              <Text style={styles.clearText}>🗑 Xóa</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.messages}
            contentContainerStyle={{ paddingBottom: 40 }}
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m, idx) => (
              <View
                key={idx}
                style={[
                  styles.bubble,
                  m.role === "user" ? styles.user : styles.bot
                ]}
              >
                <Text style={styles.text}>{m.text}</Text>
              </View>
            ))}
            {loading && <Text style={[styles.bot, styles.text]}>Đang trả lời...</Text>}
          </ScrollView>
          <View style={styles.inputBarWrapper}>
            <View style={styles.inputBar}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Nhập câu hỏi về tarot..."
                style={styles.input}
                placeholderTextColor="#ccc"
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={loading}>
                <Text style={styles.sendText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#10002b",
  },
  headerSafeArea: {
    backgroundColor: "#10002b",
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  paddingTop: Platform.OS === 'ios' ? 40 : 4,
    paddingBottom: 10,
    paddingHorizontal: 4,
    backgroundColor: '#10002b',
    zIndex: 10,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    borderRadius: 20,
    paddingLeft: 2,
    backgroundColor: 'rgba(36,0,70,0.7)',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 26,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  clearBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(36,0,70,0.7)',
  },
  clearText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
  },
  container: { flex: 1, backgroundColor: "#10002b", padding: 16, paddingBottom: 0 },
  messages: { flex: 1 },
  bubble: { padding: 12, borderRadius: 12, marginVertical: 4, maxWidth: "85%" },
  user: { alignSelf: "flex-end", backgroundColor: "#7b2cbf" },
  bot: { alignSelf: "flex-start", backgroundColor: "#240046" },
  text: { color: "#fff", lineHeight: 20 },
  inputBarWrapper: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'transparent',
  },
  inputBar: { flexDirection: "row", marginTop: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12 },
  input: { flex: 1, padding: 12, color: "#fff" },
  sendBtn: { paddingHorizontal: 16, justifyContent: "center" },
  sendText: { color: "#FFD700", fontWeight: "600" },
});
