import React from 'react';
import { auth } from '../firebase';
import firebase from 'firebase/compat/app';

const GoogleSignInButton = () => {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>Sign In with Google</button>
  );
};

export default GoogleSignInButton;