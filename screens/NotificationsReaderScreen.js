// NotificationsReaderScreen.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
} from "firebase/firestore";

export default function NotificationsReaderScreen() {
    const user = auth.currentUser; // reader user
    const readerId = user?.uid;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!readerId) return;
        const messagesRef = collection(db, "notifications", readerId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setRequests(data);
            setLoading(false);
        });
        return () => unsub();
    }, [readerId]);

    const handleAccept = async (request) => {
        try {
            if (!readerId) return;
            const readerMsgRef = doc(db, "notifications", readerId, "messages", request.id);
            await updateDoc(readerMsgRef, { status: "accepted", read: true, updatedAt: serverTimestamp() });

            // gửi phản hồi cho sender (user)
            if (request.senderId) {
                const userMsgRef = collection(db, "notifications", request.senderId, "messages");
                await addDoc(userMsgRef, {
                    fromRole: "reader",
                    fromId: readerId,
                    fromName: user.displayName || "Reader",
                    message: `🔮 Reader đã chấp nhận yêu cầu của bạn. Hãy chú ý phương thức liên hệ bạn đã gửi, Reader sẽ sớm kết nối với bạn.`,
                    status: "accepted",
                    read: false,
                    createdAt: serverTimestamp(),
                    originalRequestId: request.id,
                });
            }

            Alert.alert("Đã chấp nhận", "Bạn đã chấp nhận yêu cầu.");
        } catch (err) {
            console.error("Lỗi accept:", err);
            Alert.alert("Lỗi", "Không thể chấp nhận yêu cầu.");
        }
    };

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setModalVisible(true);
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            return Alert.alert("Nhập lý do", "Vui lòng nhập lý do từ chối.");
        }
        try {
            if (!readerId || !selectedRequest) return;
            const readerMsgRef = doc(db, "notifications", readerId, "messages", selectedRequest.id);
            await updateDoc(readerMsgRef, { status: "rejected", reason, read: true, updatedAt: serverTimestamp() });

            if (selectedRequest.senderId) {
                const userMsgRef = collection(db, "notifications", selectedRequest.senderId, "messages");
                await addDoc(userMsgRef, {
                    fromRole: "reader",
                    fromId: readerId,
                    fromName: user.displayName || "Reader",
                    message: `❌ Reader đã từ chối yêu cầu của bạn. Lý do: ${reason}`,
                    status: "rejected",
                    reason,
                    read: false,
                    createdAt: serverTimestamp(),
                    originalRequestId: selectedRequest.id,
                });
            }

            setModalVisible(false);
            setReason("");
            Alert.alert("Đã từ chối", "Đã gửi phản hồi cho người dùng.");
        } catch (err) {
            console.error("Lỗi reject:", err);
            Alert.alert("Lỗi", "Không thể gửi phản hồi từ chối.");
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔔 Yêu cầu tới bạn</Text>

            {requests.length === 0 ? (
                <Text style={styles.emptyText}>Hiện chưa có yêu cầu.</Text>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={[styles.requestItem, !item.read && { backgroundColor: "#f7f7f7" }]}>
                            <Text style={styles.message}>{item.formData?.name || item.senderName} gửi yêu cầu</Text>
                            <Text style={styles.time}>
                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : item.createdAt || ""}
                            </Text>
                            {!item.read && (
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                                        <Text style={styles.buttonText}>Chấp nhận</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.rejectBtn} onPress={() => openRejectModal(item)}>
                                        <Text style={styles.buttonText}>Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {item.status === "accepted" && <Text style={{ color: "green", marginTop: 8 }}>✅ Đã đồng ý</Text>}
                            {item.status === "rejected" && <Text style={{ color: "red", marginTop: 8 }}>❌ Đã từ chối: {item.reason}</Text>}
                        </View>
                    )}
                />
            )}

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Lý do từ chối</Text>
                        <TextInput placeholder="Lý do..." placeholderTextColor="#666" value={reason} onChangeText={setReason} style={styles.input} multiline />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleReject}>
                            <Text style={styles.submitText}>Gửi lý do</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={{ color: "#FF6B6B", marginTop: 12, textAlign: "center" }}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
    emptyText: { textAlign: "center", color: "#888", marginTop: 20 },
    requestItem: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 },
    message: { fontSize: 16, fontWeight: "600" },
    time: { fontSize: 12, color: "#666", marginTop: 6 },
    buttonRow: { flexDirection: "row", marginTop: 10, gap: 10 },
    acceptBtn: { flex: 1, backgroundColor: "#4CAF50", padding: 10, borderRadius: 8 },
    rejectBtn: { flex: 1, backgroundColor: "#FF6B6B", padding: 10, borderRadius: 8 },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
    modalContent: { width: "90%", backgroundColor: "#fff", padding: 16, borderRadius: 12 },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    input: { height: 100, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 8, textAlignVertical: "top" },
    submitBtn: { backgroundColor: "#FFD700", padding: 12, borderRadius: 8, marginTop: 12 },
    submitText: { textAlign: "center", fontWeight: "700" },
});
