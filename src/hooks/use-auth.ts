
'use client';

import { useState, useEffect } from 'react';
import { getFirebase } from '@/firebase/client';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

/**
 * Firebase 인증 상태를 관리하고, 로그인/로그아웃 기능을 제공하는 커스텀 훅입니다.
 * @returns {object} user, loading, signInWithGoogle, signOut 함수를 포함하는 객체
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { auth } = getFirebase();

  /**
   * 컴포넌트 마운트 시, Firebase의 인증 상태 변경을 감지하는 리스너를 설정합니다.
   * 사용자가 로그인하거나 로그아웃할 때마다 user 상태를 업데이트합니다.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // 컴포넌트가 언마운트될 때 리스너를 정리(cleanup)합니다.
    return () => unsubscribe();
  }, [auth]);

  /**
   * Google 인증 제공자를 사용하여 팝업창으로 로그인을 시도하는 함수입니다.
   */
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    } finally {
      // onAuthStateChanged가 처리하므로 여기서 로딩 상태를 변경할 필요가 없을 수 있습니다.
      // 하지만 즉각적인 UI 피드백을 위해 유지할 수 있습니다.
       setLoading(false);
    }
  };

  /**
   * 사용자를 로그아웃시키는 함수입니다.
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return { user, loading, signInWithGoogle, signOut };
};
