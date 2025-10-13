
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type FirebaseServices = {
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    functions: Functions;
    auth: Auth;
}

// 서비스를 한 번만 초기화하기 위한 변수
let services: FirebaseServices | null = null;

function initializeServices(): FirebaseServices {
  if (services) {
    return services;
  }

  const isConfigured = getApps().length > 0;
  const firebaseApp = isConfigured ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  const functions = getFunctions(firebaseApp, 'asia-northeast3');
  const auth = getAuth(firebaseApp);

  // 에뮬레이터 연결 코드는 프로덕션 빌드에서 제외됩니다.
  if (process.env.NODE_ENV === 'development') {
    // connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    // connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }
  
  services = { firebaseApp, firestore, functions, auth };
  return services;
}

export function getFirebase() {
  return initializeServices();
}
