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
import { id, enUS } from 'date-fns/locale';
import { cn, toTitleCase } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { ReviewModal } from './ReviewModal';
import { ShipReviews } from './ShipReviews';
import { NotificationCenter } from './NotificationCenter';
import { BusinessPlanReport } from './BusinessPlanReport';

import { Language, translations } from '../lib/translations';

// @ts-ignore
import slide1 from '../assets/images/mentawai_fast_1_1779263670466.png';
// @ts-ignore
import slide2 from '../assets/images/mentawai_fast_2_1779263686402.png';
// @ts-ignore
import slide3 from '../assets/images/mentawai_fast_3_1779263704224.png';
// @ts-ignore
import slide4 from '../assets/images/mentawai_fast_4_1779263721871.png';
// @ts-ignore
import slide5 from '../assets/images/mentawai_fast_5_1779265532488.png';
// @ts-ignore
import slide6 from '../assets/images/mentawai_fast_6_1779265550166.png';
// @ts-ignore
import slide7 from '../assets/images/mentawai_fast_7_1779265568768.png';
// @ts-ignore
import slide8 from '../assets/images/mentawai_fast_8_1779265587664.png';
// @ts-ignore
import slide9 from '../assets/images/mentawai_fast_9_1779265604137.png';
// @ts-ignore
import slide10 from '../assets/images/mentawai_fast_10_1779265624749.png';
// @ts-ignore
import slide11 from '../assets/images/mentawai_fast_11_1779265643408.png';
// @ts-ignore
import slide12 from '../assets/images/mentawai_fast_12_1779265660172.png';
// @ts-ignore
import slide13 from '../assets/images/mentawai_fast_13_1779265677772.png';
// @ts-ignore
import slide14 from '../assets/images/mentawai_fast_14_1779265697141.png';

