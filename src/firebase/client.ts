import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyAiVI9XV3_XEP0uULr4JmTGZ5pjJ1y2N_A",
    authDomain: "cmkinc.firebaseapp.com",
    projectId: "cmkinc",
    storageBucket: "cmkinc.firebasestorage.app",
    messagingSenderId: "75608099110",
    appId: "1:75608099110:web:11cec5fa31b26433cc19e7",
    measurementId: "G-RWDHKH1X3K",
};

export const app = initializeApp(firebaseConfig);