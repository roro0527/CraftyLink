
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
    setLoading(true);
    try {
      // signInWithPopup이 성공하면, onAuthStateChanged가 user와 loading 상태를 처리합니다.
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // 사용자가 팝업을 닫았거나 다른 오류가 발생했을 때만 로딩 상태를 직접 false로 설정합니다.
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup closed by user.");
      } else {
        // 다른 실제 오류가 발생한 경우에만 콘솔에 에러를 출력합니다.
        console.error("Error signing in with Google", error);
      }
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
