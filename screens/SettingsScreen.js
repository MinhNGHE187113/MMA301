import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import BackgroundWrapper from '../components/BackgroundWrapper';

export default function SettingsScreen({ navigation }) {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            Alert.alert("Đăng xuất thành công", "Hẹn gặp lại bạn!");
            navigation.replace("Login"); // Quay lại màn hình đăng nhập
        } catch (error) {
            console.log("Lỗi đăng xuất:", error);
            Alert.alert("Đã xảy ra lỗi khi đăng xuất");
        }
    };

    return (
        <BackgroundWrapper>
            <View style={styles.container}>
                <Text style={styles.text}>Trang Cài đặt</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </BackgroundWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 24, color: 'white', fontWeight: 'bold', marginBottom: 20 },

    logoutButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        shadowColor: '#ff4d4d',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
