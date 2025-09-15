
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }

    const credentials = JSON.parse(
        Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });

  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    // Fallback for environments where GOOGLE_APPLICATION_CREDENTIALS might be set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       console.log("Attempting to initialize with GOOGLE_APPLICATION_CREDENTIALS...");
       admin.initializeApp();
    } else {
       console.error("No valid Firebase credentials found.");
    }
  }
}

export function getAdminFirestore(): admin.firestore.Firestore {
  if (!firestore) {
    initializeFirebaseAdmin();
    firestore = admin.firestore();
  }
  return firestore;
}
