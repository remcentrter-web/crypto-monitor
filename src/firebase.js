import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCDh4iD_Vw3FSPxoE_zSiThg-uZTP_9ZM",
  authDomain: "crypto-monitor-36afc.firebaseapp.com",
  projectId: "crypto-monitor-36afc",
  storageBucket: "crypto-monitor-36afc.firebasestorage.app",
  messagingSenderId: "839431204241",
  appId: "1:839431204241:web:6e2fdcfaf7f442de703e30"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 