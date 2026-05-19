import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  getDoc,
  increment
} from 'firebase/firestore';
import { 
  Search, 
  MapPin, 
  Clock, 
  CreditCard, 
  Smartphone,
  Wallet,
  ChevronRight, 
  CheckCircle2,
  Ticket,
  Anchor,
  Ship,
  Plus,
  Download,
  Star,
  MessageSquare,
  Bell,
  X,
  CreditCard as CardIcon,
  AlertCircle,
  Info
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { format, parseISO, isBefore } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, toTitleCase } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { ReviewModal } from './ReviewModal';
import { ShipReviews } from './ShipReviews';
import { NotificationCenter } from './NotificationCenter';

interface UserViewProps {
  key?: string;
  activeTab: 'search' | 'my-tickets';
  setActiveTab: (tab: 'search' | 'my-tickets') => void;
}

export function UserView({ activeTab, setActiveTab }: UserViewProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [payingBooking, setPayingBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'ovo' | 'gopay'>('bank');
  const [isPaying, setIsPaying] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<any>(null);
  const [reviewingBooking, setReviewingBooking] = useState<any>(null);
  const [selectedShipForReviews, setSelectedShipForReviews] = useState<any>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [passengers, setPassengers] = useState([{ name: '', id: '', email: '', phone: '' }]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [ticker, setTicker] = useState(0);
  const [bankSettings, setBankSettings] = useState<any>({
    bankName: 'BANK MANDIRI',
    accountNumber: '111-00123-4567-8',
    accountHolder: 'Mentawai Fast Owner'
  });
  const ticketRef = useRef<HTMLDivElement>(null);

  // Force re-render for timer every second
  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Background cleanup for expired pending bookings
  useEffect(() => {
    if (!auth.currentUser || bookings.length === 0) return;

    const cleanupExpired = async () => {
      const now = new Date().toISOString();
      const expiredPending = bookings.filter(b => b.status === 'pending' && b.expiresAt && b.expiresAt < now);
      
      if (expiredPending.length === 0) return;

      for (const booking of expiredPending) {
        try {
          // Double check if it's still pending before updating
          const docRef = doc(db, 'bookings', booking.id);
          const snap = await getDoc(docRef);
          
          if (snap.exists() && snap.data().status === 'pending') {
            await updateDoc(docRef, { status: 'cancelled' });
            
            const scheduleRef = doc(db, 'schedules', booking.scheduleId);
            const scheduleSnap = await getDoc(scheduleRef);
            if (scheduleSnap.exists() && (scheduleSnap.data().bookedSeats || 0) > 0) {
              await updateDoc(scheduleRef, {
                bookedSeats: increment(-1)
              });
            }
            
            await addDoc(collection(db, 'notifications'), {
              userId: auth.currentUser!.uid,
              title: 'Tiket Kedaluwarsa',
              message: `Pemesanan MF-${booking.id.slice(0,8).toUpperCase()} telah dibatalkan karena pembayaran tidak dilakukan dalam 2 menit.`,
              type: 'booking_cancelled',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Auto-cancel failed for:", booking.id, e);
        }
      }
    };

    const interval = setInterval(cleanupExpired, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, [bookings]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [shipsData, routesData, bankSnap] = await Promise.all([
          getDocs(collection(db, 'ships')),
          getDocs(collection(db, 'routes')),
          getDoc(doc(db, 'settings', 'payment'))
        ]);
        setShips(shipsData.docs.map(d => ({ id: d.id, ...d.data() })));
        setRoutes(routesData.docs.map(d => ({ id: d.id, ...d.data() })));
        if (bankSnap.exists()) setBankSettings(bankSnap.data());
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'metadata');
      }
    };
    fetchMetadata();

    const unsubSchedules = onSnapshot(query(collection(db, 'schedules')), (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'schedules'));

    if (auth.currentUser) {
      const unsubBookings = onSnapshot(query(collection(db, 'bookings'), where('userId', '==', auth.currentUser.uid)), (snap) => {
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));

      const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'reviews'));

      const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', auth.currentUser.uid)), (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));

      return () => {
        unsubSchedules();
        unsubBookings();
        unsubReviews();
        unsubNotifications();
      };
    }
    return () => unsubSchedules();
  }, []);

  const downloadTicketPDF = async () => {
    if (!ticketRef.current) return;
    setIsGeneratingPDF(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#020617',
        cacheBust: true,
      });
      
      const imgWidth = 210;
      // create a temporary image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
      
      const imgHeight = (img.height * imgWidth) / img.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [imgWidth, imgHeight] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`mf-boarding-pass-${viewingTicket.id.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
      setStatusModal({
        show: true,
        title: 'PDF ERROR',
        message: 'Gagal mencetak dokumen boarding pass. Silakan gunakan screenshot.',
        type: 'error'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !auth.currentUser) return;
    setBookingLoading(true);
    try {
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      const bookingPromises = passengers.map(passenger => {
        return addDoc(collection(db, 'bookings'), {
          scheduleId: selectedSchedule.id,
          userId: auth.currentUser!.uid,
          passengerName: passenger.name,
          passengerId: passenger.id,
          passengerEmail: passenger.email,
          passengerPhone: passenger.phone,
          seatNumber: 'AUTO-' + Math.floor(10 + Math.random() * 90),
          totalPrice: selectedSchedule.price,
          status: 'pending',
          expiresAt: expiresAt,
          createdAt: new Date().toISOString()
        });
      });
      await Promise.all(bookingPromises);
      
      await updateDoc(doc(db, 'schedules', selectedSchedule.id), {
        bookedSeats: increment(passengers.length)
      });

      setSelectedSchedule(null);
      setPassengerCount(1);
      setPassengers([{ name: '', id: '', email: '', phone: '' }]);
      setActiveTab('my-tickets');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setBookingLoading(false);
    }
  };

  const simulatePayment = async (bookingId: string, amount: number, method: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'cancelled') {
      setStatusModal({
        show: true,
        title: 'Booking Kedaluwarsa',
        message: 'Maaf, pemesanan ini telah kedaluwarsa dan dibatalkan. Silakan lakukan pemesanan ulang.',
        type: 'error'
      });
      setPayingBooking(null);
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount })
      });
      const data = await res.json();
      if (data.status === 'success') {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'paid',
          paymentMethod: method,
          paymentId: data.transactionId,
          confirmedAt: new Date().toISOString()
        });

        await addDoc(collection(db, 'notifications'), {
          userId: auth.currentUser?.uid,
          title: 'Payload Confirmed!',
          message: `Digital ticket MF-${bookingId.slice(0,8).toUpperCase()} has been verified. Access granted.`,
          type: 'payment_confirmed',
          read: false,
          createdAt: new Date().toISOString()
        });

        // Trigger email
        const bDoc = bookings.find(b => b.id === bookingId);
        if (bDoc) {
          fetch('/api/tickets/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              booking: { ...bDoc, id: bookingId }, 
              schedule: schedules.find(s => s.id === bDoc.scheduleId), 
              ship: ships.find(s => s.id === schedules.find(s => s.id === bDoc.scheduleId)?.shipId)
            })
          }).catch(e => console.error("Auto-email failure", e));
        }

        setStatusModal({
          show: true,
          title: 'VERIFIKASI BERHASIL',
          message: 'Dokumen tiket telah berhasil diverifikasi dan dibuat.',
          type: 'success'
        });
        setPayingBooking(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    } finally {
      setIsPaying(false);
    }
  };

  const getRouteDetails = (routeId: string) => routes.find(r => r.id === routeId) || { origin: '...', destination: '...' };
  const getShipDetails = (shipId: string) => ships.find(s => s.id === shipId) || { name: '...' };
  const getShipRating = (shipId: string) => {
    const shipReviews = reviews.filter(r => r.shipId === shipId);
    if (shipReviews.length === 0) return null;
    return { avg: shipReviews.reduce((sum, r) => sum + r.rating, 0) / shipReviews.length, count: shipReviews.length };
  };

  const getRemainingSeats = (scheduleId: string, shipCapacity: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const occupied = schedule?.bookedSeats || 0;
    return Math.max(0, shipCapacity - occupied);
  };

  const getDelayRemaining = (estimatedTime: string) => {
    const now = Date.now();
    const target = new Date(estimatedTime).getTime();
    const diff = target - now;
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} />

      {/* Hero Welcome */}
      <div className="bento-card !p-6 relative overflow-hidden group bg-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white blur-[100px] rounded-full group-hover:bg-navy-100 transition-all duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <span className="badge-status bg-ship-blue/10 text-ship-blue border-ship-blue/20 mb-4 inline-block uppercase animate-pulse">Akses Terverifikasi</span>
            <h1 className="text-2xl md:text-3xl font-display font-black text-navy-900 tracking-tighter leading-none">
                HALO, <br/><span className="text-ship-blue">{auth.currentUser?.displayName?.split(' ')[0].toUpperCase()}</span>
            </h1>
            <p className="text-navy-400 text-[9px] font-black uppercase tracking-[0.3em] mt-3">Terminal Penumpang Digital Mentawai Fast</p>
          </div>
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="group relative glass-button p-4 rounded-2xl border-navy-100 overflow-hidden bg-white"
          >
            <Bell className="w-5 h-5 text-navy-400 group-hover:text-ship-blue group-hover:rotate-12 transition-all" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-5 right-5 w-5 h-5 bg-ship-blue text-white text-[10px] font-black flex items-center justify-center rounded-full ring-4 ring-white animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'search' ? (
          <motion.div key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedules
                .filter(s => {
                  const ship = getShipDetails(s.shipId);
                  const isFuture = isBefore(new Date(), parseISO(s.departureTime));
                  return ship.status !== 'docking' && ['scheduled', 'active', 'delayed'].includes(s.status) && isFuture;
                })
                .map((schedule) => {
                const route = getRouteDetails(schedule.routeId);
                const ship = getShipDetails(schedule.shipId);
                const rating = getShipRating(ship.id);
                const remainingSeats = getRemainingSeats(schedule.id, ship.capacity || 0);
                const isSoldOut = remainingSeats <= 0;
                const isDelayed = schedule.status === 'delayed';
                const delayTimer = isDelayed && schedule.estimatedActiveTime ? getDelayRemaining(schedule.estimatedActiveTime) : null;

                return (
                  <motion.div 
                    layoutId={schedule.id}
                    key={schedule.id}
                    className={cn(
                      "bento-card group cursor-pointer bg-white shadow-lg transition-all",
                      isSoldOut ? "opacity-75 grayscale-[0.5]" : "hover:border-ship-blue/50",
                      isDelayed && "border-amber-200 bg-amber-50/10"
                    )}
                    onClick={() => !isSoldOut && setSelectedSchedule(schedule)}
                  >
                    <div className="flex justify-between items-start mb-10">
                        <div className={cn(
                          "w-14 h-14 border rounded-2xl flex items-center justify-center transition-all duration-500",
                          isSoldOut ? "bg-rose-50 border-rose-100 text-rose-400" : 
                          isDelayed ? "bg-amber-50 border-amber-200 text-amber-500" :
                          "bg-white border-navy-100 text-navy-400 group-hover:text-ship-blue"
                        )}>
                           <Anchor className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isSoldOut ? (
                            <span className="badge-status bg-rose-50 text-rose-600 border-rose-200 uppercase font-black text-[8px] animate-pulse">TIKET HABIS</span>
                          ) : isDelayed ? (
                            <span className="badge-status bg-amber-50 text-amber-600 border-amber-200 uppercase font-black text-[8px] animate-pulse">TERTUNDA / DELAY</span>
                          ) : (
                            <span className="badge-status bg-emerald-50 text-emerald-600 border-emerald-200 uppercase font-black text-[8px]">{remainingSeats} Tersisa</span>
                          )}
                          {rating && (
                              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  <span className="text-[10px] font-black text-amber-600 tracking-tighter">{rating.avg.toFixed(1)}</span>
                              </div>
                          )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-display font-black text-navy-900 tracking-tighter uppercase leading-none">{ship.name}</h3>
                            <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mt-1">
                              {format(parseISO(schedule.departureTime), "EEEE, dd MMM yyyy", { locale: id })}
                            </p>
                        </div>

                        {isDelayed && delayTimer && (
                          <div className="bg-amber-100/50 p-2 rounded-lg border border-amber-200 text-center">
                            <p className="text-[7px] font-black uppercase text-amber-600 tracking-widest mb-1">Estimasi Aktif Kembali</p>
                            <div className="flex justify-center gap-2 text-amber-700 font-mono text-[10px] font-black">
                                {delayTimer.days > 0 && <span>{delayTimer.days}h </span>}
                                <span>{String(delayTimer.hours).padStart(2, '0')}:</span>
                                <span>{String(delayTimer.minutes).padStart(2, '0')}:</span>
                                <span>{String(delayTimer.seconds).padStart(2, '0')}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-black text-navy-900 tracking-widest uppercase bg-white p-3 rounded-xl border border-navy-100">
                            <span>{route.origin.substring(0,3)}</span>
                            <div className="flex-1 mx-3 h-px border-b border-dashed border-navy-200 relative">
                                <ChevronRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-ship-blue opacity-20" />
                            </div>
                            <span>{route.destination.substring(0,3)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Keberangkatan</span>
                                <span className="text-base font-display font-black text-navy-900">{format(parseISO(schedule.departureTime), "HH:mm")}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Harga</span>
                                <span className="text-base font-display font-black text-ship-blue">Rp {schedule.price.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {schedules.length === 0 && !loading && (
              <div className="py-40 text-center bento-card border-dashed">
                <Clock className="w-16 h-16 text-slate-800 mx-auto mb-6 animate-pulse" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs font-display">No Available Trajectories</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="tickets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {bookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((booking) => {
                const schedule = schedules.find(s => s.id === booking.scheduleId) || {};
                const route = getRouteDetails(schedule.routeId || '');
                const ship = getShipDetails(schedule.shipId || '');
                const isPaid = booking.status === 'paid';
                const isCancelled = booking.status === 'cancelled';
                
                return (
                  <motion.div layout key={booking.id} className={cn(
                    "bento-card !p-0 overflow-hidden group bg-white shadow-xl transition-all",
                    isCancelled && "opacity-50 grayscale scale-[0.98]"
                  )}>
                    <div className="p-8 border-b border-navy-100 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={cn("w-2.5 h-2.5 rounded-full", 
                              isPaid ? "bg-emerald-500" : isCancelled ? "bg-rose-500" : "bg-amber-500 animate-pulse"
                            )} />
                            <span className="text-[10px] font-black uppercase text-navy-400 tracking-[0.3em]">REF MF-{booking.id.slice(0,6).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isPaid && !isCancelled && booking.expiresAt && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
                                <Clock className="w-3 h-3 text-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black text-rose-600 italic">
                                    {Math.max(0, Math.floor((new Date(booking.expiresAt).getTime() - Date.now()) / 1000))}s
                                </span>
                            </div>
                          )}
                          <span className={cn(
                              "badge-status",
                              isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                              isCancelled ? "bg-rose-50 text-rose-600 border-rose-200" :
                              "bg-amber-50 text-amber-600 border-amber-200"
                          )}>{booking.status}</span>
                        </div>
                    </div>

                    <div className="p-6 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8-mt-8 opacity-5">
                            <CardIcon className="w-24 h-24 text-navy-900" />
                        </div>
                        <div className="space-y-4 relative z-10 w-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Rute Kapal</p>
                                    <h3 className="text-lg font-display font-black text-navy-900 tracking-tighter uppercase leading-none">{route.origin} → {route.destination}</h3>
                                    <p className="text-[8px] font-black text-ship-blue uppercase tracking-[0.2em] mt-2 font-mono">{ship.name}</p>
                                </div>
                        <div className="text-right">
                                    <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Penumpang</p>
                                    <p className="text-xs font-black text-navy-900 tracking-tight text-left">{toTitleCase(booking.passengerName)}</p>
                                    <p className="text-[8px] font-bold text-navy-400 mt-1 uppercase tracking-widest">{booking.passengerId}</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-navy-100">
                                <div className="flex items-center gap-4">
                                    {isPaid ? (
                                        <button onClick={() => setViewingTicket(booking)} className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-navy-600 hover:bg-white border border-navy-100">
                                            <Search className="w-3.5 h-3.5" /> Tiket
                                        </button>
                                    ) : isCancelled ? (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[8px] font-black uppercase text-rose-500 tracking-widest">
                                            <X className="w-3.5 h-3.5" /> Kedaluwarsa
                                        </div>
                                    ) : (
                                        <button onClick={() => setPayingBooking(booking)} className="bg-ship-blue hover:bg-navy-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105">
                                            <CreditCard className="w-3.5 h-3.5" /> Bayar
                                        </button>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Harga</p>
                                    <p className="text-base font-display font-black text-navy-900 tracking-tighter leading-none">Rp {booking.totalPrice.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Drawer/Modal */}
      <AnimatePresence>
        {selectedSchedule && (
            <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-3xl z-[100] p-4 overflow-y-auto">
                <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="max-w-3xl mx-auto my-12 bg-white rounded-3xl p-6 shadow-5xl border border-navy-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none">RESERVASI</h2>
                            <p className="text-ship-blue text-[9px] font-black uppercase tracking-[0.4em] mt-2">Protokol Keamanan • {getShipDetails(selectedSchedule.shipId).name}</p>
                        </div>
                        <button onClick={() => setSelectedSchedule(null)} className="glass-button p-3 rounded-xl bg-white hover:bg-navy-100 transition-all">
                            <X className="w-5 h-5 text-navy-400 hover:text-navy-900" />
                        </button>
                    </div>

                    <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-navy-100 shadow-inner">
                                <div className="space-y-1">
                                    <h4 className="text-navy-900 text-[10px] font-black uppercase tracking-widest">Jumlah Unit</h4>
                                    <p className="text-navy-400 text-[8px] font-black uppercase tracking-widest">Alokasi tiket</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => { if (passengerCount > 1) { setPassengerCount(p => p - 1); setPassengers(p => p.slice(0, -1)); } }} className="w-10 h-10 rounded-xl bg-white border border-navy-200 flex items-center justify-center text-lg font-black text-navy-900 hover:bg-navy-100 transition-colors">-</button>
                                    <span className="text-xl font-display font-black text-navy-900 w-6 text-center">{passengerCount}</span>
                                    <button type="button" onClick={() => { 
                                      const remaining = getRemainingSeats(selectedSchedule.id, getShipDetails(selectedSchedule.shipId).capacity || 0);
                                      if (passengerCount < 8 && passengerCount < remaining) { 
                                        setPassengerCount(p => p + 1); 
                                        setPassengers(p => [...p, { name: '', id: '', email: '', phone: '' }]); 
                                      } else if (passengerCount >= remaining) {
                                        setStatusModal({
                                          show: true,
                                          title: 'Kursi Terbatas',
                                          message: `Maaf, hanya tersisa ${remaining} kursi.`,
                                          type: 'error'
                                        });
                                      }
                                    }} className="w-10 h-10 rounded-xl bg-ship-blue flex items-center justify-center text-lg font-black text-white hover:bg-navy-900 transition-colors shadow-lg">+</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {passengers.map((p, i) => (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bento-card group border-navy-100 bg-white shadow-md !p-5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="w-8 h-8 bg-white border border-navy-100 flex items-center justify-center rounded-lg text-[10px] font-black text-ship-blue">{String(i+1).padStart(2, '0')}</span>
                                            <h4 className="text-navy-900 text-[10px] font-black uppercase tracking-widest leading-none">Manifest {i+1}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-navy-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                                <input required value={p.name} onChange={e => { const newP = [...passengers]; newP[i].name = toTitleCase(e.target.value); setPassengers(newP); }} className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200" placeholder="Nama Lengkap" />
                                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-navy-500 uppercase tracking-widest ml-1">NIK</label>
                                <input required value={p.id} onChange={e => { const newP = [...passengers]; newP[i].id = e.target.value; setPassengers(newP); }} className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all font-mono" placeholder="NOMOR NIK" />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <label className="text-[8px] font-black text-navy-500 uppercase tracking-widest ml-1">Email</label>
                                <input required type="email" value={p.email} onChange={e => { const newP = [...passengers]; newP[i].email = e.target.value; setPassengers(newP); }} className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all lowercase" placeholder="user@domain.com" />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <label className="text-[8px] font-black text-navy-500 uppercase tracking-widest ml-1">Nomor Telepon/WA</label>
                                <input required type="tel" value={p.phone} onChange={e => { const newP = [...passengers]; newP[i].phone = e.target.value; setPassengers(newP); }} className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all font-mono" placeholder="08xxxxxxxxxx" />
                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bento-card border-navy-100 bg-white sticky top-4 shadow-xl !p-6">
                                <h3 className="text-[10px] font-black text-navy-900 uppercase tracking-widest mb-6">Ringkasan</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-navy-100 group">
                                        <span className="text-[9px] font-black text-navy-400 uppercase">Harga x {passengerCount}</span>
                                        <span className="text-navy-900 font-black text-xs">Rp {(selectedSchedule.price * passengerCount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-navy-100">
                                        <span className="text-[9px] font-black text-navy-400 uppercase">Layanan</span>
                                        <span className="text-ship-blue font-black text-[10px] tracking-widest">GRATIS</span>
                                    </div>
                                    <div className="pt-4">
                                        <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] mb-2 text-center text-center">Total</p>
                                        <p className="text-2xl font-display font-black text-navy-900 text-center tracking-tighter">Rp {(selectedSchedule.price * passengerCount).toLocaleString()}</p>
                                    </div>
                                    <button disabled={bookingLoading} className="w-full bg-ship-blue text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:bg-navy-900 hover:scale-105 active:scale-95 shadow-xl mt-4 disabled:opacity-50">
                                        {bookingLoading ? 'MEMPROSES...' : 'BAYAR SEKARANG'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* High-End Boarding Pass Modal */}
      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 bg-navy-900/90 backdrop-blur-[60px] z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotateX: 10 }} 
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotateX: -10 }}
              className="w-full max-w-xl"
            >
                <div className="flex justify-end mb-8">
                   <button onClick={() => setViewingTicket(null)} className="glass-button p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"><X className="w-6 h-6 text-white" /></button>
                </div>
                
                <div ref={ticketRef} className="bg-white border border-navy-100 rounded-[3rem] overflow-hidden shadow-5xl relative">
                    {/* Decorative Side Punch */}
                    <div className="absolute top-1/2 -left-4 w-10 h-10 bg-navy-950 rounded-full border border-navy-100 -translate-y-1/2 z-10" />
                    <div className="absolute top-1/2 -right-4 w-10 h-10 bg-navy-950 rounded-full border border-navy-100 -translate-y-1/2 z-10" />
                    
                    <div className="bg-ship-blue p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10"><Anchor className="w-64 h-64" /></div>
                        <div className="relative z-10">
                            <h2 className="text-5xl font-display font-black italic tracking-tighter uppercase leading-none">BOARDING PASS</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-3 opacity-60 italic">MENTAWAI FAST • PRIORITAS GLOBAL</p>
                        </div>
                    </div>

                    <div className="p-12 space-y-12 bg-white">
                        <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-navy-100 border-dashed border-2">
                             <div className="text-center">
                                <h3 className="text-4xl font-display font-black text-navy-900 italic leading-none">{getRouteDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).origin.substring(0,3)}</h3>
                                <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest italic mt-2 inline-block leading-none text-left">{getRouteDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).origin}</span>
                             </div>
                             <div className="flex-1 flex flex-col items-center px-6">
                                <div className="w-full h-px border-b border-navy-200 relative">
                                    <Ship className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-ship-blue bg-white px-2" />
                                </div>
                             </div>
                             <div className="text-center">
                                <h3 className="text-4xl font-display font-black text-navy-900 italic leading-none">{getRouteDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).destination.substring(0,3)}</h3>
                                <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest italic mt-2 inline-block leading-none text-left">{getRouteDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).destination}</span>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-12 gap-x-12">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">Identitas Manifest</label>
                                <p className="text-lg font-black text-navy-900 tracking-tight leading-tight text-left">{toTitleCase(viewingTicket.passengerName)}</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">Nama Kapal</label>
                                <p className="text-lg font-black text-ship-blue tracking-tight leading-tight uppercase">{getShipDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.shipId).name}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">Waktu Berangkat</label>
                                <p className="text-md font-black text-navy-900 tracking-tight leading-tight uppercase">
                                    {format(new Date(schedules.find(s => s.id === viewingTicket.scheduleId)?.departureTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: id })}
                                </p>
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">Status Operasional</label>
                                <p className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  schedules.find(s => s.id === viewingTicket.scheduleId)?.status === 'delayed' ? "text-amber-500" : "text-emerald-500"
                                )}>
                                    {schedules.find(s => s.id === viewingTicket.scheduleId)?.status === 'delayed' ? 'DELAY / TERTUNDA' : 'AKTIF / NORMAL'}
                                </p>
                            </div>
                            {schedules.find(s => s.id === viewingTicket.scheduleId)?.status === 'delayed' && schedules.find(s => s.id === viewingTicket.scheduleId)?.estimatedActiveTime && (
                              <div className="col-span-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                  <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Estimasi Baru Beroperasi</p>
                                  <p className="text-sm font-black text-amber-700">
                                      {format(new Date(schedules.find(s => s.id === viewingTicket.scheduleId)?.estimatedActiveTime), 'dd MMM yyyy • HH:mm')}
                                  </p>
                              </div>
                            )}
                            <div className="col-span-2 py-8 bg-navy-50/50 rounded-[2.5rem] border border-navy-100/50 flex flex-col items-center justify-center">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none mb-3">Nomor Kursi</label>
                                <p className="text-5xl font-display font-black text-ship-blue tracking-tighter leading-none uppercase italic">{viewingTicket.seatNumber}</p>
                            </div>
                        </div>

                        <div className="pt-12 border-t border-navy-100 border-dashed border-2 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="bg-white p-3 rounded-2xl shadow-xl border border-navy-50">
                                    <QRCodeCanvas value={viewingTicket.id} size={80} level="H" />
                                </div>
                                <div className="space-y-2">
                                    <div className="badge-status bg-emerald-50 text-emerald-600 border-emerald-200 uppercase text-[8px] italic">Terverifikasi & Aktif</div>
                                    <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest italic font-mono uppercase">TOKEN: {viewingTicket.id.substring(0,12).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="flex gap-4" data-html2canvas-ignore="true">
                                <button onClick={downloadTicketPDF} disabled={isGeneratingPDF} className="glass-button p-6 rounded-[2rem] bg-white text-navy-400 hover:text-ship-blue transition-all group">
                                    <Download className={cn("w-7 h-7 group-hover:-translate-y-1 transition-transform", isGeneratingPDF && "animate-bounce")} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Selector Overlay */}
      <AnimatePresence>
        {payingBooking && (
            <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-3xl z-[150] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bento-card max-w-lg w-full !p-0 overflow-hidden border-navy-100 shadow-5xl bg-white">
                    <div className="bg-ship-blue p-12 text-white relative flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-display font-black tracking-tighter uppercase leading-none mb-3 text-white">AGEN PEMBAYARAN</h2>
                            <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.3em] font-display">TOTAL TAGIHAN: Rp {payingBooking.totalPrice.toLocaleString()}</p>
                        </div>
                        {payingBooking.expiresAt && (
                            <div className="flex flex-col items-end gap-2 px-6 py-4 bg-navy-900/50 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-300 italic leading-none">Batas Waktu</span>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
                                    <span className="text-3xl font-display font-black text-rose-400 italic tracking-tighter leading-none">
                                        {Math.max(0, Math.floor((new Date(payingBooking.expiresAt).getTime() - Date.now()) / 1000 / 60))}:
                                        {Math.max(0, Math.floor((new Date(payingBooking.expiresAt).getTime() - Date.now()) / 1000 % 60)).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-12 space-y-10">
                        <div className="bg-white p-8 rounded-[2rem] border border-navy-100 space-y-4 shadow-inner">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">Bank Tujuan</p>
                                    <p className="font-black text-navy-900 text-lg tracking-tight leading-none uppercase">{bankSettings.bankName}</p>
                                </div>
                                <div className="w-12 h-12 bg-white border border-navy-100 flex items-center justify-center rounded-xl p-2 font-black text-ship-blue text-xs shadow-sm">{bankSettings.bankName[0]}</div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1 italic leading-none">Nomor Rekening</p>
                                <p className="text-3xl font-display font-black text-ship-blue italic tracking-widest">{bankSettings.accountNumber}</p>
                                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 italic shadow-sm">A/N {bankSettings.accountHolder}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'bank', label: 'TRANSFER BANK', icon: CardIcon, desc: 'Verifikasi manual admin' },
                                { id: 'gopay', label: 'GOPAY / QRIS', icon: Smartphone, desc: 'Sinkronisasi instan' },
                                { id: 'ovo', label: 'OVO WALLET', icon: Wallet, desc: 'Integrasi dompet digital' }
                            ].map(method => (
                                <button 
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "w-full p-6 rounded-[2rem] border transition-all text-left flex items-center gap-6 group",
                                        paymentMethod === method.id ? "bg-ship-blue border-ship-blue text-white shadow-5xl scale-[1.02]" : "bg-white border-navy-100 text-navy-900 hover:bg-navy-100"
                                    )}
                                >
                                    <div className={cn("p-4 rounded-2xl transition-colors", paymentMethod === method.id ? "bg-white text-ship-blue" : "bg-white border border-navy-100 text-navy-400 group-hover:text-ship-blue")}>
                                        <method.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm tracking-widest uppercase">{method.label}</div>
                                        <div className={cn("text-[9px] font-black uppercase tracking-widest mt-1 opacity-50", paymentMethod === method.id ? "text-white" : "text-navy-400 group-hover:text-navy-600")}>{method.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setPayingBooking(null)} className="glass-button flex-1 py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] text-navy-400 hover:bg-white transition-all font-display">Batal</button>
                            <button 
                                onClick={() => simulatePayment(payingBooking.id, payingBooking.totalPrice, paymentMethod)} 
                                disabled={isPaying || (payingBooking.expiresAt && new Date(payingBooking.expiresAt).getTime() < Date.now())} 
                                className="flex-1 bg-ship-blue hover:bg-navy-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-5xl transition-all disabled:opacity-50"
                            >
                                {isPaying ? 'PROSES...' : (payingBooking.expiresAt && new Date(payingBooking.expiresAt).getTime() < Date.now()) ? 'KEDALUWARSA' : 'KONFIRMASI'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <ReviewModal isOpen={!!reviewingBooking} onClose={() => setReviewingBooking(null)} shipId={reviewingBooking?.shipId || ''} shipName={reviewingBooking?.shipName || ''} bookingId={reviewingBooking?.id || ''} />

      <AnimatePresence>
        {selectedShipForReviews && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-3xl z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bento-card max-w-2xl w-full border-navy-100 bg-white">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-3xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none">ULASAN KAPAL</h2>
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mt-3">{selectedShipForReviews.name} Performance Registry</p>
                </div>
                <button onClick={() => setSelectedShipForReviews(null)} className="glass-button p-4 rounded-full text-navy-400 hover:text-ship-blue bg-white hover:bg-navy-100">
                  <Plus className="w-8 h-8 rotate-45" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-4 -mx-4 custom-scrollbar">
                <ShipReviews reviews={reviews.filter(r => r.shipId === selectedShipForReviews.id)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {statusModal.show && (
          <div className="fixed inset-0 bg-navy-900/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl border border-navy-100 w-full max-w-sm overflow-hidden shadow-6xl"
            >
              <div className={cn(
                "p-8 text-center",
                statusModal.type === 'error' ? "bg-rose-50" : statusModal.type === 'success' ? "bg-emerald-50" : "bg-ship-blue/5"
              )}>
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg",
                  statusModal.type === 'error' ? "bg-rose-500 text-white" : statusModal.type === 'success' ? "bg-emerald-500 text-white" : "bg-ship-blue text-white"
                )}>
                  {statusModal.type === 'error' ? <AlertCircle className="w-8 h-8" /> : statusModal.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none mb-3 italic">{statusModal.title}</h3>
                <p className="text-[11px] font-bold text-navy-500 leading-relaxed uppercase tracking-tight">{statusModal.message}</p>
              </div>
              <div className="p-4">
                <button 
                  onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                  className="w-full bg-navy-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-ship-blue transition-all leading-none"
                >
                  MENGERTI
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
