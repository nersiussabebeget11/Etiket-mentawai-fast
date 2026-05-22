import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';

export async function generateBusinessPlanDocx(
  language: 'id' | 'en',
  businessModelImg?: string,
  processFlowImg?: string
): Promise<Blob> {
  const isId = language === 'id';

  const title = isId ? "LAPORAN PERENCANAAN BISNIS" : "BUSINESS PLANNING REPORT";
  const subtitle = "PT. MENTAWAI ANUGERAH SEJAHTERA";
  const brand = isId 
    ? "Platform Digital Presisi Tiket & Jadwal MV MENTAWAI FAST" 
    : "MV MENTAWAI FAST Digital Ticketing & Precision Scheduling Ecosystem";

  const execSummaryTitle = isId ? "Ringkasan Eksekutif" : "Executive Summary";
  const execSummaryText = isId
    ? "PT. MENTAWAI ANUGERAH SEJAHTERA menghadirkan sistem tiketing dan penjadwalan digital terpadu untuk MV MENTAWAI FAST. Platform ini dikembangkan secara cerdas untuk memecahkan hambatan logistik utama di Kepulauan Mentawai: antrean pemesanan tiket fisik yang panjang, minimnya transparansi jadwal, kesulitan penanganan bagasi khusus (papan selancar), serta ketiadaan pelacakan posisi kapal secara real-time. Dengan mengintegrasikan sistem Cloud, pelacakan armada GPS, dan pembayaran aman, kami mengubah transportasi laut pariwisata dan masyarakat lokal di Sumatera Barat menjadi ekosistem berkelas dunia."
    : "PT. MENTAWAI ANUGERAH SEJAHTERA introduces the integrated digital ticketing and fleet dispatch system for MV MENTAWAI FAST. This platform is intelligently designed to overcome critical sea transit bottlenecks in the Mentawai Archipelago: long offline booking lines, lack of real-time scheduling transparency, friction in specialized luggage (surfboard tags), and the absence of live vessel tracking. By integrating a seamless Cloud backend, GPS satellite fleet telemetry, and automated secure gateways, we elevate West Sumatra's marine transit into a highly efficient world-class ecosystem.";

  const goalsTitle = isId ? "Tujuan Strategis & Visi" : "Strategic Goals & Visions";
  const goals = isId ? [
    "Digitalisasi 100% tiket feri penyeberangan Padang - Mentawai, mengeliminasi calo dan mempercepat boarding.",
    "Meningkatkan kepercayaan wisatawan asing & peselancar mancanegara melalui sistem reservasi yang andal dan terjadwal.",
    "Mengoptimalkan operasional dan konsumsi bahan bakar armada melalui data analitik pelacakan rute secara presisi."
  ] : [
    "Digitalize 100% of ferry ticketing between Padang and Mentawai, eliminating local ticket scalping and queuing.",
    "Strengthen global surfer and tourism confidence via a highly reliable, internationalized online reservation system.",
    "Maximize vessel utilization rates and fuel efficiency metrics by parsing routing analytics and fleet scheduling histories."
  ];

  const bmcTitle = isId ? "Business Model Canvas (BMC)" : "Business Model Canvas (BMC)";
  const bmcDesc = isId
    ? "Kerangka taktis yang memetakan aliran nilai operasional PT. MENTAWAI ANUGERAH SEJAHTERA."
    : "Tactical framework mapping our operational value stream and high-level enterprise architecture.";

  const processTitle = isId ? "Analisis Proses & Alur Kerja Sistem" : "Process Workflow & System Analysis";
  const processDesc = isId
    ? "Visualisasi langkah dari hulu ke hilir: dari admin menjadwalkan, pengguna memesan, sistem mengonfirmasi, hingga boarding di dermaga port."
    : "End-to-end visualization tracing schedules configuration, passenger bookings, automated secure validation, and boarding gate protocols.";

  const financialTitle = isId ? "Proyeksi Finansial & Target Pendapatan" : "Financial Projections & Growth Outlook";
  const financialDesc = isId
    ? "Rencana pertumbuhan bisnis dalam jangka waktu 5 tahun berdasarkan peningkatan arus wisata lokal dan internasional."
    : "Five-year comprehensive business growth timeline backed by projected regional tourism recoveries and digital sales acceleration.";

  const swotTitle = isId ? "Analisis SWOT" : "SWOT Analysis";

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: subtitle,
          bold: true,
          size: 32,
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: brand,
          italics: true,
          size: 20,
          color: "475569",
        }),
      ],
      spacing: { after: 800 },
    }),

    // Section 1: Executive Summary
    new Paragraph({
      text: execSummaryTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: execSummaryText,
      spacing: { after: 300 },
    }),

    // Strategic Goals
    new Paragraph({
      text: goalsTitle,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    }),
    ...goals.map(goal => new Paragraph({
      text: `• ${goal}`,
      spacing: { after: 120 },
    })),

    // Section 2: BMC
    new Paragraph({
      text: bmcTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 200 },
    }),
    new Paragraph({
      text: bmcDesc,
      spacing: { after: 300 },
    }),
  ];

  // Try to load and render the Business Model Canvas Image
  if (businessModelImg) {
    try {
      const res = await fetch(businessModelImg);
      if (res.ok) {
        const imageBuffer = await res.arrayBuffer();
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 550,
                  height: 310,
                },
              } as any),
            ],
            spacing: { before: 200, after: 300 },
          })
        );
      }
    } catch (e) {
      console.warn("Failed to embed Business Model image in DOCX:", e);
    }
  }

  // Section 3: Process Map
  children.push(
    new Paragraph({
      text: processTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 200 },
    }),
    new Paragraph({
      text: processDesc,
      spacing: { after: 300 },
    })
  );

  // Try to load and render the Process Flow Image
  if (processFlowImg) {
    try {
      const res = await fetch(processFlowImg);
      if (res.ok) {
        const imageBuffer = await res.arrayBuffer();
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 550,
                  height: 310,
                },
              } as any),
            ],
            spacing: { before: 200, after: 300 },
          })
        );
      }
    } catch (e) {
      console.warn("Failed to embed Process Flow image in DOCX:", e);
    }
  }

  // Section 4: Proyeksi Finansial
  children.push(
    new Paragraph({
      text: financialTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 200 },
    }),
    new Paragraph({
      text: financialDesc,
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: isId 
        ? "Proyeksi Pendapatan Operasional dalam Jangka Waktu 5 Tahun (USD):" 
        : "Operational Revenue Projections over a 5-Year Horizon (USD):",
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: isId
        ? "• Tahun 1: $180,000 (Pendapatan awal, onboarding sistem digital)"
        : "• Year 1: $180,000 (Baseline ticketing digital, early integration)",
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: isId
        ? "• Tahun 2: $310,000 (Perluasan rute penyeberangan baru)"
        : "• Year 2: $310,000 (New route extensions & pricing optimization)",
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: isId
        ? "• Tahun 3: $520,000 (Kemitraan resor selancar global)"
        : "• Year 3: $520,000 (Surf camp sponsorships & global resort deals)",
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: isId
        ? "• Tahun 4: $780,000 (Operasi penuh multi-kapal / armada)"
        : "• Year 4: $780,000 (Full multi-vessel routing & booking automation)",
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: isId
        ? "• Tahun 5: $1,150,000 (Kematangan bisnis & integrasi logistik)"
        : "• Year 5: $1,150,000 (Market maturity & freight-ticket consolidation)",
      spacing: { after: 200 },
    })
  );

  // Section 5: SWOT
  children.push(
    new Paragraph({
      text: swotTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 200 },
    }),
    new Paragraph({
      text: isId 
        ? "S - Strengths (Kekuatan):\nSatu-satunya kapal penurutan feri tercepat, sistem digital 100%, pelacakan posisi real-time.\n\nW - Weaknesses (Kelemahan):\nKetergantungan cuaca ekstrem laut lepas, biaya pemeliharaan armada catamaran yang tinggi.\n\nO - Opportunities (Peluang):\nLonjakan pasar pariwisata petualangan selancar global, regulasi digitalisasi transportasi dari perhubungan laut.\n\nT - Threats (Ancaman):\nBencana alam, persaingan tarif kapal kargo tradisional."
        : "S - Strengths:\nFastest transit speed connection on the Padang route, 100% digital onboarding workflows, live tracking.\n\nW - Weaknesses:\nHigh operational susceptibility to extreme weather, expensive catamaran vessel maintenance.\n\nO - Opportunities:\nSurge in global adventure and surfboard water sports tourism, regulatory pushes for transport digitalization.\n\nT - Threats:\nSudden maritime regulatory changes, seismic natural disasters, freight-price wars.",
      spacing: { after: 200 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
