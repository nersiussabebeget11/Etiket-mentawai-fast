import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, subDays, isBefore } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, toTitleCase } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
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

interface AdminViewProps {
  key?: string;
  activeTab: 'dashboard' | 'schedules' | 'ships' | 'routes' | 'reports' | 'settings' | 'passengers' | 'maintenance';
  setActiveTab: (tab: 'dashboard' | 'schedules' | 'ships' | 'routes' | 'reports' | 'settings' | 'passengers' | 'maintenance') => void;
}

export function AdminView({ activeTab, setActiveTab }: AdminViewProps) {
  const [ships, setShips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bankSettings, setBankSettings] = useState<any>({
    bankName: 'BANK MANDIRI',
    accountNumber: '111-00123-4567-8',
    accountHolder: 'Mentawai Fast Owner'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
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
        const route = {
          origin: formData.get('origin'),
          destination: formData.get('destination'),
          basePrice: parseInt(formData.get('basePrice') as string)
        };
        if (editingItem) {
          await updateDoc(doc(db, 'routes', editingItem.id), route);
        } else {
          await addDoc(collection(db, 'routes'), route);
        }
      } else if (activeTab === 'schedules') {
        const schedule: any = {
          shipId: formData.get('shipId'),
          routeId: formData.get('routeId'),
          departureTime: formData.get('departureTime'),
          arrivalTime: formData.get('arrivalTime'),
          price: parseInt(formData.get('price') as string),
          status: formData.get('status') || (editingItem ? editingItem.status : 'scheduled'),
          bookedSeats: editingItem ? (editingItem.bookedSeats || 0) : 0
        };
        
        if (formData.get('status') === 'delayed') {
          schedule.estimatedActiveTime = formData.get('estimatedActiveTime');
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
              onClick={() => setIsAdding(true)}
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
          </motion.div>
        )}

        {activeTab === 'passengers' && (
          <motion.div key="passengers" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bento-card !p-0 overflow-hidden bg-white shadow-xl">
            <div className="p-10 border-b border-navy-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h2 className="text-2xl font-display font-black text-navy-900 tracking-tighter uppercase italic">Registry Manifest</h2>
                <p className="text-[10px] font-black text-ship-blue uppercase tracking-[0.3em] mt-3 uppercase italic">{passengerData.length} Penumpang Terindex</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
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
                      {['Info Penumpang', 'Komunikasi', 'Vektor Rute', 'Kursi', 'Status'].map(h => (
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
          <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl">
            <div className="bento-card p-8 bg-white shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-ship-blue p-4 rounded-2xl text-white shadow-[0_10px_30px_rgba(0,74,153,0.3)] shadow-sm">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black text-navy-900 tracking-tighter uppercase leading-none">Kas Negara</h2>
                  <p className="text-navy-400 text-[9px] font-black uppercase tracking-[0.2em] mt-2 italic text-white/50">Gateway Publik</p>
                </div>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-navy-500 uppercase tracking-[0.3em] font-display ml-1 leading-none">Institusi Bank</label>
                    <input name="bankName" defaultValue={bankSettings.bankName} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-ship-blue/50 transition-all outline-none text-navy-900 focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-navy-500 uppercase tracking-[0.3em] font-display ml-1 leading-none">Identitas Rekening</label>
                    <input name="accountNumber" defaultValue={bankSettings.accountNumber} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-lg font-black focus:border-ship-blue/50 transition-all outline-none text-navy-900 font-mono tracking-widest focus:bg-white shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-navy-500 uppercase tracking-[0.3em] font-display ml-1 leading-none">Pemilik Rekening</label>
                    <input name="accountHolder" defaultValue={bankSettings.accountHolder} required className="w-full bg-white border-navy-100 border px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-ship-blue/50 transition-all outline-none text-navy-900 focus:bg-white" />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={savingSettings} className="w-full bg-navy-900 hover:bg-ship-blue text-white font-black uppercase text-[10px] tracking-[0.3em] py-4 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                    {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 shadow-sm" />}
                    {savingSettings ? 'MEMPROSES...' : 'SIMPAN PERUBAHAN'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {['schedules', 'ships', 'routes'].includes(activeTab) && (
          <motion.div key={activeTab} variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {activeTab === 'schedules' && schedules
              .filter(s => isBefore(new Date(), parseISO(s.departureTime)) || s.status === 'cancelled')
              .map(s => {
              const route = getRouteDetails(s.routeId);
              const ship = getShipDetails(s.shipId);
              const isCancelled = s.status === 'cancelled';
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
                            s.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse" :
                            s.status === 'delayed' ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" :
                            s.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-200" :
                            "bg-ship-blue/10 text-ship-blue border-ship-blue/20"
                          )}>{s.status}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Okupansi</span>
                            <span className="text-[9px] font-black text-navy-900">
                                {bookings.filter(b => b.scheduleId === s.id && b.status !== 'cancelled').length} / {ship.capacity || 0}
                            </span>
                          </div>
                       </div>
                       {s.status === 'delayed' && s.estimatedActiveTime && (
                         <div className="bg-white p-2 rounded-xl border border-amber-100">
                            <p className="text-[7px] font-black uppercase text-amber-600 tracking-widest leading-none mb-1">Estimasi Aktif</p>
                            <p className="text-[9px] font-black text-amber-900">{format(parseISO(s.estimatedActiveTime), 'dd MMM HH:mm')}</p>
                         </div>
                       )}
                       <h3 className="text-xl font-display font-black text-navy-900 tracking-tighter leading-none">{ship.name}</h3>
                       
                       <div className="py-4 px-1 border-y border-navy-100 flex items-center justify-between text-[8px] font-black text-navy-400 tracking-widest uppercase leading-none">
                            <span>{route.origin}</span>
                            <div className="flex-1 mx-3 h-px border-b border-navy-100 relative">
                                <Anchor className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-ship-blue opacity-30" />
                            </div>
                            <span>{route.destination}</span>
                       </div>

                       <div className="flex items-center gap-4 text-[10px] font-black text-navy-900 uppercase tracking-tight leading-none">
                          <span className="text-ship-blue font-mono">{format(parseISO(s.departureTime), "HH:mm")}</span>
                          <span className="opacity-20">/</span>
                          <span className="text-navy-400">{format(parseISO(s.departureTime), "EEEE, dd MMM yyyy", { locale: id })}</span>
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
                            <input name="origin" defaultValue={editingItem?.origin} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all" placeholder="PADANG" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Tujuan</label>
                            <input name="destination" defaultValue={editingItem?.destination} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all" placeholder="SIBERUT" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Harga Dasar (IDR)</label>
                      <input name="basePrice" type="number" defaultValue={editingItem?.basePrice} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black focus:border-ship-blue/50 outline-none transition-all" placeholder="250000" />
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
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Rute</label>
                            <select name="routeId" defaultValue={editingItem?.routeId} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black uppercase focus:border-ship-blue/50 outline-none transition-all appearance-none shadow-inner">
                                {routes.map(r => <option key={r.id} value={r.id} className="bg-white text-[10px]">{r.origin} → {r.destination}</option>)}
                            </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Berangkat</label>
                            <input name="departureTime" type="datetime-local" defaultValue={editingItem?.departureTime} required className="w-full bg-white border border-navy-100 rounded-xl px-4 py-4 text-[10px] font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Sampai</label>
                            <input name="arrivalTime" type="datetime-local" defaultValue={editingItem?.arrivalTime} required className="w-full bg-white border border-navy-100 rounded-xl px-4 py-4 text-[10px] font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest ml-1 leading-none">Harga (IDR)</label>
                        <input name="price" type="number" defaultValue={editingItem?.price} required className="w-full bg-white border border-navy-100 rounded-xl px-6 py-4 text-navy-900 font-black focus:border-ship-blue/50 outline-none transition-all" placeholder="250000" />
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
                          <input name="estimatedActiveTime" type="datetime-local" defaultValue={editingItem?.estimatedActiveTime} className="w-full bg-white border border-navy-100 rounded-xl px-4 py-4 text-[10px] font-black text-navy-900 focus:border-ship-blue/50 outline-none transition-all" />
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
    </div>
  );
}
