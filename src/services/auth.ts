// src/services/auth.ts
// Firebase Authentication Service

import type {
  Unsubscribe,
} from 'firebase/auth';
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: any;
  providerData: any[];
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChangedListener(
  callback: (user: AuthUser | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        metadata: user.metadata,
        providerData: user.providerData,
      } as AuthUser);
    } else {
      callback(null);
    }
  });
}

/**
 * Get current user
 */
export function getCurrentUser(): AuthUser | null {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    metadata: user.metadata,
    providerData: user.providerData,
  } as AuthUser;
}

/**
 * Get auth instance
 */
export function getAuth() {
  return auth;
}

export default {
  signOut,
  onAuthStateChangedListener,
  getCurrentUser,
  getAuth,
};
