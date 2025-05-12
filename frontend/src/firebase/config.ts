import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBg1dMpVemY52weldK7h-QSiX2VRtvr8_0",
  authDomain: "ecomart-demo.firebaseapp.com",
  projectId: "ecomart-demo",
  storageBucket: "ecomart-demo.firebasestorage.app",
  messagingSenderId: "530515788961",
  appId: "1:530515788961:web:35cb09bb5fe74b8d8e5ce0",
  measurementId: "G-4LL6EJPG4J"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
// Only initialize messaging if it's supported
let messaging: any = null;
const initializeMessaging = async () => {
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (error) {
    console.error('Firebase messaging not supported', error);
  }
  return null;
};

export { app, auth, db, storage, functions, messaging, initializeMessaging };