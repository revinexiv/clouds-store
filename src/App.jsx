import React, { useState, useEffect } from 'react';
import { Send, Settings, Cloud, User, ShoppingBag, CheckCircle2, AlertCircle, X, Info, Zap, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Konfigurasi Firebase (Gunakan data kamu yang sudah benar)
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
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

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
      } else {
        setIsConfigLoaded(false);
      }
    }, (err) => console.error("Firestore sync error:", err));
    return () => unsubscribe();
  }, [user]);

  const showFeedback = (type, message) => {
    setStatus({ type, message: String(message) });
    setTimeout(() => setStatus({ type: '', message: '' }), 5000);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    if (!user) return;
    setTestLoading(true);
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'telegram');
      await setDoc(configRef, { token: botToken, chatId: chatId, updatedAt: new Date().toISOString() });
      setShowSettings(false);
      showFeedback('success', 'Berhasil disimpan ke Cloud!');
    } catch (err) {
      showFeedback('error', `Gagal simpan: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const kirimPesanan = async (e) => {
    e.preventDefault();
    if (!isConfigLoaded) return showFeedback('error', 'Admin belum melakukan setup!');
    if (!nama || !pesanan) return showFeedback('error', 'Isi Nama dan Pesanan dulu!');

    setLoading(true);
    const text = `☁️ *PESANAN BARU - CLOUDS STORE*\n\n👤 *Nama:* ${nama}\n📦 *Detail:* ${pesanan}\n\n⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
      });
      const data = await response.json();
      if (data.ok) {
        showFeedback('success', 'Pesanan terkirim ke Telegram!');
        setNama('');
        setPesanan('');
      } else {
        throw new Error(data.description);
      }
    } catch (err) {
      showFeedback('error', `Gagal kirim: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] font-sans text-slate-800 relative overflow-hidden pb-12">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500 to-transparent opacity-10"></div>
      
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Cloud size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-900 leading-none">CLOUDS STORE</h1>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Premium Ordering</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 hover:bg-blue-50 rounded-xl transition-all text-slate-400 hover:text-blue-600"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 relative z-10">
        {/* Status Toast */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border shadow-xl ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{status.message}</p>
          </div>
        )}

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full border border-blue-200 mb-6">
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">CLOUDS Store, Solusi buat lo yang mager.</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 leading-tight mb-4">
            Input Order <br/>
            <span className="text-blue-600">Ga Pake Ribet.</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm px-4">
            Isi detail di bawah, pesanan kamu langsung masuk di Telegram tim kita.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-blue-900/5 border border-white">
          <form onSubmit={kirimPesanan} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <User size={14} className="text-blue-500" /> Nama Pemesan
              </label>
              <input 
                type="text" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Siapa nama Anda?"
                className="w-full px-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <ShoppingBag size={14} className="text-blue-500" /> List Pesanan
              </label>
              <textarea 
                rows="5"
                value={pesanan}
                onChange={(e) => setPesanan(e.target.value)}
                placeholder="Tulis list pesanan kamu..."
                className="w-full px-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={loading || !isConfigLoaded}
              className={`w-full py-6 rounded-[1.5rem] font-black text-white text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                loading || !isConfigLoaded ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  Kirim Pesanan
                </>
              )}
            </button>
            
            {!isConfigLoaded && (
              <p className="text-[10px] text-center text-rose-500 font-bold uppercase tracking-widest">
                ⚠️ Admin belum melakukan setting Bot Telegram!
              </p>
            )}
          </form>
        </div>

        <p className="mt-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
          CLOUDS STORE • 2024
        </p>
      </main>

      {/* Admin Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">Admin Setup</h3>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2">Cloud Configuration</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={saveSettings} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Bot Token</label>
                <input 
                  type="password" 
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Token dari @BotFather"
                  className="w-full px-5 py-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Chat ID</label>
                <input 
                  type="text" 
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="ID Penerima (Angka)"
                  className="w-full px-5 py-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap size={16} fill="white" /> Simpan Ke Cloud
              </button>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-blue-800 leading-relaxed font-bold">
                  Setting ini tersimpan di Database Cloud. Cukup isi sekali, dan link ini akan otomatis aktif untuk semua orang.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;