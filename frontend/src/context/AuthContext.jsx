import { useState, useEffect } from 'react';
import api, { setUnauthorizedHandler } from '../services/api';
import { showToast } from '../lib/toast';
import { AuthContext } from './authContextObject';

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

function readToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

// Só aceita a sessão salva se token e usuário estiverem íntegros
function readInitialSession() {
  const storedUser = readStoredUser();
  if (readToken() && storedUser) return storedUser;
  clearSession();
  return null;
}

export function AuthProvider({ children }) {
  // Sessão lida direto na criação do estado: não há "carregando" a esperar
  const [user, setUser] = useState(readInitialSession);
  const loading = false;

  useEffect(() => {
    // Qualquer resposta 401 (token expirado ou inválido) encerra a sessão
    setUnauthorizedHandler(() => {
      // Várias requisições podem falhar juntas: só a primeira avisa
      if (!readToken()) return;

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
