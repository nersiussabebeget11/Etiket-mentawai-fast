import React from 'react';
import { db } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { Bell, Check, X, Clock, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment_confirmed' | 'booking_cancelled' | 'announcement';
  read: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export function NotificationCenter({ isOpen, onClose, notifications }: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[150]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed top-24 right-4 md:right-8 w-full max-w-sm bento-card !p-0 z-[160] border-navy-100 shadow-5xl overflow-hidden bg-white"
          >
            <div className="p-8 bg-ship-blue flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-white/10 rounded-full" />
              <div className="flex items-center gap-4 relative z-10 text-white">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black uppercase tracking-tighter text-white text-xl leading-none">Notifikasi</h3>
                  <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mt-1">{unreadCount} Info Baru</p>
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-6 space-y-4 bg-white">
              {notifications.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <Bell className="w-16 h-16 mx-auto opacity-5 text-navy-900" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-navy-200">Belum ada pesan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...notifications].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((n) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      key={n.id} 
                      className={cn(
                        "p-5 rounded-3xl transition-all cursor-pointer group relative border",
                        n.read ? "opacity-30 border-navy-100" : "bg-white hover:bg-navy-50 border-navy-100 shadow-sm"
                      )}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <div className="flex gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-navy-100 bg-white shadow-sm",
                          n.type === 'payment_confirmed' ? "text-emerald-600" : 
                          n.type === 'booking_cancelled' ? "text-rose-600" : "text-ship-blue"
                        )}>
                          {n.type === 'payment_confirmed' ? <Check className="w-5 h-5 shadow-[0_0_10px_rgba(5,150,105,0.2)]" /> : 
                           n.type === 'booking_cancelled' ? <X className="w-5 h-5 shadow-[0_0_10px_rgba(225,29,72,0.2)]" /> : <Info className="w-5 h-5" />}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-black text-navy-900 text-[11px] uppercase tracking-widest">{n.title}</h4>
                          <p className="text-[10px] text-navy-400 font-medium leading-relaxed tracking-tight">{n.message}</p>
                          <div className="flex items-center gap-1.5 text-[8px] font-black text-navy-200 pt-2 uppercase tracking-widest">
                            <Clock className="w-3 h-3 text-ship-blue opacity-40" />
                            {format(parseISO(n.createdAt), 'HH:mm • dd MMM')}
                          </div>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="absolute top-5 right-5 w-2 h-2 bg-ship-blue rounded-full animate-ping" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white border-t border-navy-100 text-center">
              <button 
                onClick={onClose}
                className="text-[9px] font-black text-navy-400 uppercase tracking-[0.4em] hover:text-ship-blue transition-colors"
              >
                TUTUP
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
