import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            Categorias
          </h1>
          <p className="text-muted text-[12.5px] mt-1">
            Organize suas receitas e despesas
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-accent text-bg px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold"
        >
          <Plus size={15} />
          Nova categoria
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted text-sm">Nenhuma categoria ainda.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    cat.type === 'INCOME'
                      ? 'bg-pos/15 text-pos'
                      : 'bg-neg/15 text-neg'
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
                    className="text-muted hover:text-text"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-muted hover:text-neg"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[13px] font-medium">{cat.name}</p>
                <p className="text-[10.5px] text-muted mt-0.5">
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