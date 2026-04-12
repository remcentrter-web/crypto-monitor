import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Твоя конфігурація Firebase (вже з твоїми ключами)
const firebaseConfig = {
  apiKey: "AIzaSyBCDh4iD_Vw3FSPxoE_zSiThg-uZTP_9ZM",
  authDomain: "crypto-monitor-36afc.firebaseapp.com",
  projectId: "crypto-monitor-36afc",
  storageBucket: "crypto-monitor-36afc.firebasestorage.app",
  messagingSenderId: "839431204241",
  appId: "1:839431204241:web:6e2fdcfaf7f442de703e30"
};

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);

// Експорт сервісу аутентифікації
export const auth = getAuth(app);