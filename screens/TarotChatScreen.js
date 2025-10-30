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
      } catch { }
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
      setMessages(prev => [...prev, { role: "bot", text: err.message || "(AI lỗi hoặc không trả lời được, thử lại sau!)" }]);
    }
    setLoading(false);
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có chắc muốn xóa toàn bộ cuộc hội thoại?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive', onPress: async () => {
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
              <Text style={styles.clearText}>Xóa lịch sử chat</Text>
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
                <Text style={styles.sendText}>▶</Text>
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
    backgroundColor: "#0c001a", // tím đen sâu
  },
  headerSafeArea: {
    backgroundColor: "#0c001a",
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 40 : 8,
    paddingBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(20,0,40,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(123,44,191,0.3)',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 26,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255,215,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(123,44,191,0.3)',
  },
  clearText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: "#0c001a",
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  messages: {
    flex: 1,
  },
  bubble: {
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: "85%",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "linear-gradient(90deg, #7b2cbf, #9d4edd)",
    backgroundColor: "#7b2cbf",
    borderTopRightRadius: 4,
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  text: {
    color: "#fff",
    lineHeight: 20,
    fontSize: 15,
  },
  inputBarWrapper: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'transparent',
  },
  inputBar: {
    flexDirection: "row",
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "#fff",
    fontSize: 15,
  },
  sendBtn: {
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 16,
    marginLeft: 6,
  },
  sendText: {
    color: "#FFD700",
    fontWeight: "600",
    fontSize: 16,
  },
});

