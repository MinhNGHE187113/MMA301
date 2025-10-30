import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Linking,
    Modal,
    TextInput,
    Button,
    Alert,
    Share,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Switch,
    KeyboardAvoidingView,
} from "react-native";
import * as Notifications from "expo-notifications";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function SettingsScreen({ navigation }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") setIsEnabled(true);
    };

    const toggleSwitch = async () => {
        if (!isEnabled) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === "granted") {
                setIsEnabled(true);
                Alert.alert("Thông báo", "✅ Đã bật thông báo thành công!");
            } else Alert.alert("Thông báo", "⚠️ Bạn chưa cấp quyền thông báo.");
        } else {
            setIsEnabled(false);
            Alert.alert("Thông báo", "❌ Đã tắt thông báo!");
        }
    };

    const shareApp = async () => {
        try {
            await Share.share({
                message: "Hãy thử ứng dụng tuyệt vời này! 📱 https://yourapp.link",
            });
        } catch (error) {
            Alert.alert("Lỗi chia sẻ", error.message);
        }
    };

    const rateUs = () => {
        const storeLink =
            Platform.OS === "ios"
                ? "itms-apps://itunes.apple.com/app/idYOUR_APP_ID"
                : "market://details?id=YOUR_PACKAGE_NAME";
        Linking.openURL(storeLink);
    };

    const sendFeedback = async () => {
        if (!email || !feedback) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        try {
            await addDoc(collection(db, "feedbacks"), {
                email,
                message: feedback,
                createdAt: serverTimestamp(),
            });
            Alert.alert("Cảm ơn bạn!", "Phản hồi của bạn đã được gửi đến admin.");
            setEmail("");
            setFeedback("");
            setModalVisible(false);
        } catch {
            Alert.alert("Lỗi", "Không thể gửi phản hồi. Vui lòng thử lại!");
        }
    };

    const openPrivacyPolicy = () => {
        Linking.openURL("https://touchzing.com/privacy/");
    };

    const handleLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            Alert.alert("Đăng xuất", "Bạn đã đăng xuất thành công!");
            navigation.replace("Login");
        } catch {
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại!");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "black" }}>
            <BackgroundWrapper>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        <Text style={styles.header}>⚙️ Cài đặt</Text>

                        <View style={styles.card}>
                            <TouchableOpacity style={styles.item}>
                                <Text style={styles.text}>🔔 Thông báo</Text>
                                <Switch
                                    trackColor={{ false: "#555", true: "#4B9EFF" }}
                                    thumbColor={isEnabled ? "#FFD93D" : "#f4f3f4"}
                                    onValueChange={toggleSwitch}
                                    value={isEnabled}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.item} onPress={shareApp}>
                                <Text style={styles.text}>📩 Chia sẻ ứng dụng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.item} onPress={rateUs}>
                                <Text style={styles.text}>⭐ Đánh giá ứng dụng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.item} onPress={() => setModalVisible(true)}>
                                <Text style={styles.text}>💬 Gửi nhận xét</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.item} onPress={openPrivacyPolicy}>
                                <Text style={styles.text}>🛡️ Chính sách bảo mật</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Text style={styles.logoutText}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </BackgroundWrapper>

            {/* 📨 Modal nhận xét */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>💬 Gửi nhận xét</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Email của bạn"
                            placeholderTextColor="#888"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            placeholder="Nhận xét của bạn..."
                            placeholderTextColor="#888"
                            multiline
                            value={feedback}
                            onChangeText={setFeedback}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: "#555" }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalBtnText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: "#4B9EFF" }]}
                                onPress={sendFeedback}
                            >
                                <Text style={styles.modalBtnText}>Gửi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 40 : 0,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        fontSize: 30,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        marginBottom: 25,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        marginBottom: 30,
    },
    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 18,
        borderBottomColor: "rgba(255,255,255,0.1)",
        borderBottomWidth: 1,
    },
    text: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "500",
    },
    logoutButton: {
        backgroundColor: "#FF4D4D",
        borderRadius: 12,
        paddingVertical: 15,
        marginHorizontal: 10,
        shadowColor: "#FF4D4D",
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    logoutText: {
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 20,
    },
    modalBox: {
        backgroundColor: "#1e1e1e",
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        marginBottom: 15,
    },
    input: {
        backgroundColor: "#2c2c2c",
        color: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 12,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    modalBtn: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 12,
        borderRadius: 10,
    },
    modalBtnText: {
        textAlign: "center",
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
