// "1 lançamento lido" / "3 lançamentos lidos"
export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
