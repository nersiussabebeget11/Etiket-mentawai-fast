import { Star, User, Calendar } from 'lucide-react';

interface ReviewItem {
  id?: string;
  shipId: string;
  shipName?: string;
  rating: number;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: string;
}

interface ShipReviewsProps {
  reviews: ReviewItem[];
}

export function ShipReviews({ reviews }: ShipReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/10 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
        <Star className="w-8 h-8 text-slate-600 mb-3 animate-pulse" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">Belum ada ulasan untuk kapal ini</p>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 block">Dapatkan boarding pass Anda lalu kirim ulasan pertama!</span>
      </div>
    );
  }

  // Sort reviews by date descending
  const sortedReviews = [...reviews].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedReviews.map((review, idx) => {
        const reviewDate = new Date(review.createdAt).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        return (
          <div 
            key={review.id || idx} 
            className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3.5"
          >
            {/* Reviewer Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold uppercase">
                  {review.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="block text-xs font-black text-white uppercase tracking-wider">{review.userName}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    {reviewDate}
                  </span>
                </div>
              </div>

              {/* Stars display */}
              <div className="flex items-center gap-0.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <Star 
                    key={starVal} 
                    className="w-3 h-3" 
                    fill={starVal <= review.rating ? "#F59E0B" : "none"} 
                    stroke={starVal <= review.rating ? "#F59E0B" : "#475569"} 
                  />
                ))}
              </div>
            </div>

            {/* Comment Body */}
            <div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed uppercase tracking-wider text-left">
                {review.comment}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
