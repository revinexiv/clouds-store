import React, { useState, useEffect } from 'react';
import { Send, Settings, Cloud, User, ShoppingBag, CheckCircle2, AlertCircle, X, Info, Zap, List } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// EDIT DAFTAR MENU & HARGA DI SINI
// ==========================================
const DAFTAR_HARGA_MENU = [
  { item: "Basreng", harga: "120B" },
  { item: "Seblak Kering", harga: "120B" },
  { item: "Pisang Sale", harga: "120B" },
  { item: "Soes Coklat", harga: "120B" },
  { item: "Usus Krispi", harga: "120B" },
  { item: "Stick Gabus", harga: "60B" },
  { item: "Amplang Obic", harga: "150B" },
  // Tambah baris baru di sini kalau ada menu tambahan
];

const firebaseConfig = {
  apiKey: "AIzaSyDSNQTjwQJ9Qs30MVseH86OXdPX_37swd8",
  authDomain: "clouds-store.firebaseapp.com",
  projectId: "clouds-store",
  storageBucket: "clouds-store.firebasestorage.app",
  messagingSenderId: "330522348078",
  appId: "1:330522348078:web:a2fe6f3c63824be692adbf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'clouds-store-order';

const App = () => {
  const [user, setUser] = useState(null);
  const [nama, setNama] = useState('');
  const [pesanan, setPesanan] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'telegram');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBotToken(data.token || '');
        setChatId(data.chatId || '');
        setIsConfigLoaded(true);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const showFeedback = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'telegram');
      await setDoc(configRef, { token: botToken, chatId: chatId, updatedAt: new Date().toISOString() });
      setShowSettings(false);
      showFeedback('success', 'Setting Cloud Berhasil!');
    } catch (err) {
      showFeedback('error', 'Gagal simpan!');
    }
  };

  const kirimPesanan = async (e) => {
    e.preventDefault();
    if (!isConfigLoaded) return showFeedback('error', 'Admin belum melakukan setup!');
    if (!nama || !pesanan) return showFeedback('error', 'Lengkapi Nama & Pesanan!');

    setLoading(true);
    const text = `☁️ *PESANAN BARU - CLOUDS STORE*\n\n👤 *Nama:* ${nama}\n📦 *Detail:* ${pesanan}\n\n⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
      });
      if (response.ok) {
        showFeedback('success', 'Pesanan terkirim ke Admin!');
        setNama(''); setPesanan('');
      }
    } catch (err) {
      showFeedback('error', 'Gagal mengirim pesan!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] font-sans text-slate-800 pb-12 selection:bg-blue-100">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl text-white shadow-lg">
            <Cloud size={24} fill="white" />
          </div>
          <h1 className="font-black text-xl tracking-tighter">CLOUDS STORE</h1>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-blue-600">
          <Settings size={22} />
        </button>
      </header>

      <main className="max-w-lg mx-auto p-6">
        {/* Toast Notif */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border shadow-xl ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            <CheckCircle2 size={18} />
            <p className="text-sm font-bold">{status.message}</p>
          </div>
        )}

        {/* Hero */}
        <div className="mb-10 text-center mt-4">
          <h2 className="text-4xl font-black text-slate-900 leading-tight">Order Apapun <br/><span className="text-blue-600">Tanpa Ribet.</span></h2>
          <p className="text-slate-500 mt-3 text-sm font-medium italic">"Solusi buat lo semua yang mager."</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/5 border border-white">
          <form onSubmit={kirimPesanan} className="space-y-7">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={14} className="text-blue-500" /> Nama Anda
              </label>
              <input 
                type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                placeholder="Isi nama kalian.."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={14} className="text-blue-500" /> List Pesanan
                </label>
                {/* TOMBOL POPUP MENU */}
                <button 
                  type="button"
                  onClick={() => setShowMenuModal(true)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <List size={12} /> LIHAT MENU & HARGA
                </button>
              </div>
              <textarea 
                rows="5" value={pesanan} onChange={(e) => setPesanan(e.target.value)}
                placeholder="Contoh: 1x Basreng, 2x Seblak..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" disabled={loading || !isConfigLoaded}
              className={`w-full py-5 rounded-3xl font-black text-white text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                loading || !isConfigLoaded ? 'bg-slate-300' : 'bg-slate-900 hover:bg-blue-600 shadow-blue-100'
              }`}
            >
              {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Kirim Pesanan</>}
            </button>
          </form>
        </div>
      </main>

      {/* POPUP MENU (HANYA LIHAT) */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Daftar Menu</h3>
              <button onClick={() => setShowMenuModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {DAFTAR_HARGA_MENU.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-700">{m.item}</span>
                  <span className="font-black text-blue-600">{m.harga}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-blue-700 font-bold text-center leading-relaxed">
                Silakan ketik nama menu di atas secara manual pada kotak pesanan ya!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Admin Setup</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={saveSettings} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1">Bot Token</label>
                <input type="password" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="Token Bot" className="w-full px-5 py-3 rounded-xl bg-slate-100 border-none text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1">Chat ID</label>
                <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="ID Telegram" className="w-full px-5 py-3 rounded-xl bg-slate-100 border-none text-xs font-mono" />
              </div>
              <button type="submit" className="w-full py-4 rounded-xl bg-slate-900 text-white font-black text-xs shadow-lg active:scale-95 transition-all">SIMPAN KE CLOUD</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;