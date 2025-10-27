import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { auth, db } from "../firebaseConfig";

export default function RegisterReaderScreen({ navigation }) {
    const [fullName, setFullName] = useState("");
    const [nickName, setNickName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");

    const isPasswordValid = (pass) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{9,}$/.test(pass);

    const handleRegister = async () => {
        if (!fullName || !nickName || !email || !password || !confirmPassword || !phone || !bio) {
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
                "Mật khẩu phải có ít nhất 9 ký tự, gồm chữ hoa, chữ thường và số."
            );
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "readers", user.uid), {
                fullName,
                nickName,
                email,
                phone,
                bio,
                role: "reader",
                approved: false,
                rejected: false,
                rejectionReason: "",
                status: "Đang bận",
                createdAt: new Date(),
            });

            Alert.alert(
                "🎉 Đăng ký thành công",
                "Thông tin của bạn đã được gửi lên Admin.\nVui lòng chờ phê duyệt trước khi đăng nhập!"
            );
            navigation.replace("Login");
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                Alert.alert(
                    "Email đã tồn tại",
                    "Email này đã được dùng để đăng ký tài khoản khác.\nVui lòng sử dụng email khác hoặc đăng nhập nhé!"
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
            <KeyboardAwareScrollView
                contentContainerStyle={styles.overlay}
                extraScrollHeight={50}
                enableOnAndroid={true}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>🔮 Đăng ký Reader Tarot</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Họ và tên đầy đủ"
                        placeholderTextColor="#ccc"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Nick name (Tên hiển thị ngắn gọn)"
                        placeholderTextColor="#ccc"
                        value={nickName}
                        onChangeText={setNickName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email (Hãy nhập email chính xác)"
                        placeholderTextColor="#ccc"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
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

                    <TextInput
                        style={styles.input}
                        placeholder="Số điện thoại"
                        placeholderTextColor="#ccc"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <TextInput
                        style={[styles.input, { height: 100 }]}
                        placeholder="Giới thiệu về bản thân"
                        placeholderTextColor="#ccc"
                        multiline
                        value={bio}
                        onChangeText={setBio}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>Đăng ký</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 },
    container: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 25, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    title: { fontSize: 24, fontWeight: "bold", color: "#E0AAFF", textAlign: "center", marginBottom: 25 },
    input: { width: "100%", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", borderRadius: 12, padding: 12, marginVertical: 8, color: "#fff", backgroundColor: "rgba(255,255,255,0.15)" },
    button: { backgroundColor: "#9D4EDD", padding: 14, borderRadius: 12, marginTop: 20 },
    buttonText: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "600" },
    link: { marginTop: 18, color: "#C77DFF", textAlign: "center" },
});
