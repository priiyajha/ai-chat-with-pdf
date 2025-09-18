import {getApp, getApps, initializeApp} from "firebase/app";
import {getFirestore} from "@firebase/firestore";
import {getStorage} from "@firebase/storage";



const firebaseConfig = {
    apiKey: "AIzaSyDqJvhv_m9Km8BJTsoZ5iYAkh1lWy5Asfw",
    authDomain: "ai-chat-with-pdf-51c16.firebaseapp.com",
    projectId: "ai-chat-with-pdf-51c16",
    storageBucket: "ai-chat-with-pdf-51c16.firebasestorage.app",
    messagingSenderId: "326255545131",
    appId: "1:326255545131:web:d22571141f9b813137136e"
};

const app = getApps().length===0? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
