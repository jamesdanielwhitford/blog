// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-SvjLpBVuCjovDb8FQ3mC4THy22khcig",
  authDomain: "port-d64f2.firebaseapp.com",
  projectId: "port-d64f2",
  storageBucket: "port-d64f2.appspot.com",
  messagingSenderId: "320967397995",
  appId: "1:320967397995:web:8bf6db3610648faa58572e",
  measurementId: "G-GK66WZ6Y20"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);