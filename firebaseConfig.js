// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚙️ Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCT1SfKPc68tm--qX54hxGX1qN-pOu71mE",
    authDomain: "tarotapp-a6ff4.firebaseapp.com",
    projectId: "tarotapp-a6ff4",
    storageBucket: "tarotapp-a6ff4.appspot.com",
    messagingSenderId: "102845355761",
    appId: "1:102845355761:web:e43df10592e0ccca5b7b50",
    measurementId: "G-ND0K8B2ZTW",
};

// 🚀 Khởi tạo app chỉ **một lần**
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 🔥 Export Firestore & Auth để dùng ở các file khác
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
