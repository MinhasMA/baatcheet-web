import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCunkD56qEbu3muLNA3Q5bDDosMeNU49Nc",
  authDomain: "baatcheetweb1.firebaseapp.com",
  projectId: "baatcheetweb1",
  storageBucket: "baatcheetweb1.firebasestorage.app",
  messagingSenderId: "105450622619",
  appId: "1:105450622619:web:269cc14da6184fbd7c403e",
  measurementId: "G-PHNT10BT9L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
