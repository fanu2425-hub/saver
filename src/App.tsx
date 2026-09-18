import { useState, useEffect } from 'react';
import { EntryType, MoneyEntry, MoneyPocketData } from './types.ts';
import { Hero } from './components/Hero.tsx';
import { BalanceCard } from './components/BalanceCard.tsx';
import { StockCard } from './components/StockCard.tsx';
import { HistoryList } from './components/HistoryList.tsx';
import { EntryModal } from './components/EntryModal.tsx';
import { StockModal } from './components/StockModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { AlertModal } from './components/AlertModal.tsx';

const STORAGE_KEY = 'money-pocket-qar-v5';
const THEME_KEY = 'money-pocket-theme';

export default function App() {
  const [data, setData] = useState<MoneyPocketData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          stock: typeof parsed.stock === 'number' ? parsed.stock : 0,
          entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        };
      }
    } catch {
      // ignore parse errors and fallback
    }
    return { stock: 0, entries: [] };
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState<EntryType>('sale');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Sync theme with body element
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // storage unavailable
    }
  }, [isDark]);

  // Persist data
  const persistData = (newData: MoneyPocketData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // storage unavailable
    }
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Calculations
  const incoming = data.entries
    .filter((e) => e.type !== 'restock')
    .reduce((acc, e) => acc + e.amount, 0);

  const outgoing = data.entries
    .filter((e) => e.type === 'restock')
    .reduce((acc, e) => acc + e.amount, 0);

  const profit = incoming - outgoing;

  // Handlers
  const handleOpenSell = () => {
    setEntryModalType('sale');
    setIsEntryModalOpen(true);
  };

  const handleOpenRestock = () => {
    setEntryModalType('restock');
    setIsEntryModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEntryModalType('sale');
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (newEntry: MoneyEntry) => {
    let newStock = data.stock;
    if (newEntry.type === 'sale') {
      newStock -= newEntry.qty;
    } else if (newEntry.type === 'restock') {
      newStock += newEntry.qty;
    }

    const updatedData: MoneyPocketData = {
      stock: newStock,
      entries: [newEntry, ...data.entries],
    };
    persistData(updatedData);
  };

  const handleRemoveEntry = (index: number) => {
    const entryToRemove = data.entries[index];
    if (!entryToRemove) return;

    let restoredStock = data.stock;
    if (entryToRemove.type === 'sale') {
      restoredStock += entryToRemove.qty;
    } else if (entryToRemove.type === 'restock') {
      restoredStock -= entryToRemove.qty;
    }

    const newEntries = data.entries.filter((_, i) => i !== index);
    persistData({
      stock: restoredStock,
      entries: newEntries,
    });
  };

  const handleSaveStock = (newStock: number) => {
    persistData({
      ...data,
      stock: newStock,
    });
  };

  const handleConfirmReset = () => {
    persistData({
      stock: 0,
      entries: [],
    });
    setIsResetConfirmOpen(false);
  };

  return (
    <main className="app" id="main-app">
      {/* Hero section */}
      <Hero
        profit={profit}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Grid: Business Balance & Stock Available */}
      <div className="grid" id="dashboard-grid">
        <BalanceCard
          moneyIn={incoming}
          moneyOut={outgoing}
          profit={profit}
          onOpenSell={handleOpenSell}
          onOpenRestock={handleOpenRestock}
        />

        <StockCard
          stock={data.stock}
          onSetStock={() => setIsStockModalOpen(true)}
          onReset={() => setIsResetConfirmOpen(true)}
        />
      </div>

      {/* History List */}
      <HistoryList
        entries={data.entries}
        onAddEntry={handleOpenAdd}
        onRemoveEntry={handleRemoveEntry}
      />

      {/* Entry Modal */}
      <EntryModal
        isOpen={isEntryModalOpen}
        initialType={entryModalType}
        stock={data.stock}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        onAlert={(msg) => setAlertMessage(msg)}
      />

      {/* Stock Modal */}
      <StockModal
        isOpen={isStockModalOpen}
        currentStock={data.stock}
        onClose={() => setIsStockModalOpen(false)}
        onSaveStock={handleSaveStock}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        message="Delete all entries and reset stock?"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Alert Notice Modal */}
      <AlertModal
        isOpen={alertMessage !== null}
        message={alertMessage || ''}
        onClose={() => setAlertMessage(null)}
      />
    </main>
  );
}
