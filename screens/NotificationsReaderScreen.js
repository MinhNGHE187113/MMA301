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

            Alert.alert("✅ Đã chấp nhận", "Bạn đã chấp nhận yêu cầu.");
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
                    message: `🎉 Reader đã chấp nhận yêu cầu trải bài của bạn!`,
                    status: "accepted",
                    read: false,
                    createdAt: serverTimestamp(),
                    originalRequestId: request.id,
                    formData: request.formData || {}, // ✅ gửi kèm lại thông tin user đã gửi
                    type: "reader_response", // ✅ thêm type để user lọc được
                });

            }

            setModalVisible(false);
            setReason("");
            Alert.alert("❌ Đã từ chối", "Đã gửi phản hồi cho người dùng.");
        } catch (err) {
            console.error("Lỗi reject:", err);
            Alert.alert("Lỗi", "Không thể gửi phản hồi từ chối.");
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

    const renderFormData = (formData) => {
        if (!formData) return null;
        return (
            <View style={styles.formBox}>
                <Text style={styles.formTitle}>📋 Thông tin yêu cầu bạn đã nhận:</Text>
                {formData.topic && <Text style={styles.formText}>📌 Chủ đề: {formData.topic}</Text>}
                {formData.birthDate && <Text style={styles.formText}>🎂 Ngày sinh: {formData.birthDate}</Text>}
                {formData.description && <Text style={styles.formText}>📝 Mô tả: {formData.description}</Text>}
            </View>
        );
    };

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
                            <Text style={styles.message}>
                                {item.formData?.name || item.senderName} đã gửi yêu cầu trải bài.
                            </Text>

                            {renderFormData(item.formData)}

                            <Text style={styles.time}>
                                {item.createdAt?.toDate
                                    ? item.createdAt.toDate().toLocaleString()
                                    : item.createdAt || ""}
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

                            {item.status === "accepted" && (
                                <Text style={{ color: "green", marginTop: 8 }}>✅ Reader đã đồng ý</Text>
                            )}
                            {item.status === "rejected" && (
                                <Text style={{ color: "red", marginTop: 8 }}>
                                    ❌ Reader đã từ chối: {item.reason}
                                </Text>
                            )}
                        </View>
                    )}
                />
            )}

            {/* Modal nhập lý do từ chối */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Lý do từ chối</Text>
                        <TextInput
                            placeholder="Nhập lý do..."
                            placeholderTextColor="#666"
                            value={reason}
                            onChangeText={setReason}
                            style={styles.input}
                            multiline
                        />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleReject}>
                            <Text style={styles.submitText}>Gửi lý do</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text
                                style={{
                                    color: "#FF6B6B",
                                    marginTop: 12,
                                    textAlign: "center",
                                }}
                            >
                                Đóng
                            </Text>
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
    requestItem: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    message: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
    time: { fontSize: 12, color: "#666", marginTop: 6 },
    buttonRow: { flexDirection: "row", marginTop: 10, gap: 10 },
    acceptBtn: { flex: 1, backgroundColor: "#4CAF50", padding: 10, borderRadius: 8 },
    rejectBtn: { flex: 1, backgroundColor: "#FF6B6B", padding: 10, borderRadius: 8 },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
    formBox: {
        backgroundColor: "#f0f7ff",
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
    },
    formTitle: { fontWeight: "700", marginBottom: 4, color: "#4a148c" },
    formText: { fontSize: 14, marginBottom: 2 },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalContent: {
        width: "90%",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    input: {
        height: 100,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 8,
        textAlignVertical: "top",
    },
    submitBtn: { backgroundColor: "#FFD700", padding: 12, borderRadius: 8, marginTop: 12 },
    submitText: { textAlign: "center", fontWeight: "700" },
});


