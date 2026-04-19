import React, { useState, useEffect } from 'react';
import { Send, Settings, Cloud, User, ShoppingBag, CheckCircle2, AlertCircle, X, Info, Zap, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * PENTING: Ganti konfigurasi di bawah ini dengan data dari Firebase Console Anda!
 * Anda bisa menemukannya di Project Settings > General > Your Apps > Firebase SDK snippet > Config
 */
const firebaseConfig = {
  apiKey: "AIzaSyDSNQTjwQJ9Qs30MVseH86OXdPX_37swd8",
  authDomain: "clouds-store.firebaseapp.com",
  projectId: "clouds-store",
  storageBucket: "clouds-store.firebasestorage.app",
  messagingSenderId: "330522348078",
  appId: "1:330522348078:web:a2fe6f3c63824be692adbf"
};

// Inisialisasi Firebase
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

  // 1. Auth Login Anonim (Rule 3)
  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 2. Ambil Data Config dari Firestore (Rule 1 & 2)
  useEffect(() => {
    if (!user) return;

    // Alamat dokumen: 6 segmen (genap) untuk menghindari error segment
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'telegram');
    
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBotToken(data.token || '');
        setChatId(data.chatId || '');
        setIsConfigLoaded(true);
      } else {
        setIsConfigLoaded(false);
        // Jika data kosong, mungkin ini pertama kali aplikasi dijalankan
      }
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

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
      await setDoc(configRef, {
        token: botToken,
        chatId: chatId,
        updatedAt: new Date().toISOString()
      });
      setShowSettings(false);
      showFeedback('success', 'Pengaturan Cloud Berhasil Disimpan!');
    } catch (err) {
      showFeedback('error', `Gagal simpan ke Cloud: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const testConnection = async () => {
    if (!botToken || !chatId) {
      showFeedback('error', 'Isi Token & Chat ID dulu!');
      return;
    }
    setTestLoading(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ *Tes Koneksi CLOUDS STORE Berhasil!*\nBot siap menerima pesanan dari semua user.",
          parse_mode: 'Markdown'
        })
      });
      const data = await response.json();
      if (data.ok) {
        showFeedback('success', 'Bot terhubung! Cek Telegram kamu.');
      } else {
        throw new Error(data.description || 'Gagal mengirim pesan');
      }
    } catch (err) {
      showFeedback('error', `Gagal: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const kirimPesanan = async (e) => {
    e.preventDefault();
    if (!isConfigLoaded) return showFeedback('error', 'Sistem belum dikonfigurasi admin.');
    if (!nama || !pesanan) return showFeedback('error', 'Harap isi Nama dan List Pesanan!');

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
        showFeedback('success', 'Pesanan terkirim ke Admin!');
        setNama('');
        setPesanan('');
      } else {
        throw new Error(data.description);
      }
    } catch (err) {
      showFeedback('error', `Gangguan koneksi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Cloud size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter leading-none">CLOUDS STORE</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Online Ordering</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"
        >
          <Settings size={22} />
        </button>
      </header>

      <main className="max-w-lg mx-auto p-6">
        {/* Feedback Alert */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border shadow-md ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{status.message}</p>
          </div>
        )}

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 mb-4">
            <Globe size={14} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Access</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Order Produk <br/><span className="text-indigo-600">Cloud Store.</span></h2>
          <p className="text-slate-500 mt-2 text-sm">Pesanan kamu langsung masuk ke Telegram Admin kami.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/50 border border-white">
          <form onSubmit={kirimPesanan} className="space-y-7">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={14} className="text-indigo-500" /> Nama Pelanggan
              </label>
              <input 
                type="text" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Siapa nama Anda?"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <ShoppingBag size={14} className="text-indigo-500" /> List Barang
              </label>
              <textarea 
                rows="5"
                value={pesanan}
                onChange={(e) => setPesanan(e.target.value)}
                placeholder="Contoh: 1x Kaos Putih, 2x Topi..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={loading || !isConfigLoaded}
              className={`w-full py-5 rounded-[26px] font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                loading || !isConfigLoaded ? 'bg-slate-300' : 'bg-slate-900 hover:bg-indigo-600 shadow-indigo-100'
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Kirim Pesanan Sekarang
                </>
              )}
            </button>
            
            {!isConfigLoaded && (
              <p className="text-[10px] text-center text-rose-500 font-bold uppercase tracking-tight">
                ⚠️ Admin belum melakukan setting Bot Telegram!
              </p>
            )}
          </form>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Zap className="text-indigo-500" size={20} /> Admin Setup
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={saveSettings} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bot API Token</label>
                <input 
                  type="password" 
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Bot API Token dari @BotFather"
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chat ID</label>
                <input 
                  type="text" 
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Chat ID / Group ID (angka)"
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={testConnection}
                  disabled={testLoading}
                  className="py-4 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center gap-2 border border-indigo-100"
                >
                  Tes Bot
                </button>
                <button 
                  type="submit" 
                  disabled={testLoading}
                  className="py-4 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-lg shadow-slate-200"
                >
                  Simpan Global
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                  Pengaturan ini disimpan di **Cloud Database**. Sekali Anda simpan, semua orang yang membuka link ini akan otomatis mengirim pesanan ke Bot yang sama.
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