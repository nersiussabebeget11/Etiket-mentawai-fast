import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Check, Trash2, Calendar } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}

export function NotificationCenter({ isOpen, onClose, notifications }: NotificationCenterProps) {
  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const ref = doc(db, 'notifications', notificationId);
      await updateDoc(ref, { read: true });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const ref = doc(db, 'notifications', notificationId);
      await deleteDoc(ref);
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  if (!isOpen) return null;

  // Sort notifications by date descending
  const sorted = [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] overflow-hidden select-none">
        {/* Backdrop overlay wrapper */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        />

        {/* Sliding Panel */}
        <div className="absolute inset-y-0 right-0 max-w-md w-full flex pl-10">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-full bg-[#0B1528] border-l border-slate-800 flex flex-col h-full shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800/80 bg-slate-950/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">NOTIFIKASI SISTEM</h3>
                  {unreadCount > 0 && (
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block mt-0.5 mt-0.5">
                      {unreadCount} Pesan Belum Dibaca
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all outline-none"
                    title="Tandai Semua Sudah Dibaca"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {sorted.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                  <div className="w-16 h-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 flex items-center justify-center mb-4 text-slate-600">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Tidak Ada Notifikasi</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                    Setiap pemesanan, tiket terkonfirmasi, atau update cuaca buruk akan tercantum di panel ini secara real-time.
                  </p>
                </div>
              ) : (
                sorted.map((item) => {
                  const itemDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  });

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      onClick={() => !item.read && markAsRead(item.id)}
                      className={cn(
                        "p-5 rounded-2xl relative border outline-none cursor-pointer group transition-all text-left",
                        item.read 
                          ? "bg-slate-900/10 border-slate-900/60 hover:border-slate-800"
                          : "bg-blue-600/5 border-blue-500/20 hover:border-blue-500/30"
                      )}
                    >
                      {/* Glow Unread Dot */}
                      {!item.read && (
                        <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500" />
                      )}

                      <h4 className={cn("text-xs font-black uppercase tracking-wider mb-1", item.read ? "text-slate-300" : "text-white")}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-wide">
                        {item.message}
                      </p>

                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800/20">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                          <Calendar className="w-3 h-3 text-slate-700" />
                          {itemDate}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
