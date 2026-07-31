import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories';
import CategoryModal from '../components/CategoryModal';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  async function loadData() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  async function handleSave(data) {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza? Isso pode afetar transações que usam essa categoria.')) return;

    try {
      await deleteCategory(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('Não foi possível excluir. Verifique se não há transações usando essa categoria.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Categorias</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition"
        >
          <Plus size={16} />
          Nova
        </button>
      </div>

      {/* Grid de categorias */}
      {categories.length === 0 ? (
        <p className="text-white/40 text-sm">Nenhuma categoria ainda.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#14141B] rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    cat.type === 'INCOME'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {cat.type === 'INCOME' ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="text-white/40 hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-white/40">
                  {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        category={editingCategory}
      />
    </div>
  );
}

export default Categories;