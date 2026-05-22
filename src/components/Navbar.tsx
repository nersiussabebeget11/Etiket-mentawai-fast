import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, Calendar, Ship, Compass, FileText, Settings, 
  Users, Wrench, Briefcase, Ticket, Search, LogOut, Globe, Shield, Anchor 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Language } from '../lib/translations';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  role: 'admin' | 'user' | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function Sidebar({ user, role, activeTab, setActiveTab, language, setLanguage }: NavbarProps) {
  const isAdmin = role === 'admin';

  const menuItems = isAdmin ? [
    { id: 'dashboard', label: language === 'id' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard },
    { id: 'passengers', label: language === 'id' ? 'Beli Tiket Loket' : 'Loket Ticket Sales', icon: Users },
    { id: 'schedules', label: language === 'id' ? 'Kelola Jadwal' : 'Manage Schedules', icon: Calendar },
    { id: 'ships', label: language === 'id' ? 'Kelola Kapal' : 'Manage Ships', icon: Ship },
    { id: 'routes', label: language === 'id' ? 'Kelola Rute' : 'Manage Routes', icon: Compass },
    { id: 'reports', label: language === 'id' ? 'Manifes & Laporan' : 'Manifest & Reports', icon: FileText },
    { id: 'maintenance', label: language === 'id' ? 'Pemeliharaan' : 'Maintenance & Fuel', icon: Wrench },
    { id: 'settings', label: language === 'id' ? 'Pengaturan Pelabuhan' : 'Port Settings', icon: Settings },
    { id: 'business-plan', label: language === 'id' ? 'Rencana Bisnis' : 'Business Plan', icon: Briefcase },
  ] : [
    { id: 'search', label: language === 'id' ? 'Cari & Pesan' : 'Search & Book', icon: Search },
    { id: 'my-tickets', label: language === 'id' ? 'Tiket Saya' : 'My Tickets', icon: Ticket },
    { id: 'business-plan', label: language === 'id' ? 'Rencana Bisnis' : 'Business Plan', icon: Briefcase },
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1528] border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5">
          <Anchor className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">MENTAWAI</h2>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5 block">FAST TICKETING</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-hidden hover:overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all border outline-none text-left",
                isActive 
                  ? "bg-blue-600 text-white border-blue-500/30 shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/30 border-transparent hover:border-slate-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer User Profile Summary */}
      <div className="p-6 border-t border-slate-800/50 bg-slate-950/20">
        {user && (
          <div className="flex items-center gap-3.5">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold flex items-center justify-center text-sm">
                {(user.displayName || user.email || 'M').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <span className="block text-xs font-black text-white truncate uppercase tracking-wide">
                {user.displayName || 'Passenger'}
              </span>
              <span className="text-[8px] font-bold text-slate-500 truncate uppercase mt-0.5 tracking-widest flex items-center gap-1.5 leading-none">
                {isAdmin ? (
                  <>
                    <Shield className="w-2.5 h-2.5 text-blue-500" />
                    ADMIN LOKET
                  </>
                ) : (
                  'PASSENGER'
                )}
              </span>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/10 outline-none"
              title={language === 'id' ? 'Keluar' : 'Sign Out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Header({ user, role, activeTab, setActiveTab, language, setLanguage }: NavbarProps) {
  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-[#0B1528]/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-4 lg:hidden">
        <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">
          <Anchor className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-black text-white uppercase tracking-wider italic">MENTAWAI FAST</h2>
        </div>
      </div>

      {/* Hidden spacer on desktop to push control block to right */}
      <div className="hidden lg:block">
        {role === 'admin' ? (
          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] italic flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            CONSOLE OPERATOR RESMI
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] italic flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            PORT ONLINE TIMING SYSTEM
          </span>
        )}
      </div>

      {/* Header Panel Controls */}
      <div className="flex items-center gap-4">
        {/* Language Selection */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button 
            onClick={() => setLanguage('id')}
            className={cn(
              "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border outline-none",
              language === 'id' 
                ? "bg-blue-600 text-white border-blue-500/10 shadow-md shadow-blue-600/5" 
                : "text-slate-400 border-transparent hover:text-white"
            )}
          >
            ID
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={cn(
              "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border outline-none",
              language === 'en' 
                ? "bg-blue-600 text-white border-blue-500/10 shadow-md shadow-blue-600/5" 
                : "text-slate-400 border-transparent hover:text-white"
            )}
          >
            EN
          </button>
        </div>

        {/* Small avatar profile card (Mobile-only dropdown fallback trigger) */}
        {user && (
          <div className="flex items-center gap-3 lg:hidden">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="user" 
                className="w-8 h-8 rounded-lg object-cover border border-slate-700" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs uppercase">
                {user.email?.charAt(0) || 'M'}
              </div>
            )}
            <button 
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-400 p-1.5"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
