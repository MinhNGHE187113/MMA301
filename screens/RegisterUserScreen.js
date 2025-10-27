import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function RegisterUserScreen({ navigation }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const isPasswordValid = (pass) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{9,}$/.test(pass);

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không trùng khớp!");
            return;
        }

        if (!isPasswordValid(password)) {
            Alert.alert(
                "Lỗi",
                "Mật khẩu phải có ít nhất 9 ký tự, bao gồm chữ hoa, chữ thường và số."
            );
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName,
                email,
                role: "user",
                createdAt: new Date(),
            });

            Alert.alert("🎉 Thành công", "Đăng ký thành công! Hãy đăng nhập.");
            navigation.replace("Login");
        } catch (error) {
            console.error("❌ Lỗi đăng ký:", error.code);

            if (error.code === "auth/email-already-in-use") {
                Alert.alert(
                    "Email đã tồn tại",
                    "Email này đã được sử dụng để đăng ký trước đó.\nVui lòng dùng email khác hoặc đăng nhập nhé!"
                );
            } else if (error.code === "auth/invalid-email") {
                Alert.alert("Email không hợp lệ", "Vui lòng nhập đúng định dạng email.");
            } else if (error.code === "auth/weak-password") {
                Alert.alert("Mật khẩu yếu", "Mật khẩu cần đủ mạnh hơn (ít nhất 9 ký tự).");
            } else {
                Alert.alert("Lỗi đăng ký", "Đã xảy ra lỗi, vui lòng thử lại sau.");
            }
        }
    };

    return (
        <ImageBackground
            source={require("../assets/background.png")}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>✨ Đăng ký tài khoản</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Họ và tên"
                        placeholderTextColor="#ccc"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#ccc"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu"
                        placeholderTextColor="#ccc"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Xác nhận mật khẩu"
                        placeholderTextColor="#ccc"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>Đăng ký ngay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.linkSmall}>Đã có tài khoản? Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: {
        flexGrow: 1,
        backgroundColor: "rgba(30, 0, 60, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    container: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#E0AAFF",
        textAlign: "center",
        marginBottom: 20,
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        color: "#fff",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    button: {
        backgroundColor: "#9D4EDD",
        padding: 14,
        borderRadius: 12,
        marginTop: 20,
    },
    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
    },
    linkSmall: {
        marginTop: 15,
        color: "#E0AAFF",
        textDecorationLine: "underline",
        textAlign: "center",
    },
});