import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // mặc định là user

  // ✅ Hàm kiểm tra mật khẩu hợp lệ
  const isPasswordValid = (pass) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{9,}$/;
    // Ít nhất 9 ký tự, có chữ hoa, chữ thường và số
    return regex.test(pass);
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (!isPasswordValid(password)) {
      Alert.alert(
        "Mật khẩu không hợp lệ",
        "Mật khẩu phải có ít nhất 9 ký tự, bao gồm:\n- Ít nhất 1 chữ hoa\n- Ít nhất 1 chữ thường\n- Ít nhất 1 chữ số"
      );
      return;
    }

    try {
      // 🔐 Tạo tài khoản trên Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🗂️ Lưu thông tin vào Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        role,
        createdAt: new Date(),
      });

      Alert.alert("Thành công", "Đăng ký thành công! Hãy đăng nhập.");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Lỗi đăng ký", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🪄 Đăng ký tài khoản</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu (ít nhất 9 ký tự, gồm hoa, thường, số)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "user" && styles.selectedRole]}
          onPress={() => setRole("user")}
        >
          <Text style={styles.roleText}>Người dùng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "reader" && styles.selectedRole]}
          onPress={() => setRole("reader")}
        >
          <Text style={styles.roleText}>Reader</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Đăng ký</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30, color: "#5A189A" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#9D4EDD",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    width: "100%",
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16 },
  link: { marginTop: 15, color: "#5A189A" },
  roleContainer: { flexDirection: "row", marginTop: 15 },
  roleButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9D4EDD",
    marginHorizontal: 5,
  },
  selectedRole: { backgroundColor: "#E0AAFF" },
  roleText: { color: "#5A189A", fontWeight: "500" },
});
