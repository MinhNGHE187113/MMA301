// sendPushNotification.js
import * as Notifications from "expo-notifications";

export async function sendPushNotification(expoPushToken, title, body) {
    if (!expoPushToken) {
        console.log("⚠️ Không có token để gửi thông báo");
        return;
    }

    try {
        const message = {
            to: expoPushToken,
            sound: "default",
            title,
            body,
            data: { extra: "data" },
        };

        await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        console.log("✅ Đã gửi push notification đến:", expoPushToken);
    } catch (error) {
        console.error("❌ Lỗi gửi thông báo:", error);
    }
}
