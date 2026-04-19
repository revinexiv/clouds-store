import React, { useState, useEffect } from 'react';
import { Send, Settings, Cloud, User, ShoppingBag, CheckCircle2, AlertCircle, X, Info, Zap, Globe, MousePointer2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Konfigurasi Firebase Anda (Sudah Riku masukkan sesuai data terakhirmu)
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
    // Menggunakan path 6 segmen untuk menghindari segment error
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
      showFeedback('success', 'Awan tersambung! Pengaturan disimpan ke Cloud.');
    } catch (err) {
      showFeedback('error', `Gagal simpan: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const kirimPesanan = async (e) => {
    e.preventDefault();
    if (!isConfigLoaded) return showFeedback('error', 'Admin belum mendarat (setup belum selesai).');
    if (!nama || !pesanan) return showFeedback('error', 'Isi Nama dan Pesanan dulu ya!');

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
        showFeedback('success', 'Pesanan meluncur ke Telegram Admin!');
        setNama('');
        setPesanan('');
      } else {
        throw new Error(data.description);
      }
    } catch (err) {
      showFeedback('error', `Gangguan sinyal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] font-sans text-slate-800 relative overflow-hidden pb-12 selection:bg-blue-200">
      {/* Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white blur-[120px] rounded-full pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-200 blur-[150px] rounded-full pointer-events-none opacity-40"></div>

      {/* Modern Navbar */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-white/50 sticky top-0 z-20 px-6 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group">
            <div className="bg-gradient-to-tr from-blue-500 to-sky-400 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-all duration-500">
              <Cloud size={24} fill="white" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter text-blue-950 leading-none">CLOUDS STORE</h1>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1.5 ml-0.5">Premium Ordering</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white hover:bg-blue-50 rounded-2xl transition-all text-slate-400 hover:text-blue-600 border border-slate-100 shadow-sm active:scale-90"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 relative z-10">
        {/* Status Toast */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 border shadow-2xl backdrop-blur-xl ${
            status.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-rose-500/10 text-rose-700 border-rose-200'
          }`}>
            <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </div>
            <p className="text-sm font-black">{status.message}</p>
          </div>
        )}

        {/* Hero */}
        <div className="mb-12 mt-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 bg-white/80 text-blue-600 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm mb-6 backdrop-blur-sm">
            <Globe size={14} className="animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Seringan Awan, Secepat Kilat</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 leading-[1.1] mb-4">
            Order Apapun <br/>
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">Tanpa Ribet.</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm px-4">
            Isi detail di bawah, pesanan Anda akan langsung mendarat di Telegram tim kami secara instan.
          </p>
        </div>

        {/* Form Card (Glassmorphism) */}
        <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-white relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
          
          <form onSubmit={kirimPesanan} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <User size={14} className="text-blue-500" /> Nama Anda
              </label>
              <input 
                type="text" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Siapa nama Anda?"
                className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-400 focus:bg-white focus:shadow-xl focus:shadow-blue-100/50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <ShoppingBag size={14} className="text-blue-500" /> List Pesanan
              </label>
              <textarea 
                rows="5"
                value={pesanan}
                onChange={(e) => setPesanan(e.target.value)}
                placeholder="Tulis list pesanan kamu..."
                className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-400 focus:bg-white focus:shadow-xl focus:shadow-blue-100/50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={loading || !isConfigLoaded}
              className={`w-full py-6 rounded-3xl font-black text-white text-lg tracking-tight shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.97] group ${
                loading || !isConfigLoaded ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:shadow-blue-200'
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Kirim Pesanan
                </>
              )}
            </button>
            
            {!isConfigLoaded && (
              <div className="flex items-center justify-center gap-2 text-rose-500 animate-pulse">
                <AlertCircle size={14} />
                <p className="text-[10px] font-black uppercase tracking-wider">Menunggu Setup Admin</p>
              </div>
            )}
          </form>
        </div>

        <p className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
          CLOUDS STORE • 2024
        </p>
      </main>

      {/* Admin Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/30 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Admin Setup</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2">Cloud Configuration</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={saveSettings} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Bot Token</label>
                <input 
                  type="password" 
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Token dari @BotFather"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Chat ID</label>
                <input 
                  type="text" 
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="ID Penerima (Angka)"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                />
              </div>

              <button 
                type="submit" 
                disabled={testLoading}
                className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95"
              >
                {testLoading ? 'Menyimpan...' : <><Zap size={16} fill="white" /> Simpan Ke Cloud</>}
              </button>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 leading-relaxed font-bold">
                  Data ini tersimpan di Cloud Database. Kamu cuma perlu setting sekali, dan semua pembeli akan langsung terhubung ke bot ini.
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