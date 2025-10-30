import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    updateDoc,
    serverTimestamp,
    getDocs,
} from "firebase/firestore";
import BackgroundWrapper from "../components/BackgroundWrapper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function ContactScreen() {
    const user = auth.currentUser;
    const [readers, setReaders] = useState([]);
    const [selectedReader, setSelectedReader] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: "",
        birthDate: new Date(),
        birthDateStr: "",
        birthTime: "",
        question: "",
        contactMethod: "",
    });

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const showTimePicker = () => setTimePickerVisibility(true);
    const hideTimePicker = () => setTimePickerVisibility(false);

    const handleConfirmDate = (selectedDate) => {
        hideDatePicker();
        if (selectedDate) {
            setForm({
                ...form,
                birthDate: selectedDate,
                birthDateStr: format(selectedDate, "dd/MM/yyyy", { locale: vi }),
            });
        }
    };

    const handleConfirmTime = (selectedTime) => {
        hideTimePicker();
        if (selectedTime) {
            const formattedTime = selectedTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
            setForm({ ...form, birthTime: formattedTime });
        }
    };

    const fetchAllReaders = async () => {
        try {
            setLoading(true);
            const readersRef = collection(db, "readers");
            const querySnapshot = await getDocs(readersRef);
            const data = [];

            querySnapshot.forEach((docSnap) => {
                if (docSnap.exists()) {
                    const info = docSnap.data();
                    const displayName = info.nickName ? `Reader ${info.nickName}` : "Reader Ẩn danh";
                    data.push({
                        id: docSnap.id,
                        nickName: displayName,
                        status: info.status || "bận",
                        isAvailable: info.isAvailable || false,
                        approved: info.approved || false,
                    });
                }
            });

            data.sort((a, b) => a.nickName.localeCompare(b.nickName));
            setReaders(data);
        } catch (error) {
            console.error("Lỗi khi tải reader:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách reader. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchAllReaders();
    }, []);

    const handleSendRequest = async () => {
        if (!form.name || !form.birthDateStr || !form.question || !form.contactMethod) {
            Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ tất cả các trường.");
            return;
        }
        if (!selectedReader) return;

        try {
            const notiRef = collection(db, "notifications", selectedReader.id, "messages");
            const notiDoc = await addDoc(notiRef, {
                senderId: user.uid,
                senderEmail: user.email,
                senderName: user.displayName || "Người dùng",
                receiverId: selectedReader.id,
                receiverName: selectedReader.nickName,
                formData: form,
                message: `📩 Yêu cầu trải bài từ ${form.name}`,
                status: "pending",
                read: false,
                createdAt: serverTimestamp(),
            });

            await updateDoc(notiDoc, { createdAt: serverTimestamp() });

            const formRef = collection(db, "formSubmissions");
            await addDoc(formRef, {
                readerId: selectedReader.id,
                readerName: selectedReader.nickName,
                userId: user.uid,
                userEmail: user.email,
                userName: form.name,
                question: form.question,
                contactMethod: form.contactMethod,
                birthDate: form.birthDate,
                birthDateStr: form.birthDateStr,
                birthTime: form.birthTime,
                status: "pending",
                read: false,
                createdAt: serverTimestamp(),
            });

            // 🔔 Gửi thông báo đến Reader
            try {
                const readerDoc = await getDocs(collection(db, "readers"));
                readerDoc.forEach((r) => {
                    if (r.id === selectedReader.id && r.data().expoPushToken) {
                        import("../sendPushNotification").then(({ sendPushNotification }) => {
                            sendPushNotification(
                                r.data().expoPushToken,
                                "🔮 Yêu cầu mới!",
                                `${form.name} vừa gửi yêu cầu trải bài đến bạn.`
                            );
                        });
                    }
                });
            } catch (e) {
                console.log("⚠️ Không tìm thấy token Reader:", e);
            }

            Alert.alert("✅ Thành công", "Đã gửi yêu cầu đến reader!");
            setModalVisible(false);
            setForm({
                name: "",
                birthDate: new Date(),
                birthDateStr: "",
                birthTime: "",
                question: "",
                contactMethod: "",
            });
        } catch (err) {
            console.error("❌ Lỗi gửi yêu cầu:", err);
            Alert.alert("Lỗi", "Không thể gửi yêu cầu. Vui lòng thử lại sau.");
        }
    };


    if (!user) {
        return (
            <BackgroundWrapper>
                <Text style={styles.infoText}>
                    Vui lòng đăng nhập để sử dụng tính năng này
                </Text>
            </BackgroundWrapper>
        );
    }

    if (loading) {
        return (
            <BackgroundWrapper>
                <ActivityIndicator size="large" color="#9D4EDD" />
            </BackgroundWrapper>
        );
    }

    return (
        <BackgroundWrapper>
            <FlatList
                data={readers.filter((r) => r.approved)}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={{ marginBottom: 10 }}>
                        <Text>     </Text>
                        <Text>     </Text>
                        <Text>     </Text>
                        <Text>     </Text>
                        <Text style={styles.header}>🔮 Chọn Reader để gửi yêu cầu</Text>
                    </View>
                )}
                renderItem={({ item }) => {
                    const available =
                        item.status?.toLowerCase().includes("rảnh") ||
                        item.status?.toLowerCase().includes("available");
                    return (
                        <TouchableOpacity
                            style={[styles.readerCard, !available && { opacity: 0.6 }]}
                            disabled={!available}
                            onPress={() => {
                                setSelectedReader(item);
                                setModalVisible(true);
                            }}
                        >
                            <View style={styles.readerRow}>
                                <Text style={styles.readerName}>{item.nickName}</Text>
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: available ? "#24c67a" : "#ff4d4d" },
                                    ]}
                                >
                                    {available ? "Rảnh" : "Bận"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListFooterComponent={() => (
                    <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <TouchableOpacity style={styles.reloadBtn} onPress={fetchAllReaders}>
                            <Text style={styles.reloadText}>Làm mới</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Modal gửi form */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <FlatList
                            data={[{}]}
                            renderItem={null}
                            ListHeaderComponent={
                                <>
                                    <Text style={styles.modalTitle}>
                                        Gửi yêu cầu đến {selectedReader?.nickName}
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Họ và tên của bạn"
                                        value={form.name}
                                        onChangeText={(t) => setForm({ ...form, name: t })}
                                    />

                                    <View style={styles.row}>
                                        <TouchableOpacity
                                            style={styles.dateButton}
                                            onPress={showDatePicker}
                                        >
                                            <Text style={styles.dateButtonText}>
                                                {form.birthDateStr || "📅 Chọn ngày sinh"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.timeInput}
                                            onPress={showTimePicker}
                                        >
                                            <Text
                                                style={{
                                                    color: form.birthTime ? "#000" : "#888",
                                                }}
                                            >
                                                {form.birthTime || "⏰ Chọn giờ sinh"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* ✅ Sửa đoạn này */}
                                    <DateTimePickerModal
                                        isVisible={isTimePickerVisible}
                                        mode="time"
                                        date={form.birthDate} // Dùng ngày sinh để tránh lỗi múi giờ
                                        is24Hour={true}
                                        locale="vi"
                                        onConfirm={handleConfirmTime}
                                        onCancel={hideTimePicker}
                                        confirmTextIOS="Xác nhận"
                                        cancelTextIOS="Hủy"
                                        headerTextIOS="Chọn giờ sinh"
                                    />

                                    <DateTimePickerModal
                                        isVisible={isDatePickerVisible}
                                        mode="date"
                                        date={form.birthDate}
                                        maximumDate={new Date()}
                                        locale="vi"
                                        onConfirm={handleConfirmDate}
                                        onCancel={hideDatePicker}
                                        confirmTextIOS="Xác nhận"
                                        cancelTextIOS="Hủy"
                                        headerTextIOS="Chọn ngày sinh của bạn"
                                    />

                                    <TextInput
                                        style={[styles.input, styles.textarea]}
                                        placeholder="💭 Câu hỏi bạn muốn gửi đến Reader"
                                        multiline
                                        textAlignVertical="top"
                                        value={form.question}
                                        onChangeText={(t) =>
                                            setForm({ ...form, question: t })
                                        }
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="📱 Phương thức liên lạc (Zalo, Instagram, Email, v.v.)"
                                        value={form.contactMethod}
                                        onChangeText={(t) =>
                                            setForm({ ...form, contactMethod: t })
                                        }
                                    />

                                    <TouchableOpacity
                                        style={styles.sendBtn}
                                        onPress={handleSendRequest}
                                    >
                                        <Text style={styles.sendText}>✨ Gửi yêu cầu</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.cancelText}>Hủy</Text>
                                    </TouchableOpacity>
                                </>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 60,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#6C63FF",
        textAlign: "center",
        marginBottom: 16,
    },
    reloadBtn: {
        backgroundColor: "#E9E4FF",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
        shadowColor: "#6C63FF",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 3,
    },
    reloadText: {
        color: "#3A0CA3",
        fontWeight: "600",
        fontSize: 16,
    },
    readerCard: {
        backgroundColor: "rgba(255,255,255,0.95)",
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e4d8ff",
        shadowColor: "#3A0CA3",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    readerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    readerName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#3A0CA3",
    },
    statusText: { fontWeight: "bold" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        width: "100%",
        maxHeight: "90%",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#3A0CA3",
        marginBottom: 16,
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    dateButton: {
        flex: 1,
        backgroundColor: "#F4EDFF",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginRight: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d4c3ff",
    },
    dateButtonText: {
        color: "#3A0CA3",
        fontWeight: "600",
    },
    timeInput: {
        flex: 1,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1c4e9",
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1c4e9",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    textarea: { height: 120 },
    sendBtn: {
        backgroundColor: "#6C63FF",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
        shadowColor: "#6C63FF",
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    sendText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    cancelText: {
        textAlign: "center",
        color: "#999",
        marginTop: 14,
        fontSize: 15,
    },
    infoText: {
        textAlign: "center",
        marginTop: 50,
        fontSize: 16,
        color: "#666",
    },
});
