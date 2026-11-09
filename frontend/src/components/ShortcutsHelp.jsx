import Modal from './Modal';
import { SHORTCUTS } from '../lib/shortcuts';

function ShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <Modal title="Atalhos do teclado" onClose={onClose} className="max-w-sm p-6" headerClassName="mb-4">
      <ul className="divide-y divide-panel-border">
        {SHORTCUTS.map((s) => (
          <li key={s.key} className="flex items-center justify-between py-2.5 text-[13px]">
            <span className="text-[#D9D8D3]">{s.label}</span>
            <kbd className="num min-w-[28px] text-center px-2 py-1 rounded-md bg-panel-strong border border-panel-border text-[12px] text-accent">
              {s.key.toUpperCase()}
            </kbd>
          </li>
        ))}
        <li className="flex items-center justify-between py-2.5 text-[13px]">
          <span className="text-[#D9D8D3]">Fechar uma janela</span>
          <kbd className="num px-2 py-1 rounded-md bg-panel-strong border border-panel-border text-[12px] text-accent">
            Esc
          </kbd>
        </li>
      </ul>
    </Modal>
  );
}

export default ShortcutsHelp;
