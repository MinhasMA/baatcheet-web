import React from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

function Auth() {
  const [user] = useAuthState(auth);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      {user ? (
        <div className="user-info">
          <img src={user.photoURL} alt="Profile" className="profile-pic" />
          <span>{user.displayName}</span>
          <button onClick={logOut} className="auth-button logout">
            Logout
          </button>
        </div>
      ) : (
        <button onClick={signInWithGoogle} className="auth-button login">
          Sign in with Google
        </button>
      )}
    </div>
  );
}

export default Auth;
