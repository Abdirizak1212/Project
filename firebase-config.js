// ============================================================
//  Nadaara Hub — Firebase Configuration
//  Replace every placeholder below with your real project values.
//  Get them from: https://console.firebase.google.com
//    → Your project → Project settings → Your apps → Web app
// ============================================================

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ============================================================
//  Admin email — any user signing in with this address
//  will be granted the 'admin' role automatically.
// ============================================================
const ADMIN_EMAIL = "admin@nadaarahub.com";

// ============================================================
//  Initialize Firebase (called once; other scripts reuse the
//  default app via firebase.app())
// ============================================================
firebase.initializeApp(firebaseConfig);
