import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';

interface Permissions {
  canWrite: boolean;         // admin + marketing
  canSync: boolean;          // admin only
  isAdmin: boolean;          // admin only
  canManageApplies: boolean; // admin + hr
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  permissions: Permissions;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getPermissions(role: UserRole): Permissions {
  return {
    canWrite: role === 'admin' || role === 'marketing',
    canSync: role === 'admin',
    isAdmin: role === 'admin',
    canManageApplies: role === 'admin' || role === 'hr',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);

        // Read role from Firestore users/{uid}
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let role: UserRole = 'user';
        let name = firebaseUser.displayName ?? firebaseUser.email ?? 'User';

        if (userSnap.exists()) {
          const data = userSnap.data();
          role = (data.role as UserRole) ?? 'user';
          name = data.name ?? name;
        } else {
          // First login — create a record with default 'user' role
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name,
            role: 'user' as UserRole,
            createdAt: serverTimestamp(),
          });
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          name,
          role,
        });
      } else {
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged updates user/token automatically
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const permissions = getPermissions(user?.role ?? 'user');

  return (
    <AuthContext.Provider value={{ user, token, isLoading, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function usePermissions() {
  return useAuth().permissions;
}

export function useCanManageApplies() {
  return useAuth().permissions.canManageApplies;
}
