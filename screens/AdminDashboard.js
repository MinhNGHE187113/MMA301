import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Modal,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboard({ navigation }) {
    const [pendingReaders, setPendingReaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState(false);
    const [selectedReader, setSelectedReader] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const fetchReaders = async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "readers"));
            const data = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((item) => item.approved === false && !item.rejected);
            setPendingReaders(data);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải danh sách reader chờ duyệt!");
        } finally {
            setLoading(false);
        }
    };

    const approveReader = async (id) => {
        try {
            await updateDoc(doc(db, "readers", id), {
                approved: true,
                rejected: false,
                rejectionReason: "",
            });
            Alert.alert("✅ Thành công", "Reader đã được duyệt!");
            fetchReaders();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể duyệt reader!");
        }
    };

    const rejectReader = async () => {
        if (!rejectReason.trim()) {
            Alert.alert("⚠️ Thiếu lý do", "Vui lòng nhập lý do từ chối!");
            return;
        }

        try {
            await updateDoc(doc(db, "readers", selectedReader.id), {
                rejected: true,
                rejectionReason: rejectReason.trim(),
                approved: false,
            });
            setRejectModal(false);
            setRejectReason("");
            Alert.alert("❌ Đã từ chối", "Reader đã bị từ chối đăng ký!");
            fetchReaders();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể từ chối reader!");
        }
    };

    const handleLogout = async () => {
        Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
            { text: "Hủy" },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                    await signOut(auth);
                    navigation.replace("Login");
                },
            },
        ]);
    };

    useEffect(() => {
        fetchReaders();
    }, []);

    return (
        <BackgroundWrapper>
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>👑 Admin Dashboard</Text>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>Danh sách Reader chờ duyệt</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#E0AAFF" style={{ marginTop: 40 }} />
                ) : pendingReaders.length === 0 ? (
                    <Text style={styles.emptyText}>🎉 Không có reader nào đang chờ duyệt</Text>
                ) : (
                    <FlatList
                        data={pendingReaders}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Text style={styles.name}>
                                    {item.fullName || "Chưa có tên"}{" "}
                                    <Text style={styles.nickName}>({item.nickName || "—"})</Text>
                                </Text>

                                <View style={styles.infoBlock}>
                                    <Text style={styles.text}>📧 Email: {item.email}</Text>
                                    <Text style={styles.text}>📞 SĐT: {item.phone || "Chưa có"}</Text>
                                    <Text style={styles.text}>
                                        💼 Kinh nghiệm: {item.experience || "Chưa cập nhật"}
                                    </Text>
                                    <Text style={styles.text}>
                                        🕒 Ngày đăng ký:{" "}
                                        {item.createdAt?.toDate
                                            ? item.createdAt.toDate().toLocaleString("vi-VN")
                                            : "Không rõ"}
                                    </Text>
                                </View>

                                <Text style={styles.bioLabel}>📝 Giới thiệu:</Text>
                                <ScrollView style={styles.bioBox}>
                                    <Text style={styles.bioText}>{item.bio || "Chưa có giới thiệu"}</Text>
                                </ScrollView>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.approveButton}
                                        onPress={() => approveReader(item.id)}
                                    >
                                        <Text style={styles.buttonText}>✅ Duyệt</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.rejectButton}
                                        onPress={() => {
                                            setSelectedReader(item);
                                            setRejectModal(true);
                                        }}
                                    >
                                        <Text style={styles.buttonText}>❌ Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )}

                {/* Modal nhập lý do từ chối */}
                <Modal visible={rejectModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>
                                ❌ Từ chối: {selectedReader?.nickName || "Reader"}
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nhập lý do từ chối..."
                                placeholderTextColor="#aaa"
                                multiline
                                value={rejectReason}
                                onChangeText={setRejectReason}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { backgroundColor: "#6A1FBF" }]}
                                    onPress={() => setRejectModal(false)}
                                >
                                    <Text style={styles.modalBtnText}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalBtn, { backgroundColor: "#C21807" }]}
                                    onPress={rejectReader}
                                >
                                    <Text style={styles.modalBtnText}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    title: { fontSize: 24, color: "#E0AAFF", fontWeight: "bold" },
    logoutBtn: { backgroundColor: "rgba(157, 78, 221, 0.9)", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#C77DFF" },
    subtitle: { fontSize: 18, color: "#fff", marginBottom: 15, textAlign: "center" },
    emptyText: { color: "#ccc", fontSize: 16, textAlign: "center", marginTop: 60 },
    card: { backgroundColor: "#2b0052", borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: "#6A1FBF" },
    name: { fontSize: 18, fontWeight: "700", color: "#FFD6FF" },
    nickName: { fontSize: 15, fontWeight: "500", color: "#C77DFF" },
    infoBlock: { marginTop: 6 },
    text: { color: "#fff", fontSize: 15, marginBottom: 3 },
    bioLabel: { marginTop: 10, color: "#E0AAFF", fontWeight: "600" },
    bioBox: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 10, marginTop: 5, maxHeight: 100 },
    bioText: { color: "#fff", fontSize: 14 },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
    approveButton: { backgroundColor: "#7B2CBF", flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#C77DFF", marginRight: 10 },
    rejectButton: { backgroundColor: "#C21807", flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#FF6B6B" },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
    modalBox: { backgroundColor: "#2b0052", width: "100%", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#C77DFF" },
    modalTitle: { fontSize: 18, color: "#FFD6FF", fontWeight: "700", marginBottom: 10 },
    input: { backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: 10, height: 100, textAlignVertical: "top" },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", marginHorizontal: 5 },
    modalBtnText: { color: "#fff", fontWeight: "600" },
});
