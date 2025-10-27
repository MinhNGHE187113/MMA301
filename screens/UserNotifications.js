import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const UserNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications', user.uid, 'messages'),
            where('type', '==', 'reader_response')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = [];
            let unread = 0;
            
            snapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                notifs.push(data);
                if (!data.read) unread++;
            });

            // Sort by createdAt (newest first)
            notifs.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
            
            setNotifications(notifs);
            setUnreadCount(unread);

            // Mark all as read
            if (unread > 0) {
                const batch = [];
                snapshot.docs.forEach((doc) => {
                    if (!doc.data().read) {
                        batch.push(updateDoc(doc.ref, { read: true }));
                    }
                });
                Promise.all(batch).catch(console.error);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'accepted':
                return styles.statusAccepted;
            case 'rejected':
                return styles.statusRejected;
            case 'pending':
            default:
                return styles.statusPending;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'accepted':
                return 'Đã chấp nhận';
            case 'rejected':
                return 'Đã từ chối';
            case 'pending':
            default:
                return 'Đang chờ phản hồi';
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.notificationCard, !item.read && styles.unreadNotification]}>
            <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>
                    {item.status === 'accepted' ? '🎉 Yêu cầu đã được chấp nhận' : 
                     item.status === 'rejected' ? '❌ Yêu cầu bị từ chối' : '⏳ Đang chờ xử lý'}
                </Text>
                <Text style={styles.notificationTime}>
                    {item.createdAt?.toDate ? 
                     format(item.createdAt.toDate(), 'HH:mm dd/MM/yyyy', { locale: vi }) : 
                     'Vừa xong'}
                </Text>
            </View>
            
            <Text style={styles.notificationMessage}>{item.message}</Text>
            
            {item.rejectionReason && (
                <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Lý do từ chối:</Text>
                    <Text style={styles.reasonText}>{item.rejectionReason}</Text>
                </View>
            )}
            
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                )}
            </View>
            
            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không có thông báo nào</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    badge: {
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    notificationTime: {
        fontSize: 12,
        color: '#888',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    reasonContainer: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 6,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#f44336',
    },
    reasonLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#f44336',
    },
    reasonText: {
        fontSize: 13,
        color: '#555',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    statusPending: {
        backgroundColor: '#FFA000',
    },
    statusAccepted: {
        backgroundColor: '#4CAF50',
    },
    statusRejected: {
        backgroundColor: '#F44336',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});

export default UserNotifications;
