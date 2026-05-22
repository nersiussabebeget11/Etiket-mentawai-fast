import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { 
  Briefcase, TrendingUp, Users, RefreshCw, BarChart2, Shield, Landmark, 
  ChevronRight, ArrowRight, Compass, Settings, Circle, BookOpen, AlertCircle, FileText
} from 'lucide-react';
import { Language } from '../lib/translations';
import { generateBusinessPlanDocx } from '../lib/docxGenerator';

// @ts-ignore
import businessModelImg from '../assets/images/mentawai_business_model_1779267788872.png';
// @ts-ignore
import processFlowImg from '../assets/images/booking_process_flowchart_1779267809132.png';

interface BusinessPlanReportProps {
  language: Language;
}

export function BusinessPlanReport({ language }: BusinessPlanReportProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'bmc' | 'process' | 'financial' | 'swot'>('summary');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generateBusinessPlanDocx(
        language,
        businessModelImg,
        processFlowImg
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = language === 'id' 
        ? 'PT_MAS_Rencana_Bisnis_Mentawai_Fast.docx' 
        : 'PT_MAS_Business_Plan_Mentawai_Fast.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download DOCX:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const content = {
    id: {
      title: "LAPORAN PERENCANAAN BISNIS",
      subtitle: "PT. MENTAWAI ANUGERAH SEJAHTERA",
      brand: "Platform Digital Presisi Tiket & Jadwal MV MENTAWAI FAST",
      executive_summary: "Ringkasan Eksekutif",
      es_text: "PT. MENTAWAI ANUGERAH SEJAHTERA menghadirkan sistem tiketing dan penjadwalan digital terpadu untuk MV MENTAWAI FAST. Platform ini dikembangkan secara cerdas untuk memecahkan hambatan logistik utama di Kepulauan Mentawai: antrean pemesanan tiket fisik yang panjang, minimnya transparansi jadwal, kesulitan penanganan bagasi khusus (papan selancar), serta ketiadaan pelacakan posisi kapal secara real-time. Dengan mengintegrasikan sistem Cloud, pelacakan armada GPS, dan pembayaran aman, kami mengubah transportasi laut pariwisata dan masyarakat lokal di Sumatera Barat menjadi ekosistem berkelas dunia.",
      goals_title: "Tujuan Strategis & Visi",
      goal_1: "Digitalisasi 100% tiket feri penyeberangan Padang - Mentawai, mengeliminasi calo dan mempercepat boarding.",
      goal_2: "Meningkatkan kepercayaan wisatawan asing & peselancar mancanegara melalui sistem reservasi yang andal dan terjadwal.",
      goal_3: "Mengoptimalkan operasional dan konsumsi bahan bakar armada melalui data analitik pelacakan rute secara presisi.",
      
      bmc_title: "Business Model Canvas (BMC)",
      bmc_desc: "Kerangka taktis yang memetakan aliran nilai operasional PT. MENTAWAI ANUGERAH SEJAHTERA.",
      process_title: "Analisis Proses & Alur Kerja Sistem",
      process_desc: "Visualisasi langkah dari hulu ke hilir: dari admin menjadwalkan, pengguna memesan, sistem mengonfirmasi, hingga boarding di dermaga port.",
      financial_title: "Proyeksi Finansial & Target Pendapatan",
      financial_desc: "Rencana pertumbuhan bisnis dalam jangka waktu 5 tahun berdasarkan peningkatan arus wisata lokal dan internasional.",
      swot_title: "Analisis SWOT Interaktif",
    },
    en: {
      title: "BUSINESS PLANNING REPORT",
      subtitle: "PT. MENTAWAI ANUGERAH SEJAHTERA",
      brand: "MV MENTAWAI FAST Digital Ticketing & Precision Scheduling Ecosystem",
      executive_summary: "Executive Summary",
      es_text: "PT. MENTAWAI ANUGERAH SEJAHTERA introduces the integrated digital ticketing and fleet dispatch system for MV MENTAWAI FAST. This platform is intelligently designed to overcome critical sea transit bottlenecks in the Mentawai Archipelago: long offline booking lines, lack of real-time scheduling transparency, friction in specialized luggage (surfboard tags), and the absence of live vessel tracking. By integrating a seamless Cloud backend, GPS satellite fleet telemetry, and automated secure gateways, we elevate West Sumatra's marine transit into a highly efficient world-class ecosystem.",
      goals_title: "Strategic Goals & Visions",
      goal_1: "Digitalize 100% of ferry ticketing between Padang and Mentawai, eliminating local ticket scalping and queuing.",
      goal_2: "Strengthen global surfer and tourism confidence via a highly reliable, internationalized online reservation system.",
      goal_3: "Maximize vessel utilization rates and fuel efficiency metrics by parsing routing analytics and fleet scheduling histories.",
      
      bmc_title: "Business Model Canvas (BMC)",
      bmc_desc: "Tactical framework mapping our operational value stream and high-level enterprise architecture.",
      process_title: "Process Workflow & System Analysis",
      process_desc: "End-to-end visualization tracing schedules configuration, passenger bookings, automated secure validation, and boarding gate protocols.",
      financial_title: "Financial Projections & Growth Outlook",
      financial_desc: "Five-year comprehensive business growth timeline backed by projected regional tourism recoveries and digital sales acceleration.",
      swot_title: "Interactive SWOT Analysis",
    }
  };

  const t = content[language];

  // Business Model Canvas Data
  const bmcBlocks = [
    {
      title_id: "Key Partners (Mitra Kunci)",
      title_en: "Key Partners",
      items_id: [
        "Otoritas Pelabuhan Muaro Padang & Mentawai",
        "Dinas Perhubungan Provinsi Sumatera Barat",
        "Resor Selancar, Surf Camps & Agen Wisata Lokal",
        "Penyedia Gateway Pembayaran (QRIS, Banks, Midtrans)"
      ],
      items_en: [
        "Muaro Padang & Mentawai Port Authorities",
        "West Sumatra Provincial Transport Dept",
        "Luxury Surf Resorts, Surf Camps & Local Agencies",
        "National Payment Gateway Providers (QRIS, Banks, Midtrans)"
      ],
      color: "border-emerald-200 bg-emerald-50/10",
      textColor: "text-emerald-700"
    },
    {
      title_id: "Key Activities (Aktivitas Utama)",
      title_en: "Key Activities",
      items_id: [
        "Perawatan & Keselamatan Feri Katamaran MV Mentawai Fast",
        "Optimasi Rute, Jadwal, & Distribusi Armada",
        "Pengembangan Platform & Validasi Tiket Digital QR",
        "Layanan Pelanggan & Koordinasi Bagasi Selancar"
      ],
      items_en: [
        "Catamaran Vessel Safety Inspections & Upkeep",
        "Route Optimization & Fleet Schedule Allocation",
        "Custom Software Development & Ticket QR Scanning App",
        "Surfboard Baggage Handling & Marine Customer Support"
      ],
      color: "border-sky-200 bg-sky-50/10",
      textColor: "text-sky-700"
    },
    {
      title_id: "Value Propositions (Proposisi Nilai)",
      title_en: "Value Propositions",
      items_id: [
        "Kecepatan: Penyeberangan Tercepat ke Mentawai (3.5 - 4 Jam)",
        "Kepastian: Jadwal Real-time Aktif di Aplikasi Selular",
        "Kenyamanan: Pemesanan Tiket dari Mana Saja di Seluruh Dunia",
        "Transparansi: Kursi Cabin Premium Terplot Jelas Tanpa Tumpang Tindih"
      ],
      items_en: [
        "Speed: Fastest transit times across West Sumatra Reefs (3.5 - 4 Hrs)",
        "Predictability: Real-time schedule broadcasts on mobile app",
        "Convenience: Global ticket booking and secure seat reservations anywhere",
        "Transparency: Premium Cabin seats mapped cleanly to prevent double-booking"
      ],
      color: "border-amber-200 bg-amber-50/10",
      textColor: "text-amber-700 font-bold"
    },
    {
      title_id: "Customer Relationships (Hubungan Pelanggan)",
      title_en: "Customer Relationships",
      items_id: [
        "Notifikasi Whatsapp & Email Real-time Saat Penundaan/Delay",
        "Layanan Pusat Review & Pengaduan Terbuka",
        "Program Loyalitas Poin untuk Warga Lokal Kepulauan",
        "Bantuan Darurat 24/7 Selama Perjalanan"
      ],
      items_en: [
        "Automated WhatsApp & Email Alert System for Delay Updates",
        "Two-way Direct Feedback and Verified Reviews Platform",
        "Loyalty Point System for Resident Frequent Travelers",
        "24/7 Shipboard Emergency Transit Assistance Desk"
      ],
      color: "border-violet-200 bg-violet-50/10",
      textColor: "text-violet-700"
    },
    {
      title_id: "Customer Segments (Segmen Pelanggan)",
      title_en: "Customer Segments",
      items_id: [
        "Turis & Peselancar Internasional (Australia, Amerika, Eropa)",
        "Penduduk Lokal Kepulauan Mentawai (Siberut, Tua Pejat, Sikakap)",
        "Pegawai Negeri / Instansi Pemerintahan, Tenaga Medis, Guru",
        "Pelancong Umum / Backpacker Tropis"
      ],
      items_en: [
        "International Surfers & Adventurers (AUS, Europe, Americas)",
        "Mentawai Islands Residents (Siberut, Tua Pejat, Sikakap)",
        "Public Workers, Medical Responders, Local Teachers",
        "Independent Tropical Backpackers & Eco-Tourists"
      ],
      color: "border-pink-200 bg-pink-50/10",
      textColor: "text-pink-700"
    },
    {
      title_id: "Key Resources (Sumber Daya Kunci)",
      title_en: "Key Resources",
      items_id: [
        "Armada Feri Katamaran MV Mentawai Fast 1 s.d 14",
        "Sistem Manajemen Database & server Cloud Handal",
        "Kru Kapal Ternavigasi Bersertifikasi Internasional",
        "Hak Akses Dermaga Eksklusif di Padang & Mentawai"
      ],
      items_en: [
        "Catamaran Fleet Units MV Mentawai Fast 1 to 14",
        "Proprietary Cloud Database & Realtime Server Architecture",
        "International-certified Sea Captains, Officers & Engineers",
        "Exclusive Pier Access Rights in Padang & Core Islands"
      ],
      color: "border-indigo-200 bg-indigo-50/10",
      textColor: "text-indigo-700"
    },
    {
      title_id: "Channels (Saluran)",
      title_en: "Channels",
      items_id: [
        "Aplikasi Web & reservasi Mobile Responsif Mentawai Fast",
        "Kios Digital Pembelian Tiket di Ruang Tunggu Pelabuhan",
        "Integrasi API dengan Resor Selancar & Travel Agents",
        "Sosial Media Aktif & Papan Informasi Pelabuhan"
      ],
      items_en: [
        "Responsive Web App and Passenger Booking Portal",
        "At-Port Digital Self-Service Interactive Kiosks",
        "B2B Reservation APIs integrated with Surf Lodges",
        "Social Media & Port Digital Signage Boards"
      ],
      color: "border-teal-200 bg-teal-50/10",
      textColor: "text-teal-700"
    },
    {
      title_id: "Cost Structure (Struktur Biaya)",
      title_en: "Cost Structure",
      items_id: [
        "Biaya Solar (Bahan Bakar) & Operasional Harian Kapal",
        "Perawatan Berkala (Docking & Mesin Utama)",
        "Gaji Penggawa Kapal, Pemelihara, & Staf Administrasi",
        "Pemasaran, Maintenance IT, Biaya Keamanan Server"
      ],
      items_en: [
        "Marine Diesel Fuel Costs & Port Departure Clearances",
        "Mandatory Docking Inspections & Engine Parts Maintenance",
        "Payroll for Marine Crews, Port Stewards, & Admin Staff",
        "IT Hosting, Database Operations, Security Audit & Marketing"
      ],
      color: "border-red-200 bg-red-50/10",
      textColor: "text-red-700",
      colspan: "md:col-span-3"
    },
    {
      title_id: "Revenue Streams (Aliran Pendapatan)",
      title_en: "Revenue Streams",
      items_id: [
        "Penjualan Tiket Komersial (Eksekutif & Kabin VIP)",
        "Biaya Tambahan Bagasi Premium (Tas Papan Selancar)",
        "Komisi Tiket Terusan Agen Wisata dan Sewa Charter Kapal",
        "Pendapatan Food & Beverage (Kantin Feri) Selama Berlayar"
      ],
      items_en: [
        "Commercial Passenger Ticket Sales (Executive & VIP Cabins)",
        "Surcharge Fee for Voluminous Surfboard Flight Bags",
        "B2B Agent Commissions & Exclusive Ship Charter Fees",
        "Shipboard F&B (Cafe / Snack bar) Passenger Retail Sales"
      ],
      color: "border-blue-200 bg-blue-50/10",
      textColor: "text-blue-700",
      colspan: "md:col-span-3"
    }
  ];

  // SWOT Interactive Data
  const swotData = [
    {
      key: "S",
      title_id: "Kekuatan (Strengths)",
      title_en: "Strengths",
      desc_id: "Kecepatan kapal tertinggi dibanding alternatif kapal feri lambat, reputasi tangguh menghadapi Samudera Hindia, kesetiaan instansi lokal yang tinggi, dan teknologi lambung ganda antipusing.",
      desc_en: "Highest catamaran transit speed in West Sumatra, long-standing seaworthy reputation in turbulent Indian Ocean swells, strong relationship with local governance, and double-hull anti-seasickness design.",
      color: "bg-emerald-500/10 border-emerald-500/35 text-emerald-800"
    },
    {
      key: "W",
      title_id: "Kelemahan (Weaknesses)",
      title_en: "Weaknesses",
      desc_id: "Arus pariwisata yang fluktuatif di luar musim selancar (Desember - Februari), tingginya biaya perawatan rutin suku cadang mesin impor, ketergantungan sinyal internet di remote area.",
      desc_en: "Fluctuating passenger traffic during winter monsoon off-seasons (Dec - Feb), heavy operational reliance on costly imported engine components, spotty network coverage around remote island harbors.",
      color: "bg-amber-500/10 border-amber-500/35 text-amber-800"
    },
    {
      key: "O",
      title_id: "Peluang (Opportunities)",
      title_en: "Opportunities",
      desc_id: "Integrasi API tiket langsung ke sistem pembayaran hotel/resor pariwisata internasional, ekspansi rute rintisan pulau terluar, pengenalan sistem kargo kilat obat-obatan dan komoditi laut.",
      desc_en: "Direct API integration into global booking engines and luxury ocean resorts, launching brand-new island milk-runs, deploying specialized cold-chain air cargo for seafood export.",
      color: "bg-blue-500/10 border-blue-500/35 text-blue-800"
    },
    {
      key: "T",
      title_id: "Tantangan (Threats)",
      title_en: "Threats",
      desc_id: "Anomali cuaca ekstrem gelombang tinggi dari Samudera Hindia Selatan, perubahan regulasi subsidi penyeberangan lokal oleh pemda, risiko fluktuasi harga global bahan bakar minyak solar industri.",
      desc_en: "Heavy monsoon weather producing dangerous high-wave advisories, shifting regional subsidy dynamics, volatile industrial-grade marine fuel price fluctuations.",
      color: "bg-rose-500/10 border-rose-500/35 text-rose-800"
    }
  ];

  // Financial Chart Data Representation
  const financialProjection = [
    { year: "Year 1", revenue: 8.5, growth: "Baseline", description_id: "Penyamaan sistem digital, peluncuran awal.", description_en: "System digitalization, initial release, & integration." },
    { year: "Year 2", revenue: 11.2, growth: "+31.7%", description_id: "Integrasi menyeluruh agen selancar, tiket naik.", description_en: "Full integration with international surf agencies." },
    { year: "Year 3", revenue: 14.8, growth: "+32.1%", description_id: "Peningkatan jadwal baru & pengiriman kargo cepat.", description_en: "Launching specialized marine express parcel services." },
    { year: "Year 4", revenue: 19.5, growth: "+31.8%", description_id: "Ekspansi rintisan, digitalisasi ekosistem total.", description_en: "Unlocking secondary routes & absolute digital ecosystem." },
    { year: "Year 5", revenue: 25.0, growth: "+28.2%", description_id: "Konsolidasi mutlak, profitabilitas optimum.", description_en: "Ultimate logistics dominance & optimized unit economics." }
  ];

  return (
    <div className="bg-slate-50 min-h-screen rounded-[2.5rem] overflow-hidden p-4 md:p-8 border border-navy-50 shadow-inner">
      
      {/* Title Header Block */}
      <div className="relative text-left max-w-6xl mx-auto rounded-[2rem] p-8 md:p-12 mb-10 overflow-hidden bg-navy-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/40 to-ship-blue/20 pointer-events-none" />
        <div className="absolute -right-32 -bottom-32 w-[35rem] h-[35rem] rounded-full bg-ship-blue/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3.5 py-1.5 bg-ship-blue/30 text-cyan-300 font-sans font-black text-[9px] uppercase tracking-[0.25em] rounded-full border border-ship-blue/40">
              BOARDROOM STRATEGY v2.0
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter leading-none text-white uppercase italic">
            {t.title}
          </h1>
          <p className="text-cyan-400 font-sans font-extrabold text-sm tracking-widest mt-2 uppercase">
            {t.subtitle}
          </p>
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-xs text-white/50 font-medium max-w-xl">
              {t.brand}
            </p>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 font-mono text-[10px] text-white/70">
              <Circle className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 animate-pulse" />
              <span>BUSINESS FEASIBILITY APPROVED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation panel */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-2.5 justify-start items-center mb-8 pb-3 border-b border-navy-100">
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: 'summary', label: language === 'id' ? 'Ringkasan Eksekutif' : 'Executive Summary', icon: Briefcase },
            { id: 'bmc', label: language === 'id' ? 'Kanvas Model Bisnis (BMC)' : 'Business Model Canvas', icon: Landmark },
            { id: 'process', label: language === 'id' ? 'Proses & Alur Kerja' : 'Process Workflow', icon: RefreshCw },
            { id: 'financial', label: language === 'id' ? 'Proyeksi Finansial' : 'Financial Revenue', icon: TrendingUp },
            { id: 'swot', label: language === 'id' ? 'Analisis SWOT' : 'SWOT Analysis', icon: BarChart2 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-navy-900 text-white shadow-lg"
                    : "bg-white text-navy-400 hover:text-navy-900 border border-navy-100 shadow-sm"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleDownloadDocx}
          disabled={isExporting}
          className="md:ml-auto w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-cyan-600 text-white hover:bg-cyan-500 hover:scale-[1.02] active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 uppercase tracking-widest cursor-pointer group"
        >
          {isExporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{language === 'id' ? 'Mengekspor...' : 'Exporting...'}</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{language === 'id' ? 'Unduh Laporan (.docx)' : 'Download Report (.docx)'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Tab Contents Panel */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <motion.div
              key="summary-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
            >
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Intro Card */}
                <div className="bg-white rounded-3xl p-8 border border-navy-50 shadow-xl shadow-navy-100/30">
                  <h3 className="text-lg md:text-xl font-display font-black text-navy-900 uppercase tracking-tight italic mb-4 flex items-center gap-3">
                    <BookOpen className="text-ship-blue w-6 h-6" />
                    <span>{t.executive_summary}</span>
                  </h3>
                  <p className="text-sm text-navy-600 font-medium leading-relaxed">
                    {t.es_text}
                  </p>
                </div>

                {/* Goals Grid */}
                <div className="bg-white rounded-3xl p-8 border border-navy-50 shadow-xl shadow-navy-100/30">
                  <h3 className="text-lg md:text-xl font-display font-black text-navy-900 uppercase tracking-tight italic mb-6 flex items-center gap-3">
                    <TrendingUp className="text-ship-blue w-6 h-6" />
                    <span>{t.goals_title}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {[t.goal_1, t.goal_2, t.goal_3].map((goal, index) => (
                      <div key={index} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-2xl border border-navy-100/30">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ship-blue/10 text-ship-blue font-mono font-black text-xs shrink-0">
                          0{index + 1}
                        </span>
                        <p className="text-xs md:text-sm text-navy-600 font-semibold leading-relaxed leading-snug">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sidebar Insights of Tab 1 */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Operational Quick Stats */}
                <div className="bg-navy-900 rounded-3xl p-8 text-white border border-navy-800 shadow-xl">
                  <h4 className="text-xs font-black tracking-widest text-white/50 uppercase mb-6 font-mono">
                    {language === 'id' ? 'LOKALITAS & OPERASIONAL' : 'REGULATORY METRICS'}
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <span className="text-3xl font-display font-black tracking-tight text-white italic">14 UNITS</span>
                      <p className="text-[10px] uppercase font-black text-navy-300 mt-2 tracking-widest leading-none">
                        {language === 'id' ? 'ARMADA FERI KATAMARAN' : 'CATAMARAN ACTIVE FLEET'}
                      </p>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <span className="text-3xl font-display font-black tracking-tight text-white italic">30 knots</span>
                      <p className="text-[10px] uppercase font-black text-navy-300 mt-2 tracking-widest leading-none">
                        {language === 'id' ? 'KECEPATAN OPERASIONAL RATA-RATA' : 'AVERAGE TRANSIT SPEED'}
                      </p>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <span className="text-3xl font-display font-black tracking-tight text-white italic">3.5 Hours</span>
                      <p className="text-[10px] uppercase font-black text-navy-300 mt-2 tracking-widest leading-none">
                        {language === 'id' ? 'DURASI RUTE UTAMA PADANG - SIBERUT' : 'PRIMARY TRANSIT DURATION'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key USP */}
                <div className="bg-ship-blue/5 rounded-3xl p-8 border border-ship-blue/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="text-ship-blue w-6 h-6 animate-pulse" />
                    <h4 className="text-sm font-sans font-black text-navy-900 uppercase">
                      {language === 'id' ? 'Sertifikasi & Keamanan' : 'Maritime Audit'}
                    </h4>
                  </div>
                  <p className="text-xs text-navy-500 font-bold leading-relaxed uppercase tracking-wider">
                    {language === 'id' ? 'Seluruh armada terverifikasi kepatuhan sertifikat kelaiklautan syahbandar berkelas internasional.' : 'Entire passenger catamaran units compliant with global IMO maritime safety procedures.'}
                  </p>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: BUSINESS MODEL CANVAS (BMC) */}
          {activeTab === 'bmc' && (
            <motion.div
              key="bmc-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-left"
            >
              <div className="bg-white rounded-[2rem] p-8 border border-navy-50 shadow-xl mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg md:text-2xl font-display font-black text-navy-900 uppercase tracking-tight italic">
                      {t.bmc_title}
                    </h3>
                    <p className="text-xs text-navy-400 font-bold uppercase tracking-widest mt-1">
                      {t.bmc_desc}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center gap-2">
                    <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 animate-pulse" />
                    <span>Laba Operasional Solid</span>
                  </div>
                </div>

                {/* BMC Grid 5-column classic block layout */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Part 1: Partners */}
                  <div className={`p-5 rounded-2xl border ${bmcBlocks[0].color} md:row-span-2 flex flex-col justify-between`}>
                    <div>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[0].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[0].title_id : bmcBlocks[0].title_en}
                      </h4>
                      <ul className="space-y-3.5">
                        {(language === 'id' ? bmcBlocks[0].items_id : bmcBlocks[0].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-600 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 2: Activities & Resources */}
                  <div className="md:col-span-1 flex flex-col gap-4 md:row-span-2">
                    <div className={`p-5 rounded-2xl border ${bmcBlocks[1].color} flex-1`}>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[1].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[1].title_id : bmcBlocks[1].title_en}
                      </h4>
                      <ul className="space-y-3">
                        {(language === 'id' ? bmcBlocks[1].items_id : bmcBlocks[1].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-600 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`p-5 rounded-2xl border ${bmcBlocks[5].color} flex-1`}>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[5].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[5].title_id : bmcBlocks[5].title_en}
                      </h4>
                      <ul className="space-y-3">
                        {(language === 'id' ? bmcBlocks[5].items_id : bmcBlocks[5].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-600 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 3: Value Proposition */}
                  <div className={`p-5 rounded-2xl border ${bmcBlocks[2].color} md:row-span-2 flex flex-col justify-between`}>
                    <div>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[2].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[2].title_id : bmcBlocks[2].title_en}
                      </h4>
                      <ul className="space-y-3.5">
                        {(language === 'id' ? bmcBlocks[2].items_id : bmcBlocks[2].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-950 font-bold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 4: Customer Relationships & Channels */}
                  <div className="md:col-span-1 flex flex-col gap-4 md:row-span-2">
                    <div className={`p-5 rounded-2xl border ${bmcBlocks[3].color} flex-1`}>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[3].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[3].title_id : bmcBlocks[3].title_en}
                      </h4>
                      <ul className="space-y-3">
                        {(language === 'id' ? bmcBlocks[3].items_id : bmcBlocks[3].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-600 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`p-5 rounded-2xl border ${bmcBlocks[6].color} flex-1`}>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[6].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[6].title_id : bmcBlocks[6].title_en}
                      </h4>
                      <ul className="space-y-3">
                        {(language === 'id' ? bmcBlocks[6].items_id : bmcBlocks[6].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-600 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Part 5: Customer Segments */}
                  <div className={`p-5 rounded-2xl border ${bmcBlocks[4].color} md:row-span-2 flex flex-col justify-between`}>
                    <div>
                      <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[4].textColor} mb-4`}>
                        {language === 'id' ? bmcBlocks[4].title_id : bmcBlocks[4].title_en}
                      </h4>
                      <ul className="space-y-3.5">
                        {(language === 'id' ? bmcBlocks[4].items_id : bmcBlocks[4].items_en).map((item, idx) => (
                          <li key={idx} className="text-xs text-navy-600 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cost Structure & Revenue Stream bottom row */}
                  <div className={`p-5 rounded-2xl border ${bmcBlocks[7].color} md:col-span-2.5 md:col-span-2`}>
                    <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[7].textColor} mb-3`}>
                      {language === 'id' ? bmcBlocks[7].title_id : bmcBlocks[7].title_en}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      {(language === 'id' ? bmcBlocks[7].items_id : bmcBlocks[7].items_en).map((item, idx) => (
                        <div key={idx} className="text-xs text-navy-600 bg-white/50 p-2.5 rounded-xl border border-red-50 font-semibold leading-relaxed">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border ${bmcBlocks[8].color} md:col-span-2.5 md:col-span-3`}>
                    <h4 className={`text-xs uppercase font-black tracking-widest ${bmcBlocks[8].textColor} mb-3`}>
                      {language === 'id' ? bmcBlocks[8].title_id : bmcBlocks[8].title_en}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      {(language === 'id' ? bmcBlocks[8].items_id : bmcBlocks[8].items_en).map((item, idx) => (
                        <div key={idx} className="text-xs text-navy-700 bg-white/50 p-2.5 rounded-xl border border-blue-50 font-bold leading-relaxed">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Show the High-Fidelity Custom Generated Business Model Mockup */}
              <div className="bg-white rounded-[2rem] p-8 border border-navy-50 shadow-xl overflow-hidden flex flex-col lg:flex-row items-center gap-8">
                <div className="w-full lg:w-1/2 text-left space-y-4">
                  <span className="px-3.5 py-1.5 bg-ship-blue/10 text-ship-blue font-mono font-black text-[9px] uppercase tracking-widest rounded-full leading-none">
                    GENERATED MOCKUP OUTLINE
                  </span>
                  <h3 className="text-xl md:text-3xl font-display font-black text-navy-900 uppercase italic tracking-tight">
                    {language === 'id' ? 'Visualisasi Ekosistem Armada' : 'Vessel Digitalization Canvas'}
                  </h3>
                  <p className="text-sm text-navy-600 leading-relaxed font-semibold">
                    {language === 'id' 
                      ? 'Gambar disamping memvisualisasikan bagaimana integrasi model bisnis kapal feri cepat MV Mentawai Fast dengan sistem pesanan cerdas, kargo terpadu, dan pelacakan posisi real-time terhubung langsung ke kabin penumpang dan pos administrasi laut.'
                      : 'The diagram illustrates how the business model is anchored by our high-performance fleet, bringing digital booking gateways and scheduling optimization to local residents and premium surf tourism agents simultaneously.'}
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div className="border-l-2 border-ship-blue pl-4">
                      <span className="text-xs font-black text-navy-905 block uppercase tracking-wider">Cloud Native Systems</span>
                      <p className="text-[10px] text-navy-400 font-bold uppercase mt-0.5 leading-none">Zero data losses & high capacity scaling</p>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <div className="relative rounded-2xl overflow-hidden border border-navy-100 shadow-2xl bg-neutral-900 group">
                    <img 
                      src={businessModelImg} 
                      alt="PT. Mentawai Anugerah Sejahtera Business Model Infographic" 
                      className="w-full h-auto object-cover max-h-[350px] group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[8px] font-black text-cyan-300 uppercase tracking-widest block">Figure 1.1</span>
                      <span className="text-[11px] font-sans font-bold text-white uppercase block mt-1 tracking-wider leading-tight">
                        {language === 'id' ? 'Kanvas Arsitektur Bisnis Pelayaran' : 'Marine Fleet Enterprise Business Canvas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: WORKFLOW PROCESS ANALYSIS */}
          {activeTab === 'process' && (
            <motion.div
              key="process-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-left flex flex-col gap-8"
            >
              
              {/* Detailed Workflow Description */}
              <div className="bg-white rounded-[2rem] p-8 border border-navy-50 shadow-xl">
                <h3 className="text-xl md:text-2xl font-display font-black text-navy-900 uppercase tracking-tight italic mb-2">
                  {t.process_title}
                </h3>
                <p className="text-xs text-navy-400 font-bold uppercase tracking-widest mb-8">
                  {t.process_desc}
                </p>

                {/* 4 Steps Interactive Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      step: "01",
                      title_id: "Sistem Administrasi Armada",
                      title_en: "Fleet Administration System",
                      desc_id: "Admin menjadwalkan keberangkatan, menetapkan armada katamaran yang prima (MV Mentawai Fast 1 - 14), dan memonitor status penundaan laut secara terpusat.",
                      desc_en: "Admins dispatch departures from Padang or Mentawai, allocate prime hull capabilities, and manage real-time schedule adjustments instantly."
                    },
                    {
                      step: "02",
                      title_id: "Modul Reservasi Tiket",
                      title_en: "Automated Ticket Reservations",
                      desc_id: "Penumpang mencari rute penyeberangan penyuport, mengisikan informasi pribadi, dan memesan nomor tempat duduk kabin yang tersedia melalui real-time seat mapper.",
                      desc_en: "Passengers lookup schedules, key in surfboard counts, select safe interior seating configurations and secure their bookings instantly."
                    },
                    {
                      step: "03",
                      title_id: "Gerbang Pembayaran & QR",
                      title_en: "Instant Payments & QR Core",
                      desc_id: "Konfirmasi instan lewat auto-payment. Enkripsi multi-channel menghasilkan e-tiket digital dengan kode QR unik terenkripsi untuk mengamankan data manifes penumpang.",
                      desc_en: "Automatic multi-bank payment validations trigger immediate QR e-ticket creations, mapping passenger details straight to the harbor manifest databases."
                    },
                    {
                      step: "04",
                      title_id: "Verifikasi Boarding Pelabuhan",
                      title_en: "Port Quay QR Boarding Code",
                      desc_id: "Petugas dermaga memindai kode QR tiket di pintu keberangkatan Muara Padang atau Mentawai untuk verifikasi instan penumpang & bagasi papan selancar.",
                      desc_en: "Pier operators scan the encrypted QR code on passenger devices, verifying boarding permissions and matching surf baggage sizes instantaneously."
                    }
                  ].map((proc, index) => (
                    <div key={index} className="relative p-6 rounded-2xl bg-slate-50/50 border border-navy-100/35 hover:bg-white transition-all group">
                      <div className="absolute top-4 right-4 text-3xl font-display font-black text-navy-300 group-hover:text-ship-blue transition-colors leading-none">
                        {proc.step}
                      </div>
                      <h4 className="text-xs md:text-sm font-sans font-black text-navy-900 uppercase tracking-wider mb-3 leading-tight pt-4">
                        {language === 'id' ? proc.title_id : proc.title_en}
                      </h4>
                      <p className="text-xs text-navy-500 font-semibold leading-relaxed">
                        {language === 'id' ? proc.desc_id : proc.desc_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show Flowchart Process Image from the generated artifact */}
              <div className="bg-white rounded-[2rem] p-8 border border-navy-50 shadow-xl overflow-hidden flex flex-col lg:flex-row-reverse items-center gap-8">
                <div className="w-full lg:w-1/2 text-left space-y-4">
                  <span className="px-3.5 py-1.5 bg-ship-blue/10 text-ship-blue font-mono font-black text-[9px] uppercase tracking-widest rounded-full leading-none">
                    PROCESS WORKFLOW CAPTURE
                  </span>
                  <h3 className="text-xl md:text-3xl font-display font-black text-navy-900 uppercase italic tracking-tight">
                    {language === 'id' ? 'Diagram Alur Transaksi Digital' : 'Digital Reservation & Check-In Workflow'}
                  </h3>
                  <p className="text-sm text-navy-600 leading-relaxed font-semibold">
                    {language === 'id' 
                      ? 'Ilustrasi disamping merepresentasikan fungsionalitas utama backend kami: validasi data, generate kode e-tiket, serta antarmuka intuitif untuk memberikan reliabilitas maksimal selama musim badai pelayaran sekalipun.'
                      : 'This detailed process flow illustrates our modern high-speed transaction pipeline. The system enforces seat verification checks, handles multi-channel payments, compiles verified manifests, and broadcasts shipping statuses seamlessly.'}
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div className="border-l-2 border-ship-blue pl-4">
                      <span className="text-xs font-black text-navy-905 block uppercase tracking-wider">Automated QR Generation</span>
                      <p className="text-[10px] text-navy-400 font-bold uppercase mt-0.5 leading-none">Scans take less than 650ms at the harbor gates</p>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <div className="relative rounded-2xl overflow-hidden border border-navy-100 shadow-2xl bg-neutral-900 group">
                    <img 
                      src={processFlowImg} 
                      alt="MV Mentawai Fast Booking Process Flowchart Infographic" 
                      className="w-full h-auto object-cover max-h-[350px] group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[8px] font-black text-cyan-300 uppercase tracking-widest block">Figure 1.2</span>
                      <span className="text-[11px] font-sans font-bold text-white uppercase block mt-1 tracking-wider leading-tight">
                        {language === 'id' ? 'Diagram Proses Logistik Tiket QR' : 'Interactive QR Ticketing Logistics Flow'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: FINANCIAL PROJECTIONS */}
          {activeTab === 'financial' && (
            <motion.div
              key="financial-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-left flex flex-col gap-8"
            >
              
              {/* Financial Outlook Header */}
              <div className="bg-white rounded-[2rem] p-8 border border-navy-50 shadow-xl">
                <h3 className="text-xl md:text-2xl font-display font-black text-navy-900 uppercase tracking-tight italic mb-2">
                  {t.financial_title}
                </h3>
                <p className="text-xs text-navy-400 font-bold uppercase tracking-widest mb-8">
                  {t.financial_desc}
                </p>

                {/* Styled CSS Projections Bar Chart */}
                <div className="space-y-6 max-w-4xl">
                  {financialProjection.map((prog, index) => {
                    const maxRevenue = 25.0;
                    const percent = (prog.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-1">
                          <div className="flex items-center gap-3">
                            <span className="w-16 font-mono font-black text-navy-900 text-left bg-navy-100/50 px-2 py-1 rounded">
                              {prog.year}
                            </span>
                            <p className="text-navy-700 font-bold uppercase tracking-wide">
                              {language === 'id' ? prog.description_id : prog.description_en}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-emerald-600 font-mono font-black uppercase text-[10px] tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                              {prog.growth}
                            </span>
                            <span className="font-display font-black text-navy-900 italic text-sm">
                              IDR {prog.revenue.toFixed(1)} Billion / thn
                            </span>
                          </div>
                        </div>
                        
                        {/* Interactive progress container bar */}
                        <div className="relative h-4 rounded-full bg-slate-100 overflow-hidden border border-navy-50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-ship-blue via-sky-500 to-cyan-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-navy-50 text-xs text-navy-400 font-mono uppercase tracking-widest leading-relaxed flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-ship-blue shrink-0 animate-bounce" />
                  <span>{language === 'id' ? '*Catatan: Proyeksi dihitung berdasarkan tarif penyeberangan standar plus biaya penanganan bagasi papan selancar.' : 'Notes: Calculations modeled using default passenger pricing matrixes and luxury surf equipment handles.'}</span>
                </div>
              </div>

              {/* Three Pillars Analysis Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title_id: "Sumber Pendapatan Utama",
                    title_en: "Core Revenue Streams",
                    desc_id: "Penjualan tiket penumpang direct dari aplikasi. Tiket VIP Cabin diproyeksikan menyumbang margin laba kotor 40% dari total porsi pendapatan.",
                    desc_en: "Ferry passenger ticketing sold directly on client web portals. Premium Cabin seating tiers command higher profit margins (+40%)."
                  },
                  {
                    title_id: "Layanan Penunjang",
                    title_en: "Ancillary Surcharges",
                    desc_id: "Penanganan kargo nelayan lokal, sewa space papan iklan di dalam kapal katamaran, dan sewa ruang bagasi khusus penerbangan olahraga air papan selancar.",
                    desc_en: "Premium surfboard cases dispatch handles, maritime courier services, and interior advertisement placements across active catamaran saloons."
                  },
                  {
                    title_id: "Kemitraan Pariwisata",
                    title_en: "Tourism Strategic B2B",
                    desc_id: "Pembagian komisi terintegrasi dengan jembatan API hotel, resor selancar tropis, kapal pesiar charter, dan agen perjalanan internasional.",
                    desc_en: "Integrated B2B ticketing pipelines directly serving global surf tour operatives, eco-lodges, resorts and exclusive cruise charters."
                  }
                ].map((pil, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 border border-navy-50 shadow-lg flex flex-col gap-3">
                    <h4 className="text-xs md:text-sm font-sans font-black text-navy-900 uppercase tracking-wider border-b border-navy-50 pb-2.5">
                      {language === 'id' ? pil.title_id : pil.title_en}
                    </h4>
                    <p className="text-xs text-navy-500 font-semibold leading-relaxed">
                      {language === 'id' ? pil.desc_id : pil.desc_en}
                    </p>
                  </div>
                ))}
              </div>

            </motion.div>
          )}

          {/* TAB 5: SWOT ANALYSIS */}
          {activeTab === 'swot' && (
            <motion.div
              key="swot-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-left"
            >
              <div className="bg-white rounded-[2rem] p-8 border border-navy-50 shadow-xl mb-8">
                <h3 className="text-xl md:text-2xl font-display font-black text-navy-900 uppercase tracking-tight italic mb-2">
                  {t.swot_title}
                </h3>
                <p className="text-xs text-navy-400 font-bold uppercase tracking-widest mb-8">
                  {language === 'id' 
                    ? 'Evaluasi mendalam mengenai kekuatan pendorong internal dan eksternal PT. MENTAWAI ANUGERAH SEJAHTERA.'
                    : 'Deep-dive audit reviewing internal growth catalysts and external global hazards facing the enterprise.'}
                </p>

                {/* SWOT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {swotData.map((item, index) => (
                    <div key={index} className={`p-6 rounded-2xl border ${item.color} flex gap-5 items-start transition-all hover:scale-[1.01]`}>
                      <span className="text-4xl md:text-5xl font-display font-black tracking-tight leading-none italic shrink-0">
                        {item.key}
                      </span>
                      <div>
                        <h4 className="text-xs md:text-sm font-sans font-black uppercase tracking-wider mb-2 leading-tight">
                          {language === 'id' ? item.title_id : item.title_en}
                        </h4>
                        <p className="text-xs md:text-sm leading-relaxed font-semibold">
                          {language === 'id' ? item.desc_id : item.desc_en}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SWOT operational summary checklist */}
              <div className="bg-navy-900 rounded-[2rem] p-8 text-white border border-navy-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-xs font-black tracking-widest text-cyan-400 uppercase mb-2 font-mono">
                    {language === 'id' ? 'STRATEGI MITIGASI RISIKO UTAMA' : 'RISK MITIGATION ACTION PLAN'}
                  </h4>
                  <p className="text-xs text-white/70 max-w-2xl font-medium leading-relaxed">
                    {language === 'id' 
                      ? 'Menggunakan sistem peringatan dini BMKG laut terotomatisasi pada panel admin kami untuk meminimalkan risiko cuaca ekstrem, serta bermitra langsung dengan penyuplai bahan bakar daerah tertunjuk demi menjaga kestabilan operasional kapal feri.'
                      : 'Integrating automated marine swell forecasting APIs inside the administrator dashboard helps preempt bad monsoons, while long-term contracts secure stable industrial fuel pricing matrices.'}
                  </p>
                </div>
                <div className="bg-white/10 px-5 py-4 rounded-xl border border-white/25 flex shrink-0 items-center justify-center font-black text-xs uppercase tracking-wide">
                  {language === 'id' ? '100% Kesiapan Operasional' : '100% Operational Readiness'}
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
