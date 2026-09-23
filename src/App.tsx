import { useState, useEffect, useRef } from 'react';
import { EntryType, MoneyEntry, MoneyPocketData } from './types.ts';
import { Hero } from './components/Hero.tsx';
import { BalanceCard } from './components/BalanceCard.tsx';
import { StockCard } from './components/StockCard.tsx';
import { HistoryList } from './components/HistoryList.tsx';
import { EntryModal } from './components/EntryModal.tsx';
import { StockModal } from './components/StockModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { AlertModal } from './components/AlertModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  User,
} from './firebase.ts';

const STORAGE_KEY = 'money-pocket-qar-v5';
const THEME_KEY = 'money-pocket-theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Local or in-memory fallback state
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
      // ignore parse error
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

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState<EntryType>('sale');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<MoneyEntry | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Check for scanned receipt QR code from URL query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const receiptParam = params.get('receipt');
      if (receiptParam) {
        const amt = parseFloat(params.get('amt') || '0');
        const qty = parseInt(params.get('qty') || '1', 10);
        const cust = params.get('cust') || 'Direct Customer';
        const item = params.get('item') || 'Sold Item';
        const date = parseInt(params.get('date') || `${Date.now()}`, 10);

        setSelectedReceiptEntry({
          type: 'sale',
          amount: isNaN(amt) ? 0 : amt,
          qty: isNaN(qty) ? 1 : qty,
          note: item,
          customer: cust,
          createdAt: isNaN(date) ? Date.now() : date,
        });
        setIsReceiptModalOpen(true);
      }
    }
  }, []);

  // Ref to track whether local data was migrated to user's Firestore
  const migrationAttempted = useRef<string | null>(null);

  // Theme synchronization
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Storage unavailable
    }
  }, [isDark]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-time synchronization when authenticated
  useEffect(() => {
    if (!user) return;

    setSyncing(true);

    // 1. Subscribe to user stock and settings
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, async (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setData((prev) => ({
          ...prev,
          stock: typeof userData.stock === 'number' ? userData.stock : 0,
        }));
      } else {
        // If the user document doesn't exist yet, initialize it
        // Check if there is local data from before signing in to migrate
        if (migrationAttempted.current !== user.uid) {
          migrationAttempted.current = user.uid;
          const currentLocalStock = data.stock;
          await setDoc(userDocRef, {
            stock: currentLocalStock,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // Migrate any local entries
          if (data.entries.length > 0) {
            const batch = writeBatch(db);
            data.entries.forEach((e) => {
              const entryRef = doc(collection(db, 'users', user.uid, 'entries'));
              batch.set(entryRef, {
                type: e.type,
                amount: e.amount,
                qty: e.qty,
                note: e.note,
                customer: e.customer || '',
                createdAt: e.createdAt || Date.now(),
              });
            });
            await batch.commit();
          }
        }
      }
      setSyncing(false);
    }, (error) => {
      console.warn('Firestore user listener error:', error);
      setSyncing(false);
    });

    // 2. Subscribe to user entries subcollection ordered by creation date
    const entriesColRef = collection(db, 'users', user.uid, 'entries');
    const q = query(entriesColRef, orderBy('createdAt', 'desc'));

    const unsubEntries = onSnapshot(q, (entriesSnap) => {
      const liveEntries: MoneyEntry[] = entriesSnap.docs.map((docSnap) => {
        const item = docSnap.data();
        return {
          id: docSnap.id,
          type: item.type as EntryType,
          amount: Number(item.amount) || 0,
          qty: Number(item.qty) || 1,
          note: item.note || '',
          customer: item.customer || '',
          createdAt: item.createdAt || 0,
        };
      });

      setData((prev) => ({
        ...prev,
        entries: liveEntries,
      }));
      setSyncing(false);
    }, (error) => {
      console.warn('Firestore entries listener error:', error);
      setSyncing(false);
    });

    return () => {
      unsubUser();
      unsubEntries();
    };
  }, [user]);

  // Persist locally for offline / non-authenticated sessions
  const persistLocalData = (newData: MoneyPocketData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // Local storage unavailable
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

  const handleSaveEntry = async (newEntry: MoneyEntry) => {
    let newStock = data.stock;
    if (newEntry.type === 'sale') {
      newStock -= newEntry.qty;
    } else if (newEntry.type === 'restock') {
      newStock += newEntry.qty;
    }

    const timestamp = Date.now();
    const entryPayload: MoneyEntry = {
      type: newEntry.type,
      amount: newEntry.amount,
      qty: newEntry.qty,
      note: newEntry.note,
      customer: newEntry.customer || '',
      createdAt: timestamp,
    };

    // When something is sold, automatically display the receipt with working QR code
    if (newEntry.type === 'sale') {
      setSelectedReceiptEntry(entryPayload);
      setIsReceiptModalOpen(true);
    }

    if (user) {
      setSyncing(true);
      try {
        const entryRef = doc(collection(db, 'users', user.uid, 'entries'));

        const batch = writeBatch(db);
        batch.set(entryRef, entryPayload);
        batch.set(
          doc(db, 'users', user.uid),
          { stock: newStock, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        await batch.commit();
      } catch (err) {
        console.error('Failed to save to Firestore:', err);
        setAlertMessage('Could not sync with cloud. Please check connection.');
      } finally {
        setSyncing(false);
      }
    } else {
      // Offline / Local
      persistLocalData({
        stock: newStock,
        entries: [entryPayload, ...data.entries],
      });
    }
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    if (typeof window !== 'undefined' && window.location.search.includes('receipt=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('receipt');
      url.searchParams.delete('amt');
      url.searchParams.delete('qty');
      url.searchParams.delete('cust');
      url.searchParams.delete('item');
      url.searchParams.delete('date');
      window.history.replaceState({}, document.title, url.pathname);
    }
  };

  const handleRemoveEntry = async (index: number) => {
    const entryToRemove = data.entries[index];
    if (!entryToRemove) return;

    let restoredStock = data.stock;
    if (entryToRemove.type === 'sale') {
      restoredStock += entryToRemove.qty;
    } else if (entryToRemove.type === 'restock') {
      restoredStock -= entryToRemove.qty;
    }

    if (user && entryToRemove.id) {
      setSyncing(true);
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', user.uid, 'entries', entryToRemove.id));
        batch.set(
          doc(db, 'users', user.uid),
          { stock: restoredStock, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        await batch.commit();
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
        setAlertMessage('Could not sync entry removal with cloud.');
      } finally {
        setSyncing(false);
      }
    } else {
      const newEntries = data.entries.filter((_, i) => i !== index);
      persistLocalData({
        stock: restoredStock,
        entries: newEntries,
      });
    }
  };

  const handleSaveStock = async (newStock: number) => {
    if (user) {
      setSyncing(true);
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { stock: newStock, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to update stock in Firestore:', err);
        setAlertMessage('Could not update stock in cloud.');
      } finally {
        setSyncing(false);
      }
    } else {
      persistLocalData({
        ...data,
        stock: newStock,
      });
    }
  };

  const handleConfirmReset = async () => {
    if (user) {
      setSyncing(true);
      try {
        const batch = writeBatch(db);
        data.entries.forEach((entry) => {
          if (entry.id) {
            batch.delete(doc(db, 'users', user.uid, 'entries', entry.id));
          }
        });
        batch.set(
          doc(db, 'users', user.uid),
          { stock: 0, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        await batch.commit();
      } catch (err) {
        console.error('Failed to reset data in Firestore:', err);
        setAlertMessage('Could not complete reset in cloud.');
      } finally {
        setSyncing(false);
      }
    } else {
      persistLocalData({
        stock: 0,
        entries: [],
      });
    }
    setIsResetConfirmOpen(false);
  };

  return (
    <main className="app" id="main-app">
      {/* Hero section */}
      <Hero
        profit={profit}
        isDark={isDark}
        user={user}
        syncing={syncing}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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
        onViewReceipt={(entry) => {
          setSelectedReceiptEntry(entry);
          setIsReceiptModalOpen(true);
        }}
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

      {/* Auth Modal (Google & Email/Password for multi-device sync) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      {/* Alert Notice Modal */}
      <AlertModal
        isOpen={alertMessage !== null}
        message={alertMessage || ''}
        onClose={() => setAlertMessage(null)}
      />

      {/* Sale Receipt with Working QR Code */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        entry={selectedReceiptEntry}
        onClose={handleCloseReceipt}
      />
    </main>
  );
}
