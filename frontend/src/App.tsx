import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, initializeMessaging } from './firebase/config';
import { onMessage, getToken } from 'firebase/messaging';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import FoodWastePage from './pages/FoodWastePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RecyclePage from './pages/RecyclePage';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  const [user] = useAuthState(auth);

  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    const setupMessaging = async () => {
      try {
        if (!user) return;

        const messaging = await initializeMessaging();
        if (!messaging) return;

        // Check if we already have a token stored
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        // Request permission and get token
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          });

          // Save token to Firestore if it's new or changed
          if (token && (!userData?.fcmToken || userData.fcmToken !== token)) {
            await setDoc(userDocRef, { fcmToken: token }, { merge: true });
          }

          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Message received in foreground:', payload);
            // Display a notification or toast
            if (payload.notification) {
              const { title, body } = payload.notification;
              // Show notification if browser supports it
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title as string, {
                  body: body as string,
                  icon: '/favicon.svg',
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error setting up messaging:', error);
      }
    };

    setupMessaging();
  }, [user]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/recycle" element={<RecyclePage />} />
            <Route path="/food-waste" element={<FoodWastePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;