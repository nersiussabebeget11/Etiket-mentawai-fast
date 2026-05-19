import { User, signOut } from 'firebase/auth';
import { auth, signInWithGoogle } from '../lib/firebase';
import { Ship, User as UserIcon, LogOut, LayoutDashboard, Ticket, Bell, Calendar, MapPin, Anchor, Search, CreditCard, Users, Menu, X, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface NavbarProps {
  user: User | null;
  role: string | null;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export function Sidebar({ user, role, activeTab, setActiveTab }: NavbarProps) {
  if (!user) return null;

  const menuItems = role === 'admin' 
    ? [
        { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
        { id: 'maintenance', label: 'Pemeliharaan Data', icon: Trash2 },
        { id: 'passengers', label: 'Database Penumpang', icon: Users },
        { id: 'schedules', label: 'Master Jadwal', icon: Calendar },
        { id: 'ships', label: 'Armada Kapal', icon: Anchor },
        { id: 'routes', label: 'Manajemen Rute', icon: MapPin },
        { id: 'reports', label: 'Laporan Penjualan', icon: Ticket },
        { id: 'settings', label: 'Pengaturan', icon: CreditCard },
      ]
    : [
        { id: 'search', label: 'Cari Jadwal', icon: Search },
        { id: 'my-tickets', label: 'Tiket Saya', icon: Ticket },
      ];

  return (
    <div className="flex flex-col h-full bg-navy-900 border-r border-navy-800">
      <div className="p-8">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-ship-blue rounded-2xl flex items-center justify-center font-black text-white shadow-[0_10px_20px_rgba(0,74,153,0.3)] group-hover:scale-110 transition-transform duration-500 relative">
            MF
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-navy-900 flex items-center justify-center text-[8px] font-black">V2</div>
          </div>
          <div>
            <h1 className="text-xl font-display font-black tracking-tighter text-white leading-none uppercase">Mentawai</h1>
            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">Express Fast</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-1 py-4 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4 text-[10px] font-black text-navy-500 uppercase tracking-[0.2em] opacity-50">Sistem Navigasi</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
              activeTab === item.id 
                ? "bg-white text-ship-blue shadow-[0_10px_30px_rgba(0,0,0,0.2)]" 
                : "text-navy-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-4 relative z-10">
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-ship-blue" : "text-navy-500 group-hover:text-ship-blue transition-colors")} />
              <span className="tracking-tight">{item.label}</span>
            </div>
            {activeTab === item.id && (
              <motion.div layoutId="nav-glow" className="absolute inset-0 bg-gradient-to-r from-navy-100/50 to-transparent" />
            )}
            <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all", activeTab === item.id ? "text-ship-blue" : "text-ship-blue")} />
          </button>
        ))}
      </nav>

      <div className="p-8">
        <div className="bg-navy-800 rounded-3xl p-5 border border-navy-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Anchor className="w-12 h-12 text-ship-blue" />
          </div>
          <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest mb-3">Status Sistem</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-ship-blue rounded-full animate-ping absolute inset-0" />
              <div className="relative w-2.5 h-2.5 bg-ship-blue rounded-full" />
            </div>
            <span className="text-xs text-white font-black uppercase tracking-tighter">Otomatis Aktif</span>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between opacity-30 px-2">
            <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">v2.8.0</span>
            <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{role}</span>
        </div>
      </div>
    </div>
  );
}

export function Header({ user, role, activeTab, setActiveTab }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={cn(
        "fixed top-0 right-0 left-0 lg:left-80 z-50 transition-all duration-500 px-4 py-4 md:px-8",
        isScrolled ? "bg-white/80 backdrop-blur-2xl border-b border-navy-100 shadow-xl" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white backdrop-blur-md rounded-[2rem] px-6 py-3 border border-navy-100 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-navy-400 hover:text-ship-blue transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] font-black text-ship-blue uppercase tracking-widest">{format(new Date(), 'EEEE, d MMM yyyy')}</span>
              <span className="text-xs font-bold text-navy-900 tracking-tight uppercase">Pelabuhan Muaro Padang</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!user ? (
              <button 
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (e: any) {
                    if (e.code !== 'auth/popup-closed-by-user') {
                      console.error("Sign-in Error:", e);
                    }
                  }
                }}
                className="bg-ship-blue text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-navy-900 hover:scale-105 active:scale-95 shadow-xl shadow-ship-blue/10"
              >
                Boarding Pass
              </button>
            ) : (
              <div className="flex items-center gap-3 md:gap-5">
                <button className="hidden md:flex p-3 rounded-2xl bg-white text-navy-400 hover:text-ship-blue hover:bg-navy-100 transition-all relative border border-navy-100 group">
                  <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>
                
                <div className="h-10 w-px bg-navy-100 hidden md:block" />
                
                <div className="flex items-center gap-4 bg-white p-1.5 pr-4 rounded-2xl border border-navy-100 hover:border-navy-200 transition-all group">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-xl border border-navy-200 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-ship-blue flex items-center justify-center font-black text-white uppercase">
                      {user.displayName?.charAt(0) || <UserIcon />}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-black text-navy-900 leading-none">{user.displayName}</p>
                    <p className="text-[9px] text-ship-blue uppercase font-black tracking-widest mt-1">{role}</p>
                  </div>
                  <button 
                    onClick={() => signOut(auth)}
                    className="ml-2 p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-navy-900/60 backdrop-blur-md z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-navy-900 z-[101] shadow-2xl lg:hidden"
            >
                <div className="flex items-center justify-between p-8 border-b border-navy-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ship-blue rounded-xl flex items-center justify-center font-black text-white">MF</div>
                        <span className="font-display font-black text-white">PORTAL</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-navy-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <Sidebar user={user} role={role} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
