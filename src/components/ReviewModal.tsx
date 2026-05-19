import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipId: string;
  shipName: string;
  bookingId: string;
}

export function ReviewModal({ isOpen, onClose, shipId, shipName, bookingId }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        shipId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        bookingId,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bento-card w-full max-w-md border-navy-100 bg-white"
          >
            <div className="bg-ship-blue p-10 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <h2 className="text-2xl font-display font-black tracking-tighter uppercase leading-none italic">Ulasan Perjalanan</h2>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-2 italic">Kapal: {shipName}</p>
              </div>
              <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              <div className="space-y-4 text-center">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] italic">Rating Pengalaman</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform hover:scale-125 active:scale-90"
                    >
                      <Star 
                        className={cn(
                          "w-12 h-12 transition-all",
                          (hover || rating) >= star ? "fill-amber-400 text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "text-navy-100"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 flex items-center gap-2 italic">
                  <MessageSquare className="w-4 h-4 text-ship-blue" /> Komentar
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white border-navy-100 border rounded-[2rem] px-8 py-5 text-navy-900 text-sm font-black focus:border-ship-blue/50 outline-none transition-all resize-none h-32 placeholder:text-navy-200"
                  placeholder="Ceritakan pengalaman perjalanan Anda..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-ship-blue hover:bg-navy-900 text-white font-black uppercase text-xs tracking-[0.3em] py-6 rounded-[2rem] shadow-5xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                KIRIM ULASAN
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
