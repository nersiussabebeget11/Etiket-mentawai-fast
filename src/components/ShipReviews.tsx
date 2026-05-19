import React from 'react';
import { Star, MessageSquare, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ShipReviewsProps {
  reviews: Review[];
}

export function ShipReviews({ reviews }: ShipReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="py-20 text-center bento-card border-dashed bg-white border-navy-100 italic">
        <MessageSquare className="w-12 h-12 text-navy-200 mx-auto mb-6" />
        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.4em] italic leading-none">Belum Ada Ulasan Tersedia</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between bg-white p-8 rounded-[2rem] border border-navy-100 shadow-inner">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white border border-navy-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Star className="w-7 h-7 fill-amber-400 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
          </div>
          <div>
            <div className="text-4xl font-display font-black text-navy-900 italic leading-none">{averageRating.toFixed(1)}</div>
            <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 italic">Rata-rata dari {reviews.length} ulasan</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {reviews.map((review) => (
          <div key={review.id} className="bento-card border-navy-100 bg-white !p-6 group hover:border-ship-blue/30 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-navy-100 group-hover:bg-ship-blue/10 transition-colors">
                  <UserIcon className="w-5 h-5 text-navy-300 group-hover:text-ship-blue" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-navy-900 uppercase tracking-tighter leading-none italic">{review.userName}</div>
                  <div className="text-[8px] font-black text-navy-300 mt-1 uppercase tracking-widest italic">{format(parseISO(review.createdAt), 'dd MMM yyyy')}</div>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={cn(
                      "w-3 h-3 transition-all",
                      s <= review.rating ? "fill-amber-400 text-amber-500" : "text-navy-100"
                    )} 
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-[11px] text-navy-600 font-medium leading-relaxed italic border-l-2 border-ship-blue/20 pl-4 py-1">"{review.comment}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
