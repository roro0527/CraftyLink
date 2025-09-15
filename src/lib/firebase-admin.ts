
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

    // Decode the base64 service account key
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    // As a fallback, try initializing with default credentials (useful in some cloud environments)
    if (!admin.apps.length) {
       try {
           console.log("Attempting to initialize with default credentials...");
           admin.initializeApp();
       } catch (fallbackError) {
           console.error("Fallback initialization also failed:", fallbackError);
       }
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
