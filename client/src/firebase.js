// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAL-EArGui8uanm0qpN4see6T3xtYyLr_4",
  authDomain: "collabease-49374.firebaseapp.com",
  projectId: "collabease-49374",
  storageBucket: "collabease-49374.firebasestorage.app",
  messagingSenderId: "261368885344",
  appId: "1:261368885344:web:08bb35abc29c5f30489305"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();

export { auth, githubProvider }; 