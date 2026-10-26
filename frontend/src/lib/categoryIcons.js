import { createElement } from 'react';
import {
  ShoppingCart,
  Car,
  Home,
  Utensils,
  HeartPulse,
  Tv,
  Wallet,
  Smile,
  PawPrint,
} from 'lucide-react';

const icons = {
  Salário: Wallet,
  Pix: Wallet,
  Alimentação: Utensils,
  Transporte: Car,
  Moradia: Home,
  Saúde: HeartPulse,
  Entretenimento: Tv,
  Lazer: Smile,
  Pets: PawPrint,
};

export function getCategoryIcon(name) {
  return icons[name] || ShoppingCart;
}

// Renderiza o ícone da categoria sem criar componente durante o render
export function CategoryIcon({ name, ...props }) {
  return createElement(getCategoryIcon(name), props);
}
