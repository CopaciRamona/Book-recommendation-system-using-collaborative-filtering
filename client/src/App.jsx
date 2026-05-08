import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import { useAuth } from './context/AuthContext';
import BookDetails from './pages/BookDetails';
import Library from './pages/LIbrary'; // Ai grija la litera mare 'I' de aici
import Profile from './pages/Profile';
import Chatbot from './components/Chatbot';
import Discover from './pages/Discover';
import GenreBooks from './pages/GenreBooks';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';

// 1. PAZNIC PENTRU PAGINILE PRINCIPALE
const RequireCompleteProfile = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Se verifică...</div>;
  if (!user) return <Navigate to="/welcome" />;
  if (user.isProfileComplete === false) {
      return <Navigate to="/update-profile" replace />;
  }
  return children;
};

// 2. PAZNIC PENTRU PROFIL
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Se verifică...</div>;
  return user ? children : <Navigate to="/welcome" />;
};

// 3. PAZNIC PENTRU PAGINILE PUBLICE
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Se verifică...</div>;
  
  if (user) {
      if (!user.isProfileComplete) {
          return <Navigate to="/update-profile" replace />;
      } else {
          return <Navigate to="/home" replace />;
      }
  }
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <>
      {(!user || !user.isProfileComplete) && <Navbar />}

      <Routes>
        {/* RUTE PUBLICE*/}
        <Route path="/" element={<GuestRoute><Welcome /></GuestRoute>} />
        <Route path="/welcome" element={<GuestRoute><Welcome /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        
        {/* RUTĂ DE SETARE PROFIL*/}
        <Route path="/update-profile" element={
            <RequireAuth>
                <ProfileSetup />
            </RequireAuth>
        } />

        {/* RUTELE APLICAȚIEI (CU SIDEBAR) */}
        <Route element={
            <RequireCompleteProfile>
                <MainLayout />
            </RequireCompleteProfile>
        }>
            {/* Home-ul funcționează acum și ca Admin Dashboard */}
            <Route path="/home" element={<Home />} />
            
            <Route path="/discover" element={<Discover />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/book/:id" element={<BookDetails />} />
            <Route path="/genre/:genreName" element={<GenreBooks />} />
        </Route>

        {/* Fallback pentru rute inexistente */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>

      {user && user.isProfileComplete && <Chatbot />}
    </>
  );
}

export default App;