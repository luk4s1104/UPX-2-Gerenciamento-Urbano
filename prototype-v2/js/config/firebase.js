import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseCredentials from './firebase-credentials.js'

const app = initializeApp(firebaseCredentials)
export const auth = getAuth(app)
export const db = getFirestore(app)