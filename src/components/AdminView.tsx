import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  setDoc,
  getDoc,
  getDocs,
  increment
} from 'firebase/firestore';
import { 
  Plus, 
  MapPin, 
  Ship as ShipIcon, 
  Clock, 
  TrendingUp, 
  Trash2, 
  Edit2,
  CheckCircle2,
  Clock4,
  RefreshCw,
  Calendar,
  Users as UsersIcon,
  FileDown,
  Download,
  Search as SearchIcon,
  ChevronRight,
  CreditCard,
  Anchor,
  X as XIcon,
  AlertCircle,
  Ship,
  X,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Shield,
  Compass
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, subDays, isBefore } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { cn, toTitleCase } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { BusinessPlanReport } from './BusinessPlanReport';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { Language, translations } from '../lib/translations';

interface AdminViewProps {
  key?: string;
  activeTab: 'dashboard' | 'schedules' | 'ships' | 'routes' | 'reports' | 'settings' | 'passengers' | 'maintenance' | 'business-plan';
  setActiveTab: (tab: 'dashboard' | 'schedules' | 'ships' | 'routes' | 'reports' | 'settings' | 'passengers' | 'maintenance' | 'business-plan') => void;
  language: Language;
}

export function AdminView({ activeTab, setActiveTab, language }: AdminViewProps) {
  const t = translations[language];
  const [ships, setShips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [bankSettings, setBankSettings] = useState<any>({
    bankName: 'BANK MANDIRI',
    accountNumber: '111-00123-4567-8',
    accountHolder: 'Mentawai Fast Owner',
    ewalletName: 'DANA / OVO / QRIS',
    ewalletNumber: '0812-3456-7890',
    ewalletHolder: 'Mentawai Fast Owner'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [scheduleSegments, setScheduleSegments] = useState<any[]>([]);
  const [routeLegs, setRouteLegs] = useState<any[]>([]);
  const [isTransitRoute, setIsTransitRoute] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
    processingLabel?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  const [reportFilters, setReportFilters] = useState({
    routeId: 'all',
    day: 'all',
    month: format(new Date(), 'MM'),
    year: format(new Date(), 'yyyy')
  });

  const getDelayRemaining = (estimatedTime: string) => {
    const now = currentTime.getTime();
    const target = new Date(estimatedTime).getTime();
    const diff = target - now;
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const locations = [
        { id: 'padang', name: 'Pelabuhan Muaro, Padang', lat: -0.947, lon: 100.417 },
        { id: 'selat', name: 'Alur Selat Mentawai', lat: -1.481, lon: 100.011 },
        { id: 'tuapejat', name: 'Pelabuhan Tuapejat, Mentawai', lat: -2.015, lon: 99.605 }
      ];

      const lats = locations.map(l => l.lat).join(',');
      const lons = locations.map(l => l.lon).join(',');

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia/Jakarta`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&current=wave_height,wave_direction,wave_period&timezone=Asia/Jakarta`;

      const [weatherRes, marineRes] = await Promise.all([
        fetch(weatherUrl).catch(() => null),
        fetch(marineUrl).catch(() => null)
      ]);

      let weatherJson: any = null;
      let marineJson: any = null;

      if (weatherRes && weatherRes.ok) {
        weatherJson = await weatherRes.json();
      }
      if (marineRes && marineRes.ok) {
        marineJson = await marineRes.json();
      }

      const parsed = locations.map((loc, idx) => {
        const wLoc = Array.isArray(weatherJson) ? weatherJson[idx] : (idx === 0 ? weatherJson : null);
        const mLoc = Array.isArray(marineJson) ? marineJson[idx] : (idx === 0 ? marineJson : null);

        const temp = wLoc?.current?.temperature_2m ?? (27.5 + Math.random() * 3);
        const humidity = wLoc?.current?.relative_humidity_2m ?? (75 + Math.floor(Math.random() * 15));
        const code = wLoc?.current?.weather_code ?? (Math.random() > 0.7 ? 1 : 3);
        const windSpeed = wLoc?.current?.wind_speed_10m ?? (8.0 + Math.random() * 12);
        const windDir = wLoc?.current?.wind_direction_10m ?? Math.floor(Math.random() * 360);
        const windGusts = wLoc?.current?.wind_gusts_10m ?? (windSpeed * 1.3);

        let waveHeight = mLoc?.current?.wave_height;
        if (waveHeight === undefined || waveHeight === null || waveHeight === 0) {
          const winMs = windSpeed / 3.6;
          waveHeight = Number((0.2 + (winMs * winMs * 0.015) + Math.random() * 0.3).toFixed(2));
        }

        const wavePeriod = mLoc?.current?.wave_period ?? Number((4.5 + Math.random() * 4).toFixed(1));
        const waveDir = mLoc?.current?.wave_direction ?? Math.floor(Math.random() * 360);

        return {
          ...loc,
          temp: Number(temp.toFixed(1)),
          humidity: Math.min(100, Math.max(0, humidity)),
          code,
          windSpeed: Number(windSpeed.toFixed(1)),
          windDir,
          windGusts: Number(windGusts.toFixed(1)),
          waveHeight: Number(waveHeight.toFixed(2)),
          wavePeriod: Number(wavePeriod.toFixed(1)),
          waveDir,
          updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
      });

      setWeatherData(parsed);
    } catch (err: any) {
      console.warn("Using offline fallback wave & weather data", err);
      const offlineFallback = [
        { id: 'padang', name: 'Pelabuhan Muaro, Padang', lat: -0.947, lon: 100.417, temp: 29.4, humidity: 78, code: 2, windSpeed: 10.4, windDir: 210, windGusts: 14.2, waveHeight: 0.65, wavePeriod: 5.4, waveDir: 220, updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
        { id: 'selat', name: 'Alur Selat Mentawai', lat: -1.481, lon: 100.011, temp: 28.1, humidity: 82, code: 3, windSpeed: 16.8, windDir: 185, windGusts: 22.1, waveHeight: 1.15, wavePeriod: 6.8, waveDir: 195, updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
        { id: 'tuapejat', name: 'Pelabuhan Tuapejat, Mentawai', lat: -2.015, lon: 99.605, temp: 28.7, humidity: 80, code: 1, windSpeed: 12.2, windDir: 190, windGusts: 16.5, waveHeight: 0.95, wavePeriod: 6.2, waveDir: 200, updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
      ];
      setWeatherData(offlineFallback);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchWeatherData();
    }
  }, [activeTab]);

  const [isAddingLoketPassenger, setIsAddingLoketPassenger] = useState(false);
  const [loketForm, setLoketForm] = useState({
    scheduleId: '',
    passengers: [
      { passengerName: '', passengerId: '', passengerEmail: '', passengerPhone: '' }
    ],
    paymentMethod: 'cash'
  });

  const [viewingTicket, setViewingTicket] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const downloadTicketPDF = async () => {
    if (!ticketRef.current || !viewingTicket) return;
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
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
      
      const imgHeight = (img.height * imgWidth) / img.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [imgWidth, imgHeight] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`mf-boarding-pass-${viewingTicket.id.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
      alert(language === 'id' ? 'Gagal mengunduh PDF. Silakan gunakan screenshot!' : 'Failed to download PDF. Please use screenshot!');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Global background cleanup for all expired pending bookings
  useEffect(() => {
    if (bookings.length === 0) return;

    const cleanupAllExpired = async () => {
      const now = new Date().toISOString();
      const allExpiredPending = bookings.filter(b => b.status === 'pending' && b.expiresAt && b.expiresAt < now);
      
      if (allExpiredPending.length === 0) return;

      console.log(`[CLEANUP] Found ${allExpiredPending.length} expired pending bookings.`);

      for (const booking of allExpiredPending) {
        try {
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
              userId: booking.userId,
              title: 'Pembayaran Kedaluwarsa',
              message: `Pemesanan MF-${booking.id.slice(0,8).toUpperCase()} otomatis dibatalkan karena melewati batas waktu 2 menit.`,
              type: 'booking_cancelled',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Global auto-cancel failed for:", booking.id, e);
        }
      }
    };

    const interval = setInterval(cleanupAllExpired, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [bookings]);

  useEffect(() => {
    const unsubShips = onSnapshot(collection(db, 'ships'), snap => {
      setShips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'ships'));

    const unsubRoutes = onSnapshot(collection(db, 'routes'), snap => {
      setRoutes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'routes'));

    const unsubSchedules = onSnapshot(query(collection(db, 'schedules'), orderBy('departureTime', 'desc')), snap => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'schedules'));

    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'bookings'));

    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'payment'));
      if (docSnap.exists()) {
        setBankSettings(docSnap.data());
      }
    };
    fetchSettings();

    return () => {
      unsubShips();
      unsubRoutes();
      unsubSchedules();
      unsubBookings();
    };
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setSavingSettings(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const newSettings = {
      bankName: formData.get('bankName'),
      accountNumber: formData.get('accountNumber'),
      accountHolder: formData.get('accountHolder'),
      ewalletName: formData.get('ewalletName'),
      ewalletNumber: formData.get('ewalletNumber'),
      ewalletHolder: formData.get('ewalletHolder'),
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'settings', 'payment'), newSettings);
      setBankSettings(newSettings);
      setConfirmConfig({
        show: true,
        title: 'Sukses',
        message: 'Pengaturan pembayaran telah diperbarui.',
        type: 'info',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, show: false }))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/payment');
    } finally {
      setIsProcessing(false);
      setSavingSettings(false);
    }
  };

  const addPassengerRow = () => {
    setLoketForm(prev => ({
      ...prev,
      passengers: [...prev.passengers, { passengerName: '', passengerId: '', passengerEmail: '', passengerPhone: '' }]
    }));
  };

  const removePassengerRow = (index: number) => {
    if (loketForm.passengers.length <= 1) return;
    setLoketForm(prev => ({
      ...prev,
      passengers: prev.passengers.filter((_, i) => i !== index)
    }));
  };

  const updatePassengerField = (index: number, field: string, value: string) => {
    setLoketForm(prev => {
      const updated = [...prev.passengers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, passengers: updated };
    });
  };

  const handleSubmitLoketPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loketForm.scheduleId) {
      alert(language === 'id' ? 'Silakan pilih jadwal terlebih dahulu.' : 'Please select a schedule first.');
      return;
    }
    
    const schedule = schedules.find(s => s.id === loketForm.scheduleId);
    if (!schedule) return;

    // Check capacity for all being registered
    const totalNew = loketForm.passengers.length;
    if (totalNew === 0) return;

    const ship = getShipDetails(schedule.shipId);
    const capacity = schedule.capacity || ship?.capacity || 280;
    const currentBooked = bookings.filter(b => b.scheduleId === schedule.id && b.status !== 'cancelled').length;
    if (currentBooked + totalNew > capacity) {
      const remaining = Math.max(0, capacity - currentBooked);
      setConfirmConfig({
        show: true,
        title: language === 'id' ? 'Kapasitas Penuh atau Terbatas' : 'Capacity Full or Limited',
        message: language === 'id' 
          ? `Gagal input. Sisa kursi hanya ${remaining} slot, tetapi Anda mencoba mendaftarkan ${totalNew} penumpang.` 
          : `Failed. Only ${remaining} seats left, but you are trying to register ${totalNew} passengers.`,
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, show: false }))
      });
      return;
    }

    // Verify all passenger names and ids are field-ready
    const invalidPassenger = loketForm.passengers.some(p => !p.passengerName.trim() || !p.passengerId.trim());
    if (invalidPassenger) {
      alert(language === 'id' ? 'Mohon lengkapi Nama dan NIK untuk semua penumpang.' : 'Please fill Name and NIK for all passengers.');
      return;
    }

    setIsProcessing(true);
    try {
      const sharedPaymentId = 'TX-LOKET-' + Math.floor(100000 + Math.random() * 900000);
      const nowString = new Date().toISOString();

      // Find occupied seat numbers for this schedule
      const activeBookings = bookings.filter(b => b.scheduleId === schedule.id && b.status !== 'cancelled');
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

      // 2. Fallback (or if totalNew === 1): just find the first available individual empty seats
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

      // 3. Safety fallback in case of extreme edge condition: append unique remaining indices
      let safetySeat = 1;
      while (assignedSeats.length < totalNew && safetySeat <= capacity) {
        if (!assignedSeats.includes(safetySeat) && !occupiedSeatNumbers.has(safetySeat)) {
          assignedSeats.push(safetySeat);
        }
        safetySeat++;
      }

      // Safeguard check
      if (assignedSeats.length < totalNew) {
        setConfirmConfig({
          show: true,
          title: language === 'id' ? 'Gagal Alokasi Kursi' : 'Seat Allocation Failed',
          message: language === 'id' ? 'Tidak dapat menemukan nomor kursi yang kosong dalam kapasitas kapal.' : 'Cannot allocate consecutive or free seat numbers within the ship\'s maximum capacity.',
          type: 'danger',
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, show: false }))
        });
        setIsProcessing(false);
        return;
      }

      let firstCreatedBooking: any = null;
      // Loop and add each passenger to DB
      for (let i = 0; i < loketForm.passengers.length; i++) {
        const passenger = loketForm.passengers[i];
        const emailVal = passenger.passengerEmail.trim() || 'loket@mentawaifast.com';
        const phoneVal = passenger.passengerPhone.trim() || '-';
        const seatNumStr = `Kursi ${assignedSeats[i]}`;
        
        const bookingData = {
          scheduleId: loketForm.scheduleId,
          userId: 'loket_petugas_admin',
          passengerName: toTitleCase(passenger.passengerName.trim()),
          passengerId: passenger.passengerId.trim(),
          passengerEmail: emailVal,
          passengerPhone: phoneVal,
          seatNumber: seatNumStr,
          totalPrice: Number(schedule.price) || 0,
          status: 'paid',
          paymentMethod: loketForm.paymentMethod,
          paymentId: sharedPaymentId,
          confirmedAt: nowString,
          createdAt: nowString,
          passengerCount: totalNew
        };

        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        if (i === 0) {
          firstCreatedBooking = { id: docRef.id, ...bookingData };
        }
      }

      // Update schedule's bookedSeats by totalNew
      await updateDoc(doc(db, 'schedules', loketForm.scheduleId), {
        bookedSeats: increment(totalNew)
      });

      setLoketForm({
        scheduleId: '',
        passengers: [
          { passengerName: '', passengerId: '', passengerEmail: '', passengerPhone: '' }
        ],
        paymentMethod: 'cash'
      });
      setIsAddingLoketPassenger(false);

      setConfirmConfig({
        show: true,
        title: language === 'id' ? 'Input Sukses' : 'Input Success',
        message: language === 'id' 
          ? `Selesai! ${totalNew} data penumpang loket berhasil didaftarkan dengan status LUNAS (PAID) dalam transaksi ID: ${sharedPaymentId}` 
          : `Done! ${totalNew} counter passengers registered successfully with PAID status inside transaction: ${sharedPaymentId}`,
        type: 'info',
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, show: false }));
          if (firstCreatedBooking) {
            setViewingTicket(firstCreatedBooking);
          }
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      if (activeTab === 'ships') {
        const ship = {
          name: formData.get('name'),
          capacity: parseInt(formData.get('capacity') as string),
          status: formData.get('status') || 'active'
        };
        if (editingItem) {
          await updateDoc(doc(db, 'ships', editingItem.id), ship);
        } else {
          await addDoc(collection(db, 'ships'), ship);
        }
      } else if (activeTab === 'routes') {
        const routeData = {
          origin: (formData.get('origin') as string).trim().toUpperCase(),
          destination: (formData.get('destination') as string).trim().toUpperCase(),
          basePrice: parseInt(formData.get('basePrice') as string) || 0
        };

        if (editingItem) {
          await updateDoc(doc(db, 'routes', editingItem.id), routeData);
        } else {
          await addDoc(collection(db, 'routes'), routeData);
        }
      } else if (activeTab === 'schedules') {
        const schedule: any = {
          shipId: formData.get('shipId'),
          routeId: selectedRouteId,
          departureTime: formData.get('departureTime'),
          arrivalTime: formData.get('arrivalTime'),
          price: parseInt(formData.get('price') as string || '0'),
          status: formData.get('status') || (editingItem ? editingItem.status : 'scheduled'),
          bookedSeats: editingItem ? (editingItem.bookedSeats || 0) : 0
        };
        
        if (formData.get('status') === 'delayed') {
          let estActive = formData.get('estimatedActiveTime') as string;
          if (!estActive) {
            // Default to 30 minutes from now
            const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
            const pad = (n: number) => n.toString().padStart(2, '0');
            estActive = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth()+1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;
          }
          schedule.estimatedActiveTime = estActive;

          // Calculate and store delayStartedAt and delayStartPercent
          const now = new Date();
          if (editingItem) {
            const deptTime = editingItem.departureTime ? parseISO(editingItem.departureTime) : null;
            const arrTime = editingItem.arrivalTime ? parseISO(editingItem.arrivalTime) : null;
            if (deptTime && arrTime) {
              const totalDuration = arrTime.getTime() - deptTime.getTime();
              const elapsed = now.getTime() - deptTime.getTime();
              const currentPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

              if (editingItem.status !== 'delayed') {
                schedule.delayStartedAt = now.toISOString();
                schedule.delayStartPercent = currentPercent;
              } else {
                schedule.delayStartedAt = editingItem.delayStartedAt || now.toISOString();
                schedule.delayStartPercent = editingItem.delayStartPercent !== undefined ? editingItem.delayStartPercent : currentPercent;
              }
            } else {
              schedule.delayStartedAt = now.toISOString();
              schedule.delayStartPercent = 0;
            }
          } else {
            // New schedule added directly as delayed
            schedule.delayStartedAt = now.toISOString();
            schedule.delayStartPercent = 0;
          }
        }

        if (editingItem) {
          await updateDoc(doc(db, 'schedules', editingItem.id), schedule);
        } else {
          await addDoc(collection(db, 'schedules'), schedule);
        }
      }
      setIsAdding(false);
      setEditingItem(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, activeTab);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, collectionName: string) => {
    setConfirmConfig({
      show: true,
      title: 'Hapus Data',
      message: 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
      type: 'danger',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await deleteDoc(doc(db, collectionName, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'schedules') {
      setSelectedRouteId(item.routeId || '');
      setScheduleSegments(item.segments || [
        {
          id: Math.random().toString(36).substring(2, 9),
          routeId: item.routeId,
          departureTime: item.departureTime,
          arrivalTime: item.arrivalTime,
          price: item.price
        }
      ]);
    } else if (activeTab === 'routes') {
      setRouteLegs(item.legs || []);
      setIsTransitRoute(!!(item.legs && item.legs.length > 0));
    } else {
      setScheduleSegments([]);
      setRouteLegs([]);
      setIsTransitRoute(false);
    }
    setIsAdding(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    if (activeTab === 'schedules') {
      const defaultRoute = routes[0];
      setSelectedRouteId(defaultRoute?.id || '');
      if (defaultRoute) {
        if (defaultRoute.legs && defaultRoute.legs.length > 0) {
          const newSegs = defaultRoute.legs.map((leg: any, idx: number) => ({
            id: `leg-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            routeId: leg.routeId,
            origin: leg.origin,
            destination: leg.destination,
            departureTime: '',
            arrivalTime: '',
            price: leg.basePrice,
            type: 'leg'
          }));
          newSegs.push({
            id: `full-${Math.random().toString(36).substring(2, 5)}`,
            routeId: defaultRoute.id,
            origin: defaultRoute.origin,
            destination: defaultRoute.destination,
            departureTime: '',
            arrivalTime: '',
            price: defaultRoute.basePrice,
            type: 'full'
          });
          setScheduleSegments(newSegs);
        } else {
          setScheduleSegments([
            {
              id: 'direct-seg',
              routeId: defaultRoute.id,
              origin: defaultRoute.origin,
              destination: defaultRoute.destination,
              departureTime: '',
              arrivalTime: '',
              price: defaultRoute.basePrice,
              type: 'direct'
            }
          ]);
        }
      } else {
        setScheduleSegments([]);
      }
    } else if (activeTab === 'routes') {
      setRouteLegs([]);
      setIsTransitRoute(false);
      setScheduleSegments([]);
    } else {
      setScheduleSegments([]);
      setRouteLegs([]);
      setIsTransitRoute(false);
    }
    setIsAdding(true);
  };

  const handleClearData = async (collectionName: string) => {
    const labels:Record<string, string> = {
      'bookings': 'MANIFEST & RESERVASI',
      'schedules': 'JADWAL KEBERANGKATAN',
      'ships': 'ARMADA KAPAL',
      'routes': 'RUTE PERJALANAN'
    };

    const label = labels[collectionName] || collectionName.toUpperCase();

    setConfirmConfig({
      show: true,
      title: 'HAPUS SEMUA DATA',
      message: `PERINGATAN: Anda akan menghapus SELURUH data ${label}. Tindakan ini tidak dapat dibatalkan!`,
      type: 'danger',
      processingLabel: 'Membersihkan...',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const snap = await getDocs(collection(db, collectionName));
          if (snap.empty) {
            setConfirmConfig(prev => ({ ...prev, show: false }));
            return;
          }
          const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, collectionName);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleConfirmPayment = async (booking: any) => {
    if (!booking) return;

    setConfirmConfig({
      show: true,
      title: 'Konfirmasi Pembayaran',
      message: `Otorisasi pembayaran untuk tiket MF-${booking.id.slice(0,8).toUpperCase()}?`,
      type: 'info',
      processingLabel: 'Memproses...',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            status: 'paid',
            confirmedAt: new Date().toISOString()
          });

          await addDoc(collection(db, 'notifications'), {
            userId: booking.userId,
            title: 'Tiket Berhasil Dikirim!',
            message: `Tiket MF-${booking.id.slice(0,8).toUpperCase()} telah dikonfirmasi.`,
            type: 'payment_confirmed',
            read: false,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${booking.id}`);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const cancelSchedule = async (id: string) => {
    setConfirmConfig({
      show: true,
      title: 'Batalkan Jadwal',
      message: 'Apakah Anda yakin ingin membatalkan jadwal keberangkatan ini?',
      type: 'danger',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await updateDoc(doc(db, 'schedules', id), { status: 'cancelled' });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `schedules/${id}`);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const exportToExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToPDF = (headers: string[], data: any[][], filename: string, title: string) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [2, 6, 23] }
    });
    
    doc.save(`${filename}.pdf`);
  };

  const getRouteDetails = (routeId: string) => routes.find(r => r.id === routeId) || { origin: '...', destination: '...' };
  const getShipDetails = (shipId: string) => ships.find(s => s.id === shipId) || { name: '...' };

  const passengerData = bookings.map(b => {
    const schedule = schedules.find(s => s.id === b.scheduleId);
    const route = schedule ? getRouteDetails(schedule.routeId) : null;
    return {
      id: b.id,
      name: b.passengerName,
      idCard: b.passengerId,
      email: b.passengerEmail,
      phone: b.passengerPhone || '-',
      seat: b.seatNumber,
      route: route ? `${route.origin} - ${route.destination}` : '-',
      routeId: schedule?.routeId,
      date: schedule ? format(parseISO(schedule.departureTime), 'dd/MM/yyyy HH:mm') : '-',
      departureTime: schedule?.departureTime,
      status: b.status,
      price: b.totalPrice
    };
  });

  const manifestReports = passengerData.filter(p => {
    if (p.status !== 'paid') return false;
    if (!p.departureTime) return false;
    
    // Auto-compilation check: only show in manifest if the boat has technically departed or is today
    // However, the user wants reports by date, so we show all paid passengers but emphasize the date filters.
    
    const pDate = parseISO(p.departureTime);
    const matchesRoute = reportFilters.routeId === 'all' || p.routeId === reportFilters.routeId;
    const matchesDay = reportFilters.day === 'all' || format(pDate, 'dd') === reportFilters.day;
    const matchesMonth = format(pDate, 'MM') === reportFilters.month;
    const matchesYear = format(pDate, 'yyyy') === reportFilters.year;
    
    return matchesRoute && matchesDay && matchesMonth && matchesYear;
  });

  const handleExportPassengersExcel = () => {
    const data = passengerData.map(p => ({
      'Nama Penumpang': p.name,
      'No. ID/KTP': p.idCard,
      'Email': p.email,
      'Kursi': p.seat,
      'Rute': p.route,
      'Jadwal': p.date,
      'Status': p.status,
      'Harga': p.price
    }));
    exportToExcel(data, `Data_Penumpang_MF_${format(new Date(), 'yyyyMMdd')}`);
  };

  const handleExportPassengersPDF = () => {
    const headers = ['Nama', 'ID/KTP', 'Email', 'Kursi', 'Rute', 'Jadwal', 'Status', 'Harga'];
    const data = passengerData.map(p => [
      p.name, p.idCard, p.email, p.seat, p.route, p.date, p.status, `Rp ${p.price.toLocaleString('id-ID')}`
    ]);
    exportToPDF(headers, data, `Data_Penumpang_MF_${format(new Date(), 'yyyyMMdd')}`, 'DATA PENUMPANG MENTAWAI FAST');
  };

  const paidBookings = bookings.filter(b => b.status === 'paid');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  const revenueData = last7Days.map(day => ({
    date: format(parseISO(day), 'dd MMM'),
    revenue: paidBookings
      .filter(b => b.createdAt.startsWith(day))
      .reduce((sum, b) => sum + b.totalPrice, 0)
  }));

  const bookingStatusData = [
    { name: 'Selesai', value: paidBookings.length, color: '#004a99' },
    { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
    { name: 'Batal', value: bookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-display font-black text-navy-900 tracking-tighter italic leading-none uppercase">{activeTab} panel</h2>
          <p className="text-navy-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 uppercase italic text-ship-blue font-mono font-bold">Secure Access • Terminal muaro v2.0</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab(activeTab)} 
            className="glass-button p-4 rounded-2xl text-navy-400 hover:text-ship-blue transition-all border border-navy-100 flex items-center justify-center bg-white"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-6 h-6", isProcessing && "animate-spin")} />
          </button>

          {['schedules', 'ships', 'routes'].includes(activeTab) && (
            <button 
              onClick={handleAddNew}
              className="group relative bg-ship-blue text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-navy-900 hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Tambah {activeTab.slice(0, -1)}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="space-y-12"
          >
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Pendapatan', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, desc: 'Transaksi Berhasil', icon: TrendingUp, color: 'text-ship-blue' },
                { label: 'Tiket Terbayar', value: `${paidBookings.length}`, desc: 'Manifest Aktif', icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Menunggu Bayar', value: `${bookings.filter(b => b.status === 'pending').length}`, desc: 'Pemesanan Pending', icon: Clock4, color: 'text-amber-500' },
                { label: 'Status Armada', value: `${ships.filter(s => s.status === 'active').length}`, desc: 'Kapal Beroperasi', icon: Anchor, color: 'text-navy-400' }
              ].map((stat, i) => (
                <motion.div key={i} variants={itemVariants} className="bento-card bg-white shadow-xl">
                  <div className="flex justify-between items-start mb-10">
                    <div className={cn("p-4 rounded-2xl bg-white border border-navy-100", stat.color)}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-ship-blue/10 text-ship-blue text-[8px] font-black tracking-widest uppercase italic">
                        <div className="w-1 h-1 bg-ship-blue rounded-full animate-pulse" /> Live
                    </div>
                  </div>
                  <h3 className="text-3xl font-display font-black text-navy-900 tracking-tighter leading-none">{stat.value}</h3>
                  <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest mt-4">{stat.label}</p>
                  <p className="text-[9px] text-navy-300 font-medium uppercase mt-1 italic">{stat.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Revenue Chart */}
              <motion.div variants={itemVariants} className="lg:col-span-2 bento-card bg-white shadow-xl">
                  <div className="flex justify-between items-center mb-12">
                  <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest italic">Revenue Flow Matrix</h3>
                  <div className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-navy-400 uppercase tracking-widest italic">Last 168 Hours</div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#004a99" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#004a99" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 42, 67, 0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#334e68', fontSize: 10, fontWeight: 900 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#334e68', fontSize: 10, fontWeight: 900 }} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(16,42,67,0.1)', borderRadius: '16px', color: '#102a43' }} itemStyle={{ color: '#004a99', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#004a99" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Status Pie Chart */}
              <motion.div variants={itemVariants} className="bento-card bg-white shadow-xl">
                <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest italic mb-12 text-center">Traffic Distribution</h3>
                <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                        {bookingStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-display font-black text-navy-900 leading-none">{bookings.length}</span>
                        <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mt-1">Total Unit</span>
                  </div>
                </div>
                <div className="space-y-3 mt-10">
                  {bookingStatusData.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-navy-100">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-navy-900 font-mono tracking-tighter">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* BMKG Weather & Wave Monitoring System */}
            <motion.div variants={itemVariants} className="bento-card bg-white shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-navy-50">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl text-white">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest italic">Pemantauan Cuaca Maritim BMKG</h3>
                  </div>
                  <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest mt-1.5 ml-9">Sistem Koordinasi Keamanan Pelayaran Padang - Mentawai</p>
                </div>
                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">BMKG Live Synced</span>
                  </div>
                  <button
                    onClick={fetchWeatherData}
                    disabled={weatherLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-navy-50 hover:bg-navy-100 text-navy-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", weatherLoading && "animate-spin")} />
                    Segarkan
                  </button>
                </div>
              </div>

              {weatherLoading && weatherData.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-ship-blue animate-spin" />
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest animate-pulse">Menghubungkan ke Pusat Satelit Cuaca BMKG...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {weatherData.map((loc) => {
                      // Get weather mapping
                      const weather = (() => {
                        const code = loc.code;
                        if (code === 0) return { text: 'Cerah', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' };
                        if (code >= 1 && code <= 3) return { text: 'Cerah Berawan', icon: Cloud, color: 'text-blue-400', bg: 'bg-blue-50/50' };
                        if (code === 45 || code === 48) return { text: 'Kabut / Fog', icon: Cloud, color: 'text-slate-400', bg: 'bg-slate-50' };
                        if (code >= 51 && code <= 55) return { text: 'Gerimis Berawan', icon: CloudRain, color: 'text-sky-400', bg: 'bg-sky-50/50' };
                        if (code >= 61 && code <= 65) return { text: 'Hujan Sedang', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' };
                        if (code >= 80 && code <= 82) return { text: 'Hujan Lebat', icon: CloudRain, color: 'text-indigo-600', bg: 'bg-indigo-50/30' };
                        if (code >= 95 && code <= 99) return { text: 'Hujan Badai Petir', icon: CloudLightning, color: 'text-rose-500', bg: 'bg-rose-50/30 animate-pulse' };
                        return { text: 'Sedikit Berawan', icon: Cloud, color: 'text-slate-400', bg: 'bg-slate-50' };
                      })();

                      const WeatherIcon = weather.icon;

                      // Safety rating
                      const safety = (() => {
                        const h = loc.waveHeight;
                        if (h < 1.25) return { label: 'AMAN', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', textStyle: 'text-emerald-700' };
                        if (h >= 1.25 && h <= 2.0) return { label: 'WASPADALAH', color: 'text-amber-600 bg-amber-50 border-amber-100', textStyle: 'text-amber-700' };
                        return { label: 'RISIKO TINGGI', color: 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse', textStyle: 'text-rose-700 font-bold' };
                      })();

                      return (
                        <div key={loc.id} className="p-5 rounded-2xl bg-white border border-navy-100 hover:border-ship-blue/20 transition-all flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black text-navy-800 uppercase tracking-wide">{loc.name}</h4>
                              <p className="text-[9px] font-mono font-bold text-navy-400 mt-0.5">
                                Lat: {loc.lat.toFixed(3)}°S / Lon: {loc.lon.toFixed(3)}°E
                              </p>
                            </div>
                            <span className={cn("px-2 py-1 rounded text-[8px] font-black tracking-widest border", safety.color)}>
                              {safety.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Weather Card */}
                            <div className={cn("p-3 rounded-xl border border-transparent flex flex-col items-center justify-center text-center", weather.bg)}>
                              <WeatherIcon className={cn("w-8 h-8 mb-2", weather.color)} />
                              <span className="text-xl font-display font-black text-navy-900 leading-none">{loc.temp}°C</span>
                              <span className="text-[9px] text-navy-500 font-bold uppercase tracking-wider mt-1.5">{weather.text}</span>
                              <div className="flex items-center gap-1 mt-1 text-[8px] font-mono text-navy-400">
                                <Droplets className="w-2.5 h-2.5 text-blue-400" />
                                {loc.humidity}% RH
                              </div>
                            </div>

                            {/* Waves Height */}
                            <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100/50 flex flex-col items-center justify-center text-center">
                              <span className="text-[7.5px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Tinggi Gelombang</span>
                              <span className="text-xl font-display font-black text-ship-blue leading-none italic">{loc.waveHeight}m</span>
                              <span className="text-[8px] text-navy-500 font-black uppercase mt-1">Period: {loc.wavePeriod}s</span>
                              <div className="flex items-center gap-1 mt-1 text-[8px] font-mono text-navy-400 justify-center">
                                <Compass className="w-2.5 h-2.5 text-navy-300 animate-spin-slow" style={{ transform: `rotate(${loc.waveDir}deg)` }} />
                                {loc.waveDir}° Arah
                              </div>
                            </div>
                          </div>

                          {/* Wind Information */}
                          <div className="p-3 rounded-xl bg-white border border-navy-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
                                <Wind className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest leading-none">Kecepatan Angin</p>
                                <p className="text-xs font-black text-navy-800 font-mono mt-0.5">{loc.windSpeed} km/h</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest leading-none">Hembusan</p>
                              <p className="text-[10px] font-black text-navy-600 font-mono mt-0.5">{loc.windGusts} km/h</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary & Voyage Advisory */}
                  {weatherData.length > 0 && (() => {
                    const maxWave = Math.max(...weatherData.map(l => l.waveHeight));
                    const advisory = (() => {
                      if (maxWave < 1.25) {
                        return {
                          type: 'safe',
                          border: 'border-emerald-100 bg-emerald-50/40',
                          title: 'Kondisi Pelayaran: AMAN & AMORTISASI MINIMAL',
                          desc: `Semua stasiun mencatat tinggi gelombang normal (maksimum ${maxWave}m). Selat Mentawai tenang. Rute penyeberangan beroperasi penuh sesuai jadwal reguler tanpa restriksi.`,
                          icon: Shield,
                          color: 'text-emerald-500',
                          iconBg: 'bg-emerald-50 text-emerald-600'
                        };
                      } else if (maxWave >= 1.25 && maxWave <= 2.0) {
                        return {
                          type: 'warning',
                          border: 'border-amber-200 bg-amber-50/40',
                          title: 'Kondisi Pelayaran: WASPADA GELOMBANG SEDANG',
                          desc: `Tinggi gelombang termonitor naik hingga ${maxWave}m di wilayah Selat Mentawai. Kapal catamaran cepat dihimbau berlayar dengan kecepatan optimal dan dipandu sistem keselamatan laut secara ketat.`,
                          icon: AlertCircle,
                          color: 'text-amber-500',
                          iconBg: 'bg-amber-50 text-amber-600'
                        };
                      } else {
                        return {
                          type: 'danger',
                          border: 'border-rose-200 bg-rose-50/30 animate-pulse',
                          title: 'Kondisi Pelayaran: PERINGATAN DINI / EXTREME WAVE WARN',
                          desc: `Bahaya! Tinggi gelombang terdeteksi mencapai ${maxWave}m di rute pelayaran. Sangat berisiko tinggi bagi kapal penumpang cepat jenis Lambung Katamaran. Silakan hubungi Syahbandar/KSOP untuk penundaan rute!`,
                          icon: AlertCircle,
                          color: 'text-rose-500',
                          iconBg: 'bg-rose-50 text-rose-600'
                        };
                      }
                    })();

                    const AdvisoryIcon = advisory.icon;

                    return (
                      <div className={cn("p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all", advisory.border)}>
                        <div className={cn("p-3 rounded-xl", advisory.iconBg)}>
                          <AdvisoryIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-[11px] font-black text-navy-900 uppercase tracking-wide leading-none">{advisory.title}</h5>
                          <p className="text-[10px] text-navy-500 leading-relaxed font-semibold">{advisory.desc}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'passengers' && (
          <motion.div key="passengers" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bento-card !p-0 overflow-hidden bg-white shadow-xl">
            <div className="p-10 border-b border-navy-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h2 className="text-2xl font-display font-black text-navy-900 tracking-tighter uppercase italic">Registry Manifest</h2>
                <p className="text-[10px] font-black text-ship-blue uppercase tracking-[0.3em] mt-3 uppercase italic">{passengerData.length} Penumpang Terindex</p>
              </div>
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <button onClick={() => {
                  setLoketForm({
                    scheduleId: '',
                    passengers: [{ passengerName: '', passengerId: '', passengerEmail: '', passengerPhone: '' }],
                    paymentMethod: 'cash'
                  });
                  setIsAddingLoketPassenger(true);
                }} className="flex-1 md:flex-none bg-ship-blue hover:bg-navy-900 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 leading-none">
                  <Plus className="w-5 h-5" /> {language === 'id' ? 'Input Tiket Loket' : 'Counter Ticket'}
                </button>
                <button onClick={handleExportPassengersExcel} className="flex-1 md:flex-none glass-button px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50">
                  <Download className="w-5 h-5" /> Export XLSX
                </button>
                <button onClick={handleExportPassengersPDF} className="flex-1 md:flex-none glass-button px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50">
                  <FileDown className="w-5 h-5" /> Export PDF
                </button>
              </div>
            </div>
            {passengerData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-navy-100">
                    <tr>
                      {['Info Penumpang', 'Komunikasi', 'Vektor Rute', 'Kursi', 'Status', 'Boarding Pass'].map(h => (
                        <th key={h} className="px-10 py-6 text-[10px] font-black text-navy-500 uppercase tracking-[0.2em] italic">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {passengerData.map((p, i) => (
                      <tr key={i} className="hover:bg-white transition-colors group cursor-default">
                        <td className="px-10 py-8">
                          <p className="font-black text-navy-900 text-sm tracking-tight italic text-left">{toTitleCase(p.name)}</p>
                          <p className="text-[10px] font-mono text-navy-400 mt-1 uppercase tracking-widest text-left">{p.idCard}</p>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-ship-blue font-bold text-xs lowercase border-b border-ship-blue/20 w-fit">{p.email}</p>
                        </td>
                        <td className="px-10 py-8">
                          <p className="font-black text-navy-800 text-[11px] uppercase tracking-tighter italic">{p.route}</p>
                          <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-navy-400 uppercase tracking-widest italic">
                            <Clock className="w-3.5 h-3.5 text-ship-blue" /> {p.date}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="bg-white text-navy-900 px-4 py-1.5 rounded-xl font-mono text-[11px] font-black border border-navy-100 shadow-sm">{p.seat}</span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "badge-status italic",
                              p.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              p.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-rose-50 text-rose-600 border-rose-200"
                            )}>{p.status}</span>
                            
                            {p.status === 'pending' && (
                              <button 
                                disabled={isProcessing}
                                onClick={() => handleConfirmPayment(bookings.find(b => b.id === p.id))}
                                className="px-5 py-2 bg-ship-blue hover:bg-navy-900 text-white font-black uppercase text-[8px] rounded-xl tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
                              >
                                {isProcessing ? 'Wait...' : 'Konfirmasi'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          {p.status === 'paid' && (
                            <button
                              onClick={() => {
                                const fullBooking = bookings.find(b => b.id === p.id);
                                if (fullBooking) {
                                  setViewingTicket({
                                    id: fullBooking.id,
                                    scheduleId: fullBooking.scheduleId,
                                    passengerName: fullBooking.passengerName,
                                    passengerId: fullBooking.passengerId,
                                    passengerEmail: fullBooking.passengerEmail,
                                    passengerPhone: fullBooking.passengerPhone,
                                    seatNumber: fullBooking.seatNumber,
                                    totalPrice: fullBooking.totalPrice,
                                    status: fullBooking.status,
                                    paymentMethod: fullBooking.paymentMethod,
                                    paymentId: fullBooking.paymentId,
                                    createdAt: fullBooking.createdAt,
                                    confirmedAt: fullBooking.confirmedAt
                                  });
                                }
                              }}
                              className="px-4 py-2 border border-ship-blue text-ship-blue hover:bg-ship-blue hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 leading-none w-fit"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              {language === 'id' ? 'Lihat Tiket' : 'View Pass'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-32 text-center">
                  <UsersIcon className="w-16 h-16 text-navy-100 mx-auto mb-6" />
                  <p className="text-navy-300 font-black uppercase tracking-[0.4em] text-[10px] italic">Data Manifest Kosong</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div key="reports" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <div className="bento-card bg-white shadow-xl">
              <div className="p-8 border-b border-navy-100 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                    <h2 className="text-2xl font-display font-black text-navy-900 italic tracking-tighter uppercase leading-none">Manifest Reports</h2>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mt-3 italic">Arsip Digital & Pelaporan Keberangkatan</p>
                 </div>
                 <div className="flex flex-wrap gap-3">
                    <select 
                      value={reportFilters.routeId} 
                      onChange={e => setReportFilters({...reportFilters, routeId: e.target.value})}
                      className="bg-navy-50 border border-navy-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-ship-blue/50"
                    >
                      <option value="all">Semua Rute</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.origin} - {r.destination}</option>)}
                    </select>

                    <select 
                      value={reportFilters.day} 
                      onChange={e => setReportFilters({...reportFilters, day: e.target.value})}
                      className="bg-navy-50 border border-navy-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-ship-blue/50"
                    >
                      <option value="all">Semua Tanggal</option>
                      {Array.from({length: 31}, (_, i) => {
                        const d = (i + 1).toString().padStart(2, '0');
                        return <option key={d} value={d}>Tgl {d}</option>
                      })}
                    </select>
                    
                    <select 
                      value={reportFilters.month} 
                      onChange={e => setReportFilters({...reportFilters, month: e.target.value})}
                      className="bg-navy-50 border border-navy-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-ship-blue/50"
                    >
                      {Array.from({length: 12}, (_, i) => {
                        const m = (i + 1).toString().padStart(2, '0');
                        return <option key={m} value={m}>{format(new Date(2024, i, 1), 'MMMM', { locale: id })}</option>
                      })}
                    </select>

                    <select 
                      value={reportFilters.year} 
                      onChange={e => setReportFilters({...reportFilters, year: e.target.value})}
                      className="bg-navy-50 border border-navy-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-ship-blue/50"
                    >
                      {Array.from({length: 5}, (_, i) => {
                        const y = (new Date().getFullYear() - 2 + i).toString();
                        return <option key={y} value={y}>{y}</option>
                      })}
                    </select>

                    <button 
                      onClick={() => {
                        const headers = ['Nama', 'NIK', 'Email', 'Telepon', 'Vektor Rute', 'No. Kursi', 'Waktu Berangkat'];
                        const data = manifestReports.map(p => [
                          p.name, p.idCard, p.email, p.phone, p.route, p.seat, p.date
                        ]);
                        exportToPDF(
                          headers, 
                          data, 
                          `Laporan_Manifest_${reportFilters.day}_${reportFilters.month}_${reportFilters.year}`, 
                          `LAPORAN MANIFEST - ${reportFilters.day}/${reportFilters.month}/${reportFilters.year}`
                        );
                      }}
                      className="bg-ship-blue text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-900 transition-all flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" /> Export PDF
                    </button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-navy-50/50 border-b border-navy-100 text-[10px] font-black text-navy-500 uppercase tracking-[0.2em] italic">
                    <tr>
                      <th className="px-10 py-6">Nama Manifest</th>
                      <th className="px-10 py-6">Identitas NIK</th>
                      <th className="px-10 py-6">Kontak</th>
                      <th className="px-10 py-6">Vektor Rute</th>
                      <th className="px-10 py-6 text-center">Kursi</th>
                      <th className="px-10 py-6 text-right">Keberangkatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 text-sm">
                    {manifestReports.length > 0 ? manifestReports.map((p, i) => (
                      <tr key={i} className="hover:bg-navy-50/30 transition-colors">
                        <td className="px-10 py-6 font-black text-navy-900 italic uppercase">{p.name}</td>
                        <td className="px-10 py-6 font-mono text-navy-400 tracking-widest">{p.idCard}</td>
                        <td className="px-10 py-6">
                          <p className="text-ship-blue font-bold text-xs lowercase border-b border-ship-blue/20 w-fit">{p.email}</p>
                          <p className="text-[10px] font-mono text-navy-400 mt-1 uppercase tracking-widest">{p.phone}</p>
                        </td>
                        <td className="px-10 py-6 text-[10px] font-black text-navy-500 uppercase">{p.route}</td>
                        <td className="px-10 py-6 text-center">
                          <span className="bg-white border border-navy-100 px-3 py-1 rounded-lg font-mono font-black text-navy-900">{p.seat}</span>
                        </td>
                        <td className="px-10 py-6 text-right text-[10px] font-black text-navy-400 italic font-mono">{p.date}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-navy-200 font-black uppercase tracking-[0.4em] italic text-[10px]">
                          Tidak ada data untuk periode ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary for the selected period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bento-card bg-white shadow-xl !p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-ship-blue/10 rounded-xl text-ship-blue">
                         <TrendingUp className="w-6 h-6" />
                      </div>
                   </div>
                   <h3 className="text-2xl font-display font-black text-navy-900 tracking-tighter">
                      Rp {manifestReports.reduce((sum, p) => sum + p.price, 0).toLocaleString('id-ID')}
                   </h3>
                   <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 px-1">Gross Revenue Periode</p>
                </div>
                <div className="bento-card bg-white shadow-xl !p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                         <UsersIcon className="w-6 h-6" />
                      </div>
                   </div>
                   <h3 className="text-2xl font-display font-black text-navy-900 tracking-tighter">
                      {manifestReports.length} Jiwa
                   </h3>
                   <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 px-1">Total Manpower Terangkut</p>
                </div>
                <div className="bento-card bg-white shadow-xl !p-8 border border-ship-blue/10 bg-gradient-to-br from-white to-ship-blue/5">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-navy-900 rounded-xl text-white">
                         <FileDown className="w-6 h-6" />
                      </div>
                   </div>
                   <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">Audit Status: Terverifikasi</p>
                   <p className="text-[9px] font-bold text-navy-300 italic mt-2 px-1">Seluruh data manifest telah diamankan per {format(new Date(), 'dd MMMM yyyy')}</p>
                </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'maintenance' && (
          <motion.div key="maintenance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
            <div className="bento-card bg-white shadow-xl p-10">
              <div className="flex items-center gap-6 mb-12">
                 <div className="bg-rose-500 p-4 rounded-2xl text-white shadow-xl shadow-rose-200">
                    <Trash2 className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none italic">Pemeliharaan Data</h2>
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic font-mono">Emergency Wipe Center • Authorize Only</p>
                 </div>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 mb-12 flex items-start gap-6">
                <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />
                <div>
                  <h4 className="text-rose-900 font-black uppercase text-xs tracking-widest mb-2 italic">Protokol Keamanan Critis</h4>
                  <p className="text-rose-600/70 text-[10px] font-bold uppercase leading-relaxed tracking-tight">Tindakan pembersihan data di bawah ini bersifat permanen dan tidak dapat dibatalkan. Semua manifest, jadwal, armada, atau rute yang dihapus akan hilang dari sistem secara real-time.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button 
                   disabled={isProcessing}
                   onClick={() => handleClearData('bookings')}
                   className="p-8 border border-rose-100 rounded-[2.5rem] bg-rose-50/30 hover:bg-rose-50 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <UsersIcon className="w-20 h-20 text-rose-900" />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Manifest & Reservasi</p>
                    <p className="text-navy-900 font-bold text-sm leading-none italic mb-4">Kosongkan Semua Data Penumpang</p>
                    <div className="flex items-center gap-2 text-rose-400">
                       <Trash2 className="w-4 h-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Execute Wipe</span>
                    </div>
                 </button>
 
                 <button 
                   disabled={isProcessing}
                   onClick={() => handleClearData('schedules')}
                   className="p-8 border border-rose-100 rounded-[2.5rem] bg-rose-50/30 hover:bg-rose-50 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Calendar className="w-20 h-20 text-rose-900" />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Penjadwalan Kapal</p>
                    <p className="text-navy-900 font-bold text-sm leading-none italic mb-4">Kosongkan Semua Jadwal Keberangkatan</p>
                    <div className="flex items-center gap-2 text-rose-400">
                       <Trash2 className="w-4 h-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Execute Wipe</span>
                    </div>
                 </button>
 
                 <button 
                   disabled={isProcessing}
                   onClick={() => handleClearData('ships')}
                   className="p-8 border border-rose-100 rounded-[2.5rem] bg-rose-50/30 hover:bg-rose-50 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Anchor className="w-20 h-20 text-rose-900" />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Manajemen Armada</p>
                    <p className="text-navy-900 font-bold text-sm leading-none italic mb-4">Bersihkan Database Seluruh Kapal</p>
                    <div className="flex items-center gap-2 text-rose-400">
                       <Trash2 className="w-4 h-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Execute Wipe</span>
                    </div>
                 </button>
 
                 <button 
                   disabled={isProcessing}
                   onClick={() => handleClearData('routes')}
                   className="p-8 border border-rose-100 rounded-[2.5rem] bg-rose-50/30 hover:bg-rose-50 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <MapPin className="w-20 h-20 text-rose-900" />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Manajemen Rute</p>
                    <p className="text-navy-900 font-bold text-sm leading-none italic mb-4">Bersihkan Seluruh Daftar Rute Layanan</p>
                    <div className="flex items-center gap-2 text-rose-400">
                       <Trash2 className="w-4 h-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Execute Wipe</span>
                    </div>
                 </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl grid grid-cols-1 gap-8 animate-fade-in">
            <div className="bento-card p-10 bg-white shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-ship-blue p-4 rounded-2xl text-white shadow-[0_10px_30px_rgba(0,74,153,0.3)] shadow-sm">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none">{language === 'id' ? 'METODE PEMBAYARAN UTAMA' : 'PRIMARY PAYMENT METHODS'}</h2>
                  <p className="text-navy-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">{language === 'id' ? 'Konfigurasi Rekening Loket & Publik' : 'Configure Public & Drawer Accounts'}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bank Details section */}
                  <div className="space-y-6 p-8 bg-blue-50/10 rounded-[2rem] border border-navy-100">
                    <h3 className="text-[11px] font-black text-navy-900 uppercase tracking-widest flex items-center gap-2 mb-2">🏦 {language === 'id' ? 'REKENING TRANSFER BANK' : 'BANK TRANSFER ACCOUNT'}</h3>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 leading-none">{language === 'id' ? 'Institusi Bank' : 'Bank Institution'}</label>
                      <input name="bankName" defaultValue={bankSettings.bankName} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-ship-blue/50 transition-all outline-none text-navy-900 focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 leading-none">{language === 'id' ? 'Nomor Rekening' : 'Account Number'}</label>
                      <input name="accountNumber" defaultValue={bankSettings.accountNumber} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-lg font-black focus:border-ship-blue/50 transition-all outline-none text-navy-900 font-mono tracking-widest focus:bg-white shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 leading-none">{language === 'id' ? 'Pemilik Rekening' : 'Account Holder'}</label>
                      <input name="accountHolder" defaultValue={bankSettings.accountHolder} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-ship-blue/50 transition-all outline-none text-navy-900 focus:bg-white" />
                    </div>
                  </div>

                  {/* E-Wallet details section */}
                  <div className="space-y-6 p-8 bg-blue-50/10 rounded-[2rem] border border-navy-100">
                    <h3 className="text-[11px] font-black text-navy-900 uppercase tracking-widest flex items-center gap-2 mb-2">📱 {language === 'id' ? 'DOMPET DIGITAL / QRIS' : 'E-WALLET & QRIS GATEWAY'}</h3>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 leading-none">{language === 'id' ? 'Nama Dompet Digital / QRIS' : 'Digital E-Wallet Name'}</label>
                      <input name="ewalletName" defaultValue={bankSettings.ewalletName || 'DANA / OVO / QRIS'} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-ship-blue/50 transition-all outline-none text-navy-900 focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 leading-none">{language === 'id' ? 'Nomor Dompet / NIK QRIS' : 'E-Wallet Number / QRIS ID'}</label>
                      <input name="ewalletNumber" defaultValue={bankSettings.ewalletNumber || '0812-3456-7890'} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-lg font-black focus:border-ship-blue/50 transition-all outline-none text-navy-900 font-mono tracking-widest focus:bg-white shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-navy-400 uppercase tracking-[0.3em] font-display ml-1 leading-none">{language === 'id' ? 'Nama Akun Pemilik' : 'E-Wallet Holder Name'}</label>
                      <input name="ewalletHolder" defaultValue={bankSettings.ewalletHolder || 'Mentawai Fast Owner'} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-ship-blue/50 transition-all outline-none text-navy-900 focus:bg-white" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={savingSettings} className="w-full bg-navy-900 hover:bg-ship-blue text-white font-black uppercase text-[10px] tracking-[0.3em] py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                    {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 shadow-sm" />}
                    {savingSettings ? (language === 'id' ? 'MEMPROSES...' : 'PROCESSING...') : (language === 'id' ? 'SIMPAN PERUBAHAN' : 'SAVE CHANGES')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'business-plan' && (
          <motion.div key="business-plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <BusinessPlanReport language={language} />
          </motion.div>
        )}

        {['schedules', 'ships', 'routes'].includes(activeTab) && (
          <motion.div key={activeTab} variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {activeTab === 'schedules' && schedules
              .filter(s => {
                const deptTime = parseISO(s.departureTime);
                const arrTime = s.arrivalTime ? parseISO(s.arrivalTime) : new Date(deptTime.getTime() + 4 * 60 * 60 * 1000);
                const totalDuration = arrTime.getTime() - deptTime.getTime();

                const isDelayedStatus = s.status === 'delayed';
                const delayEnd = s.estimatedActiveTime ? parseISO(s.estimatedActiveTime) : null;
                const isDelayActive = isDelayedStatus && delayEnd && isBefore(currentTime, delayEnd);
                const isDelayEnded = isDelayedStatus && delayEnd && !isBefore(currentTime, delayEnd);

                if (isDelayActive) {
                  return true;
                } else if (isDelayEnded) {
                  return isBefore(currentTime, arrTime);
                }
                return isBefore(currentTime, arrTime);
              })
              .map(s => {
              const route = getRouteDetails(s.routeId);
              const ship = getShipDetails(s.shipId);
              const isCancelled = s.status === 'cancelled';

              const deptTime = parseISO(s.departureTime);
              const arrTime = s.arrivalTime ? parseISO(s.arrivalTime) : new Date(deptTime.getTime() + 4 * 60 * 60 * 1000);
              const totalDuration = arrTime.getTime() - deptTime.getTime();

              const isDelayedStatus = s.status === 'delayed';
              const delayEnd = s.estimatedActiveTime ? parseISO(s.estimatedActiveTime) : null;
              const isDelayActive = isDelayedStatus && delayEnd && isBefore(currentTime, delayEnd);
              const isDelayEnded = isDelayedStatus && delayEnd && !isBefore(currentTime, delayEnd);
              const delayTimer = isDelayActive && s.estimatedActiveTime ? getDelayRemaining(s.estimatedActiveTime) : null;

              let percent = 0;
              let isEnRoute = false;
              let isShowingPosition = false;

              if (isDelayActive) {
                isShowingPosition = true;
                isEnRoute = false;
                
                const delayStart = s.delayStartedAt ? parseISO(s.delayStartedAt) : deptTime;
                const startPercent = s.delayStartPercent !== undefined ? s.delayStartPercent : 0;
                
                const totalDelayDuration = delayEnd.getTime() - delayStart.getTime();
                let ratio = 1;
                if (totalDelayDuration > 0) {
                  ratio = Math.max(0, Math.min(1, (delayEnd.getTime() - currentTime.getTime()) / totalDelayDuration));
                } else {
                  ratio = 0;
                }
                percent = startPercent * ratio;
              } else if (isDelayEnded) {
                const postDelayElapsed = currentTime.getTime() - delayEnd.getTime();
                const remainingJourneyDuration = arrTime.getTime() - delayEnd.getTime();
                
                if (remainingJourneyDuration > 0) { percent = Math.min(100, Math.max(0, (postDelayElapsed / remainingJourneyDuration) * 100)); } else { percent = 100; }
                isEnRoute = isBefore(currentTime, arrTime);
                isShowingPosition = isEnRoute;
              } else {
                const isFuture = isBefore(currentTime, deptTime);
                isEnRoute = !isFuture && isBefore(currentTime, arrTime) && s.status !== 'cancelled';
                percent = Math.min(100, Math.max(0, ((currentTime.getTime() - deptTime.getTime()) / totalDuration) * 100));
                isShowingPosition = isEnRoute;
              }

              return (
                <motion.div key={s.id} variants={itemVariants} className={cn(
                  "bento-card group h-full flex flex-col justify-between bg-white shadow-xl transition-all",
                  isCancelled && 'opacity-60 grayscale'
                )}>
                  <div>
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-16 h-16 bg-white border border-navy-100 rounded-3xl flex items-center justify-center text-ship-blue group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-navy-100/20">
                        <Clock className="w-8 h-8" />
                      </div>
                      <div className="flex gap-2 relative z-10">
                        <button onClick={() => handleEdit(s)} className="p-3 bg-white hover:bg-navy-100 rounded-2xl text-navy-400 hover:text-navy-900 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id, 'schedules')} className="p-3 bg-white hover:bg-rose-50 rounded-2xl text-navy-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                       <div className="flex justify-between items-center">
                          <span className={cn(
                            "badge-status",
                            isEnRoute ? "bg-blue-50 text-blue-600 border-blue-200 animate-pulse" :
                            s.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse" :
                            s.status === 'delayed' ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" :
                            s.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-200" :
                            "bg-ship-blue/10 text-ship-blue border-ship-blue/20"
                          )}>{isEnRoute ? (language === 'id' ? 'DALAM PERJALANAN' : 'EN ROUTE') : 
                               s.status === 'scheduled' ? (language === 'id' ? 'TERSEDIA' : 'SCHEDULED') :
                               s.status === 'active' ? (language === 'id' ? 'AKTIF' : 'ACTIVE') :
                               s.status === 'delayed' ? (language === 'id' ? 'DELAY / TERTUNDA' : 'DELAYED') :
                               s.status === 'cancelled' ? (language === 'id' ? 'DIBATALKAN' : 'CANCELLED') :
                               s.status}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Okupansi</span>
                            <span className="text-[9px] font-black text-navy-900">
                                {bookings.filter(b => b.scheduleId === s.id && b.status !== 'cancelled').length} / {ship.capacity || 0}
                            </span>
                          </div>
                       </div>
                       {isDelayActive && s.estimatedActiveTime && (
                          <div className="bg-amber-100/50 p-2.5 rounded-xl border border-amber-200 text-left space-y-1">
                             <p className="text-[7.5px] font-black uppercase text-amber-600 tracking-widest leading-none">
                               {language === 'id' ? 'Estimasi Keberangkatan Baru' : 'New Estimated Departure'}
                             </p>
                             <p className="text-[10px] font-black text-amber-900 leading-tight">
                               {format(parseISO(s.estimatedActiveTime), 'EEEE, dd MMMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS })}
                             </p>
                             {delayTimer && (
                               <div className="flex items-center gap-1.5 text-amber-700 font-mono text-[9px] font-black pt-1 border-t border-amber-200/50">
                                 <span className="text-[7px] font-black uppercase text-amber-500 tracking-widest mr-1">
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
                       <h3 className="text-xl font-display font-black text-navy-900 tracking-tighter leading-none">{ship.name}</h3>

                       {s.segments && s.segments.length > 1 ? (
                         <div className="my-3 py-3 px-3 rounded-2xl bg-navy-50/20 border border-navy-100/50 space-y-2 select-none">
                           <span className="text-[7.5px] font-black tracking-widest text-[#001D4A] uppercase block mb-1">
                             📌 {language === 'id' ? 'KAPAL TRANSIT (MULTI-STOP)' : 'TRANSIT SHIP (MULTI-STOP)'}
                           </span>
                           <div className="flex gap-1.5 flex-wrap items-center">
                             {(() => {
                               const stopsList: string[] = [];
                               const firstRoute = getRouteDetails(s.segments[0].routeId);
                               if (firstRoute) stopsList.push(firstRoute.origin);
                               s.segments.forEach((seg: any) => {
                                 const rDet = getRouteDetails(seg.routeId);
                                 if (rDet && !stopsList.includes(rDet.destination)) {
                                   stopsList.push(rDet.destination);
                                 }
                               });
                               return stopsList.map((stopName, sIdx) => (
                                 <React.Fragment key={sIdx}>
                                   {sIdx > 0 && <span className="text-navy-300 text-[8px] font-bold">→</span>}
                                   <span className="text-[9px] font-black text-navy-900 bg-white border border-navy-100 px-2 py-0.5 rounded-md shadow-sm">
                                      {stopName.substring(0, 3).toUpperCase()}
                                   </span>
                                 </React.Fragment>
                               ));
                             })()}
                           </div>
                         </div>
                       ) : null}
                       
                       {isShowingPosition ? (
                          <div className={cn(
                            "py-4 select-none px-3 rounded-2xl border transition-all duration-300",
                            isDelayActive ? "bg-amber-50/30 border-amber-100/30" : "bg-blue-50/30 border-blue-100/30"
                          )}>
                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest leading-none mb-2">
                              <span className={cn("flex items-center gap-1.5", isDelayActive ? "text-amber-600" : "text-blue-600")}>
                                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDelayActive ? "bg-amber-500" : "bg-blue-500 animate-ping")} />
                                {isDelayActive 
                                  ? (language === 'id' ? 'Mundur Posisi Kapal (Delay Cuaca)' : 'Vessel Receding (Weather Delay)') 
                                  : (language === 'id' ? 'Posisi Kapal (Real-time)' : 'Ship Position (Real-time)')}
                              </span>
                              <span className={cn("font-mono text-[9px]", isDelayActive ? "text-amber-700" : "text-blue-700")}>
                                {Math.round(percent)}% {language === 'id' ? 'Selesai' : 'Completed'}
                              </span>
                            </div>
                            <div className={cn("relative w-full h-2 rounded-full border my-2", isDelayActive ? "bg-amber-100/50 border-amber-200/20" : "bg-blue-100/50 border-blue-200/20")}>
                              <div 
                                className={cn(
                                  "absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out",
                                  isDelayActive ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-blue-400 to-ship-blue"
                                )}
                                style={{ width: `${percent}%` }}
                              />
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 ease-out"
                                style={{ left: `${percent}%` }}
                              >
                                <div className={cn(
                                  "w-6 h-6 bg-white border-2 rounded-full flex items-center justify-center shadow-md animate-bounce",
                                  isDelayActive ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                                )}>
                                  <ShipIcon className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                           <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-wider text-navy-400 px-0.5 pt-1 leading-none">
                             <span>{route.origin}</span>
                             <span>{route.destination}</span>
                           </div>
                         </div>
                       ) : (
                         <div className="py-4 px-1 border-y border-navy-100 flex items-center justify-between text-[8px] font-black text-navy-400 tracking-widest uppercase leading-none">
                            <span>{route.origin}</span>
                            <div className="flex-1 mx-3 h-px border-b border-navy-100 relative">
                                <Anchor className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-ship-blue opacity-30" />
                            </div>
                            <span>{route.destination}</span>
                       </div>
                       )}

                       <div className="space-y-2">
                          <div className="flex items-center gap-4 text-[10px] font-black text-navy-900 uppercase tracking-tight leading-none">
                             <span className="text-navy-400 w-16 uppercase text-[8px] tracking-wider">{language === 'id' ? 'Berangkat' : 'Depart'}:</span>
                             <span className="text-ship-blue font-mono">{format(parseISO(s.departureTime), "HH:mm")}</span>
                             <span className="opacity-20">/</span>
                             <span className="text-navy-400">{format(parseISO(s.departureTime), "EEEE, dd MMM yyyy", { locale: language === 'id' ? id : enUS })}</span>
                          </div>
                          {s.arrivalTime && (
                            <div className="flex items-center gap-4 text-[10px] font-black text-navy-900 uppercase tracking-tight leading-none">
                               <span className="text-navy-400 w-16 uppercase text-[8px] tracking-wider">{language === 'id' ? 'Tiba' : 'Arrive'}:</span>
                               <span className="text-ship-blue font-mono">{format(parseISO(s.arrivalTime), "HH:mm")}</span>
                               <span className="opacity-20">/</span>
                               <span className="text-navy-400">{format(parseISO(s.arrivalTime), "EEEE, dd MMM yyyy", { locale: language === 'id' ? id : enUS })}</span>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                     <span className="text-lg font-display font-black text-navy-900">IDR {s.price.toLocaleString()}</span>
                     <button 
                        onClick={() => isCancelled ? updateDoc(doc(db, 'schedules', s.id), { status: 'scheduled' }) : cancelSchedule(s.id)} 
                        className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all leading-none",
                          isCancelled ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "text-navy-300 hover:text-rose-600"
                        )}
                      >
                        {isCancelled ? 'Aktifkan Kembali' : 'Batalkan Sesi'}
                      </button>
                  </div>
                </motion.div>
              );
            })}
            
            {activeTab === 'ships' && ships.map(s => (
              <motion.div key={s.id} variants={itemVariants} className="bento-card group h-full flex flex-col bg-white shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="w-20 h-20 bg-white border border-navy-100 rounded-[2.5rem] flex items-center justify-center text-navy-400 group-hover:text-ship-blue transition-all duration-700 shadow-2xl overflow-hidden relative">
                      <ShipIcon className="w-10 h-10 relative z-10" />
                      <div className="absolute inset-0 bg-gradient-to-br from-ship-blue/10 to-transparent group-hover:opacity-100 opacity-0 transition-opacity" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s)} className="p-3 bg-white hover:bg-navy-100 rounded-2xl text-navy-400 hover:text-navy-900 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id, 'ships')} className="p-3 bg-white hover:bg-rose-50 rounded-2xl text-navy-400 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="text-2xl font-display font-black text-navy-900 tracking-tighter uppercase leading-[0.85] mb-4">{s.name}</h3>
                <div className="space-y-4 mt-auto">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Beban Operasional</span>
                        <span className="text-xs font-black font-mono text-navy-900 tracking-tighter shadow-sm">{s.capacity} Slot</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-navy-100 p-px">
                        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-ship-blue to-navy-900 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                        <span className="badge-status bg-white text-navy-400 border-navy-100 lowercase">v2.1 Kapal</span>
                        <span className={cn(
                          "badge-status",
                          s.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          s.status === 'docking' ? "bg-amber-50 text-amber-600 border-amber-200" :
                          "bg-rose-50 text-rose-600 border-rose-200"
                        )}>{s.status}</span>
                    </div>
                </div>
              </motion.div>
            ))}

            {activeTab === 'routes' && routes.map(r => (
              <motion.div key={r.id} variants={itemVariants} className="bento-card group flex flex-col justify-between overflow-hidden bg-white shadow-xl relative min-h-[200px]">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-700 pointer-events-none">
                    <MapPin className="w-48 h-48 text-navy-900" />
                </div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-white border border-navy-100 rounded-xl flex items-center justify-center text-navy-400 group-hover:text-ship-blue transition-all shadow-sm">
                         <MapPin className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(r)} className="p-2.5 bg-white backdrop-blur shadow-sm hover:bg-white rounded-xl text-navy-400 hover:text-navy-900 transition-all border border-navy-100"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id, 'routes')} className="p-2.5 bg-white backdrop-blur shadow-sm hover:bg-rose-50 rounded-xl text-navy-400 hover:text-rose-600 transition-all border border-navy-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                   <h3 className="text-xl font-display font-black text-navy-900 tracking-tighter uppercase mb-6 flex items-center gap-3 leading-none">
                        {r.origin} <ChevronRight className="w-5 h-5 text-ship-blue opacity-30" /> {r.destination}
                   </h3>
                </div>
                <div className="bg-white backdrop-blur-md p-4 rounded-2xl border border-navy-100 group-hover:border-navy-200 transition-all relative z-10 shadow-inner">
                    <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">Varian Harga</p>
                    <p className="text-lg font-display font-black text-navy-900 tracking-tighter">Rp {r.basePrice.toLocaleString('id-ID')}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isAdding && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white border border-navy-100 rounded-3xl w-full max-w-xl overflow-hidden shadow-5xl my-12">
            <div className="bg-ship-blue p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10 bg-navy-900 w-32 h-32 rounded-full" />
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 opacity-60 text-white/70 leading-none">Terminal Keamanan</p>
                <h2 className="text-2xl font-display font-black tracking-tighter uppercase leading-none">{editingItem ? 'Edit' : 'Input'} {activeTab.slice(0,-1)}</h2>
              </div>
              <button 
                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                className="relative z-10 p-3 bg-navy-900 text-white rounded-xl hover:rotate-90 transition-transform duration-500 shadow-xl"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="space-y-6">
                {activeTab === 'ships' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Nama Kapal</label>
                      <input name="name" defaultValue={editingItem?.name} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase tracking-widest focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200" placeholder="MF-01 PHOENIX" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Kapasitas</label>
                      <input name="capacity" type="number" defaultValue={editingItem?.capacity} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200" placeholder="280" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Status Kapal</label>
                      <select name="status" defaultValue={editingItem?.status || 'active'} className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all appearance-none shadow-inner">
                        <option value="active" className="text-[10px]">Aktif / Siaga</option>
                        <option value="docking" className="text-[10px]">Docking / Perbaikan</option>
                        <option value="maintenance" className="text-[10px]">Maintenance</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'routes' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Asal</label>
                            <input name="origin" defaultValue={editingItem?.origin} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200" placeholder="PADANG" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Tujuan</label>
                            <input name="destination" defaultValue={editingItem?.destination} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200" placeholder="SIBERUT" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Harga Dasar (IDR)</label>
                      <input name="basePrice" type="number" defaultValue={editingItem?.basePrice} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200" placeholder="250000" />
                    </div>
                  </>
                )}

                {activeTab === 'schedules' && (
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Kapal</label>
                            <select name="shipId" defaultValue={editingItem?.shipId} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all appearance-none shadow-inner">
                                {ships.map(s => (
                                  <option key={s.id} value={s.id} className="bg-white text-[10px]">
                                    {s.name} ({s.status.toUpperCase()})
                                  </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Pilih Rute Perjalanan</label>
                           <select 
                             value={selectedRouteId} 
                             onChange={(e) => {
                               setSelectedRouteId(e.target.value);
                             }}
                             required 
                             className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all appearance-none shadow-inner"
                           >
                             <option value="" disabled className="text-[10px]">-- Pilih Rute --</option>
                             {routes.map(r => (
                               <option key={r.id} value={r.id} className="bg-white text-[10px]">
                                 {r.origin} → {r.destination}
                               </option>
                             ))}
                           </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Status Jadwal</label>
                          <select name="status" defaultValue={editingItem?.status || 'scheduled'} className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all appearance-none shadow-inner">
                              <option value="scheduled" className="text-[10px]">Tersedia</option>
                              <option value="active" className="text-[10px]">Aktif / Boarding</option>
                              <option value="delayed" className="text-[10px]">Delay / Tunda</option>
                              <option value="cancelled" className="text-[10px]">Dibatalkan</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Estimasi Aktif (Jika Delay)</label>
                          <input name="estimatedActiveTime" type="datetime-local" defaultValue={editingItem?.estimatedActiveTime} className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-[10px] font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all" />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-navy-100">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Waktu Berangkat</label>
                            <input
                              name="departureTime"
                              type="datetime-local"
                              defaultValue={editingItem?.departureTime}
                              required
                              className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-[10px] font-black text-navy-900 focus:border-ship-blue/50 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Waktu Tiba</label>
                            <input
                              name="arrivalTime"
                              type="datetime-local"
                              defaultValue={editingItem?.arrivalTime}
                              required
                              className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-[10px] font-black text-navy-900 focus:border-ship-blue/50 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Harga Tiket (IDR)</label>
                          <input
                            name="price"
                            type="number"
                            defaultValue={editingItem?.price}
                            required
                            className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black focus:border-ship-blue/50 outline-none"
                          />
                        </div>
                      </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-4">
                  <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingItem(null); }}
                  className="flex-1 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-navy-400 hover:bg-white transition-all font-display"
                  >
                    Batal
                  </button>
                  <button type="submit" className="flex-[2] bg-ship-blue hover:bg-navy-900 text-white font-black uppercase text-[10px] tracking-[0.2em] py-4 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                    {editingItem ? 'Perbarui' : 'Simpan'} <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* LOKET PASSENGER INPUT MODAL */}
      <AnimatePresence>
        {isAddingLoketPassenger && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-navy-100 w-full max-w-2xl overflow-hidden shadow-5xl max-h-[90vh] flex flex-col"
            >
              <div className="bg-ship-blue p-8 text-white relative flex justify-between items-start flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tighter uppercase leading-none mb-2 text-white">
                    {language === 'id' ? 'INPUT DATA PENUMPANG LOKET' : 'REGISTER COUNTER PASSENGER'}
                  </h2>
                  <p className="text-[9px] font-black uppercase text-white/75 tracking-[0.2em] italic">
                    {language === 'id' ? 'Untuk Pemesanan Offline/On-the-spot di Pelabuhan' : 'For On-Site / Walk-in Walk-out Port Purchases'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddingLoketPassenger(false)} 
                  className="p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all flex items-center justify-center"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitLoketPassenger} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Select Schedule */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block ml-1">
                    {language === 'id' ? 'Pilih Jadwal Keberangkatan Kapal (Hanya Jadwal Aktif)' : 'Select Departure Boat Schedule (Active Only)'}
                  </label>
                  <div className="relative">
                    <select 
                      required 
                      value={loketForm.scheduleId}
                      onChange={e => setLoketForm(prev => ({ ...prev, scheduleId: e.target.value }))}
                      className="w-full bg-white border border-navy-100 px-6 py-4 rounded-2xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all uppercase appearance-none cursor-pointer shadow-inner font-sans"
                    >
                      <option value="">-- {language === 'id' ? 'PILIH JADWAL YANG AKTIF' : 'CHOOSE ACTIVE SCHEDULE'} --</option>
                      {schedules
                        .filter(s => {
                          if (s.status === 'cancelled') return false;
                          const deptTime = parseISO(s.departureTime);
                          const isFuture = isBefore(currentTime, deptTime);
                          return isFuture; // Only schedules whose departure is in the future (not en-route, not past)
                        })
                        .map(s => {
                          const route = getRouteDetails(s.routeId);
                          const ship = getShipDetails(s.shipId);
                          const deptTime = parseISO(s.departureTime);
                          const bookedCount = bookings.filter(b => b.scheduleId === s.id && b.status !== 'cancelled').length;
                          const totalSeats = s.capacity || ship?.capacity || 280;
                          return (
                            <option key={s.id} value={s.id}>
                              [{ship?.name || 'KAPAL'}] {route?.origin} - {route?.destination} ({format(deptTime, 'dd MMM yyyy HH:mm')}) - Rp {s.price?.toLocaleString()} ({bookedCount}/{totalSeats} Kursi)
                            </option>
                          );
                        })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-ship-blue">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Multiple Passengers Area */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-100">
                    <h3 className="text-[10px] font-black text-navy-900 uppercase tracking-widest">
                      👥 {language === 'id' ? 'DAFTAR PASSENGER / PENUMPANG' : 'PASSENGERS LIST'} ({loketForm.passengers.length})
                    </h3>
                    <button
                      type="button"
                      onClick={addPassengerRow}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 leading-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> {language === 'id' ? 'TAMBAH BARIS PENUMPANG' : 'ADD PASSENGER ROW'}
                    </button>
                  </div>

                  <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loketForm.passengers.map((p, idx) => (
                      <div key={idx} className="p-6 bg-slate-50/50 hover:bg-slate-50 border border-navy-100 rounded-3xl relative space-y-4 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-ship-blue uppercase tracking-widest">
                            {language === 'id' ? `PENUMPANG #${idx + 1}` : `PASSENGER #${idx + 1}`}
                          </span>
                          {loketForm.passengers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePassengerRow(idx)}
                              className="p-1 px-2.5 text-rose-500 hover:text-white hover:bg-rose-500 border border-thin border-rose-200 hover:border-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 flex items-center gap-1 leading-none"
                            >
                              <XIcon className="w-2.5 h-2.5" /> {language === 'id' ? 'HAPUS' : 'DELETE'}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-[8px] font-black text-navy-400 uppercase tracking-widest block ml-1">
                              {language === 'id' ? 'Nama Lengkap (Sesuai KTP)' : 'Full Name (As ID/Passport)'} <span className="text-rose-500">*</span>
                            </label>
                            <input 
                              required 
                              type="text" 
                              value={p.passengerName}
                              onChange={e => updatePassengerField(idx, 'passengerName', e.target.value)}
                              className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200 uppercase"
                              placeholder={language === 'id' ? "NAMA LENGKAP" : "FULL NAME"}
                            />
                          </div>

                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-[8px] font-black text-navy-400 uppercase tracking-widest block ml-1">
                              {language === 'id' ? 'NIK / Nomor Identitas KTP' : 'ID Number (NIK)'} <span className="text-rose-500">*</span>
                            </label>
                            <input 
                              required 
                              type="text" 
                              value={p.passengerId}
                              onChange={e => updatePassengerField(idx, 'passengerId', e.target.value)}
                              className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 font-mono focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200"
                              placeholder="NIK PENUMPANG"
                            />
                          </div>

                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-[8px] font-black text-navy-400 uppercase tracking-widest block ml-1">
                              {language === 'id' ? 'Alamat Email (Dibuat otomatis bila kosong)' : 'Email Address (Auto generated if empty)'}
                            </label>
                            <input 
                              type="email" 
                              value={p.passengerEmail}
                              onChange={e => updatePassengerField(idx, 'passengerEmail', e.target.value)}
                              className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200 lowercase"
                              placeholder="loket@mentawaifast.com"
                            />
                          </div>

                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-[8px] font-black text-navy-400 uppercase tracking-widest block ml-1">
                              {language === 'id' ? 'No Telepon/WhatsApp' : 'Phone / WA Number'}
                            </label>
                            <input 
                              type="tel" 
                              value={p.passengerPhone}
                              onChange={e => updatePassengerField(idx, 'passengerPhone', e.target.value)}
                              className="w-full bg-white border border-navy-100 px-4 py-3 rounded-xl text-xs font-black text-navy-900 font-mono focus:border-ship-blue/50 outline-none transition-all placeholder:text-navy-200"
                              placeholder="08XXXXXXXXXX"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block ml-1">
                    {language === 'id' ? 'Pilih Metode Pembayaran' : 'Choose Payment Method'}
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'cash', label: '💵 CASH / TUNAI', desc: 'Bayar Langsung' },
                      { id: 'bank', label: '🏦 BANK', desc: {bankSettings: bankSettings.bankName}.bankSettings || 'BANK MANDIRI' },
                      { id: 'ewallet', label: '📱 E-WALLET / QRIS', desc: {bankSettings: bankSettings.ewalletName}.bankSettings || 'DANA/OVO/QRIS' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLoketForm(prev => ({ ...prev, paymentMethod: m.id }))}
                        className={cn(
                          "p-4 rounded-2xl border text-left flex flex-col justify-between transition-all",
                          loketForm.paymentMethod === m.id 
                            ? "bg-ship-blue border-ship-blue text-white shadow-lg scale-[1.02]" 
                            : "bg-white border-navy-100 text-navy-900 hover:bg-navy-50"
                        )}
                      >
                        <span className="text-[10px] font-black tracking-wider uppercase leading-none mb-2">{m.label}</span>
                        <span className={cn("text-[8px] font-black uppercase tracking-tight truncate leading-none block w-full", loketForm.paymentMethod === m.id ? "text-white/80" : "text-navy-400")}>{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-navy-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddingLoketPassenger(false)}
                    className="flex-1 py-5 border border-navy-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-navy-400 hover:bg-navy-50 transition-colors leading-none"
                  >
                    {language === 'id' ? 'BATAL' : 'CANCEL'}
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="flex-1 bg-ship-blue hover:bg-navy-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2 leading-none"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isProcessing ? (language === 'id' ? 'MEMPROSES...' : 'PROCESSING...') : (language === 'id' ? 'SIMPAN TIKET LOKET' : 'SAVE COUNTER TICKET')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmConfig.show && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] border border-navy-100 w-full max-w-sm overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]"
            >
              <div className={cn(
                "p-10 text-center",
                confirmConfig.type === 'danger' ? "bg-rose-50/50" : "bg-ship-blue/5"
              )}>
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl skew-x-[-4deg]",
                  confirmConfig.type === 'danger' ? "bg-rose-500 text-white" : "bg-ship-blue text-white"
                )}>
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none mb-4 italic">{confirmConfig.title}</h3>
                <p className="text-[12px] font-bold text-navy-500 leading-relaxed uppercase tracking-tight opacity-70">{confirmConfig.message}</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4 bg-white">
                <button 
                  onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
                  className="bg-navy-50 text-navy-900 px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-navy-100 transition-all leading-none italic"
                >
                  BATAL
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  disabled={isProcessing}
                  className={cn(
                    "px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl text-white leading-none italic flex items-center justify-center gap-2",
                    confirmConfig.type === 'danger' ? "bg-rose-600 hover:bg-rose-700" : "bg-ship-blue hover:bg-navy-900"
                  )}
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SAYA MENGERTI'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-End Boarding Pass Modal for Admin */}
      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 bg-navy-900/90 backdrop-blur-[60px] z-[400] flex items-center justify-center p-4">
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
                                <h3 className="text-4xl font-display font-black text-navy-900 italic leading-none">
                                  {getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId || '').origin.substring(0,3)}
                                </h3>
                                <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest italic mt-2 inline-block leading-none text-left">
                                  {getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId || '').origin}
                                </span>
                             </div>
                             <div className="flex-1 flex flex-col items-center px-6">
                                <div className="w-full h-px border-b border-navy-200 relative">
                                    <Ship className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-ship-blue bg-white px-2" />
                                </div>
                             </div>
                             <div className="text-center">
                                <h3 className="text-4xl font-display font-black text-navy-900 italic leading-none">
                                  {getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId || '').destination.substring(0,3)}
                                </h3>
                                <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest italic mt-2 inline-block leading-none text-left">
                                  {getRouteDetails(viewingTicket.routeId || schedules.find(s => s.id === viewingTicket.scheduleId)?.routeId || '').destination}
                                </span>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-12 gap-x-12">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Identitas Manifest' : 'Manifest Identity'}</label>
                                <p className="text-lg font-black text-navy-900 tracking-tight leading-tight text-left">{toTitleCase(viewingTicket.passengerName)}</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Nama Kapal' : 'Ship Name'}</label>
                                <p className="text-lg font-black text-ship-blue tracking-tight leading-tight uppercase">
                                  {getShipDetails(schedules.find(s => s.id === viewingTicket.scheduleId)?.shipId || '').name}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Waktu Berangkat' : 'Departure Time'}</label>
                                <p className="text-md font-black text-navy-900 tracking-tight leading-tight uppercase">
                                    {viewingTicket.departureTime 
                                      ? format(new Date(viewingTicket.departureTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS }) 
                                      : schedules.find(s => s.id === viewingTicket.scheduleId)?.departureTime
                                        ? format(new Date(schedules.find(s => s.id === viewingTicket.scheduleId)!.departureTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS })
                                        : '-'}
                                </p>
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Waktu Tiba' : 'Arrival Time'}</label>
                                <p className="text-md font-black text-navy-900 tracking-tight leading-tight uppercase">
                                    {viewingTicket.arrivalTime 
                                      ? format(new Date(viewingTicket.arrivalTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS }) 
                                      : schedules.find(s => s.id === viewingTicket.scheduleId)?.arrivalTime
                                        ? format(new Date(schedules.find(s => s.id === viewingTicket.scheduleId)!.arrivalTime), 'EEEE, dd MMM yyyy • HH:mm', { locale: language === 'id' ? id : enUS })
                                        : '-'}
                                </p>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Status Operasional' : 'Operational Status'}</label>
                                <p className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  (() => {
                                    const sched = schedules.find(s => s.id === viewingTicket.scheduleId);
                                    const isDelayActive = sched?.status === 'delayed' && sched.estimatedActiveTime && isBefore(currentTime, parseISO(sched.estimatedActiveTime));
                                    return isDelayActive;
                                  })() ? "text-amber-500" : "text-emerald-500"
                                )}>
                                    {(() => {
                                      const sched = schedules.find(s => s.id === viewingTicket.scheduleId);
                                      const isDelayActive = sched?.status === 'delayed' && sched.estimatedActiveTime && isBefore(currentTime, parseISO(sched.estimatedActiveTime));
                                      return isDelayActive ? (language === 'id' ? 'DELAY / TERTUNDA' : 'DELAYED') : (language === 'id' ? 'AKTIF / NORMAL' : 'ACTIVE / NORMAL');
                                    })()}
                                </p>
                            </div>
                            {(() => {
                              const sched = schedules.find(s => s.id === viewingTicket.scheduleId);
                              const isDelayActive = sched?.status === 'delayed' && sched.estimatedActiveTime && isBefore(currentTime, parseISO(sched.estimatedActiveTime));
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
    </div>
  );
}
