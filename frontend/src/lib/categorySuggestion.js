// Palavras-chave associadas a cada categoria.
// A busca ignora maiúsculas/minúsculas e acentos.
const CATEGORY_KEYWORDS = {
  'Salário': ['salario', 'salário', 'pagamento', 'holerite', 'pix recebido'],
  'Alimentação': ['mercado', 'supermercado', 'ifood', 'restaurante', 'padaria', 'lanche', 'comida', 'almoco', 'almoço', 'jantar'],
  'Transporte': ['uber', '99', 'gasolina', 'combustivel', 'combustível', 'onibus', 'ônibus', 'metro', 'metrô', 'estacionamento'],
  'Moradia': ['aluguel', 'condominio', 'condomínio', 'luz', 'energia', 'agua', 'água', 'internet', 'gas', 'gás'],
  'Saúde': ['farmacia', 'farmácia', 'remedio', 'remédio', 'consulta', 'medico', 'médico', 'plano de saude', 'dentista'],
  'Entretenimento': ['netflix', 'spotify', 'cinema', 'show', 'streaming', 'jogo', 'game'],
  'Lazer': ['viagem', 'passeio', 'bar', 'balada', 'parque'],
};

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function suggestCategory(description, categories) {
  if (!description || description.trim().length < 3) return null;
  const normalizedDesc = normalize(description);

  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.some((kw) => normalizedDesc.includes(normalize(kw)));
    if (matched) {
      const found = categories.find(
        (cat) => normalize(cat.name) === normalize(categoryName)
      );
      if (found) return found.id;
    }
  }
  return null;
}
