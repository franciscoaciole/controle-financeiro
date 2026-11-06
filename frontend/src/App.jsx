import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Layout from './components/Layout';
import Toaster from './components/Toaster';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  // replace: o botão Voltar não volta para uma tela que exige login
  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
}

// Login e cadastro: quem já está logado vai direto ao dashboard
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

// Raiz do site e endereços desconhecidos: o destino depende de haver sessão
function FallbackRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <Transactions />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <Categories />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </>
  );
}

export default App;