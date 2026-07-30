import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Olá, {user?.name}!</h1>
        <button
          onClick={logout}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm"
        >
          Sair
        </button>
      </div>
      <p className="text-white/60">Dashboard em construção...</p>
    </div>
  );
}

export default Dashboard;