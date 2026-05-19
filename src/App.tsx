/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Sidebar, Header } from './components/Navbar';
import { UserView } from './components/UserView';
import { AdminView } from './components/AdminView';
import { Layout } from './components/Layout';
import { Loader2, Anchor, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from './lib/firebase-errors';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('search');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check/Create user in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${currentUser.uid}`);
            return;
          }
          
          if (!userSnap.exists()) {
            // Priority email for admin
            const isRequestor = currentUser.email === 'leggeu29@gmail.com';
            
            const newUser = {
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              role: isRequestor ? 'admin' : 'member'
            };
            try {
              await setDoc(userRef, newUser);
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
            }
            setRole(newUser.role);
            setActiveTab(newUser.role === 'admin' ? 'schedules' : 'search');
          } else {
            // Auto-promote requestor if they are currently a member
            const userData = userSnap.data();
            if (currentUser.email === 'leggeu29@gmail.com' && userData.role !== 'admin') {
              try {
                await setDoc(userRef, { ...userData, role: 'admin' }, { merge: true });
              } catch (e) {
                handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
              }
              setRole('admin');
              setActiveTab('schedules');
            } else {
              setRole(userData.role);
              setActiveTab(userData.role === 'admin' ? 'schedules' : 'search');
            }
          }
        } catch (error) {
          console.error("Initialization Error:", error);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-6">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-navy-100 border-t-ship-blue rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-ship-light rounded-full flex items-center justify-center font-black text-ship-blue text-xs uppercase animate-pulse shadow-sm">MF</div>
            </div>
        </div>
        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] animate-pulse">Menghubungkan Pulau...</p>
      </div>
    );
  }

  return (
    <Layout sidebar={user ? <Sidebar user={user} role={role} activeTab={activeTab} setActiveTab={setActiveTab} /> : undefined}>
      <Header user={user} role={role} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-y-auto pt-24 md:pt-32 pb-12 px-4 md:px-8">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="max-w-6xl mx-auto py-12 text-center"
            >
              <div className="mb-20">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block px-5 py-2 bg-white border border-navy-100 text-ship-blue rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-sm"
                >
                  Premium Fast Ferry Experience
                </motion.div>
                <h1 className="text-5xl md:text-8xl font-display font-black text-navy-900 mb-10 tracking-tighter leading-[0.9] italic">
                  MENTAWAI <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-ship-blue to-navy-700">EXPRESS FAST</span>
                </h1>
                <p className="text-lg md:text-xl text-navy-500 max-w-3xl mx-auto leading-relaxed font-light tracking-wide uppercase font-black text-xs">
                  Solusi digital tercanggih untuk reservasi armada kapal cepat Kepulauan Mentawai. Real-time scheduling, secure payments, dan digital ticketing dalam satu genggaman.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                 {[
                    { label: "Realtime Tracking", desc: "Pantau posisi kapal secara presisi" },
                    { label: "Secure Gateway", desc: "Sistem pembayaran multi-channel terenkripsi" },
                    { label: "Digital E-Ticket", desc: "Akses tiket instan tanpa cetak fisik" }
                 ].map((feat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        key={i} 
                        className="glass-card rounded-4xl p-8 border border-navy-100 hover:border-ship-blue/30 transition-all group cursor-default shadow-lg"
                    >
                        <div className="w-12 h-12 bg-ship-blue/5 rounded-2xl flex items-center justify-center mb-6 text-ship-blue group-hover:scale-110 transition-transform">
                            <Anchor className="w-6 h-6" />
                        </div>
                        <h3 className="text-navy-900 font-black text-sm tracking-widest mb-2 italic uppercase">{feat.label}</h3>
                        <p className="text-xs text-navy-400 font-bold leading-relaxed uppercase tracking-widest">{feat.desc}</p>
                    </motion.div>
                 ))}
              </div>

              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (e: any) {
                      if (e.code === 'auth/popup-closed-by-user') {
                        // Silent fail for user closing the popup
                        console.log("Sign-in popup closed by user.");
                      } else {
                        handleFirestoreError(e, OperationType.GET, 'auth');
                      }
                    }
                  }}
                  className="group relative px-12 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] overflow-hidden shadow-2xl shadow-ship-blue/20"
                >
                  <div className="absolute inset-0 bg-ship-blue group-hover:bg-navy-900 transition-colors" />
                  <span className="relative text-white z-10 flex items-center gap-3">
                    Masuk Sekarang <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <p className="text-navy-400 text-[10px] font-black uppercase tracking-[0.3em] italic">Authorized Personnel Only</p>
              </div>
            </motion.div>
          ) : role === 'admin' ? (
            <AdminView key="admin" activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
          ) : (
            <UserView key="user" activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

