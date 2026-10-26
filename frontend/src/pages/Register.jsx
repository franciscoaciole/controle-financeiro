import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';

const inputClass =
  'w-full bg-panel-strong border border-panel-border rounded-[10px] px-4 py-3 text-base sm:text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60';

// Medidor de força: serve só de orientação, não bloqueia o cadastro
function getStrength(password) {
  if (!password) return { score: 0, label: '' };

  let points = 0;
  if (password.length >= 8) points++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) points++;

  const score = password.length < 6 ? 1 : Math.max(points, 1);
  return { score, label: ['Fraca', 'Média', 'Forte'][score - 1] };
}

const barColors = ['bg-neg', 'bg-accent', 'bg-pos'];
const labelColors = ['text-neg', 'text-accent', 'text-pos'];

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const strength = getStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await register(name.trim(), email, password);
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) {
        setError('Sem conexão com o servidor. Tente novamente.');
      } else if (status === 400 || status === 429) {
        setError(err.response.data?.error || 'Não foi possível cadastrar.');
      } else {
        setError('Erro ao cadastrar. Tente novamente.');
      }
      setLoading(false);
      return;
    }

    // Entra automaticamente quando as credenciais forem válidas
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Se o login automático falhar, a conta existe e a pessoa entra pela tela de login
      navigate('/login');
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Leva menos de um minuto. Suas categorias já vêm prontas."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="text-accent hover:underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Nome</span>
          <input
            type="text"
            autoComplete="name"
            placeholder="Como quer ser chamado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </label>

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

        <div className="flex flex-col gap-2">
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
            minLength={6}
          />

          {password ? (
            <div className="flex items-center gap-3 px-0.5">
              <div className="flex flex-1 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < strength.score
                        ? barColors[strength.score - 1]
                        : 'bg-panel-strong'
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-[11px] font-medium ${labelColors[strength.score - 1]}`}
              >
                {strength.label}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-muted px-0.5">
              Use letras maiúsculas e minúsculas, números ou símbolos.
            </p>
          )}
        </div>

        {error && <p className="text-neg text-[12.5px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-bg rounded-[10px] py-3 mt-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
