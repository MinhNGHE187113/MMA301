import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from "react-native";
import { db, auth } from "../firebaseConfig";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDoc
} from "firebase/firestore";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const getStatusText = (status, rejectionReason) => {
    switch (status) {
        case 'pending':
            return { text: '🟡 Đang chờ tín hiệu từ reader', color: '#FFA500' };
        case 'accepted':
            return { text: '✅ Reader đã đồng ý', color: '#4CAF50' };
        case 'rejected':
            return {
                text: `❌ Reader đã từ chối${rejectionReason ? `: ${rejectionReason}` : ''}`,
                color: '#F44336'
            };
        default:
            return { text: '', color: '#2196F3' };
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
                    // 👇 Khi có thông báo mới, hiển thị Notification cục bộ (nếu app đang mở)
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "🔔 Thông báo mới",
                            body: msg.message || "Bạn có thông báo mới",
                        },
                        trigger: null,
                    });
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


    const renderRequestItem = ({ item }) => {
        const status = getStatusText(item.status, item.rejectionReason);
        const requestDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();

        return (
            <View style={[styles.card, { borderLeftColor: status.color, borderLeftWidth: 4 }]}>
                <Text style={styles.msg}>{item.message}</Text>

                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                        {status.text}
                    </Text>
                </View>

                {item.formData && (
                    <View style={styles.formData}>
                        <Text style={styles.formLabel}>Thông tin yêu cầu:</Text>
                        <Text>📌 Chủ đề: {item.formData.topic}</Text>
                        <Text>📅 Ngày sinh: {item.formData.birthDateStr}</Text>
                        <Text>📝 Mô tả: {item.formData.description}</Text>
                    </View>
                )}

                <Text style={styles.time}>
                    {format(requestDate, 'HH:mm - dd/MM/yyyy', { locale: vi })}
                </Text>

                {item.status === 'accepted' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            // Navigate to chat or other action
                            Alert.alert("Thông báo", "Reader Hãy chú ý phương thức liên hệ bạn đã gửi, Reader sẽ sớm kết nối với bạn.!");
                        }}
                    >
                        <Text style={styles.actionButtonText}>Nhắn tin ngay</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔔 Thông báo</Text>
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                )}
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
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    badge: {
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    msg: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    statusContainer: {
        marginVertical: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    formData: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    formLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    time: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    actionButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