const slides = [
  {
    image: slide1,
    id: {
      title: 'KONEKTIVITAS TERBAIK',
      subtitle: 'Padang ke Mentawai Lebih Cepat',
      desc: 'Menghubungkan Padang dan Kepulauan Mentawai dengan kecepatan dan kenyamanan tinggi melalui armada ferry modern berkecepatan tinggi.'
    },
    en: {
      title: 'PREMIER CONNECTIVITY',
      subtitle: 'Padang to Mentawai is Faster',
      desc: 'Connecting Padang mainland directly with Mentawai islands using high-speed modern catamaran vessels.'
    }
  },
  {
    image: slide2,
    id: {
      title: 'KEINDAHAN SAMUDERA',
      subtitle: 'Jelajahi Surga Tropis Dunia',
      desc: 'Jelajahi keindahan alam Kepulauan Mentawai bersama layanan prioritas terverifikasi kami untuk petualangan selancar legendaris.'
    },
    en: {
      title: 'OCEANIC SPLENDOR',
      subtitle: 'Explore the World’s Tropical Paradise',
      desc: 'Navigate the clean pristine waters of Mentawai Islands with our certified priority service for legendary wave trips.'
    }
  },
  {
    image: slide3,
    id: {
      title: 'PROSEDUR PRIORITAS',
      subtitle: 'Keamanan & Kenyamanan Utama',
      desc: 'Armada tangguh dirancang khusus dengan sistem navigasi termutakhir untuk menjamin keselamatan dan kepuasan perjalanan Anda.'
    },
    en: {
      title: 'PRIORITY COMPLIANCE',
      subtitle: 'Safety & Comfort First',
      desc: 'Robust vessels designed specifically with advanced navigation tools to guarantee complete safety and satisfying transit.'
    }
  },
  {
    image: slide4,
    id: {
      title: 'TROPIS MEWAH',
      subtitle: 'Surga Selancar & Liburan Dunia',
      desc: 'Perjalanan cepat yang nyaman menuju ombak kelas dunia, bibir pantai pasir putih bersih, dan resor eksotis di Mentawai.'
    },
    en: {
      title: 'LUXURY TROPICAL ESCAPE',
      subtitle: 'World-Class Surfing Haven',
      desc: 'Direct rapid transit towards legendary world-class surf breaks, pristine white sands, and exotic sea resorts.'
    }
  },
  {
    image: slide5,
    id: {
      title: 'KABIN PREMIUM LUAS',
      subtitle: 'Terbaik Dalam Kenyamanan Perjalanan',
      desc: 'Nikmati fasilitas kursi empuk ergonomis dan pemandangan samudera memesona di dalam kabin rute Padang - Mentawai.'
    },
    en: {
      title: 'SPACIOUS PREMIUM CABIN',
      subtitle: 'Ultimate Passenger Transit Comfort',
      desc: 'Unwind with premium ergonomic leather chairs and stellar landscape windows during your sea voyage.'
    }
  },
  {
    image: slide6,
    id: {
      title: 'DERMAGA PELABUHAN UTAMA',
      subtitle: 'Proses Boarding Cepat & Teratur',
      desc: 'Petugas ramah siap membantu memuat peralatan selancar dan barang bawaan Anda langsung dari dermaga port.'
    },
    en: {
      title: 'EXPEDITED DIRECT BOARDING',
      subtitle: 'Streamlined Pier Departure Protocols',
      desc: 'Friendly personnel helping secure surfboard bags and premium luggage directly at the harbor quay.'
    }
  },
  {
    image: slide7,
    id: {
      title: 'PELAYANAN ANTAR PULAU',
      subtitle: 'Jelajahi Gugusan Pulau Eksotis',
      desc: 'Akses tercepat menuju Siberut, Tua Pejat, Sikakap, dan pulau-pulau legendaris tak terjamah di Kepulauan Mentawai.'
    },
    en: {
      title: 'ARCHIPELAGO ISLAND TRANSIT',
      subtitle: 'Explore Untouched Tropical Jewels',
      desc: 'Rapid sailing directly connecting West Sumatra mainland to Siberut, Tua Pejat, Sikakap, and paradise reefs.'
    }
  },
  {
    image: slide8,
    id: {
      title: 'FASILITAS INTERIOR MODERN',
      subtitle: 'Kebersihan & Sanitasi Terjamin',
      desc: 'Ruang berpendingin udara (AC) yang sejuk, bersih, dan higienis untuk menyegarkan suasana perjalanan laut Anda.'
    },
    en: {
      title: 'MODERN SHIPSIDE INTERIORS',
      subtitle: 'Cleanliness & Sanitized Cabins',
      desc: 'Fully air-conditioned, sanitized, and crisp passenger saloons ensuring complete freshness all the way.'
    }
  },
  {
    image: slide9,
    id: {
      title: 'PELAYARAN SENJA ESTETIK',
      subtitle: 'Harmoni Keindahan Cakrawala Senja',
      desc: 'Saksikan pemandangan matahari terbenam emas yang magis langsung dari atas kapal ferry tercepat di dunia.'
    },
    en: {
      title: 'GOLDEN HOUR SAILING VIBE',
      subtitle: 'Witness Enchanting Sunset Horizons',
      desc: 'Enjoy majestic and warm ocean sunset views directly from the top-deck vantage viewpoints.'
    }
  },
  {
    image: slide10,
    id: {
      title: 'AKSES OMBAK DUNIA',
      subtitle: 'Gerbang Utama Menuju Surga Surfing',
      desc: 'Rencanakan liburan surfing impian Anda ke ombak legendaris Lances Left, Telescopes, dan Macaronis dengan mudah.'
    },
    en: {
      title: 'EPIC WAVE ACCESS PORTAL',
      subtitle: 'Gateway to World-Class Surf Breaks',
      desc: 'Plan dream surf trips to world-famous breaks including Telescopes, Lances Right, and Macaronis.'
    }
  },
  {
    image: slide11,
    id: {
      title: 'NAVIGASI TERMUTAKHIR',
      subtitle: 'Sistem Keselamatan Laut Kelas Dunia',
      desc: 'Dilengkapi radar canggih dan kru profesional bersertifikat penuh yang menjamin keamanan maksimum.'
    },
    en: {
      title: 'ADVANCED SEA NAVIGATION',
      subtitle: 'State-of-the-Art Safekeeping Systems',
      desc: 'Equipped with highly advanced marine radars and fully certified marine officers on duty.'
    }
  },
  {
    image: slide12,
    id: {
      title: 'KECEPATAN KATAMARAN TINGGI',
      subtitle: 'Waktu Tempuh Jauh Lebih Singkat',
      desc: 'Teknologi lambung ganda menstabilkan pergerakan untuk meminimalkan mabuk laut dalam pelayaran cepat Anda.'
    },
    en: {
      title: 'HIGH SPEED CATAMARAN ENGINEERING',
      subtitle: 'Super Fast Sailing On Double Hulls',
      desc: 'Optimized dual-hull structure reducing rolling motion to eliminate motion sickness during rapid transits.'
    }
  },
  {
    image: slide13,
    id: {
      title: 'SAMBUTAN HANGAT MENTAWAI',
      subtitle: 'Petualangan Terbaik Dimulai Di Sini',
      desc: 'Rasakan keramahan penduduk lokal dan kebudayaan Mentawai yang kaya, eksotis, dan penuh pesona.'
    },
    en: {
      title: 'WARM MENTAWAI WELCOME',
      subtitle: 'Epic Coastal Adventures Begin Here',
      desc: 'Experience unparalleled hospitality, white sand shores, and the rich cultural heritage of Mentawai.'
    }
  },
  {
    image: slide14,
    id: {
      title: 'KETANGGUHAN CUACA LAUT',
      subtitle: 'Andal Di Setiap Operasional Perjalanan',
      desc: 'Mesin berperforma tinggi yang dirancang tangguh menghadapi gelombang Samudera Hindia di segala musim.'
    },
    en: {
      title: 'MASTERY OVER HEAVY SEAS',
      subtitle: 'Committed & Resilient Ocean Crossings',
      desc: 'High-performance propulsion engines designed to cruise robustly through Indian Ocean waves.'
    }
  }
];

