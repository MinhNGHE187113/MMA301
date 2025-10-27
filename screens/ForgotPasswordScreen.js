// screens/ForgotPasswordScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import BackgroundWrapper from "../components/BackgroundWrapper"; // 🟣 thêm nền

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("");

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert("Thông báo", "Vui lòng nhập email bạn đã đăng ký!");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Thành công", "Email đặt lại mật khẩu đã được gửi!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email!");
        }
    };

    return (
        <BackgroundWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>🔒 Quên mật khẩu</Text>
                <Text style={styles.text}>Nhập email bạn đã dùng để đăng ký tài khoản:</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email đăng ký"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                    <Text style={styles.buttonText}>Xác nhận</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.link}>← Quay lại đăng nhập</Text>
                </TouchableOpacity>
            </View>
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 15,
        padding: 20,
        alignItems: "center",
    },
    title: { fontSize: 26, fontWeight: "bold", color: "#5A189A", marginBottom: 15 },
    text: { fontSize: 15, textAlign: "center", marginBottom: 10 },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 10,
        marginVertical: 8,
        backgroundColor: "#fff",
    },
    button: {
        backgroundColor: "#7B2CBF",
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        width: "100%",
    },
    buttonText: { color: "#fff", textAlign: "center", fontSize: 16 },
    link: { marginTop: 15, color: "#5A189A" },
});
