import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Layout from './components/Layout';
import { initDB } from './services/db';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';

import Library from './pages/Library';
import Planner from './pages/Planner';
import Train from './pages/Train';
import Stats from './pages/Stats';
import Tips from './pages/Tips';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

// App Content Wrapper to access Auth Context
const AppContent = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      initDB(currentUser.uid);
    }
  }, [currentUser]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Stats />} /> {/* Default to Stats/Dashboard */}
        <Route path="library" element={<Library />} />
        <Route path="plan" element={<Planner />} />
        <Route path="train/:sessionId" element={<Train />} />
        <Route path="tips" element={<Tips />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
