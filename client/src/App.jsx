import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import { useAuth } from './context/AuthContext';
import BookDetails from './pages/BookDetails';

// Importăm noile componente pentru interfață
import MainLayout from './components/MainLayout';
import Home from './pages/Home';

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

// 3. PAZNIC PENTRU PAGINILE PUBLICE (Welcome, Login, Register)
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
      {/* Afișăm Navbar-ul de sus DOAR dacă userul NU are profilul complet 
          (adică e vizitator, sau abia se loghează/face profilul).
          În rest, în interiorul aplicației ne bazăm pe Sidebar! */}
      {(!user || !user.isProfileComplete) && <Navbar />}

      <Routes>
        
        {/* ========================================== */}
        {/* RUTE PUBLICE (Fără Sidebar) */}
        {/* ========================================== */}
        <Route path="/" element={<GuestRoute><Welcome /></GuestRoute>} />
        <Route path="/welcome" element={<GuestRoute><Welcome /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        
        {/* ========================================== */}
        {/* RUTĂ DE SETARE PROFIL (Fără Sidebar) */}
        {/* ========================================== */}
        <Route path="/update-profile" element={
            <RequireAuth>
                <ProfileSetup />
            </RequireAuth>
        } />

        {/* ========================================== */}
        {/* RUTELE APLICAȚIEI (CU SIDEBAR) */}
        {/* ========================================== */}
        {/* Învelim MainLayout-ul în paznicul nostru. Astfel, TOATE rutele 
            din interiorul lui vor fi automat protejate! */}
        <Route element={
            <RequireCompleteProfile>
                <MainLayout />
            </RequireCompleteProfile>
        }>
            {/* Aici intră paginile care se vor randa în <Outlet /> din MainLayout */}
            <Route path="/home" element={<Home />} />
            
            {/* Pe măsură ce le construiești, le adaugi tot aici: */}
            {/* <Route path="/library" element={<Library />} /> */}
            {/* <Route path="/profile" element={<Profile />} /> */}
            {/* <Route path="/chatbot" element={<Chatbot />} /> */}
            <Route path="/book/:id" element={<BookDetails />} />
        </Route>

        {/* Fallback pentru rute inexistente */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>
    </>
  );
}

export default App;