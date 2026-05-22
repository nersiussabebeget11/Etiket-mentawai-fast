import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, StarOff, X, Send } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipId: string;
  shipName: string;
  bookingId: string;
}

export function ReviewModal({ isOpen, onClose, shipId, shipName, bookingId }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);

    const reviewData = {
      shipId,
      shipName,
      bookingId,
      rating,
      comment: comment.trim(),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Passenger',
      userEmail: auth.currentUser.email || '',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'reviews'), reviewData);
      setComment('');
      setRating(5);
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0B1528] border border-slate-800 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest italic">KIRIM ULASAN KAPAL</h3>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Kapal: {shipName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating Select */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-900/40 rounded-2xl border border-slate-800/50">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3">Beri Rating Penyeberangan</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isHighlighted = (hoverRating !== null ? starVal <= hoverRating : starVal <= rating);
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 text-amber-400 hover:scale-115 transition-transform outline-none"
                    >
                      <Star 
                        className="w-8 h-8" 
                        fill={isHighlighted ? "#F59E0B" : "none"} 
                        stroke={isHighlighted ? "#F59E0B" : "#475569"} 
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest mt-3 italic">
                {rating === 5 ? 'Sangat Memuaskan' : rating === 4 ? 'Memuaskan' : rating === 3 ? 'Cukup Baik' : rating === 2 ? 'Keterlambatan / Kurang' : 'Sangat Kurang'}
              </span>
            </div>

            {/* Comment Area */}
            <div className="space-y-2">
              <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Komentar & Pengalaman Perjalanan</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs font-black text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-500 custom-scrollbar"
                placeholder="Tuliskan ulasan Anda mengenai fasilitas kapal, pelayanan petugas port, penanganan surfboard, atau kenyamanan transit..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="w-full relative py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 outline-none overflow-hidden"
            >
              <span>{isSubmitting ? 'MENGIRIM...' : 'KIRIM ULASAN'}</span>
              {!isSubmitting && <Send className="w-4 h-4 ml-1" />}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
