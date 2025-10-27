import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { auth, db } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      // ADMIN đăng nhập
      if (email === "admin" || email === "admin@gmail.com") {
        const adminRef = doc(db, "admin", "fiZ3M9IMVTOQomW6bJIe");
        const adminDoc = await getDoc(adminRef);
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          if (password === adminData.password) {
            setLoading(false);
            navigation.replace("AdminDashboard", { user: "admin" });
            return;
          } else {
            Alert.alert("Sai mật khẩu", "Mật khẩu admin không đúng!");
            setLoading(false);
            return;
          }
        } else {
          Alert.alert("Lỗi", "Không tìm thấy tài khoản admin trong Firestore!");
          setLoading(false);
          return;
        }
      }

      // Đăng nhập Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let userDoc = await getDoc(doc(db, "users", user.uid));
      let userData;

      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        userDoc = await getDoc(doc(db, "readers", user.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          Alert.alert("Lỗi", "Không tìm thấy tài khoản trong hệ thống!");
          setLoading(false);
          return;
        }
      }

      if (userData.role === "reader") {
        if (!userData.approved && !userData.rejected) {
          Alert.alert("Chờ duyệt", "Tài khoản Reader của bạn đang chờ admin phê duyệt!");
          setLoading(false);
          return;
        }

        if (userData.rejected) {
          Alert.alert(
            "Tài khoản bị từ chối",
            `Tài khoản của bạn đã bị từ chối bởi admin.\nLý do: ${userData.rejectionReason || "Không có lý do"}`
          );
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      if (userData.role === "reader") {
        navigation.replace("ReaderStack", { user: email });
      } else if (userData.role === "user") {
        navigation.replace("MainTabs", {
          screen: "HomeTabs",
          params: { user: email },
        });
      } else {
        Alert.alert("Lỗi", "Không xác định được vai trò tài khoản!");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Đăng nhập thất bại", "Sai email hoặc mật khẩu!");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🔮 Tarot App</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
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

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.linkSmall}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("RegisterChoice")}>
            <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 0, 60, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#E0AAFF",
    textAlign: "center",
    marginBottom: 25,
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
  link: {
    marginTop: 18,
    color: "#C77DFF",
    textAlign: "center",
  },
  linkSmall: {
    marginTop: 12,
    color: "#E0AAFF",
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
