import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const inputClass =
  'w-full bg-panel-strong border border-panel-border rounded-[10px] px-4 py-3 text-base sm:text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Sem conexão com o servidor. Tente novamente.');
      } else if (err.response.status === 429) {
        setError(err.response.data?.error || 'Muitas tentativas. Aguarde um pouco.');
      } else {
        setError('Email ou senha inválidos.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Faça seu login"
      subtitle="Entre para acompanhar suas finanças."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/register" className="text-accent hover:underline underline-offset-4">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
        </label>

        {error && <p className="text-neg text-[12.5px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-bg rounded-[10px] py-3 mt-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
