/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { Sidebar, Header } from './components/Navbar';
import { UserView } from './components/UserView';
import { AdminView } from './components/AdminView';
import { BusinessPlanReport } from './components/BusinessPlanReport';
import { Layout } from './components/Layout';
import { Loader2, Anchor, ChevronRight, AlertCircle, Calendar, MapPin, Clock, ArrowRight, Ship, Bell, Compass, ShieldCheck, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from './lib/firebase-errors';
import { Language, translations } from './lib/translations';
import { format, parseISO, isBefore } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { cn } from './lib/utils';

// @ts-ignore
import slide1 from './assets/images/mentawai_fast_1_1779263670466.png';
// @ts-ignore
import slide2 from './assets/images/mentawai_fast_2_1779263686402.png';
// @ts-ignore
import slide3 from './assets/images/mentawai_fast_3_1779263704224.png';
// @ts-ignore
import slide4 from './assets/images/mentawai_fast_4_1779263721871.png';
// @ts-ignore
import slide5 from './assets/images/mentawai_fast_5_1779265532488.png';
// @ts-ignore
import slide6 from './assets/images/mentawai_fast_6_1779265550166.png';
// @ts-ignore
import slide7 from './assets/images/mentawai_fast_7_1779265568768.png';
// @ts-ignore
import slide8 from './assets/images/mentawai_fast_8_1779265587664.png';
// @ts-ignore
import slide9 from './assets/images/mentawai_fast_9_1779265604137.png';
// @ts-ignore
import slide10 from './assets/images/mentawai_fast_10_1779265624749.png';
// @ts-ignore
import slide11 from './assets/images/mentawai_fast_11_1779265643408.png';
// @ts-ignore
import slide12 from './assets/images/mentawai_fast_12_1779265660172.png';
// @ts-ignore
import slide13 from './assets/images/mentawai_fast_13_1779265677772.png';
// @ts-ignore
import slide14 from './assets/images/mentawai_fast_14_1779265697141.png';

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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('search');
  const [showPublicBusinessPlan, setShowPublicBusinessPlan] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('id');
  const [currentTime, setCurrentTime] = useState(new Date());
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (user) return;
    setSchedulesLoading(true);
    const unsubSchedules = onSnapshot(query(collection(db, 'schedules')), (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSchedulesLoading(false);
    }, (err) => console.error("Error retrieving schedules on landing page:", err));

    const fetchMetadata = async () => {
      try {
        const [shipsData, routesData] = await Promise.all([
          getDocs(collection(db, 'ships')),
          getDocs(collection(db, 'routes'))
        ]);
        setShips(shipsData.docs.map(d => ({ id: d.id, ...d.data() })));
        setRoutes(routesData.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error retrieving metadata on landing page:", err);
      }
    };
    fetchMetadata();

    return () => {
      unsubSchedules();
    };
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          setShowPublicBusinessPlan(false);
          // Check/Create user in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (e: any) {
            console.error("Firestore getDoc Error:", e);
            // Don't throw here, just try to continue or set a default role
            setRole('member');
            setLoading(false);
            return;
          }
          
          if (!userSnap.exists()) {
            const isRequestor = currentUser.email === 'leggeu29@gmail.com';
            const newUser = {
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              role: isRequestor ? 'admin' : 'member'
            };
            try {
              await setDoc(userRef, newUser);
            } catch (e: any) {
              console.error("Firestore setDoc Error:", e);
            }
            setRole(newUser.role);
            setActiveTab(newUser.role === 'admin' ? 'schedules' : 'search');
          } else {
            const userData = userSnap.data();
            if (currentUser.email === 'leggeu29@gmail.com' && userData.role !== 'admin') {
              try {
                await setDoc(userRef, { ...userData, role: 'admin' }, { merge: true });
              } catch (e) {
                console.error("Auto-promote error:", e);
              }
              setRole('admin');
              setActiveTab('schedules');
            } else {
              setRole(userData.role);
              setActiveTab(userData.role === 'admin' ? 'schedules' : 'search');
            }
          }
        } else {
          setRole(null);
        }
      } catch (error: any) {
        console.error("Auth State Check Error:", error);
        setErrorStatus("Terjadi kesalahan saat verifikasi akun. Periksa koneksi internet Anda.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-6">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-navy-100 border-t-ship-blue rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-ship-light rounded-full flex items-center justify-center font-black text-ship-blue text-xs uppercase animate-pulse shadow-sm">MF</div>
            </div>
        </div>
        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] animate-pulse">Menghubungkan Pulau...</p>
      </div>
    );
  }

  return (
    <Layout sidebar={user ? <Sidebar user={user} role={role} activeTab={activeTab} setActiveTab={setActiveTab} language={language} setLanguage={setLanguage} /> : undefined}>
      <Header user={user} role={role} activeTab={activeTab} setActiveTab={setActiveTab} language={language} setLanguage={setLanguage} />
      <div className="flex-1 overflow-y-auto pt-24 md:pt-32 pb-12 px-4 md:px-8">
        <AnimatePresence mode="wait">
          {!user ? (
            showPublicBusinessPlan ? (
              <motion.div
                key="public-business-plan"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="max-w-6xl mx-auto py-6"
              >
                <div className="mb-6 text-left">
                  <button 
                    onClick={() => setShowPublicBusinessPlan(false)}
                    className="px-6 py-2.5 rounded-xl border border-navy-200 text-xs font-black uppercase text-navy-900 bg-white hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                  >
                    ← {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
                  </button>
                </div>
                <BusinessPlanReport language={language} />
              </motion.div>
            ) : (
              <motion.div
                key="landing"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="max-w-6xl mx-auto py-12 text-center"
            >
              <div className="mb-20">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block px-5 py-2 bg-white border border-navy-100 text-ship-blue rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-sm"
                >
                  {t.landing_premium_exp}
                </motion.div>
                <h1 className="mb-10 text-center italic font-display">
                  <span className="block text-xs sm:text-sm md:text-base lg:text-lg font-bold font-sans text-navy-500 tracking-[0.25em] not-italic mb-4 whitespace-nowrap">
                    {t.landing_title_1}
                  </span>
                  <span className="block text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-ship-blue to-navy-700 leading-[0.9] tracking-tighter">
                    {t.landing_title_2}
                  </span>
                </h1>
                
                {errorStatus && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 justify-center text-red-600 text-[10px] font-black uppercase tracking-widest text-center"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errorStatus}
                  </motion.div>
                )}

                <p className="text-lg md:text-xl text-navy-500 max-w-3xl mx-auto leading-relaxed font-light tracking-wide uppercase font-black text-xs">
                  {t.landing_subtitle}
                </p>
              </div>

              {/* Interactive Image Slideshow Slider */}
              <div className="relative rounded-[2rem] overflow-hidden bg-slate-950 text-white min-h-[360px] md:min-h-[460px] flex flex-col justify-between border border-slate-800 shadow-2xl group w-full mb-20 text-left">
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
                        alt="Mentawai Fast Landing Slideshow" 
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

                {/* Content Overlay */}
                <div className="relative z-10 p-8 md:p-12 flex flex-col justify-between h-full flex-grow gap-8">
                  {/* Top Header Row with Badge */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4 pb-4 border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge-status bg-white/10 text-white border-white/20 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase backdrop-blur-md animate-pulse font-sans">
                        {language === 'id' ? 'ARMADA UTAMA' : 'FLAGSHIP VESSEL'}
                      </span>
                      <span className="text-[10px] font-mono tracking-widest text-white/50 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                        MV MENTAWAI FAST
                      </span>
                    </div>
                  </div>

                  {/* Caption with slide transition animations at the bottom half */}
                  <div className="pt-16 mt-auto">
                    <div className="max-w-3xl space-y-2 mt-auto">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentSlide}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.5 }}
                        >
                          <span className="text-cyan-400 text-[10.5px] font-black uppercase tracking-[0.25em] block mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                            {slides[currentSlide][language as 'id' | 'en']?.title || slides[currentSlide]['en'].title}
                          </span>
                          <h3 className="text-xl md:text-3xl font-display font-black tracking-tight text-white uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                            {slides[currentSlide][language as 'id' | 'en']?.subtitle || slides[currentSlide]['en'].subtitle}
                          </h3>
                          <p className="text-sm text-white/95 max-w-2xl mt-2 leading-relaxed font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                            {slides[currentSlide][language as 'id' | 'en']?.desc || slides[currentSlide]['en'].desc}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                 {[
                    { label: t.landing_feat_1_title, desc: t.landing_feat_1_desc, icon: Compass },
                    { label: t.landing_feat_2_title, desc: t.landing_feat_2_desc, icon: ShieldCheck },
                    { label: t.landing_feat_3_title, desc: t.landing_feat_3_desc, icon: Ticket }
                 ].map((feat, i) => {
                    const IconComponent = feat.icon;
                    return (
                      <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + (i * 0.1) }}
                          key={i} 
                          className="glass-card rounded-4xl p-8 border border-navy-100 hover:border-ship-blue/30 transition-all group cursor-default shadow-lg flex flex-col items-center text-center"
                      >
                          <div className="w-12 h-12 bg-ship-blue/5 rounded-2xl flex items-center justify-center mb-6 text-ship-blue group-hover:scale-110 transition-transform">
                              <IconComponent className="w-6 h-6" />
                          </div>
                          <h3 className="text-navy-900 font-black text-sm tracking-widest mb-2 italic uppercase">{feat.label}</h3>
                          <p className="text-xs text-navy-400 font-bold leading-relaxed uppercase tracking-widest">{feat.desc}</p>
                      </motion.div>
                    );
                 })}
              </div>

              {/* Active Sailing Schedules Section */}
              {(() => {
                const getRouteDetails = (routeId: string) => routes.find(r => r.id === routeId) || { origin: '...', destination: '...' };
                const getShipDetails = (shipId: string) => ships.find(s => s.id === shipId) || { name: '...', capacity: 100, status: '...' };
                const activeSchedules = schedules.filter(s => {
                  const ship = getShipDetails(s.shipId);
                  const now = currentTime;
                  const deptTime = parseISO(s.departureTime);
                  const arrTime = s.arrivalTime ? parseISO(s.arrivalTime) : new Date(deptTime.getTime() + 4 * 60 * 60 * 1000); // assume 4 hours
                  const totalDuration = arrTime.getTime() - deptTime.getTime();

                  const isDelayedStatus = s.status === 'delayed';
                  const delayEnd = s.estimatedActiveTime ? parseISO(s.estimatedActiveTime) : null;
                  const isDelayActive = isDelayedStatus && delayEnd && isBefore(now, delayEnd);
                  const isDelayEnded = isDelayedStatus && delayEnd && !isBefore(now, delayEnd);

                  let isEnRoute = false;

                  if (isDelayActive) {
                    isEnRoute = false;
                  } else if (isDelayEnded) {
                    isEnRoute = isBefore(now, arrTime);
                  } else {
                    const isFuture = isBefore(now, deptTime);
                    isEnRoute = !isFuture && isBefore(now, arrTime) && s.status !== 'cancelled';
                  }

                  const isFuture = isBefore(now, deptTime);

                  return ship.status !== 'docking' && 
                         ['scheduled', 'active', 'delayed'].includes(s.status) && 
                         (isFuture || isEnRoute || isDelayActive);
                });

                return (
                  <div className="mt-28 mb-20 text-left max-w-5xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b border-navy-50 pb-6">
                      <div>
                        <span className="badge-status bg-ship-blue/10 text-ship-blue border-ship-blue/20 mb-3 inline-block uppercase animate-pulse">Live Schedule</span>
                        <h2 className="text-3xl md:text-5xl font-display font-black text-navy-900 tracking-tighter leading-none uppercase italic">
                          {t.landing_schedules_title}
                        </h2>
                        <p className="text-xs text-navy-400 font-bold uppercase tracking-widest mt-2 font-mono">
                          {t.landing_schedules_subtitle}
                        </p>
                      </div>
                    </div>

                    {schedulesLoading ? (
                      <div className="flex items-center justify-center py-16 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-ship-blue" />
                        <span className="text-xs font-black text-navy-400 uppercase tracking-widest leading-none">Memuat Jadwal...</span>
                      </div>
                    ) : activeSchedules.length === 0 ? (
                      <div className="bg-navy-50/50 border border-navy-100/50 rounded-4xl p-16 text-center">
                        <Calendar className="w-12 h-12 text-navy-300 mx-auto mb-4" />
                        <p className="text-xs font-black text-navy-400 uppercase tracking-widest">{t.landing_schedules_no_data}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeSchedules.slice(0, 6).map((schedule) => {
                          const route = getRouteDetails(schedule.routeId);
                          const ship = getShipDetails(schedule.shipId);
                          const occupied = schedule.bookedSeats || 0;
                          const shipCapacity = ship.capacity || 100;
                          const remainingSeats = Math.max(0, shipCapacity - occupied);
                          const isSoldOut = remainingSeats <= 0;

                          const now = currentTime;
                          const deptTime = parseISO(schedule.departureTime);
                          const arrTime = schedule.arrivalTime ? parseISO(schedule.arrivalTime) : new Date(deptTime.getTime() + 4 * 60 * 60 * 1000);
                          const totalDuration = arrTime.getTime() - deptTime.getTime();

                          const isDelayedStatus = schedule.status === 'delayed';
                          const delayEnd = schedule.estimatedActiveTime ? parseISO(schedule.estimatedActiveTime) : null;
                          const isDelayActive = isDelayedStatus && delayEnd && isBefore(now, delayEnd);
                          const isDelayEnded = isDelayedStatus && delayEnd && !isBefore(now, delayEnd);

                          let percent = 0;
                          let isEnRoute = false;
                          let isShowingPosition = false;

                          if (isDelayActive) {
                            isShowingPosition = true;
                            isEnRoute = false;
                            
                            const delayStart = schedule.delayStartedAt ? parseISO(schedule.delayStartedAt) : deptTime;
                            const startPercent = schedule.delayStartPercent !== undefined ? schedule.delayStartPercent : 0;
                            
                            const totalDelayDuration = delayEnd.getTime() - delayStart.getTime();
                            let ratio = 1;
                            if (totalDelayDuration > 0) {
                              ratio = Math.max(0, Math.min(1, (delayEnd.getTime() - now.getTime()) / totalDelayDuration));
                            } else {
                              ratio = 0;
                            }
                            percent = startPercent * ratio;
                          } else if (isDelayEnded) {
                            const postDelayElapsed = now.getTime() - delayEnd.getTime();
                            const remainingJourneyDuration = arrTime.getTime() - delayEnd.getTime();
                            
                            if (remainingJourneyDuration > 0) { percent = Math.min(100, Math.max(0, (postDelayElapsed / remainingJourneyDuration) * 100)); } else { percent = 100; }
                            isEnRoute = isBefore(now, arrTime);
                            isShowingPosition = isEnRoute;
                          } else {
                            const isFuture = isBefore(now, deptTime);
                            isEnRoute = !isFuture && isBefore(now, arrTime) && schedule.status !== 'cancelled';
                            percent = Math.min(100, Math.max(0, ((now.getTime() - deptTime.getTime()) / totalDuration) * 100));
                            isShowingPosition = isEnRoute;
                          }

                          return (
                            <div 
                              key={schedule.id}
                              onClick={async () => {
                                if (isEnRoute) return;
                                setErrorStatus(null);
                                try {
                                  await signInWithGoogle();
                                } catch (e: any) {
                                  if (
                                    e.code !== 'auth/popup-closed-by-user' && 
                                    e.code !== 'auth/cancelled-popup-request' && 
                                    e.code !== 'auth/popup-blocked'
                                  ) {
                                    setErrorStatus("Gagal masuk. Periksa koneksi internet Anda.");
                                  }
                                }
                              }}
                              className={cn(
                                "bento-card group bg-white border border-navy-100/70 shadow-lg hover:shadow-2xl hover:shadow-ship-blue/5 transition-all duration-300",
                                isDelayActive ? "border-amber-200 bg-amber-50/5 cursor-default" : 
                                isEnRoute ? "border-blue-200 bg-blue-50/10 cursor-default" : "cursor-pointer hover:border-ship-blue/50"
                              )}
                            >
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-ship-blue/5 rounded-xl flex items-center justify-center text-ship-blue">
                                    <Anchor className="w-5 h-5 animate-pulse" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-display font-black text-navy-900 tracking-tight uppercase leading-none">{ship.name}</h4>
                                    <p className="text-[9px] font-black text-navy-400 tracking-widest uppercase mt-1 italic leading-none">MENTAWAI FAST FLEET</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {isEnRoute ? (
                                      <span className="badge-status bg-blue-50 text-blue-600 border-blue-200 uppercase font-black text-[8px] animate-pulse">
                                        {language === 'id' ? 'DALAM PERJALANAN' : 'EN ROUTE'}
                                      </span>
                                    ) : isDelayActive ? (
                                      <span className="badge-status bg-amber-50 text-amber-600 border-amber-200 uppercase font-black text-[8px] animate-pulse">
                                        {language === 'id' ? 'TERTUNDA' : 'DELAYED'}
                                      </span>
                                    ) : isSoldOut ? (
                                      <span className="badge-status bg-rose-50 text-rose-600 border-rose-200 uppercase font-black text-[8px] animate-pulse">
                                        {language === 'id' ? 'TIKET HABIS' : 'SOLD OUT'}
                                      </span>
                                    ) : (
                                      <span className="badge-status bg-emerald-50 text-emerald-600 border-emerald-200 uppercase font-black text-[8px]">
                                        {remainingSeats} {language === 'id' ? 'Slot Tersisa' : 'Seats Left'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                <div className="flex items-center gap-2 bg-navy-50/50 px-3 py-2 border border-navy-100/50 rounded-2xl w-fit">
                                  <Calendar className="w-3.5 h-3.5 text-ship-blue animate-pulse" />
                                  <span className="text-[10px] font-mono font-black text-navy-800 uppercase tracking-wide leading-none">
                                    {format(parseISO(schedule.departureTime), "EEEE, dd MMM yyyy", { locale: language === 'id' ? id : enUS })}
                                  </span>
                                </div>

                                {isDelayActive && schedule.estimatedActiveTime && (
                                  <div className="bg-amber-50 px-3 py-2 rounded-2xl border border-amber-200 flex items-center gap-1.5 w-fit">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-mono font-black text-amber-700 uppercase tracking-wide leading-none">
                                      {language === 'id' ? 'ESTIMASI BARU:' : 'EST. DEPARTURE:'} {format(parseISO(schedule.estimatedActiveTime), "EEEE, dd MMMM yyyy • HH:mm", { locale: language === 'id' ? id : enUS })}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between bg-navy-50/50 p-4 rounded-2xl border border-navy-100/50 mb-6 font-display font-medium">
                                <div className="flex flex-col font-sans">
                                  <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'ASAL' : 'ORIGIN'}</span>
                                  <span className="text-sm font-display font-black text-navy-950 leading-none">{route.origin}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-navy-300" />
                                <div className="flex flex-col items-end font-sans">
                                  <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'TUJUAN' : 'DESTINATION'}</span>
                                  <span className="text-sm font-display font-black text-navy-950 leading-none">{route.destination}</span>
                                </div>
                              </div>

                              {/* Live Travel Position / Seat Availability Indicator */}
                              {isShowingPosition ? (
                                <div className={cn(
                                  "mb-6 space-y-2 select-none p-4 rounded-2xl border transition-all duration-300",
                                  isDelayActive ? "bg-amber-50/30 border-amber-100/30 text-amber-600" : "bg-blue-50/30 border-blue-100/30 text-blue-600"
                                )}>
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest leading-none">
                                    <span className="flex items-center gap-1.5">
                                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDelayActive ? "bg-amber-500" : "bg-blue-500 animate-ping")} />
                                      {isDelayActive
                                        ? (language === 'id' ? 'Mundur Posisi Kapal (Delay Cuaca)' : 'Vessel Receding (Weather Delay)')
                                        : (language === 'id' ? 'Posisi Kapal (Real-time)' : 'Ship Position (Real-time)')}
                                    </span>
                                    <span className={cn("font-mono text-[9px]", isDelayActive ? "text-amber-700" : "text-blue-700")}>
                                      {Math.round(percent)}% {language === 'id' ? 'Selesai' : 'Completed'}
                                    </span>
                                  </div>
                                  <div className={cn("relative w-full h-2 rounded-full border mt-2", isDelayActive ? "bg-amber-100/50 border-amber-200/20" : "bg-blue-100/50 border-blue-200/20")}>
                                    {/* Route track overlay */}
                                    <div 
                                      className={cn(
                                        "absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out",
                                        isDelayActive ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-blue-400 to-ship-blue"
                                      )}
                                      style={{ width: `${percent}%` }}
                                    />
                                    {/* Ship pointer */}
                                    <div 
                                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 ease-out"
                                      style={{ left: `${percent}%` }}
                                    >
                                      <div className={cn(
                                        "w-6 h-6 bg-white border-2 rounded-full flex items-center justify-center shadow-md animate-bounce",
                                        isDelayActive ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                                      )}>
                                        <Ship className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-wider text-navy-400 px-0.5 pt-1">
                                    <span>{route.origin}</span>
                                    <span>{route.destination}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-6 space-y-1.5">
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-navy-400 leading-none">
                                    <span>{language === 'id' ? 'Ketersediaan Slot Tiket' : 'Ticket Slot Availability'}</span>
                                    <span className={`font-mono text-[9px] ${isSoldOut ? "text-rose-600" : "text-ship-blue"}`}>
                                      {occupied} / {shipCapacity} {language === 'id' ? 'Terisi' : 'Booked'}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-navy-50 rounded-full overflow-hidden border border-navy-100/30">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isSoldOut ? 'bg-rose-500 animate-pulse' : 'bg-ship-blue'
                                      }`}
                                      style={{ width: `${Math.min(100, (occupied / shipCapacity) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2 border-t border-navy-50">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Berangkat' : 'Departure'}</span>
                                    <span className="text-sm font-mono font-black text-navy-950 leading-none">{format(parseISO(schedule.departureTime), "HH:mm")}</span>
                                  </div>
                                  <div className="h-6 w-px bg-navy-100" />
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Tiba' : 'Arrival'}</span>
                                    <span className="text-sm font-mono font-black text-navy-950 leading-none">
                                      {schedule.arrivalTime ? format(parseISO(schedule.arrivalTime), "HH:mm") : '-'}
                                    </span>
                                  </div>
                                </div>
                                {!isEnRoute && (
                                  <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1 leading-none">{language === 'id' ? 'Harga' : 'Price'}</span>
                                    <span className="text-sm font-display font-black text-ship-blue leading-none">Rp {schedule.price.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-6 pt-4 border-t border-navy-100/50 flex justify-end">
                                {isDelayActive ? (
                                  <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-1.5 leading-none animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                    {language === 'id' ? 'KAPAL TERTUNDA' : 'SHIP DELAYED'}
                                  </span>
                                ) : isEnRoute ? (
                                  <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-1.5 leading-none animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                                    {language === 'id' ? 'KAPAL DALAM PERJALANAN' : 'SHIP EN ROUTE'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-ship-blue group-hover:text-navy-950 tracking-widest flex items-center gap-1 transition-colors leading-none">
                                    {t.landing_schedules_book} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={async () => {
                    setErrorStatus(null);
                    try {
                      await signInWithGoogle();
                    } catch (e: any) {
                      console.error("Login Button Error:", e);
                      if (
                        e.code !== 'auth/popup-closed-by-user' && 
                        e.code !== 'auth/cancelled-popup-request' && 
                        e.code !== 'auth/popup-blocked'
                      ) {
                        setErrorStatus("Gagal masuk. Periksa koneksi internet Anda.");
                      }
                    }
                  }}
                  className="group relative px-12 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] overflow-hidden shadow-2xl shadow-ship-blue/20"
                >
                  <div className="absolute inset-0 bg-ship-blue group-hover:bg-navy-900 transition-colors" />
                  <span className="relative text-white z-10 flex items-center gap-3">
                    {t.landing_login_btn} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <p className="text-navy-400 text-[10px] font-black uppercase tracking-[0.3em] italic">{t.landing_auth_only}</p>
              </div>
            </motion.div>
            )
          ) : role === 'admin' ? (
            <AdminView key="admin" activeTab={activeTab as any} setActiveTab={setActiveTab as any} language={language} />
          ) : (
            <UserView key="user" activeTab={activeTab as any} setActiveTab={setActiveTab as any} language={language} />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

