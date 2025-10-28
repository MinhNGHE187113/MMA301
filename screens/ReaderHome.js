// screens/ReaderHome.js
import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    Switch,
    TextInput,
    SafeAreaView,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
    doc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    addDoc,
    getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function ReaderHome({ navigation }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [status, setStatus] = useState("Đang bận");
    const [nickname, setNickname] = useState("Ẩn danh");
    const [isActive, setIsActive] = useState(false);
    const lastRequestIds = useRef(new Set());
    const user = auth.currentUser;

    // --- Firestore listener
    useEffect(() => {
        if (!user) return;

        const readerRef = doc(db, "readers", user.uid);
        const unsubReader = onSnapshot(readerRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setStatus(data.status || "Đang bận");
                setNickname(data.nickName || data.fullName || "Ẩn danh");
                setIsActive(data.status === "Đang rảnh");
            }
        });

        const submissionsRef = collection(db, "formSubmissions");
        const q = query(
            submissionsRef,
            where("readerId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubSubmissions = onSnapshot(q, (snap) => {
            const list = [];
            snap.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                list.push(data);

                // Cảnh báo yêu cầu mới
                if (!lastRequestIds.current.has(docSnap.id)) {
                    if (data.status === "pending") {
                        Alert.alert(
                            "🔮 Yêu cầu mới!",
                            `${data.userName || "Người dùng"} vừa gửi yêu cầu trải bài.`
                        );
                    }
                    lastRequestIds.current.add(docSnap.id);
                }
            });
            setRequests(list);
            setLoading(false);
        });

        return () => {
            unsubReader();
            unsubSubmissions();
        };
    }, [user]);

    // --- Toggle trạng thái
    const toggleSwitch = async () => {
        const newStatus = isActive ? "Đang bận" : "Đang rảnh";
        setIsActive(!isActive);
        setStatus(newStatus);
        await updateDoc(doc(db, "readers", user.uid), { status: newStatus });
    };

    // --- Đăng xuất
    const handleLogout = () => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc chắn muốn đăng xuất không?",
            [
                {
                    text: "Hủy",
                    style: "cancel",
                },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                        } catch {
                            Alert.alert("Lỗi", "Không thể đăng xuất. Thử lại.");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // --- Chấp nhận yêu cầu
    const handleAccept = async (req) => {
        try {
            const ref = doc(db, "formSubmissions", req.id);
            await updateDoc(ref, { status: "accepted" });

            // 🔔 Gửi thông báo trong Firestore
            await addDoc(collection(db, "notifications", req.userId, "messages"), {
                senderId: user.uid,
                senderName: nickname,
                receiverId: req.userId,
                message: `✨ Reader ${nickname} đã chấp nhận yêu cầu của bạn.`,
                read: false,
                createdAt: new Date(),
            });

            // 🔔 Gửi Push Notification đến User
            try {
                const userRef = doc(db, "users", req.userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists() && userSnap.data().expoPushToken) {
                    // Import động để tránh vòng lặp import
                    import("../sendPushNotification").then(({ sendPushNotification }) => {
                        sendPushNotification(
                            userSnap.data().expoPushToken,
                            "🔮 Reader đã chấp nhận yêu cầu!",
                            `Reader ${nickname} đã chấp nhận yêu cầu trải bài của bạn.`
                        );
                    });
                } else {
                    console.log("⚠️ Không tìm thấy expoPushToken của user");
                }
            } catch (pushError) {
                console.log("❌ Lỗi khi gửi push notification:", pushError);
            }

            Alert.alert("✅ Thành công", "Đã chấp nhận yêu cầu.");
            setModalVisible(false);
            setShowRejectInput(false);
            setRejectReason("");
        } catch (error) {
            console.error("❌ Lỗi khi chấp nhận yêu cầu:", error);
            Alert.alert("Lỗi", "Không thể xử lý yêu cầu. Vui lòng thử lại sau.");
        }
    };

    // --- Từ chối yêu cầu
    const handleReject = async (req) => {
        if (!rejectReason.trim()) {
            Alert.alert("Lý do từ chối", "Vui lòng nhập lý do từ chối.");
            return;
        }

        try {
            const ref = doc(db, "formSubmissions", req.id);
            await updateDoc(ref, { status: "rejected", rejectionReason: rejectReason });

            // 🔔 Gửi thông báo trong Firestore
            await addDoc(collection(db, "notifications", req.userId, "messages"), {
                senderId: user.uid,
                senderName: nickname,
                receiverId: req.userId,
                message: `❌ Reader ${nickname} đã từ chối yêu cầu.\n📋 Lý do: ${rejectReason}`,
                read: false,
                createdAt: new Date(),
            });

            // 🔔 Gửi Push Notification đến User
            try {
                const userRef = doc(db, "users", req.userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists() && userSnap.data().expoPushToken) {
                    import("../sendPushNotification").then(({ sendPushNotification }) => {
                        sendPushNotification(
                            userSnap.data().expoPushToken,
                            "❌ Reader đã từ chối yêu cầu",
                            `Reader ${nickname} đã từ chối yêu cầu của bạn.\n📋 Lý do: ${rejectReason}`
                        );
                    });
                } else {
                    console.log("⚠️ Không tìm thấy expoPushToken của user");
                }
            } catch (pushError) {
                console.log("❌ Lỗi khi gửi push notification:", pushError);
            }

            setRejectReason("");
            setShowRejectInput(false);
            setModalVisible(false);
            Alert.alert("Đã gửi thông báo", "Reader đã từ chối yêu cầu.");
        } catch (error) {
            console.error("❌ Lỗi khi từ chối yêu cầu:", error);
            Alert.alert("Lỗi", "Không thể xử lý yêu cầu. Vui lòng thử lại sau.");
        }
    };


    // --- Thẻ trạng thái
    const renderStatusBadge = (status) => {
        const colors = {
            pending: "rgba(255, 179, 71, 0.8)",
            accepted: "rgba(111, 214, 124, 0.8)",
            rejected: "rgba(229, 115, 115, 0.8)",
        };
        const labels = {
            pending: "⏳ Chờ xử lý",
            accepted: "✅ Đã chấp nhận",
            rejected: "❌ Đã từ chối",
        };
        return (
            <View style={[styles.badge, { backgroundColor: colors[status] || "#999" }]}>
                <Text style={styles.badgeText}>{labels[status] || "Không rõ"}</Text>
            </View>
        );
    };

    // --- Render item
    const renderRequestItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedRequest(item);
                setModalVisible(true);
            }}
        >
            <Text style={styles.topic}>🧍‍♀️ {item.userName || "Người dùng ẩn danh"}</Text>
            <Text style={styles.subText}>🎂 {item.birthDateStr || "Không rõ ngày sinh"}</Text>
            <Text style={styles.subText}>🕐 {item.birthTime || "Không rõ giờ sinh"}</Text>
            <Text style={styles.subText}>💬 {item.question || "Không có câu hỏi"}</Text>
            <Text style={styles.subText}>📞 {item.contactMethod || "Không rõ"}</Text>
            <Text style={styles.subText}>
                🗓️{" "}
                {item.createdAt?.seconds
                    ? format(new Date(item.createdAt.seconds * 1000), "dd/MM/yyyy HH:mm", { locale: vi })
                    : "Chưa rõ"}
            </Text>
            {renderStatusBadge(item.status)}
        </TouchableOpacity>
    );

    // --- Loading
    if (loading)
        return (
            <BackgroundWrapper>
                <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
                    <ActivityIndicator size="large" color="#b892ff" />
                </SafeAreaView>
            </BackgroundWrapper>
        );

    return (
        <BackgroundWrapper>
            <SafeAreaView style={{ flex: 1 }}>
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    ListHeaderComponent={() => (
                        <>
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.title}>🔮 Reader: {nickname}</Text>
                                </View>
                                <TouchableOpacity onPress={handleLogout}>
                                    <Icon name="log-out-outline" size={26} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Trạng thái: {status}</Text>
                                <Switch
                                    value={isActive}
                                    onValueChange={toggleSwitch}
                                    trackColor={{ true: "#b892ff" }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Danh sách yêu cầu trải bài:</Text>
                            </View>

                            {requests.length === 0 && (
                                <Text style={styles.emptyText}>Chưa có yêu cầu nào.</Text>
                            )}
                        </>
                    )}
                />

                {/* Modal */}
                <Modal visible={modalVisible} transparent animationType="fade">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalBox}>
                            {selectedRequest && (
                                <>
                                    <Text style={styles.modalTitle}>✨ Chi tiết yêu cầu</Text>
                                    <Text style={styles.modalText}>👤 {selectedRequest.userName}</Text>
                                    <Text style={styles.modalText}>🎂 {selectedRequest.birthDateStr || "Không rõ"}</Text>
                                    <Text style={styles.modalText}>🕐 {selectedRequest.birthTime || "Không rõ"}</Text>
                                    <Text style={styles.modalText}>💬 {selectedRequest.question}</Text>
                                    <Text style={styles.modalText}>📞 {selectedRequest.contactMethod}</Text>
                                    <View style={{ marginVertical: 10 }}>
                                        {renderStatusBadge(selectedRequest.status)}
                                    </View>

                                    {selectedRequest.status === "pending" && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.btn, { backgroundColor: "#6fd67caa" }]}
                                                onPress={() => handleAccept(selectedRequest)}
                                            >
                                                <Text style={styles.btnText}>Chấp nhận</Text>
                                            </TouchableOpacity>

                                            {!showRejectInput && (
                                                <TouchableOpacity
                                                    style={[styles.btn, { backgroundColor: "#e57373cc", marginTop: 10 }]}
                                                    onPress={() => setShowRejectInput(true)}
                                                >
                                                    <Text style={styles.btnText}>Từ chối</Text>
                                                </TouchableOpacity>
                                            )}

                                            {showRejectInput && (
                                                <>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Nhập lý do từ chối..."
                                                        placeholderTextColor="#aaa"
                                                        value={rejectReason}
                                                        onChangeText={setRejectReason}
                                                    />
                                                    <TouchableOpacity
                                                        style={[styles.btn, { backgroundColor: "#e57373cc" }]}
                                                        onPress={() => handleReject(selectedRequest)}
                                                    >
                                                        <Text style={styles.btnText}>Xác nhận từ chối</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.btn, { backgroundColor: "#555", marginTop: 10 }]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            setShowRejectInput(false);
                                            setRejectReason("");
                                        }}
                                    >
                                        <Text style={styles.btnText}>Đóng</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: "rgba(123, 92, 255, 0.8)",
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "rgba(164,138,255,0.6)",
        borderRadius: 12,
        margin: 10,
    },
    title: { fontSize: 18, color: "#fff", fontWeight: "bold" },
    subTitle: { color: "#e0e0ff", fontSize: 13, marginTop: 2 },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 16,
        alignItems: "center",
        backgroundColor: "rgba(42,36,64,0.6)",
        padding: 12,
        borderRadius: 10,
        marginVertical: 6,
    },
    statusLabel: { fontSize: 16, color: "#fff" },
    card: {
        backgroundColor: "rgba(42, 36, 64, 0.65)",
        marginHorizontal: 15,
        marginVertical: 8,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(79,63,138,0.6)",
    },
    topic: { fontSize: 17, fontWeight: "bold", color: "#fff" },
    subText: { color: "#d6d2f8", marginTop: 4 },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        marginTop: 8,
    },
    badgeText: { color: "#fff", fontSize: 13 },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#fff",
        fontSize: 16,
        opacity: 0.8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalBox: {
        backgroundColor: "rgba(30,25,55,0.95)",
        width: "85%",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(106,90,205,0.6)",
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#fff" },
    modalText: { marginTop: 4, fontSize: 15, color: "#ddd" },
    input: {
        borderWidth: 1,
        borderColor: "#6a5acd",
        borderRadius: 10,
        marginTop: 10,
        padding: 8,
        color: "#fff",
    },
    btn: {
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    btnText: { color: "#fff", fontWeight: "bold" },
});
