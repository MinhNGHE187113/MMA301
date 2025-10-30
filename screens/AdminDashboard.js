import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Modal,
    TextInput,
} from "react-native";
import { collection, getDocs, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboard({ navigation }) {
    const [pendingReaders, setPendingReaders] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("readers"); // "readers" hoặc "feedbacks"
    const [rejectModal, setRejectModal] = useState(false);
    const [selectedReader, setSelectedReader] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    // 🔹 Lấy danh sách reader chờ duyệt
    const fetchReaders = async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "readers"));
            const data = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((item) => item.approved === false && !item.rejected);
            setPendingReaders(data);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải danh sách reader!");
        } finally {
            setLoading(false);
        }
    };

    // 🔁 Lắng nghe phản hồi người dùng realtime
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "feedbacks"), (snap) => {
            const fbData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFeedbacks(fbData);
        });
        return unsub;
    }, []);

    useEffect(() => {
        fetchReaders();
    }, []);

    // ✅ Duyệt reader
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

    // ❌ Từ chối reader
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
            Alert.alert("❌ Đã từ chối", "Reader đã bị từ chối!");
            fetchReaders();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể từ chối reader!");
        }
    };

    // 🚪 Đăng xuất
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

    return (
        <BackgroundWrapper>
            <View style={styles.overlay}>
                {/* 🟣 Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>👑 Admin Dashboard</Text>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* 🔁 Tabs */}
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, viewMode === "readers" && styles.activeTab]}
                        onPress={() => setViewMode("readers")}
                    >
                        <Text style={styles.tabText}>📋 Reader chờ duyệt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, viewMode === "feedbacks" && styles.activeTab]}
                        onPress={() => setViewMode("feedbacks")}
                    >
                        <Text style={styles.tabText}>💬 Phản hồi người dùng</Text>
                    </TouchableOpacity>
                </View>

                {/* 📦 Nội dung hiển thị */}
                {viewMode === "readers" ? (
                    loading ? (
                        <ActivityIndicator size="large" color="#E0AAFF" style={{ marginTop: 40 }} />
                    ) : pendingReaders.length === 0 ? (
                        <Text style={styles.emptyText}>🎉 Không có reader nào đang chờ duyệt</Text>
                    ) : (
                        <FlatList
                            data={pendingReaders}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.card}>
                                    <Text style={styles.name}>
                                        {item.fullName || "Chưa có tên"}{" "}
                                        <Text style={styles.nickName}>({item.nickName || "—"})</Text>
                                    </Text>

                                    <Text style={styles.text}>📧 {item.email}</Text>
                                    <Text style={styles.text}>📞 {item.phone || "Chưa có"}</Text>
                                    <Text style={styles.text}>
                                        🕒 {item.createdAt?.toDate?.().toLocaleString("vi-VN") || ""}
                                    </Text>

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
                    )
                ) : (
                    <FlatList
                        data={feedbacks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Text style={styles.name}>📩 {item.email || "Ẩn danh"}</Text>
                                <Text style={styles.text}>
                                    {item.message ? item.message : "(Không có nội dung)"}
                                </Text>
                                <Text style={styles.textSmall}>
                                    🕒{" "}
                                    {item.createdAt?.toDate?.().toLocaleString("vi-VN") ||
                                        "Không rõ thời gian"}
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* 🟥 Modal từ chối */}
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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 24, color: "#E0AAFF", fontWeight: "bold" },
    logoutBtn: { backgroundColor: "rgba(157,78,221,0.9)", padding: 8, borderRadius: 10 },
    tabRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 15 },
    tab: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#C77DFF" },
    activeTab: { backgroundColor: "#7B2CBF" },
    tabText: { color: "#fff", fontWeight: "600" },
    emptyText: { color: "#ccc", textAlign: "center", marginTop: 40 },
    card: { backgroundColor: "#2b0052", borderRadius: 16, padding: 15, marginBottom: 10 },
    name: { fontSize: 18, color: "#FFD6FF", fontWeight: "700" },
    nickName: { color: "#C77DFF" },
    text: { color: "#fff", fontSize: 15, marginBottom: 3 },
    textSmall: { color: "#ccc", fontSize: 13, marginTop: 5 },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    approveButton: {
        flex: 1,
        backgroundColor: "#7B2CBF",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        marginRight: 10,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: "#C21807",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "600" },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalBox: { backgroundColor: "#2b0052", padding: 20, borderRadius: 16, width: "90%" },
    modalTitle: { color: "#FFD6FF", fontSize: 18, fontWeight: "700", marginBottom: 10 },
    input: {
        backgroundColor: "rgba(255,255,255,0.15)",
        color: "#fff",
        borderRadius: 10,
        padding: 10,
        height: 100,
    },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", marginHorizontal: 5 },
    modalBtnText: { color: "#fff", fontWeight: "600" },
});