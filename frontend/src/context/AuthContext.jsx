import { createContext, useContext, useState, useEffect } from 'react';
import api, { setUnauthorizedHandler } from '../services/api';
import { showToast } from '../lib/toast';

const AuthContext = createContext();

function clearSession() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // armazenamento indisponível: nada a limpar
  }
}

// Lê o usuário salvo sem quebrar o app se o conteúdo estiver corrompido
function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao carregar o app, só aceita a sessão se token e usuário estiverem íntegros
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch {
      token = null;
    }

    const storedUser = readStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    } else {
      clearSession();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Qualquer resposta 401 (token expirado ou inválido) encerra a sessão
    setUnauthorizedHandler(() => {
      let hasToken = false;
      try {
        hasToken = Boolean(localStorage.getItem('token'));
      } catch {
        hasToken = false;
      }
      // Várias requisições podem falhar juntas: só a primeira avisa
      if (!hasToken) return;

      clearSession();
      setUser(null);
      showToast('Sua sessão expirou. Entre novamente.');
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  async function register(name, email, password) {
    await api.post('/auth/register', { name, email, password });
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
