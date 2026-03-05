import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Users, Receipt, Calculator, Settings, AlertTriangle, Check, X, ArrowRightLeft, Save, Book, ArrowLeft, DollarSign, Wallet, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Safe Storage Utility ---
const STORAGE_KEY = 'travel_expense_books_v3_companion';

const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore in sandbox
    }
  }
};

const formatCurrency = (amount, currency = 'HKD') => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount);
};

export default function TravelExpenseApp() {
  // --- Global State: All Books ---
  const [books, setBooks] = useState(() => {
    const saved = safeStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeBookId, setActiveBookId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [deleteBookModal, setDeleteBookModal] = useState({ show: false, bookId: null });

  // Auto-save whenever books change
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  // --- Handlers: Book Management ---
  const handleCreateBook = () => {
    if (!newBookName.trim()) return;
    
    const newBook = {
      id: Date.now().toString(),
      name: newBookName.trim(),
      created: new Date().toISOString(),
      // Default Data Structure for a Book
      members: [],
      transactions: [],
      settings: { exchangeRate: 0.052, foreignCurrency: 'JPY' },
      settledMarkers: {} // format: "debtorId-creditorId": true
    };

    setBooks([newBook, ...books]);
    setNewBookName('');
    setIsCreateModalOpen(false);
    // Optional: Auto open the new book
    setActiveBookId(newBook.id);
  };

  const handleDeleteBookConfirm = () => {
    if (deleteBookModal.bookId) {
      setBooks(books.filter(b => b.id !== deleteBookModal.bookId));
      setDeleteBookModal({ show: false, bookId: null });
    }
  };

  const updateActiveBook = (updatedBookData) => {
    setBooks(prevBooks => 
      prevBooks.map(b => b.id === activeBookId ? { ...b, ...updatedBookData } : b)
    );
  };

  // --- Render ---
  const activeBook = books.find(b => b.id === activeBookId);

  if (activeBook) {
    return (
      <ActiveBookView 
        book={activeBook} 
        onUpdate={updateActiveBook} 
        onBack={() => setActiveBookId(null)} 
      />
    );
  }

  return (
    /* 
       LAYOUT FIX: 
       Changed 'max-w-md' to 'w-full max-w-3xl'.
       This allows the app to expand up to 768px (tablet/large phone width) 
       while taking full width on smaller devices.
    */
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-24 relative w-full max-w-3xl mx-auto shadow-2xl">
      {/* Bookshelf Header */}
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="w-full relative flex items-center justify-center h-10">
          {/* 1. Title Centered & Renamed */}
          <h1 className="text-xl font-bold flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Book size={24} className="text-rose-400" /> 同行記
          </h1>
          
          {/* 2. Conditional Button: Only show if books exist */}
          {books.length > 0 && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="absolute right-0 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition"
            >
              <Plus size={16} /> 立即起番份數簿
            </button>
          )}
        </div>
      </header>

      <main className="w-full p-4">
        {books.length === 0 ? (
          // Empty State
          <div className="mt-10 flex flex-col items-center justify-center">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full max-w-sm h-64 border-4 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 transition group"
            >
              <div className="bg-gray-100 group-hover:bg-rose-100 p-6 rounded-full transition">
                <Plus size={48} />
              </div>
              <span className="text-xl font-bold">立即起番份數簿</span>
            </button>
          </div>
        ) : (
          // Book List
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Added sm:grid-cols-2 to show 2 columns on wider screens if needed */}
            {books.map(book => (
              <motion.div 
                key={book.id}
                layoutId={book.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition cursor-pointer"
                onClick={() => setActiveBookId(book.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-rose-100 text-rose-600 p-3 rounded-xl">
                    <Book size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{book.name}</h3>
                    <p className="text-xs text-gray-400">
                      建立於: {new Date(book.created).toLocaleDateString()} • {book.members.length} 位隊友
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteBookModal({ show: true, bookId: book.id });
                  }}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Book Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">建立新數簿</h3>
              <input 
                autoFocus
                type="text" 
                placeholder="例如：7月日本東京之旅"
                className="w-full border p-3 rounded-lg mb-4 text-lg"
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBook()}
              />
              <div className="flex gap-2">
                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold text-gray-600">取消</button>
                <button onClick={handleCreateBook} className="flex-1 py-3 rounded-xl bg-rose-500 font-bold text-white shadow-lg shadow-rose-200">建立</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (Burn Book) */}
      <AnimatePresence>
        {deleteBookModal.show && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">是否要燒數簿？</h3>
              <p className="text-gray-500 text-sm mb-6">
                刪除後資料將無法復原，所有帳目將會灰飛煙滅。
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteBookModal({ show: false, bookId: null })}
                  className="flex-1 py-3 rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                >
                  否 (取消)
                </button>
                <button 
                  onClick={handleDeleteBookConfirm}
                  className="flex-1 py-3 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200"
                >
                  是 (燒毀)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Component: Inside a specific Book ---
function ActiveBookView({ book, onUpdate, onBack }) {
  const [activeTab, setActiveTab] = useState('members');
  
  // Local state for inputs (doesn't need to be saved to disk until submitted)
  const [newMemberName, setNewMemberName] = useState('');
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    currency: book.settings.foreignCurrency,
    payerId: '',
    involvedIds: [],
  });
  
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [settleModal, setSettleModal] = useState({ show: false, debtKey: null });

  // Helpers
  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  // Actions
  const updateSettings = (key, value) => {
    onUpdate({ settings: { ...book.settings, [key]: value } });
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    const newMember = { id: Date.now().toString(), name: newMemberName.trim() };
    onUpdate({ members: [...book.members, newMember] });
    setNewMemberName('');
    showToast("隊友已新增");
  };

  const removeMember = (id) => {
    // Check if involved in transactions
    const hasRecords = book.transactions.some(t => t.payerId === id || t.involvedIds.includes(id));
    if (hasRecords) {
      showToast("此人有帳在身，不能刪除", "error");
      return;
    }
    onUpdate({ members: book.members.filter(m => m.id !== id) });
  };

  const addTransaction = () => {
    if (!expenseForm.amount || !expenseForm.description || !expenseForm.payerId || expenseForm.involvedIds.length === 0) {
      showToast("資料不完整", "error");
      return;
    }
    const amountVal = parseFloat(expenseForm.amount);
    const amountInHKD = expenseForm.currency === 'HKD' ? amountVal : amountVal * book.settings.exchangeRate;

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: expenseForm.description,
      originalAmount: amountVal,
      originalCurrency: expenseForm.currency,
      amountHKD: amountInHKD,
      payerId: expenseForm.payerId,
      involvedIds: expenseForm.involvedIds,
      payerName: book.members.find(m => m.id === expenseForm.payerId)?.name || 'Unknown',
      isDeleted: false,
    };

    onUpdate({ transactions: [newTx, ...book.transactions] });
    setExpenseForm({ ...expenseForm, amount: '', description: '' });
    showToast("記帳成功！");
  };

  const toggleTransactionDelete = (txId) => {
    const updatedTransactions = book.transactions.map(t => 
      t.id === txId ? { ...t, isDeleted: !t.isDeleted } : t
    );
    onUpdate({ transactions: updatedTransactions });
  };

  const markAsSettled = (debtKey) => {
    const newMarkers = { ...book.settledMarkers, [debtKey]: true };
    onUpdate({ settledMarkers: newMarkers });
    setSettleModal({ show: false, debtKey: null });
  };

  // Logic: Settlement Calculation
  const settlementPlan = useMemo(() => {
    const balances = {}; 
    book.members.forEach(m => balances[m.id] = 0);
    
    const activeTransactions = book.transactions.filter(t => !t.isDeleted);

    activeTransactions.forEach(t => {
      if (balances[t.payerId] === undefined) balances[t.payerId] = 0;
      t.involvedIds.forEach(id => {
        if (balances[id] === undefined) balances[id] = 0;
      });
    });

    activeTransactions.forEach(t => {
      const splitAmount = t.amountHKD / t.involvedIds.length;
      balances[t.payerId] += t.amountHKD;
      t.involvedIds.forEach(mid => balances[mid] -= splitAmount);
    });

    let debtors = [];
    let creditors = [];

    Object.keys(balances).forEach(id => {
      const amount = balances[id];
      if (amount < -0.01) debtors.push({ id, amount });
      else if (amount > 0.01) creditors.push({ id, amount });
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const plan = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
      
      plan.push({
        fromId: debtor.id,
        toId: creditor.id,
        fromName: book.members.find(m => m.id === debtor.id)?.name || "未知",
        toName: book.members.find(m => m.id === creditor.id)?.name || "未知",
        amount: amount
      });

      debtor.amount += amount;
      creditor.amount -= amount;

      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { plan, balances };
  }, [book.members, book.transactions]);

  return (
    /* 
       LAYOUT FIX: 
       Changed 'max-w-md' to 'w-full max-w-3xl'.
       This ensures the active book view also uses the full available width.
    */
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-24 relative w-full max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">{book.name}</h1>
              <div className="flex items-center gap-1 text-[10px] opacity-80">
                 <Save size={10} /> 自動儲存中
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full p-4">
        {/* Tab 1: Settings & Members */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-rose-600">
                <Settings size={20} /> 匯率設定
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">外幣代號:</span>
                  <input 
                    type="text" 
                    value={book.settings.foreignCurrency}
                    onChange={(e) => updateSettings('foreignCurrency', e.target.value.toUpperCase())}
                    className="border p-2 rounded w-20 text-center uppercase font-bold"
                    maxLength={3}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">1 {book.settings.foreignCurrency} = </span>
                  <input 
                    type="number" 
                    value={book.settings.exchangeRate}
                    onChange={(e) => updateSettings('exchangeRate', parseFloat(e.target.value))}
                    step="0.0001"
                    className="border p-2 rounded w-28 text-center font-mono"
                  />
                  <span className="text-sm text-gray-600">HKD</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-rose-600">
                <Users size={20} /> 隊友名單
              </h2>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="輸入名字"
                  className="flex-1 border border-gray-300 p-3 rounded-lg"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMember()}
                />
                <button onClick={addMember} className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap">放低一蚊跟機</button>
              </div>
              <div className="space-y-2">
                {book.members.map(member => (
                  <div key={member.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-700">{member.name}</span>
                    <button onClick={() => removeMember(member.id)} className="text-gray-400 hover:text-red-500 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {book.members.length === 0 && <div className="text-center text-gray-400">暫無隊友</div>}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Add Expense */}
        {activeTab === 'add' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="text-rose-500" /> 新增消費
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">貨幣</label>
                  <select 
                    className="w-full border p-3 rounded-lg bg-gray-50 font-medium"
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm({...expenseForm, currency: e.target.value})}
                  >
                    <option value={book.settings.foreignCurrency}>{book.settings.foreignCurrency}</option>
                    <option value="HKD">HKD</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">金額</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full border p-3 rounded-lg text-lg font-mono"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">消費明細</label>
                <input 
                  type="text" 
                  placeholder="例如：拉麵、車費"
                  className="w-full border p-3 rounded-lg"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">誰先付款？</label>
                <select 
                  className="w-full border p-3 rounded-lg bg-white"
                  value={expenseForm.payerId}
                  onChange={(e) => setExpenseForm({...expenseForm, payerId: e.target.value})}
                >
                  <option value="" disabled>請選擇付款人</option>
                  {book.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500">誰有責任平分？</label>
                  <button 
                    onClick={() => setExpenseForm(prev => ({...prev, involvedIds: book.members.map(m => m.id)}))}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    全選
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {book.members.map(m => {
                    const isSelected = expenseForm.involvedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          const current = expenseForm.involvedIds;
                          const newIds = current.includes(m.id) ? current.filter(id => id !== m.id) : [...current, m.id];
                          setExpenseForm({...expenseForm, involvedIds: newIds});
                        }}
                        className={`p-2 rounded-lg text-sm font-medium transition border ${
                          isSelected ? 'bg-rose-100 border-rose-500 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {m.name} {isSelected && <Check size={14} className="inline ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={addTransaction} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg">確認記帳</button>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Receipt className="text-rose-500" /> 消費記錄
            </h2>
            {book.transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-300">暫無消費記錄</div>
            ) : (
              book.transactions.map((t) => (
                <div 
                  key={t.id} 
                  className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 ${t.isDeleted ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className={`flex-1 flex flex-col gap-2 ${t.isDeleted ? 'line-through' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{t.description}</h3>
                        <p className="text-xs text-gray-400">{new Date(t.date).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-rose-600 text-lg">{formatCurrency(t.originalAmount, t.originalCurrency)}</div>
                        {t.originalCurrency !== 'HKD' && <div className="text-xs text-gray-400">≈ {formatCurrency(t.amountHKD, 'HKD')}</div>}
                      </div>
                    </div>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span><span className="font-bold text-gray-800">{t.payerName}</span> 先付</span>
                      <span>{t.involvedIds.length} 人平分</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center border-l pl-3 border-gray-100">
                    <button 
                      onClick={() => toggleTransactionDelete(t.id)}
                      className={`p-2 rounded-full transition ${t.isDeleted ? 'bg-gray-200 text-gray-500' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                      title={t.isDeleted ? "還原" : "刪除"}
                    >
                      {t.isDeleted ? <RotateCcw size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Settlement */}
        {activeTab === 'settle' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-rose-600">
                <Calculator size={20} /> 成員收支總覽 (HKD)
              </h2>
              <div className="space-y-3">
                {book.members.map(m => {
                  const balance = settlementPlan.balances[m.id] || 0;
                  const isPositive = balance > 0;
                  const isZero = Math.abs(balance) < 0.01;
                  return (
                    <div key={m.id} className="flex justify-between items-center p-2 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-700">{m.name}</span>
                      <span className={`font-mono font-bold ${isZero ? 'text-gray-400' : isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {isZero ? '-' : (isPositive ? '+' : '') + formatCurrency(balance, 'HKD')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-rose-400" /> 智能分帳方案
              </h2>
              {settlementPlan.plan.length === 0 ? (
                <div className="text-center text-gray-400 py-4">目前沒有需要結算的債務。</div>
              ) : (
                <div className="space-y-3">
                  {settlementPlan.plan.map((item, idx) => {
                    const debtKey = `${item.fromId}-${item.toId}`;
                    const isSettled = book.settledMarkers && book.settledMarkers[debtKey];

                    return (
                      <div key={idx} className="flex items-center justify-between bg-white/10 p-3 rounded-lg relative overflow-hidden">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <span className="font-bold text-rose-300">{item.fromName}</span>
                            <span className="text-xs text-gray-400">給</span>
                            <span className="font-bold text-green-300">{item.toName}</span>
                          </div>
                          <div className="font-mono font-bold text-xl">
                            {formatCurrency(item.amount, 'HKD')}
                          </div>
                        </div>
                        
                        <div>
                          {isSettled ? (
                            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                              <Check size={14} />
                              <span className="text-xs font-bold">上等人</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setSettleModal({ show: true, debtKey })}
                              className="bg-white/20 hover:bg-white/30 active:scale-95 transition p-2 rounded-full text-white"
                            >
                              <DollarSign size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 font-bold text-sm whitespace-nowrap ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'
            }`}
          >
            {notification.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settle Debt Modal */}
      <AnimatePresence>
        {settleModal.show && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <Wallet size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">是否已找數？</h3>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => markAsSettled(settleModal.debtKey)}
                  className="flex-1 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 shadow-lg shadow-green-200"
                >
                  是
                </button>
                <button 
                  onClick={() => setSettleModal({ show: false, debtKey: null })}
                  className="flex-1 py-3 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 text-xs px-1"
                >
                  已走數/準備走數/未收到
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
        {/* Changed max-w-3xl to match main container */}
        <div className="flex justify-around w-full max-w-3xl mx-auto">
          <NavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users size={20} />} label="隊友" />
          <NavButton active={activeTab === 'add'} onClick={() => setActiveTab('add')} icon={<Plus size={24} />} label="記帳" isMain />
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<Receipt size={20} />} label="記錄" />
          <NavButton active={activeTab === 'settle'} onClick={() => setActiveTab('settle')} icon={<Calculator size={20} />} label="分帳" />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, isMain }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 px-4 w-full transition-colors ${
        active ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className={`${isMain ? 'bg-rose-100 p-2 rounded-full mb-1 -mt-6 border-4 border-white shadow-sm' : 'mb-1'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
