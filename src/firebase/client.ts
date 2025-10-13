
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "craftylink",
  "appId": "1:439428212295:web:7b44282ec320220b5c7362",
  "apiKey": "AIzaSyBGm21LtpinX_pKIxqwtwEGNGk4BjLUmGU",
  "authDomain": "craftylink.firebaseapp.com",
  "messagingSenderId": "439428212295"
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
  
  services = { firebaseApp, firestore, functions, auth };
  return services;
}

export function getFirebase() {
  return initializeServices();
}
