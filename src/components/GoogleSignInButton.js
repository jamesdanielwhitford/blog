import React from 'react';
import { auth } from '../firebase';
import firebase from 'firebase/compat/app';

const GoogleSignInButton = () => {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      window.location.href = '/admin'; // Redirect to the admin page
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <button className="google-sign-in-button" onClick={handleGoogleSignIn}>
      Sign In with Google
    </button>
  );
};

export default GoogleSignInButton;