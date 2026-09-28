'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { setAuthToken } from '../lib/axios';
import { User } from '../types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  currentUser: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
        setFirebaseUser(user);
      } else {
        setAuthToken(null);
        setFirebaseUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
    setAuthToken(null);
    setFirebaseUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, currentUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
