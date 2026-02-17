import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDhlPxmMc9R471kObm-4ZWceT6O1xvCmVs",
    authDomain: "englishmaster-pro.web.app",
    projectId: "englishmaster-pro",
    storageBucket: "englishmaster-pro.firebasestorage.app",
    messagingSenderId: "165102982425",
    appId: "1:165102982425:web:f0185ec54947ccbccf6188"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
