import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PodcastProvider } from './context/PodcastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ForgotPassword } from './components/ForgotPassword';
import { Settings } from './components/Settings';
import { CharacterManager } from './components/CharacterManager';
import { CharacterCreator } from './components/CharacterCreator';
import { CharacterDetail } from './components/CharacterDetail';
import { ProgramManager } from './components/ProgramManager';
import { ProgramCreator } from './components/ProgramCreator';
import { ProgramDetail } from './components/ProgramDetail';
import { EpisodeCreator } from './components/EpisodeCreator';
import { EpisodePlayer } from './components/EpisodePlayer';
import { EpisodeLibrary } from './components/EpisodeLibrary';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="/episodes" element={<ProtectedRoute><EpisodeLibrary /></ProtectedRoute>} />

      <Route path="/characters" element={<ProtectedRoute><CharacterManager /></ProtectedRoute>} />
      <Route path="/characters/new" element={<ProtectedRoute><CharacterCreator /></ProtectedRoute>} />
      <Route path="/characters/edit/:id" element={<ProtectedRoute><CharacterCreator /></ProtectedRoute>} />
      <Route path="/character/:id" element={<ProtectedRoute><CharacterDetail /></ProtectedRoute>} />

      <Route path="/programs" element={<ProtectedRoute><ProgramManager /></ProtectedRoute>} />
      <Route path="/programs/new" element={<ProtectedRoute><ProgramCreator /></ProtectedRoute>} />
      <Route path="/programs/edit/:id" element={<ProtectedRoute><ProgramCreator /></ProtectedRoute>} />
      <Route path="/program/:id" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />

      <Route path="/create" element={<ProtectedRoute><EpisodeCreator /></ProtectedRoute>} />
      <Route path="/episode/:id" element={<ProtectedRoute><EpisodePlayer /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PodcastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </PodcastProvider>
    </AuthProvider>
  );
};

export default App;