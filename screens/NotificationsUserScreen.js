import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import BackgroundWrapper from "../components/BackgroundWrapper";

const getStatusText = (status, rejectionReason) => {
    switch (status) {
        case "pending":
            return { text: "🟡 Đang chờ tín hiệu từ Reader", color: "#FFA500" };
        case "accepted":
            return { text: "✅ Reader đã đồng ý", color: "#4CAF50" };
        case "rejected":
            return {
                text: `❌ Reader đã từ chối${rejectionReason ? `: ${rejectionReason}` : ""}`,
                color: "#F44336",
            };
        default:
            return { text: "", color: "#2196F3" };
    }
};

export default function NotificationsUserScreen({ navigation }) {
    const user = auth.currentUser;
    const userId = user?.uid;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const ref = collection(db, "notifications", userId, "messages");
        const q = query(ref, orderBy("createdAt", "desc"));

        const unsub = onSnapshot(q, async (snap) => {
            const data = [];
            let unread = 0;

            for (const docSnap of snap.docs) {
                const msg = { id: docSnap.id, ...docSnap.data() };
                if (!msg.read) {
                    await updateDoc(docSnap.ref, { read: true });
                    unread++;
                }
                data.push(msg);
            }

            setRequests(data);
            setUnreadCount(unread);
            setLoading(false);
            navigation.setParams({ unreadCount: unread });
        });

        return () => unsub();
    }, [userId, navigation]);

    const renderReaderInfo = (readerPayload) => {
        // readerPayload có thể là object chứa nhiều trường khác nhau
        // hiển thị những trường thông dụng (name, note, readingSummary, contact, price, method)
        if (!readerPayload || typeof readerPayload !== "object") return null;

        const {
            readerName,
            note,
            message,
            readingSummary,
            summary,
            contact,
            method,
            price,
            details,
        } = readerPayload;

        return (
            <View style={styles.readerBox}>
                <Text style={styles.readerLabel}>🔮 Thông tin reader đã gửi:</Text>
                {readerName ? <Text style={styles.readerField}>👤 Reader: {readerName}</Text> : null}
                {message ? <Text style={styles.readerField}>💬 Tin nhắn: {message}</Text> : null}
                {note ? <Text style={styles.readerField}>📝 Ghi chú: {note}</Text> : null}
                {readingSummary ? (
                    <Text style={styles.readerField}>📖 Tóm tắt trải bài: {readingSummary}</Text>
                ) : null}
                {summary ? <Text style={styles.readerField}>📖 Tóm tắt: {summary}</Text> : null}
                {details ? <Text style={styles.readerField}>🔎 Chi tiết: {details}</Text> : null}
                {contact ? <Text style={styles.readerField}>📱 Liên hệ reader: {contact}</Text> : null}
                {method ? <Text style={styles.readerField}>🔗 Phương thức liên hệ: {method}</Text> : null}
                {price ? <Text style={styles.readerField}>💰 Giá: {price}</Text> : null}
            </View>
        );
    };

    const renderRequestItem = ({ item }) => {
        const status = getStatusText(item.status, item.rejectionReason);
        const requestDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();

        // Tìm payload reader gửi lại (tùy tên trường trong db)
        const readerPayload =
            item.readerResponse ||
            item.readerData ||
            item.response ||
            item.responseForm ||
            item.readerForm ||
            item.readerPayload ||
            null;

        return (
            <View style={[styles.card, { borderLeftColor: status.color }]}>
                {/* Nội dung thông báo */}
                <Text style={styles.msg}>{item.message}</Text>

                {/* Trạng thái */}
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>

                {/* Hiển thị form user đã gửi (nếu có) */}
                {item.formData && (
                    <View style={styles.formData}>
                        <Text style={styles.formLabel}>📋 Thông tin bạn đã gửi:</Text>

                        {item.formData.fullName ? (
                            <Text style={styles.formField}>👤 Họ tên: {item.formData.fullName}</Text>
                        ) : null}

                        {item.formData.topic ? (
                            <Text style={styles.formField}>📌 Chủ đề: {item.formData.topic}</Text>
                        ) : null}

                        {item.formData.birthDateStr ? (
                            <Text style={styles.formField}>🎂 Ngày sinh: {item.formData.birthDateStr}</Text>
                        ) : null}

                        {item.formData.contact ? (
                            <Text style={styles.formField}>📱 Liên hệ: {item.formData.contact}</Text>
                        ) : null}

                        {item.formData.description ? (
                            <Text style={styles.formField}>📝 Mô tả: {item.formData.description}</Text>
                        ) : null}
                    </View>
                )}

                {/* Hiển thị thông tin reader trả về (nếu có) */}
                {readerPayload && renderReaderInfo(readerPayload)}

                {/* Thời gian */}
                <Text style={styles.time}>
                    {format(requestDate, "HH:mm - dd/MM/yyyy", { locale: vi })}
                </Text>

                {/* Nút hành động khi reader đã đồng ý */}
                {item.status === "accepted" && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                            Alert.alert(
                                "Thông báo",
                                "Reader sẽ liên hệ theo phương thức đã gửi. Mở phần chat để nhắn tin hoặc đợi reader kết nối."
                            )
                        }
                    >
                        <Text style={styles.actionButtonText}>Nhắn tin ngay</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <BackgroundWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6a1b9a" />
                </View>
            </BackgroundWrapper>
        );
    }

    return (
        <BackgroundWrapper>
            <View>
                <Text> </Text>
                <Text> </Text>
                <View style={{ height: 8 }} />

                <View style={styles.header}>
                    <Text style={styles.title}>🔔 Thông báo</Text>
                </View>
            </View>
            <View>
                <TouchableOpacity
                    onPress={() => navigation.navigate("HomeScreen")}
                    style={styles.backIcon}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>

            </View>

            {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        marginVertical: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#4B0082",
    },
    badge: {
        backgroundColor: "#e53935",
        borderRadius: 10,
        minWidth: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
    },
    badgeText: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
    },
    listContent: {
        paddingBottom: 30,
        paddingHorizontal: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 80,
    },
    emptyText: {
        fontSize: 16,
        color: "#fff",
        textShadowColor: "#000",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    card: {
        backgroundColor: "rgba(255,255,255,0.96)",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        marginHorizontal: 2,
        borderLeftWidth: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    msg: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
        color: "#222",
    },
    statusContainer: {
        marginVertical: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
    },
    formData: {
        backgroundColor: "rgba(240,240,255,0.85)",
        borderRadius: 10,
        padding: 10,
        marginVertical: 8,
    },
    formLabel: {
        fontWeight: "800",
        marginBottom: 8,
        color: "#4B0082",
        fontSize: 15,
    },
    formField: {
        fontSize: 14,
        color: "#333",
        marginBottom: 6,
    },
    readerBox: {
        backgroundColor: "rgba(230,240,255,0.95)",
        borderRadius: 10,
        padding: 10,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: "rgba(120,81,169,0.12)",
    },
    readerLabel: {
        fontWeight: "800",
        color: "#3a0066",
        marginBottom: 8,
        fontSize: 15,
    },
    readerField: {
        fontSize: 14,
        color: "#222",
        marginBottom: 6,
    },
    time: {
        fontSize: 12,
        color: "#666",
        textAlign: "right",
        marginTop: 6,
    },
    actionButton: {
        backgroundColor: "#7b1fa2",
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
        marginTop: 12,
    },
    actionButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backIcon: {
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 100,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    backArrow: {
        fontSize: 22,
        color: "#fff",
        fontWeight: "600",
    },

});
