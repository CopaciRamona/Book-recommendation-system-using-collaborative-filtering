import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import { useAuth } from './context/AuthContext';

// 1. PAZNIC PENTRU PAGINILE PRINCIPALE (Home/Chatbot)
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

// 3. NOU! PAZNIC PENTRU PAGINILE PUBLICE (Welcome, Login, Register)
// Regula: Dacă ești logat, zburăm de aici!
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Se verifică...</div>;
  
  // Dacă există un user logat, verificăm ce e cu el
  if (user) {
      if (!user.isProfileComplete) {
          // Nu are profilul complet? Îl aruncăm înapoi în "închisoarea" formularului
          return <Navigate to="/update-profile" replace />;
      } else {
          // Are profilul complet? Îl aruncăm pe Home
          return <Navigate to="/home" replace />; // Schimbă cu /chatbot dacă e cazul
      }
  }
  
  // Dacă NU e logat, îl lăsăm să vadă pagina (copilul)
  return children;
};

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        
        {/* Acum "învelim" rutele publice cu GuestRoute */}
        <Route path="/" element={
            <GuestRoute><Welcome /></GuestRoute>
        } />
        <Route path="/welcome" element={
            <GuestRoute><Welcome /></GuestRoute>
        } />
        <Route path="/login" element={
            <GuestRoute><Login /></GuestRoute>
        } />
        <Route path="/register" element={
            <GuestRoute><Register /></GuestRoute>
        } />
        
        {/* Ruta de Profil rămâne protejată doar de logare */}
        <Route path="/update-profile" element={
            <RequireAuth>
                <ProfileSetup />
            </RequireAuth>
        } />

        {/* Ruta principală (Accesibilă doar cu profil 100% complet) */}
        <Route path="/home" element={
            <RequireCompleteProfile>
                <div>Aici e pagina Home - Acces permis doar cu profil complet!</div>
            </RequireCompleteProfile>
        } />
        
      </Routes>
    </>
  );
}

export default App;