interface UserViewProps {
  key?: string;
  activeTab: 'search' | 'my-tickets' | 'business-plan';
  setActiveTab: (tab: 'search' | 'my-tickets' | 'business-plan') => void;
  language: Language;
}

export function UserView({ activeTab, setActiveTab, language }: UserViewProps) {
  const t = translations[language];
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
    accountHolder: 'Mentawai Fast Owner',
    ewalletName: 'DANA / OVO / QRIS',
    ewalletNumber: '0812-3456-7890',
    ewalletHolder: 'Mentawai Fast Owner'
  });
  const ticketRef = useRef<HTMLDivElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 5 seconds randomly
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => {
        let nextIndex = prev;
        while (nextIndex === prev && slides.length > 1) {
          nextIndex = Math.floor(Math.random() * slides.length);
        }
        return nextIndex;
      });
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

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

    // Check if passengers entered information
    const invalidPassenger = passengers.some(p => !p.name.trim() || !p.id.trim());
    if (invalidPassenger) {
      setStatusModal({
        show: true,
        title: language === 'id' ? 'Data Tidak Lengkap' : 'Incomplete Data',
        message: language === 'id' ? 'Silakan isi Nama Lengkap dan NIK untuk semua penumpang.' : 'Please enter Full Name and ID for all passengers.',
        type: 'error'
      });
      return;
    }

    setBookingLoading(true);
    try {
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

      // Fetch all bookings for this schedule, including other users', to prevent seat number collisions
      const seatSnap = await getDocs(query(
        collection(db, 'bookings'),
        where('scheduleId', '==', selectedSchedule.id)
      ));
      const activeBookings = seatSnap.docs
        .map(d => d.data())
        .filter(b => b.status !== 'cancelled');

      const ship = getShipDetails(selectedSchedule.shipId);
      const capacity = selectedSchedule.capacity || ship?.capacity || 280;
      const totalNew = passengers.length;

      // Realtime remaining seat checker
      if (activeBookings.length + totalNew > capacity) {
        const remaining = Math.max(0, capacity - activeBookings.length);
        setStatusModal({
          show: true,
          title: language === 'id' ? 'Kursi Penuh / Terbatas' : 'Seats Limit',
          message: language === 'id' 
            ? `Maaf, sisa kursi hanya ${remaining} slot, namun Anda mendaftarkan ${totalNew} penumpang.`
            : `Sorry, only ${remaining} seats left, but you are trying to register ${totalNew} passengers.`,
          type: 'error'
        });
        setBookingLoading(false);
        return;
      }

      // Track occupied seat numbers
      const occupiedSeatNumbers = new Set<number>();
      activeBookings.forEach(b => {
        const seatVal = b.seatNumber;
        if (!seatVal) return;
        const matches = seatVal.match(/\d+/);
        if (matches) {
          occupiedSeatNumbers.add(parseInt(matches[0], 10));
        }
      });

      let assignedSeats: number[] = [];

      // 1. Try to find a consecutive block of empty seats for totalNew passengers
      if (totalNew > 1) {
        for (let s = 1; s <= capacity - totalNew + 1; s++) {
          let isConsecutiveEmpty = true;
          for (let offset = 0; offset < totalNew; offset++) {
            if (occupiedSeatNumbers.has(s + offset)) {
              isConsecutiveEmpty = false;
              break;
            }
          }
          if (isConsecutiveEmpty) {
            for (let offset = 0; offset < totalNew; offset++) {
              assignedSeats.push(s + offset);
            }
            break;
          }
        }
      }

      // 2. Fallback (or if totalNew === 1): find the first available individual empty seats
      if (assignedSeats.length === 0) {
        for (let s = 1; s <= capacity; s++) {
          if (!occupiedSeatNumbers.has(s)) {
            assignedSeats.push(s);
            if (assignedSeats.length === totalNew) {
              break;
            }
          }
        }
      }

      // 3. Safety fallback: unique index filling up to capacity ceiling
      let safetySeat = 1;
      while (assignedSeats.length < totalNew && safetySeat <= capacity) {
        if (!assignedSeats.includes(safetySeat) && !occupiedSeatNumbers.has(safetySeat)) {
          assignedSeats.push(safetySeat);
        }
        safetySeat++;
      }

      // Safeguard check
      if (assignedSeats.length < totalNew) {
        setStatusModal({
          show: true,
          title: language === 'id' ? 'Gagal Alokasi Kursi' : 'Seat Allocation Failed',
          message: language === 'id' ? 'Tidak dapat menemukan nomor kursi yang kosong di kapal.' : 'Cannot find available seat numbers on this vessel.',
          type: 'error'
        });
        setBookingLoading(false);
        return;
      }

      const bookingPromises = passengers.map((passenger, idx) => {
        const seatNumStr = `Kursi ${assignedSeats[idx]}`;
        const emailVal = passenger.email.trim() || `${auth.currentUser?.email || 'user'}@mentawaifast.com`;
        const phoneVal = passenger.phone.trim() || '-';

        return addDoc(collection(db, 'bookings'), {
          scheduleId: selectedSchedule.id,
          userId: auth.currentUser!.uid,
          passengerName: toTitleCase(passenger.name.trim()),
          passengerId: passenger.id.trim(),
          passengerEmail: emailVal,
          passengerPhone: phoneVal,
          seatNumber: seatNumStr,
          totalPrice: Number(selectedSchedule.price) || 0,
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

      {/* Hero Welcome & Scenic Slideshow */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-950 text-white min-h-[360px] md:min-h-[420px] flex flex-col justify-between border border-slate-800 shadow-2xl group w-full">
        {/* Carousel Background Images */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.9, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={slides[currentSlide].image} 
                alt="Mentawai Fast Slideshow" 
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>
          {/* Soft Elegant Dark Gradients on top of image to protect text contrast without heavy dimming */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/25 to-transparent/5" />
        </div>

        {/* Absolute Pagination indicator container at the top center inside the slide */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 max-w-[90%] select-none">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="group flex items-center cursor-pointer focus:outline-none"
            >
              <div className="relative w-3.5 h-1 md:w-5 rounded-full bg-white/20 overflow-hidden transition-all duration-300">
                <div 
                  className={cn(
                    "absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all",
                    currentSlide === idx ? "w-full" : "w-0 group-hover:w-1/2"
                  )}
                  style={{ transitionDuration: currentSlide === idx ? '5000ms' : '300ms' }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-between h-full flex-grow gap-8">
          {/* Top Header Row inside Hero */}
          <div className="flex justify-between items-start w-full">
            <div>
              <span className="badge-status bg-white/10 text-white border-white/20 mb-3 inline-block uppercase text-[9px] tracking-widest backdrop-blur-md animate-pulse">
                {language === 'id' ? 'Akses Terverifikasi' : 'Verified Access'}
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter leading-none text-white drop-shadow-md uppercase text-left">
                {language === 'id' ? 'HALO,' : 'HELLO,'} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 font-extrabold">
                  {auth.currentUser?.displayName?.split(' ')[0].toUpperCase()}
                </span>
              </h1>
              <p className="text-white/60 text-[8px] md:text-[10px] font-mono tracking-[0.3em] font-bold mt-2 uppercase text-left">
                {language === 'id' ? 'Terminal Penumpang Digital Mentawai Fast' : 'Mentawai Fast Passenger Portal'}
              </p>
            </div>
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="group relative backdrop-blur-md p-4 rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition-all active:scale-95"
            >
              <Bell className="w-5 h-5 text-white/70 group-hover:text-cyan-400 group-hover:rotate-12 transition-all" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-5 right-5 w-5 h-5 bg-cyan-400 text-slate-950 text-[10px] font-black flex items-center justify-center rounded-full ring-4 ring-slate-950 animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>

          {/* Bottom Caption Slide content */}
          <div className="mt-auto pt-4 text-left">
            {/* Slide title and text */}
            <div className="max-w-3xl space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em] block mb-1 text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                    {slides[currentSlide][language as 'id' | 'en']?.title || slides[currentSlide]['en'].title}
                  </span>
                  <h3 className="text-lg md:text-2xl font-display font-black tracking-tight text-white uppercase italic text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                    {slides[currentSlide][language as 'id' | 'en']?.subtitle || slides[currentSlide]['en'].subtitle}
                  </h3>
                  <p className="text-xs md:text-sm text-white/95 max-w-2xl mt-1 leading-relaxed text-left font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                    {slides[currentSlide][language as 'id' | 'en']?.desc || slides[currentSlide]['en'].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
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
                const isDelayedStatus = schedule.status === 'delayed';
                const delayEnd = schedule.estimatedActiveTime ? parseISO(schedule.estimatedActiveTime) : null;
                const isDelayed = isDelayedStatus && delayEnd && isBefore(new Date(), delayEnd);
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
                    onClick={() => {
                      if (!isSoldOut) {
                        setSelectedSchedule(schedule);
                      }
                    }}
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
                            <span className="badge-status bg-rose-50 text-rose-600 border-rose-200 uppercase font-black text-[8px] animate-pulse">{language === 'id' ? 'TIKET HABIS' : 'SOLD OUT'}</span>
                          ) : isDelayed ? (
                            <span className="badge-status bg-amber-50 text-amber-600 border-amber-200 uppercase font-black text-[8px] animate-pulse">{language === 'id' ? 'TERTUNDA' : 'DELAYED'}</span>
                          ) : (
                            <span className="badge-status bg-emerald-50 text-emerald-600 border-emerald-200 uppercase font-black text-[8px]">{remainingSeats} {language === 'id' ? 'Tersisa' : 'Left'}</span>
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

                        {isDelayed && schedule.estimatedActiveTime && (
                          <div className="bg-amber-100/50 p-3 rounded-2xl border border-amber-200 space-y-1.5 text-center">
                            <p className="text-[8px] font-black uppercase text-amber-600 tracking-widest leading-none">
                              {language === 'id' ? 'Estimasi Keberangkatan Baru' : 'New Estimated Departure'}
                            </p>
                            <p className="text-xs font-black text-amber-900 leading-tight">
                              {format(parseISO(schedule.estimatedActiveTime), "EEEE, dd MMMM yyyy • HH:mm", { locale: language === 'id' ? id : enUS })}
                            </p>
                            {delayTimer && (
                              <div className="flex justify-center items-center gap-1.5 text-amber-700 font-mono text-[10px] font-black pt-1 border-t border-amber-200/50">
                                <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest mr-1">
                                  {language === 'id' ? 'TUNDA SISA:' : 'DELAY LEFT:'}
                                </span>
                                {delayTimer.days > 0 && <span>{delayTimer.days}d </span>}
                                <span>{String(delayTimer.hours).padStart(2, '0')}:</span>
                                <span>{String(delayTimer.minutes).padStart(2, '0')}:</span>
                                <span>{String(delayTimer.seconds).padStart(2, '0')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {schedule.segments && schedule.segments.length > 1 ? (
                          <div className="space-y-3 bg-navy-50/20 p-3 rounded-2xl border border-navy-100 select-none">
                            <span className="text-[7.5px] font-black tracking-widest text-[#001D4A] uppercase block">
                              📌 {language === 'id' ? 'KAPAL TRANSIT (MULTI-STOP)' : 'TRANSIT SHIP (MULTI-STOP)'}
                            </span>
                            <div className="relative flex justify-between items-center px-1">
                              {/* Background connection line */}
                              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 border-t border-dashed border-navy-200" />
                              
                              {(() => {
                                const stopsList: string[] = [];
                                const firstRoute = getRouteDetails(schedule.segments[0].routeId);
                                if (firstRoute) stopsList.push(firstRoute.origin);
                                schedule.segments.forEach((seg: any) => {
                                  const rDet = getRouteDetails(seg.routeId);
                                  if (rDet && !stopsList.includes(rDet.destination)) {
                                    stopsList.push(rDet.destination);
                                  }
                                });
                                return stopsList.map((stopName, sIdx) => (
                                  <div key={sIdx} className="flex flex-col items-center z-10 bg-white px-1.5 py-1 rounded-lg border border-navy-100 shadow-sm">
                                    <span className="text-[9px] font-black text-navy-900 tracking-wider">
                                      {stopName.substring(0, 3).toUpperCase()}
                                    </span>
                                    {sIdx === 0 ? (
                                      <span className="text-[6.5px] font-mono font-bold text-emerald-600">
                                        {format(parseISO(schedule.departureTime), "HH:mm")}
                                      </span>
                                    ) : sIdx === stopsList.length - 1 ? (
                                      <span className="text-[6.5px] font-mono font-bold text-rose-600">
                                        {schedule.arrivalTime ? format(parseISO(schedule.arrivalTime), "HH:mm") : '-'}
                                      </span>
                                    ) : (
                                      <span className="text-[6.5px] font-mono font-bold text-amber-600">
                                        {format(parseISO(schedule.segments[sIdx - 1]?.arrivalTime), "HH:mm")}
                                      </span>
                                    )}
                                  </div>
                                ));
                              })()}
                            </div>
                            <div className="flex flex-col gap-1 pt-1 border-t border-navy-50">
                              {schedule.segments.map((seg: any, sIdx: number) => {
                                const rDet = getRouteDetails(seg.routeId);
                                return (
                                  <div key={seg.id || sIdx} className="flex justify-between text-[7.5px] font-mono text-navy-400 font-bold uppercase tracking-wider">
                                    <span>#{sIdx + 1}: {rDet.origin} → {rDet.destination}</span>
                                    <span>{format(parseISO(seg.departureTime), "HH:mm")} - {format(parseISO(seg.arrivalTime), "HH:mm")}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[10px] font-black text-navy-900 tracking-widest uppercase bg-white p-3 rounded-xl border border-navy-100 font-display">
                              <span>{route.origin.substring(0,3)}</span>
                              <div className="flex-1 mx-3 h-px border-b border-dashed border-navy-200 relative">
                                  <ChevronRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-ship-blue opacity-20" />
                              </div>
                              <span>{route.destination.substring(0,3)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-navy-50">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Berangkat' : 'Departure'}</span>
                                    <span className="text-base font-mono font-black text-navy-900 leading-none">{format(parseISO(schedule.departureTime), "HH:mm")}</span>
                                </div>
                                <div className="h-6 w-px bg-navy-100" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Tiba' : 'Arrival'}</span>
                                    <span className="text-base font-mono font-black text-navy-900 leading-none">
                                        {schedule.arrivalTime ? format(parseISO(schedule.arrivalTime), "HH:mm") : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Harga' : 'Price'}</span>
                                <span className="text-base font-display font-black text-ship-blue leading-none">Rp {schedule.price.toLocaleString()}</span>
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
        ) : activeTab === 'business-plan' ? (
          <motion.div key="business-plan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            <BusinessPlanReport language={language} />
          </motion.div>
        ) : (
          <motion.div key="tickets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {bookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((booking) => {
                const schedule = schedules.find(s => s.id === booking.scheduleId) || {};
                const route = getRouteDetails(booking.routeId || schedule.routeId || '');
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
                                            <Search className="w-3.5 h-3.5" /> {language === 'id' ? 'Tiket' : 'Ticket'}
                                        </button>
                                    ) : isCancelled ? (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[8px] font-black uppercase text-rose-500 tracking-widest">
                                            <X className="w-3.5 h-3.5" /> {language === 'id' ? 'Kedaluwarsa' : 'Expired'}
                                        </div>
                                    ) : (
                                        <button onClick={() => setPayingBooking(booking)} className="bg-ship-blue hover:bg-navy-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105">
                                            <CreditCard className="w-3.5 h-3.5" /> {language === 'id' ? 'Bayar' : 'Pay'}
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
                                        <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] mb-2 text-center">Total</p>
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
                            <h2 className="text-5xl font-display font-black italic tracking-tighter uppercase leading-none">{language === 'id' ? 'BOARDING PASS' : 'BOARDING PASS'}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-3 opacity-60 italic">{language === 'id' ? 'MENTAWAI FAST • PRIORITAS GLOBAL' : 'MENTAWAI FAST • GLOBAL PRIORITY'}</p>
                        </div>
                    </div>

                    <div className="p-12 space-y-12 bg-white">
                        <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-navy-100 border-dashed border-2">
                             <div className="text-center">
                                <h3 className="text-4xl font-display font-black text-navy-900 italic leading-none">{getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).origin.substring(0,3)}</h3>
                                <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest italic mt-2 inline-block leading-none text-left">{getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).origin}</span>
                             </div>
                             <div className="flex-1 flex flex-col items-center px-6">
                                <div className="w-full h-px border-b border-navy-200 relative">
                                    <Ship className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-ship-blue bg-white px-2" />
                                </div>
                             </div>
                             <div className="text-center">
                                <h3 className="text-4xl font-display font-black text-navy-900 italic leading-none">{getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).destination.substring(0,3)}</h3>
                                <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest italic mt-2 inline-block leading-none text-left">{getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId).destination}</span>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-12 gap-x-12">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Identitas Manifest' : 'Manifest Identity'}</label>
                                <p className="text-lg font-black text-navy-900 tracking-tight leading-tight text-left">{toTitleCase(viewingTicket.passengerName)}</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Nama Kapal' : 'Ship Name'}</label>
                                <p className="text-lg font-black text-ship-blue tracking-tight leading-tight uppercase">{getShipDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.shipId).name}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Waktu Berangkat' : 'Departure Time'}</label>
                                <p className="text-md font-black text-navy-900 tracking-tight leading-tight uppercase">
                                    {format(new Date(viewingTicket.departureTime || schedules.find(s => s.id === viewingTicket.scheduleId)?.departureTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS })}
                                </p>
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Waktu Tiba' : 'Arrival Time'}</label>
                                <p className="text-md font-black text-navy-900 tracking-tight leading-tight uppercase">
                                    {(viewingTicket.arrivalTime || schedules.find(s => s.id === viewingTicket.scheduleId)?.arrivalTime) ? format(new Date(viewingTicket.arrivalTime || schedules.find(s => s.id === viewingTicket.scheduleId)?.arrivalTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS }) : '-'}
                                </p>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Status Operasional' : 'Operational Status'}</label>
                                <p className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  (() => {
                                    const sched = schedules.find(s => s.id === viewingTicket.scheduleId);
                                    const isDelayActive = sched?.status === 'delayed' && sched.estimatedActiveTime && isBefore(new Date(), parseISO(sched.estimatedActiveTime));
                                    return isDelayActive;
                                  })() ? "text-amber-500" : "text-emerald-500"
                                )}>
                                    {(() => {
                                      const sched = schedules.find(s => s.id === viewingTicket.scheduleId);
                                      const isDelayActive = sched?.status === 'delayed' && sched.estimatedActiveTime && isBefore(new Date(), parseISO(sched.estimatedActiveTime));
                                      return isDelayActive ? (language === 'id' ? 'DELAY / TERTUNDA' : 'DELAYED') : (language === 'id' ? 'AKTIF / NORMAL' : 'ACTIVE / NORMAL');
                                    })()}
                                </p>
                            </div>
                            {(() => {
                              const sched = schedules.find(s => s.id === viewingTicket.scheduleId);
                              const isDelayActive = sched?.status === 'delayed' && sched.estimatedActiveTime && isBefore(new Date(), parseISO(sched.estimatedActiveTime));
                              return isDelayActive && sched?.estimatedActiveTime && (
                                <div className="col-span-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Estimasi Baru Beroperasi</p>
                                    <p className="text-sm font-black text-amber-700">
                                        {format(new Date(sched.estimatedActiveTime), 'EEEE, dd MMMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS })}
                                    </p>
                                </div>
                              );
                            })()}
                             <div className="col-span-2 py-8 bg-navy-50/50 rounded-[2.5rem] border border-navy-100/50 flex flex-col items-center justify-center">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none mb-3">{language === 'id' ? 'Nomor Kursi' : 'Seat Number'}</label>
                                <p className="text-5xl font-display font-black text-ship-blue tracking-tighter leading-none uppercase italic">{viewingTicket.seatNumber}</p>
                            </div>
                        </div>

                        <div className="pt-12 border-t border-navy-100 border-dashed border-2 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="bg-white p-3 rounded-2xl shadow-xl border border-navy-50">
                                    <QRCodeCanvas value={viewingTicket.id} size={80} level="H" />
                                </div>
                                <div className="space-y-2">
                                    <div className="badge-status bg-emerald-50 text-emerald-600 border-emerald-200 uppercase text-[8px] italic">{language === 'id' ? 'Terverifikasi & Aktif' : 'Verified & Active'}</div>
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
                            <h2 className="text-3xl font-display font-black tracking-tighter uppercase leading-none mb-3 text-white">{language === 'id' ? 'AGEN PEMBAYARAN' : 'PAYMENT AGENT'}</h2>
                            <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.3em] font-display">{language === 'id' ? 'TOTAL TAGIHAN' : 'TOTAL BILL'}: Rp {payingBooking.totalPrice.toLocaleString()}</p>
                        </div>
                        {payingBooking.expiresAt && (
                            <div className="flex flex-col items-end gap-2 px-6 py-4 bg-navy-900/50 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-300 italic leading-none">{language === 'id' ? 'Batas Waktu' : 'Expires In'}</span>
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
                            {paymentMethod === 'bank' ? (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Bank Tujuan' : 'Target Bank'}</p>
                                            <p className="font-black text-navy-900 text-lg tracking-tight leading-none uppercase">{bankSettings.bankName}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white border border-navy-100 flex items-center justify-center rounded-xl p-2 font-black text-ship-blue text-xs shadow-sm">{bankSettings.bankName ? bankSettings.bankName[0] : 'B'}</div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1 italic leading-none">{language === 'id' ? 'Nomor Rekening' : 'Account Number'}</p>
                                        <p className="text-3xl font-display font-black text-ship-blue italic tracking-widest">{bankSettings.accountNumber}</p>
                                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 italic shadow-sm">A/N {bankSettings.accountHolder}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'E-Wallet / Kode QRIS' : 'E-Wallet / QRIS Destination'}</p>
                                            <p className="font-black text-navy-900 text-lg tracking-tight leading-none uppercase">{bankSettings.ewalletName || 'GOPAY / OVO / QRIS'}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white border border-navy-100 flex items-center justify-center rounded-xl p-2 font-black text-ship-blue text-xs shadow-sm">QR</div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1 italic leading-none">{language === 'id' ? 'Nomor Telepon / Kode' : 'Phone Number / Code'}</p>
                                        <p className="text-3xl font-display font-black text-ship-blue italic tracking-widest">{bankSettings.ewalletNumber || '0812-3456-7890'}</p>
                                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 italic shadow-sm">A/N {bankSettings.ewalletHolder || 'Mentawai Fast Owner'}</p>
                                    </div>
                                </>
                            )}
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
