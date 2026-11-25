export interface ToolMeta {
  slug: string;
  nameEn: string;
  nameId: string;
  shortDescEn: string;
  shortDescId: string;
  category: '✨ PRO AI' | 'Compress' | 'Convert' | 'Organize' | 'Security';
  isPro: boolean;
  creditCost?: number;
  iconName: string;
  badge?: string;
  isComingSoon?: boolean;
  seoTitleEn: string;
  seoTitleId: string;
  seoDescriptionEn: string;
  seoDescriptionId: string;
  howToStepsEn: { step: number; title: string; desc: string }[];
  howToStepsId: { step: number; title: string; desc: string }[];
  faqsEn: { question: string; answer: string }[];
  faqsId: { question: string; answer: string }[];
}

export const CATEGORIES = [
  'All',
  '✨ PRO AI',
  'Compress',
  'Convert',
  'Organize',
  'Security'
] as const;

export type Category = (typeof CATEGORIES)[number];

export const TOOLS: ToolMeta[] = [
  // --- 5 PRO AI TOOLS (As specified in PRD.md) ---
  {
    slug: 'ai-edit-pdf',
    nameEn: 'AI Edit Scanned & Screenshot PDF',
    nameId: 'AI Edit PDF Scan & Screenshot',
    shortDescEn: 'Replace, erase, and edit text inside scanned documents and screenshots seamlessly.',
    shortDescId: 'Ganti, hapus, dan perbaiki teks di dalam PDF hasil scan dan screenshot secara rapi.',
    category: '✨ PRO AI',
    isPro: true,
    creditCost: 2,
    iconName: 'Sparkles',
    badge: 'PRO',
    seoTitleEn: 'AI Edit Scanned PDF Online — Edit Text in Document Photos | PurePDF',
    seoTitleId: 'Edit PDF Scan & Screenshot Online dengan AI | PurePDF',
    seoDescriptionEn: 'Neural font matching and inpainting technology to edit non-editable scanned PDFs in seconds.',
    seoDescriptionId: 'Teknologi AI untuk mengedit teks dalam PDF hasil scan atau screenshot tanpa merusak layout.',
    howToStepsEn: [
      { step: 1, title: 'Upload Scanned File', desc: 'Drag and drop your scan or document screenshot.' },
      { step: 2, title: 'Click on Text', desc: 'AI recognizes the font style, size, and background texture.' },
      { step: 3, title: 'Edit & Export', desc: 'Type your replacement text and download the seamless output.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Unggah Dokumen Scan', desc: 'Tarik dan lepas berkas scan atau screenshot Anda.' },
      { step: 2, title: 'Klik pada Teks', desc: 'AI otomatis mendeteksi jenis font, ukuran, dan latar belakang.' },
      { step: 3, title: 'Ubah & Unduh', desc: 'Ketik teks pengganti dan unduh hasil bersihnya langsung.' }
    ],
    faqsEn: [
      { question: 'Does it support curved or low-res photos?', answer: 'Yes, our neural dewarping model straightens lines before matching typography.' }
    ],
    faqsId: [
      { question: 'Apakah bisa untuk foto yang sedikit miring?', answer: 'Bisa, sistem AI kami otomatis meluruskan orientasi halaman sebelum mendeteksi teks.' }
    ]
  },
  {
    slug: 'force-unlock-pdf',
    nameEn: 'Force Unlock Restricted PDF',
    nameId: 'Buka Paksa PDF Terproteksi',
    shortDescEn: 'Bypass edit locks, print prohibitions, and copy restrictions on secured documents.',
    shortDescId: 'Buka kunci larangan print, salin teks, dan edit pada dokumen PDF yang terproteksi.',
    category: '✨ PRO AI',
    isPro: true,
    creditCost: 2,
    iconName: 'Unlock',
    badge: 'PRO',
    seoTitleEn: 'Force Unlock PDF Online — Remove Security & Copy Restrictions | PurePDF',
    seoTitleId: 'Buka Paksa Password & Proteksi PDF Online | PurePDF',
    seoDescriptionEn: 'Instantly strip owner restrictions and enable printing, selecting, and form editing.',
    seoDescriptionId: 'Hilangkan pembatasan izin cetak dan salin dokumen PDF terproteksi dengan aman.',
    howToStepsEn: [
      { step: 1, title: 'Upload Locked PDF', desc: 'Select the file with restricted permissions.' },
      { step: 2, title: 'Strip Permissions Lock', desc: 'Our engine decrypts owner security layers in memory.' },
      { step: 3, title: 'Download Open PDF', desc: 'Export completely unrestricted document.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Dokumen', desc: 'Unggah file PDF yang memiliki batasan izin.' },
      { step: 2, title: 'Lepas Proteksi', desc: 'Sistem mendekripsi lapisan kunci izin di memori.' },
      { step: 3, title: 'Unduh Berkas Bebas', desc: 'Dapatkan file PDF yang bebas dicetak dan disalin.' }
    ],
    faqsEn: [
      { question: 'Is this process safe?', answer: 'Yes, all decryption happens in temporary RAM without retaining data.' }
    ],
    faqsId: [
      { question: 'Apakah aman?', answer: 'Sangat aman, proses pembukaan kunci berjalan di memori sementara dan langsung terhapus.' }
    ]
  },
  {
    slug: 'high-accuracy-pdf-to-word',
    nameEn: 'High-Accuracy PDF to Word',
    nameId: 'PDF ke Word Akurasi Tinggi',
    shortDescEn: 'Reconstruct complex multi-column tables, formulas, and headers into 99.4% faithful DOCX.',
    shortDescId: 'Rekonstruksi tabel multi-kolom, rumus, dan tata letak rumit menjadi DOCX akurasi 99.4%.',
    category: '✨ PRO AI',
    isPro: true,
    creditCost: 2,
    iconName: 'FileSpreadsheet',
    badge: 'PRO',
    seoTitleEn: 'High-Accuracy PDF to Word DOCX Converter | PurePDF PRO',
    seoTitleId: 'Konverter PDF ke Word Akurasi Tinggi DOCX | PurePDF PRO',
    seoDescriptionEn: 'AI-assisted document layout reconstruction with perfect table cell boundary detection.',
    seoDescriptionId: 'Ubah PDF menjadi file Word DOCX yang bisa diedit total dengan susunan tabel rapi.',
    howToStepsEn: [
      { step: 1, title: 'Upload Complex PDF', desc: 'Select any multi-column financial statement or report.' },
      { step: 2, title: 'Neural Layout Parse', desc: 'Detects table borders, columns, and paragraph styles.' },
      { step: 3, title: 'Download Editable DOCX', desc: 'Open and edit seamlessly in Microsoft Word.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Dokumen', desc: 'Unggah laporan keuangan atau dokumen berkolom banyak.' },
      { step: 2, title: 'Analisis AI', desc: 'AI mendeteksi batas tabel, margin, dan gaya paragraf.' },
      { step: 3, title: 'Unduh DOCX', desc: 'Buka dan edit dengan rapi di Microsoft Word.' }
    ],
    faqsEn: [{ question: 'Are scanned pages converted?', answer: 'Yes, integrated neural OCR converts scanned images into editable Word text.' }],
    faqsId: [{ question: 'Bisa untuk halaman hasil scan?', answer: 'Bisa, OCR bawaan langsung mengubah teks foto menjadi teks Word yang bisa diedit.' }]
  },

  // --- 21 STANDARD FREE TOOLS ---
  // Compress (1)
  {
    slug: 'compress-pdf',
    nameEn: 'Compress PDF',
    nameId: 'Kompres PDF',
    shortDescEn: 'Reduce PDF file size up to 85% while keeping crisp visual quality.',
    shortDescId: 'Kecilkan ukuran file PDF hingga 85% dengan kualitas visual tetap tajam.',
    category: 'Compress',
    isPro: false,
    iconName: 'Minimize2',
    seoTitleEn: 'Compress PDF Online — Reduce PDF File Size Free | PurePDF',
    seoTitleId: 'Kompres PDF Online — Perkecil Ukuran PDF Gratis | PurePDF',
    seoDescriptionEn: 'Free online PDF compressor. Shrink PDF size for email attachment with zero file uploads to servers.',
    seoDescriptionId: 'Kompres PDF gratis di browser tanpa unggah file ke server.',
    howToStepsEn: [
      { step: 1, title: 'Upload PDF', desc: 'Select or drop your large PDF file.' },
      { step: 2, title: 'Select Level', desc: 'Choose Extreme, Recommended, or High Quality.' },
      { step: 3, title: 'Download', desc: 'Save your optimized PDF instantly.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File', desc: 'Pilih berkas PDF Anda.' },
      { step: 2, title: 'Pilih Level', desc: 'Tentukan tingkat kompresi yang diinginkan.' },
      { step: 3, title: 'Unduh', desc: 'Simpan berkas hasil kompresi.' }
    ],
    faqsEn: [{ question: 'Does text stay sharp?', answer: 'Yes, vector text remains crisp.' }],
    faqsId: [{ question: 'Apakah teks tetap tajam?', answer: 'Ya, font vektor tetap tajam.' }]
  },

  // Convert (9)
  {
    slug: 'pdf-to-word',
    nameEn: 'PDF to Word',
    nameId: 'PDF ke Word',
    shortDescEn: 'Standard conversion of PDF files to editable DOCX documents.',
    shortDescId: 'Konversi standar file PDF menjadi dokumen Word DOCX yang bisa diedit.',
    category: 'Convert',
    isPro: false,
    iconName: 'FileType',
    seoTitleEn: 'PDF to Word Converter — Convert PDF to DOCX Online Free | PurePDF',
    seoTitleId: 'Konversi PDF ke Word Online Gratis | PurePDF',
    seoDescriptionEn: 'Turn PDF documents into editable Microsoft Word files directly in your browser.',
    seoDescriptionId: 'Ubah file PDF menjadi Word DOCX gratis langsung di browser.',
    howToStepsEn: [
      { step: 1, title: 'Select PDF', desc: 'Upload the PDF you want to convert.' },
      { step: 2, title: 'Parse Elements', desc: 'Reconstructs paragraphs into Word formatting.' },
      { step: 3, title: 'Download', desc: 'Save your DOCX file.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File', desc: 'Pilih file PDF Anda.' },
      { step: 2, title: 'Proses', desc: 'Mengubah struktur PDF ke format Word.' },
      { step: 3, title: 'Unduh', desc: 'Simpan berkas DOCX Anda.' }
    ],
    faqsEn: [{ question: 'Is it free?', answer: '100% free client-side conversion.' }],
    faqsId: [{ question: 'Apakah gratis?', answer: '100% gratis diproses langsung di browser.' }]
  },
  {
    slug: 'word-to-pdf',
    nameEn: 'Word to PDF',
    nameId: 'Word ke PDF',
    shortDescEn: 'Turn Microsoft Word DOCX and DOC files into clean, universal PDFs.',
    shortDescId: 'Ubah dokumen Microsoft Word DOCX menjadi file PDF universal.',
    category: 'Convert',
    isPro: false,
    iconName: 'FileText',
    seoTitleEn: 'Word to PDF Converter — Free DOCX to PDF Online | PurePDF',
    seoTitleId: 'Konversi Word ke PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Convert Word documents to PDF online for universal viewing on any device.',
    seoDescriptionId: 'Ubah berkas Word menjadi PDF agar rapi dan tidak berantakan saat dibuka.',
    howToStepsEn: [
      { step: 1, title: 'Upload DOCX', desc: 'Choose your Word file.' },
      { step: 2, title: 'Compile PDF', desc: 'Render exact layout geometry.' },
      { step: 3, title: 'Save PDF', desc: 'Download standard PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File DOCX', desc: 'Pilih dokumen Word Anda.' },
      { step: 2, title: 'Kompilasi', desc: 'Menata letak halaman ke format PDF.' },
      { step: 3, title: 'Simpan PDF', desc: 'Unduh file PDF yang sudah jadi.' }
    ],
    faqsEn: [{ question: 'Are fonts preserved?', answer: 'Yes, fonts are embedded.' }],
    faqsId: [{ question: 'Apakah font berubah?', answer: 'Tidak, font tertanam rapi.' }]
  },
  {
    slug: 'pdf-to-excel',
    nameEn: 'PDF to Excel',
    nameId: 'PDF ke Excel',
    shortDescEn: 'Extract financial tables, numbers, and data into spreadsheet XLSX.',
    shortDescId: 'Ekstrak tabel angka, data bank, dan laporan ke spreadsheet Excel XLSX.',
    category: 'Convert',
    isPro: false,
    iconName: 'Table',
    seoTitleEn: 'PDF to Excel Converter — Extract PDF Tables to XLSX | PurePDF',
    seoTitleId: 'Konversi PDF ke Excel Online Gratis | PurePDF',
    seoDescriptionEn: 'Convert bank statements and data tables from PDF into structured Excel spreadsheets.',
    seoDescriptionId: 'Ekstrak tabel dari PDF menjadi spreadsheet Excel yang bisa diolah rumus.',
    howToStepsEn: [
      { step: 1, title: 'Upload PDF', desc: 'Drop your financial or tabular PDF.' },
      { step: 2, title: 'Extract Columns', desc: 'Cell coordinates parsed automatically.' },
      { step: 3, title: 'Export XLSX', desc: 'Download clean Excel workbook.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File', desc: 'Pilih PDF berisi tabel data.' },
      { step: 2, title: 'Ekstrak', desc: 'Sistem membaca baris dan kolom tabel.' },
      { step: 3, title: 'Unduh XLSX', desc: 'Simpan berkas Excel yang siap diolah.' }
    ],
    faqsEn: [{ question: 'Can it handle formulas?', answer: 'Values are extracted cleanly into cells.' }],
    faqsId: [{ question: 'Apakah angkanya bisa dihitung?', answer: 'Bisa, angka masuk ke cell Excel secara rapi.' }]
  },
  {
    slug: 'excel-to-pdf',
    nameEn: 'Excel to PDF',
    nameId: 'Excel ke PDF',
    shortDescEn: 'Convert spreadsheets into print-ready PDF reports with fit-to-page margins.',
    shortDescId: 'Ubah spreadsheet Excel menjadi laporan PDF siap cetak dengan margin pas.',
    category: 'Convert',
    isPro: false,
    iconName: 'FileCheck',
    seoTitleEn: 'Excel to PDF — Convert XLSX Spreadsheets to PDF Online | PurePDF',
    seoTitleId: 'Konversi Excel ke PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Fit Excel sheets into professional landscape or portrait PDF documents.',
    seoDescriptionId: 'Ubah tabel Excel menjadi dokumen PDF rapi tanpa terpotong.',
    howToStepsEn: [
      { step: 1, title: 'Upload Excel', desc: 'Select your XLSX file.' },
      { step: 2, title: 'Set Orientation', desc: 'Choose portrait or landscape.' },
      { step: 3, title: 'Download PDF', desc: 'Get print-ready document.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File Excel', desc: 'Pilih file XLSX Anda.' },
      { step: 2, title: 'Atur Margin', desc: 'Pilih orientasi potret atau lanskap.' },
      { step: 3, title: 'Unduh PDF', desc: 'Simpan file PDF siap cetak.' }
    ],
    faqsEn: [{ question: 'Can I include gridlines?', answer: 'Yes, gridlines can be kept.' }],
    faqsId: [{ question: 'Apakah garis tabel tetap muncul?', answer: 'Ya, garis tabel dipertahankan.' }]
  },
  {
    slug: 'pdf-to-ppt',
    nameEn: 'PDF to PowerPoint',
    nameId: 'PDF ke PowerPoint',
    shortDescEn: 'Convert presentation PDFs into editable PPTX slide decks.',
    shortDescId: 'Ubah slide presentasi PDF menjadi file PowerPoint PPTX yang bisa diedit.',
    category: 'Convert',
    isPro: false,
    iconName: 'Presentation',
    seoTitleEn: 'PDF to PowerPoint — Convert PDF to PPTX Slides | PurePDF',
    seoTitleId: 'Konversi PDF ke PowerPoint PPTX Online | PurePDF',
    seoDescriptionEn: 'Turn PDF slides back into editable PowerPoint presentation decks.',
    seoDescriptionId: 'Ubah halaman PDF presentasi menjadi slide PowerPoint siap presentasi.',
    howToStepsEn: [
      { step: 1, title: 'Upload Deck', desc: 'Select your PDF slide deck.' },
      { step: 2, title: 'Convert Slides', desc: 'Every PDF page becomes a PPTX slide.' },
      { step: 3, title: 'Download PPTX', desc: 'Open in Keynote or PowerPoint.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File', desc: 'Pilih file slide PDF Anda.' },
      { step: 2, title: 'Konversi', desc: 'Tiap halaman diubah menjadi satu slide presentasi.' },
      { step: 3, title: 'Unduh PPTX', desc: 'Buka di PowerPoint atau Google Slides.' }
    ],
    faqsEn: [{ question: 'Can text be edited in PPT?', answer: 'Yes, text boxes are generated.' }],
    faqsId: [{ question: 'Apakah teksnya bisa diedit?', answer: 'Bisa, teks dibuat dalam bentuk kotak teks.' }]
  },
  {
    slug: 'ppt-to-pdf',
    nameEn: 'PowerPoint to PDF',
    nameId: 'PowerPoint ke PDF',
    shortDescEn: 'Convert PPT and PPTX presentation slides into universal viewable PDFs.',
    shortDescId: 'Ubah slide presentasi PPTX menjadi berkas PDF yang rapi di semua perangkat.',
    category: 'Convert',
    isPro: false,
    iconName: 'FileSliders',
    seoTitleEn: 'PowerPoint to PDF — Convert PPTX to PDF Online | PurePDF',
    seoTitleId: 'Konversi PowerPoint ke PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Export your pitch decks and presentations to crisp PDF files.',
    seoDescriptionId: 'Ekspor slide materi kuliah atau pitch deck menjadi dokumen PDF.',
    howToStepsEn: [
      { step: 1, title: 'Choose Presentation', desc: 'Upload PPTX file.' },
      { step: 2, title: 'Process Slides', desc: 'Render vector typography.' },
      { step: 3, title: 'Save File', desc: 'Instant client-side PDF export.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File PPTX', desc: 'Unggah file presentasi.' },
      { step: 2, title: 'Render', desc: 'Menyusun elemen slide ke format PDF.' },
      { step: 3, title: 'Unduh PDF', desc: 'Simpan file PDF hasil ekspor.' }
    ],
    faqsEn: [{ question: 'Are animations included?', answer: 'Animations are rendered into static slides.' }],
    faqsId: [{ question: 'Apakah animasinya ikut?', answer: 'Animasi diubah menjadi tampilan slide final.' }]
  },
  {
    slug: 'pdf-to-jpg',
    nameEn: 'PDF to JPG',
    nameId: 'PDF ke JPG',
    shortDescEn: 'Convert each PDF page into high-resolution JPG images.',
    shortDescId: 'Ubah setiap halaman PDF menjadi gambar foto JPG beresolusi tinggi.',
    category: 'Convert',
    isPro: false,
    iconName: 'Image',
    seoTitleEn: 'PDF to JPG Converter — Extract PDF Pages as Images | PurePDF',
    seoTitleId: 'Konversi PDF ke Gambar JPG Online Gratis | PurePDF',
    seoDescriptionEn: 'Convert PDF pages into high-quality JPEG images or a ZIP archive.',
    seoDescriptionId: 'Ekstrak halaman PDF menjadi gambar foto JPG tajam.',
    howToStepsEn: [
      { step: 1, title: 'Select File', desc: 'Upload your PDF.' },
      { step: 2, title: 'Set Quality', desc: 'Choose standard or high-DPI quality.' },
      { step: 3, title: 'Download Images', desc: 'Get images or ZIP.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File', desc: 'Unggah berkas PDF Anda.' },
      { step: 2, title: 'Atur Kualitas', desc: 'Tentukan resolusi gambar.' },
      { step: 3, title: 'Unduh JPG', desc: 'Simpan gambar JPG langsung.' }
    ],
    faqsEn: [{ question: 'Can I choose single pages?', answer: 'Yes, extract all or selected pages.' }],
    faqsId: [{ question: 'Bisa pilih halaman tertentu?', answer: 'Bisa, pilih halaman atau semua halaman.' }]
  },
  {
    slug: 'jpg-to-pdf',
    nameEn: 'JPG to PDF',
    nameId: 'JPG ke PDF',
    shortDescEn: 'Combine multiple JPG, PNG, and HEIC photos into a unified PDF file.',
    shortDescId: 'Gabungkan beberapa foto JPG, PNG, dan gambar menjadi satu berkas PDF rapi.',
    category: 'Convert',
    isPro: false,
    iconName: 'Images',
    seoTitleEn: 'JPG to PDF Converter — Combine Images into One PDF | PurePDF',
    seoTitleId: 'Konversi Foto JPG ke PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Convert photos, receipts, and scans into a single organized PDF document.',
    seoDescriptionId: 'Gabungkan foto dokumen, struk belanja, dan scan menjadi satu PDF rapi.',
    howToStepsEn: [
      { step: 1, title: 'Drop Photos', desc: 'Upload multiple JPG or PNG images.' },
      { step: 2, title: 'Reorder', desc: 'Drag thumbnails to arrange sequence.' },
      { step: 3, title: 'Generate PDF', desc: 'Merge into one unified document.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Foto', desc: 'Pilih satu atau banyak gambar.' },
      { step: 2, title: 'Atur Urutan', desc: 'Geser urutan foto sesuai keinginan.' },
      { step: 3, title: 'Buat PDF', desc: 'Unduh satu berkas PDF gabungan.' }
    ],
    faqsEn: [{ question: 'Is there a limit on photos?', answer: 'Combine up to 100 images.' }],
    faqsId: [{ question: 'Berapa banyak foto yang bisa digabung?', answer: 'Bisa hingga 100 gambar sekaligus.' }]
  },
  {
    slug: 'html-to-pdf',
    nameEn: 'HTML to PDF',
    nameId: 'HTML ke PDF',
    shortDescEn: 'Convert live web pages or raw HTML code into beautiful PDF snapshots.',
    shortDescId: 'Ubah halaman situs web atau kode HTML menjadi berkas PDF rapi.',
    category: 'Convert',
    isPro: false,
    iconName: 'Code',
    seoTitleEn: 'HTML to PDF — Convert Webpages and HTML Code to PDF | PurePDF',
    seoTitleId: 'Konversi Web & HTML ke PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Render full-page website screenshots or HTML code directly to PDF.',
    seoDescriptionId: 'Simpan tampilan halaman web menjadi dokumen PDF lengkap.',
    howToStepsEn: [
      { step: 1, title: 'Enter URL or Code', desc: 'Paste live URL or upload HTML.' },
      { step: 2, title: 'Configure', desc: 'Choose desktop or mobile width.' },
      { step: 3, title: 'Download PDF', desc: 'Save vector-rendered PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Masukkan Tautan', desc: 'Tempel link web atau unggah HTML.' },
      { step: 2, title: 'Atur Tampilan', desc: 'Pilih ukuran desktop atau ponsel.' },
      { step: 3, title: 'Unduh PDF', desc: 'Simpan file PDF halaman web.' }
    ],
    faqsEn: [{ question: 'Are styles preserved?', answer: 'Yes, modern CSS styles are captured.' }],
    faqsId: [{ question: 'Apakah tampilannya persis?', answer: 'Ya, format CSS dan tata letak dipertahankan.' }]
  },

  // Organize (7)
  {
    slug: 'merge-pdf',
    nameEn: 'Merge PDF',
    nameId: 'Gabungkan PDF',
    shortDescEn: 'Combine multiple PDF documents into one single organized file.',
    shortDescId: 'Gabungkan beberapa dokumen PDF menjadi satu berkas teratur.',
    category: 'Organize',
    isPro: false,
    iconName: 'Layers',
    seoTitleEn: 'Merge PDF Online — Combine Multiple PDFs into One Free | PurePDF',
    seoTitleId: 'Gabungkan File PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Fast, secure, 100% client-side PDF merger. Combine invoices, chapters, or reports.',
    seoDescriptionId: 'Gabungkan berkas PDF dengan mudah dan aman langsung di browsermu.',
    howToStepsEn: [
      { step: 1, title: 'Upload Files', desc: 'Drop two or more PDF files.' },
      { step: 2, title: 'Reorder Files', desc: 'Drag cards into your preferred order.' },
      { step: 3, title: 'Merge & Save', desc: 'Download unified PDF in 1 second.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Berkas', desc: 'Pilih dua atau lebih file PDF.' },
      { step: 2, title: 'Atur Urutan', desc: 'Geser posisi file sesuai susunan yang diinginkan.' },
      { step: 3, title: 'Gabungkan', desc: 'Unduh satu file PDF gabungan.' }
    ],
    faqsEn: [{ question: 'Is there a page limit?', answer: 'No limit, processed in browser memory.' }],
    faqsId: [{ question: 'Apakah ada batas halaman?', answer: 'Tidak ada batasan halaman.' }]
  },
  {
    slug: 'split-pdf',
    nameEn: 'Split PDF',
    nameId: 'Pisahkan PDF',
    shortDescEn: 'Extract individual pages or divide documents by custom page ranges.',
    shortDescId: 'Pisahkan halaman tertentu atau bagi dokumen berdasarkan rentang halaman.',
    category: 'Organize',
    isPro: false,
    iconName: 'Scissors',
    seoTitleEn: 'Split PDF Online — Separate PDF Pages into Single Files | PurePDF',
    seoTitleId: 'Pisahkan Halaman PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Extract page ranges or separate every single page into independent PDFs.',
    seoDescriptionId: 'Pisahkan dokumen PDF besar menjadi beberapa bagian kecil dengan mudah.',
    howToStepsEn: [
      { step: 1, title: 'Upload Document', desc: 'Select PDF.' },
      { step: 2, title: 'Choose Range', desc: 'Specify ranges e.g. 1-3, 5, 8-12.' },
      { step: 3, title: 'Download Split Files', desc: 'Get clean individual files.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Berkas', desc: 'Unggah file PDF Anda.' },
      { step: 2, title: 'Tentukan Halaman', desc: 'Ketik nomor halaman (contoh: 1-5, 8).' },
      { step: 3, title: 'Unduh Hasil', desc: 'Simpan file pecahan PDF Anda.' }
    ],
    faqsEn: [{ question: 'Can I split all pages?', answer: 'Yes, split into individual single-page files.' }],
    faqsId: [{ question: 'Bisa pisah per halaman?', answer: 'Bisa, tiap halaman disimpan sebagai satu file.' }]
  },
  {
    slug: 'remove-pages',
    nameEn: 'Remove Pages',
    nameId: 'Hapus Halaman PDF',
    shortDescEn: 'Delete unwanted, blank, or duplicate pages from any PDF.',
    shortDescId: 'Hapus halaman kosong, salah cetak, atau halaman yang tidak diperlukan.',
    category: 'Organize',
    isPro: false,
    iconName: 'Trash2',
    seoTitleEn: 'Delete PDF Pages — Remove Blank or Unwanted Pages Online | PurePDF',
    seoTitleId: 'Hapus Halaman PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Visual grid interface to select and instantly delete pages from PDF files.',
    seoDescriptionId: 'Pilih dan hapus halaman yang tidak terpakai dari dokumen PDF.',
    howToStepsEn: [
      { step: 1, title: 'Inspect Grid', desc: 'View visual thumbnails of all pages.' },
      { step: 2, title: 'Click to Delete', desc: 'Click trash icon on pages to discard.' },
      { step: 3, title: 'Save Clean PDF', desc: 'Export sanitized document.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Lihat Thumbnail', desc: 'Periksa seluruh halaman dalam tampilan galeri.' },
      { step: 2, title: 'Pilih yang Dihapus', desc: 'Klik ikon hapus pada halaman yang tidak dipakai.' },
      { step: 3, title: 'Simpan PDF', desc: 'Unduh file PDF yang sudah bersih.' }
    ],
    faqsEn: [{ question: 'Is original safe?', answer: 'Original on your disk is never modified.' }],
    faqsId: [{ question: 'Apakah file asli aman?', answer: 'File asli di komputermu tidak berubah.' }]
  },
  {
    slug: 'extract-pages',
    nameEn: 'Extract Pages',
    nameId: 'Ekstrak Halaman PDF',
    shortDescEn: 'Select specific page thumbnails to create a brand new PDF.',
    shortDescId: 'Pilih beberapa halaman penting untuk dijadikan satu dokumen PDF baru.',
    category: 'Organize',
    isPro: false,
    iconName: 'Copy',
    seoTitleEn: 'Extract PDF Pages — Create New PDF from Selected Pages | PurePDF',
    seoTitleId: 'Ekstrak Halaman PDF Tertentu Online | PurePDF',
    seoDescriptionEn: 'Cherry-pick specific pages from large PDFs and bundle them into a new document.',
    seoDescriptionId: 'Ambil hanya halaman yang kamu butuhkan dari file PDF tebal.',
    howToStepsEn: [
      { step: 1, title: 'Browse Pages', desc: 'Scroll through page previews.' },
      { step: 2, title: 'Select Pages', desc: 'Click to check desired pages.' },
      { step: 3, title: 'Download New PDF', desc: 'Download curated booklet.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Buka Halaman', desc: 'Lihat pratinjau halaman PDF.' },
      { step: 2, title: 'Pilih Halaman', desc: 'Centang halaman yang ingin diambil.' },
      { step: 3, title: 'Unduh PDF Baru', desc: 'Simpan file PDF berisi halaman pilihan.' }
    ],
    faqsEn: [{ question: 'Can I extract multiple?', answer: 'Yes, pick any number of pages.' }],
    faqsId: [{ question: 'Bisa ambil banyak halaman?', answer: 'Bisa, pilih halaman berapapun.' }]
  },
  {
    slug: 'organize-pdf',
    nameEn: 'Organize & Reorder',
    nameId: 'Atur Urutan & Putar',
    shortDescEn: 'Drag and drop page thumbnails to reorder, sort, and rotate.',
    shortDescId: 'Geser posisi thumbnail halaman untuk merapikan urutan dan memutar orientasi.',
    category: 'Organize',
    isPro: false,
    iconName: 'Grid',
    seoTitleEn: 'Organize PDF Pages — Reorder and Sort PDF Online | PurePDF',
    seoTitleId: 'Atur & Urutkan Halaman PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Intuitive canvas board to visually reorganize and rotate PDF page orders.',
    seoDescriptionId: 'Atur urutan halaman PDF dengan mudah menggunakan kanvas geser dan lepas.',
    howToStepsEn: [
      { step: 1, title: 'Open Board', desc: 'Load all document pages into the board.' },
      { step: 2, title: 'Drag to Rearrange', desc: 'Shift pages into logical flow.' },
      { step: 3, title: 'Save Changes', desc: 'Export ordered PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Buka Kanvas', desc: 'Muat seluruh halaman dokumen.' },
      { step: 2, title: 'Geser Urutan', desc: 'Tarik halaman ke posisi yang tepat.' },
      { step: 3, title: 'Simpan Berkas', desc: 'Unduh PDF dengan urutan baru.' }
    ],
    faqsEn: [{ question: 'Can I rotate too?', answer: 'Yes, rotate 90 or 180 degrees.' }],
    faqsId: [{ question: 'Bisa sekaligus memutar halaman?', answer: 'Bisa, putar 90° atau 180°.' }]
  },
  {
    slug: 'crop-pdf',
    nameEn: 'Crop PDF',
    nameId: 'Potong Margin PDF',
    shortDescEn: 'Trim margins, headers, or white space to fit e-readers and mobile.',
    shortDescId: 'Potong tepi margin putih atau header agar pas dibaca di HP dan tablet.',
    category: 'Organize',
    isPro: false,
    iconName: 'Crop',
    seoTitleEn: 'Crop PDF Margins — Trim PDF Pages Online Free | PurePDF',
    seoTitleId: 'Potong Tepi Margin PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Cut off wide margins and trim excess borders from PDF files for optimal viewing.',
    seoDescriptionId: 'Koreksi margin putih yang terlalu lebar pada dokumen PDF.',
    howToStepsEn: [
      { step: 1, title: 'Set Crop Box', desc: 'Drag corner handles over visual page.' },
      { step: 2, title: 'Apply to All', desc: 'Apply crop rectangle to all pages.' },
      { step: 3, title: 'Download', desc: 'Save trimmed PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Tentukan Kotak Potong', desc: 'Tarik batas kotak pemotong di halaman.' },
      { step: 2, title: 'Terapkan', desc: 'Terapkan ke halaman ini atau seluruh halaman.' },
      { step: 3, title: 'Unduh', desc: 'Simpan berkas PDF hasil potongan.' }
    ],
    faqsEn: [{ question: 'Is content deleted?', answer: 'Only visible viewport boundaries are adjusted.' }],
    faqsId: [{ question: 'Apakah teks di dalam ikut hilang?', answer: 'Teks di luar batas potong disembunyikan rapi.' }]
  },
  {
    slug: 'page-numbers',
    nameEn: 'Add Page Numbers',
    nameId: 'Tambah Nomor Halaman',
    shortDescEn: 'Insert customizable page numbers, header titles, and footer notes.',
    shortDescId: 'Beri nomor halaman otomatis pada header atau footer dokumen PDF.',
    category: 'Organize',
    isPro: false,
    iconName: 'Hash',
    seoTitleEn: 'Add Page Numbers to PDF — Number Pages Online | PurePDF',
    seoTitleId: 'Beri Nomor Halaman PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Add page numbers with custom font, position, start number, and format.',
    seoDescriptionId: 'Tambahkan penomoran halaman dengan font, posisi, dan format sesuai kebutuhan.',
    howToStepsEn: [
      { step: 1, title: 'Choose Position', desc: 'Select bottom-center, top-right, etc.' },
      { step: 2, title: 'Format Style', desc: 'Choose "Page 1 of N" or simple numerals.' },
      { step: 3, title: 'Stamp Numbers', desc: 'Download numbered PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Posisi', desc: 'Pilih posisi bawah tengah, kanan, atau atas.' },
      { step: 2, title: 'Pilih Format', desc: 'Pilih format angka biasa atau "Halaman X dari Y".' },
      { step: 3, title: 'Cetak Nomor', desc: 'Unduh berkas PDF yang sudah bernomor.' }
    ],
    faqsEn: [{ question: 'Can I skip cover page?', answer: 'Yes, set start page to 2.' }],
    faqsId: [{ question: 'Bisa lewati halaman sampul?', answer: 'Bisa, atur nomor mulai dari halaman 2.' }]
  },

  // Security (4)
  {
    slug: 'protect-pdf',
    nameEn: 'Protect & Lock PDF',
    nameId: 'Kunci & Password PDF',
    shortDescEn: 'Encrypt documents with 256-bit AES password encryption.',
    shortDescId: 'Amankan berkas PDF rahasia dengan enkripsi password AES 256-bit.',
    category: 'Security',
    isPro: false,
    iconName: 'Lock',
    seoTitleEn: 'Protect PDF with Password — Encrypt PDF Online | PurePDF',
    seoTitleId: 'Kunci PDF dengan Password Online Gratis | PurePDF',
    seoDescriptionEn: 'Secure your sensitive PDF files with military-grade AES-256 password protection.',
    seoDescriptionId: 'Beri password pada file PDF agar tidak bisa dibuka oleh orang yang tidak berhak.',
    howToStepsEn: [
      { step: 1, title: 'Set Password', desc: 'Enter a strong access password.' },
      { step: 2, title: 'Choose Permissions', desc: 'Restrict printing or copying.' },
      { step: 3, title: 'Download Locked PDF', desc: 'Encrypted client-side in browser.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Buat Password', desc: 'Ketik kata sandi yang aman.' },
      { step: 2, title: 'Atur Izin', desc: 'Batasi izin cetak atau penyalinan isi.' },
      { step: 3, title: 'Unduh File Terkunci', desc: 'File diamankan dengan enkripsi kuat.' }
    ],
    faqsEn: [{ question: 'Is password sent to servers?', answer: 'Never. Encryption runs 100% inside your browser.' }],
    faqsId: [{ question: 'Apakah password dikirim ke server?', answer: 'Tidak pernah. Enkripsi berjalan 100% di browsermu.' }]
  },
  {
    slug: 'unlock-pdf',
    nameEn: 'Unlock PDF',
    nameId: 'Buka Password PDF',
    shortDescEn: 'Remove owner passwords and printing restrictions from your authorized PDFs.',
    shortDescId: 'Hapus password dan batasan cetak dari dokumen PDF yang kamu miliki.',
    category: 'Security',
    isPro: false,
    iconName: 'Unlock',
    seoTitleEn: 'Unlock PDF — Remove PDF Password Security Online | PurePDF',
    seoTitleId: 'Hapus Password Dokumen PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Remove forgotten owner passwords and printing locks from PDF documents.',
    seoDescriptionId: 'Buka password PDF yang sudah diotorisasi agar tidak perlu ketik sandi lagi.',
    howToStepsEn: [
      { step: 1, title: 'Upload File', desc: 'Select encrypted PDF.' },
      { step: 2, title: 'Enter Password', desc: 'Provide password once.' },
      { step: 3, title: 'Remove Lock', desc: 'Export unlocked PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Dokumen', desc: 'Unggah file PDF berpassword.' },
      { step: 2, title: 'Ketik Password', desc: 'Masukkan password yang benar sekali.' },
      { step: 3, title: 'Buka Kunci', desc: 'Simpan file PDF permanen tanpa password.' }
    ],
    faqsEn: [{ question: 'Does it brute-force?', answer: 'No, authorized password is required.' }],
    faqsId: [{ question: 'Apakah menebak password?', answer: 'Tidak, Anda harus mengetahui password dokumen.' }]
  },
  {
    slug: 'watermark-pdf',
    nameEn: 'Watermark PDF',
    nameId: 'Watermark PDF',
    shortDescEn: 'Stamp custom text or confidential logo watermarks over pages.',
    shortDescId: 'Beri cap teks "RAHASIA", "DRAFT", atau logo transparan pada tiap halaman.',
    category: 'Security',
    isPro: false,
    iconName: 'Stamp',
    seoTitleEn: 'Watermark PDF Online — Add Text or Image Watermarks | PurePDF',
    seoTitleId: 'Beri Watermark pada File PDF Online | PurePDF',
    seoDescriptionEn: 'Stamp "CONFIDENTIAL", "DRAFT", or company logos over your PDF pages.',
    seoDescriptionId: 'Tambahkan cap air teks atau logo untuk mencegah pencurian dokumen.',
    howToStepsEn: [
      { step: 1, title: 'Choose Watermark', desc: 'Type text or upload logo image.' },
      { step: 2, title: 'Set Opacity & Angle', desc: 'Adjust 45-degree angle and transparency.' },
      { step: 3, title: 'Stamp & Download', desc: 'Export watermarked document.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Cap Air', desc: 'Ketik teks watermark atau unggah logo PNG.' },
      { step: 2, title: 'Atur Sudut & Transparansi', desc: 'Atur kemiringan 45 derajat dan ketebalan.' },
      { step: 3, title: 'Cetak & Unduh', desc: 'Simpan PDF yang sudah ber-watermark.' }
    ],
    faqsEn: [{ question: 'Can watermark be removed easily?', answer: 'It is burned into the vector stream.' }],
    faqsId: [{ question: 'Apakah mudah dihapus?', answer: 'Cap air menyatu langsung dengan halaman PDF.' }]
  },
  {
    slug: 'sign-pdf',
    nameEn: 'Sign PDF Online',
    nameId: 'Tanda Tangan PDF Online',
    shortDescEn: 'Draw, type, or upload your electronic signature directly onto PDF.',
    shortDescId: 'Gambar tanda tangan langsung dengan mouse/touchscreen atau tempel tanda tangan foto.',
    category: 'Security',
    isPro: false,
    iconName: 'PenTool',
    seoTitleEn: 'Sign PDF Online — Free Electronic Signature on PDF | PurePDF',
    seoTitleId: 'Tanda Tangani PDF Online Gratis & Cepat | PurePDF',
    seoDescriptionEn: 'Draw your signature, place dates, and sign PDF contracts online legally.',
    seoDescriptionId: 'Beri tanda tangan digital pada surat, formulir, atau kontrak PDF secara gratis.',
    howToStepsEn: [
      { step: 1, title: 'Create Signature', desc: 'Draw with mouse or touchpad.' },
      { step: 2, title: 'Position on Page', desc: 'Drag signature box to signature line.' },
      { step: 3, title: 'Save Document', desc: 'Download signed contract.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Buat Tanda Tangan', desc: 'Gambar langsung dengan layar sentuh atau mouse.' },
      { step: 2, title: 'Atur Posisi', desc: 'Geser tanda tangan ke kolom yang sesuai.' },
      { step: 3, title: 'Simpan Berkas', desc: 'Unduh berkas PDF yang sudah ditandatangani.' }
    ],
    faqsEn: [{ question: 'Is e-signature legal?', answer: 'Yes, compliant with ESIGN and UETA standards.' }],
    faqsId: [{ question: 'Apakah sah secara hukum?', answer: 'Ya, memenuhi standar tanda tangan elektronik dokumen umum.' }]
  },

  // --- NEW TOOLS EXTRACTED FROM PDF24 SUITE ---
  {
    slug: 'rotate-pdf',
    nameEn: 'Rotate PDF',
    nameId: 'Putar Halaman PDF',
    shortDescEn: 'Rotate PDF pages permanently by 90°, 180°, or 270° clockwise or counter-clockwise.',
    shortDescId: 'Putar orientasi halaman PDF permanen 90°, 180°, atau 270° searah atau berlawanan jarum jam.',
    category: 'Organize',
    isPro: false,
    iconName: 'RotateCw',
    seoTitleEn: 'Rotate PDF Online — Permanently Rotate PDF Pages Free | PurePDF',
    seoTitleId: 'Putar Halaman PDF Online Gratis | PurePDF',
    seoDescriptionEn: 'Rotate upside-down scanned pages or landscape PDF orientation permanently in browser.',
    seoDescriptionId: 'Putar halaman PDF yang terbalik atau miring secara permanen tanpa merusak dokumen.',
    howToStepsEn: [
      { step: 1, title: 'Upload PDF', desc: 'Select document with rotated pages.' },
      { step: 2, title: 'Choose Orientation', desc: 'Rotate individual pages or all pages 90°/180°.' },
      { step: 3, title: 'Save File', desc: 'Export correctly oriented PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Berkas', desc: 'Unggah file PDF yang ingin diputar orientasinya.' },
      { step: 2, title: 'Pilih Sudut', desc: 'Putar per halaman atau semua halaman sekaligus 90°/180°.' },
      { step: 3, title: 'Simpan', desc: 'Unduh PDF dengan orientasi yang sudah benar.' }
    ],
    faqsEn: [{ question: 'Is rotation permanent?', answer: 'Yes, rotation angle is saved permanently to document dictionary.' }],
    faqsId: [{ question: 'Apakah rotasinya permanen?', answer: 'Ya, orientasi baru tersimpan permanen saat dibuka di software lain.' }]
  },
  {
    slug: 'redact-pdf',
    nameEn: 'Redact & Blackout PDF',
    nameId: 'Hitamkan & Sensor PDF',
    shortDescEn: 'Permanently blackout confidential text, names, ID numbers, and sensitive document areas.',
    shortDescId: 'Hitamkan teks rahasia, NIK, nominal uang, dan data pribadi secara permanen dan tidak dapat dipulihkan.',
    category: 'Security',
    isPro: false,
    iconName: 'EyeOff',
    seoTitleEn: 'Redact PDF Online — Permanently Blackout Sensitive PDF Data | PurePDF',
    seoTitleId: 'Hitamkan & Sensor PDF Online Gratis — Tutup Data Rahasia | PurePDF',
    seoDescriptionEn: 'Burn permanent black redaction rectangles over confidential sections. Text cannot be copied or recovered.',
    seoDescriptionId: 'Sensor bagian rahasia dokumen dengan kotak hitam permanen yang tidak dapat disalin atau dibatalkan.',
    howToStepsEn: [
      { step: 1, title: 'Select Document', desc: 'Upload PDF containing sensitive information.' },
      { step: 2, title: 'Mark Redaction Area', desc: 'Select keywords or place solid blackout blocks over secret data.' },
      { step: 3, title: 'Sanitize & Save', desc: 'Export sanitized PDF with underlying data destroyed.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Unggah Berkas', desc: 'Pilih PDF yang memuat data rahasia.' },
      { step: 2, title: 'Beri Kotak Sensor', desc: 'Tentukan kata kunci atau beri kotak hitam pekat di atas data rahasia.' },
      { step: 3, title: 'Simpan Bersih', desc: 'Unduh berkas PDF yang data rahasianya telah dimusnahkan secara permanen.' }
    ],
    faqsEn: [{ question: 'Can blacked-out text be uncovered?', answer: 'No, redacted areas are burned into flat vector streams, destroying the text underneath.' }],
    faqsId: [{ question: 'Apakah teks di balik kotak hitam bisa dicopy?', answer: 'Tidak bisa, data teks di balik sensor langsung dihapus dari struktur berkas.' }]
  },
  {
    slug: 'overlay-pdf',
    nameEn: 'Overlay & Letterhead PDF',
    nameId: 'Overlay & Kertas Kop Surat',
    shortDescEn: 'Superimpose digital letterheads, borders, and stamps onto background or foreground.',
    shortDescId: 'Gabungkan kop surat perusahaan, bingkai, atau stempel di latar belakang maupun latar depan dokumen.',
    category: 'Organize',
    isPro: false,
    iconName: 'Layers',
    seoTitleEn: 'Overlay PDF Online — Add Digital Letterhead to Documents | PurePDF',
    seoTitleId: 'Overlay PDF & Kop Surat Online Gratis | PurePDF',
    seoDescriptionEn: 'Superimpose digital stationery and letterheads on invoices, contracts, and letters in browser.',
    seoDescriptionId: 'Padukan berkas surat atau invoice dengan kop surat resmi perusahaan secara mudah.',
    howToStepsEn: [
      { step: 1, title: 'Upload Content PDF', desc: 'Select your main document body.' },
      { step: 2, title: 'Upload Letterhead PDF', desc: 'Select company letterhead or border template.' },
      { step: 3, title: 'Overlay & Download', desc: 'Superimpose and export merged stationery.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Dokumen Utama', desc: 'Unggah naskah atau invoice Anda.' },
      { step: 2, title: 'Pilih Kop Surat', desc: 'Unggah template kop surat atau border resmi.' },
      { step: 3, title: 'Gabung & Unduh', desc: 'Satukan kedua dokumen menjadi satu berkas rapi.' }
    ],
    faqsEn: [{ question: 'Can letterhead repeat for all pages?', answer: 'Yes, single-page letterheads automatically apply to every page.' }],
    faqsId: [{ question: 'Bisa otomatis untuk semua halaman?', answer: 'Bisa, kop surat 1 lembar akan otomatis ditempelkan ke seluruh halaman.' }]
  },
  {
    slug: 'ocr-pdf',
    nameEn: 'PDF OCR Text Recognition',
    nameId: 'PDF OCR Pengenal Teks',
    shortDescEn: 'Transform scanned images and photo documents into searchable, copyable text.',
    shortDescId: 'Ubah PDF hasil foto dan scan menjadi berkas yang teksnya bisa dicari (searchable) dan disalin.',
    category: 'Convert',
    isPro: false,
    iconName: 'ScanLine',
    seoTitleEn: 'PDF OCR Online — Make Scanned PDFs Searchable Free | PurePDF',
    seoTitleId: 'PDF OCR Online — Ubah Scan Jadi Teks yang Bisa Dicari | PurePDF',
    seoDescriptionEn: 'Optical Character Recognition in browser. Extract and index text from scanned documents.',
    seoDescriptionId: 'Kenali teks dalam PDF hasil scan atau foto agar bisa disalin dan dicari dengan CTRL+F.',
    howToStepsEn: [
      { step: 1, title: 'Upload Scanned File', desc: 'Choose photo or scan.' },
      { step: 2, title: 'Select Language', desc: 'Choose document language (Indonesian, English, etc.).' },
      { step: 3, title: 'Export Searchable PDF', desc: 'Download PDF with embedded text layer.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Unggah Scan', desc: 'Pilih foto atau dokumen hasil scan.' },
      { step: 2, title: 'Pilih Bahasa', desc: 'Tentukan bahasa dokumen (Indonesia, Inggris, dll.).' },
      { step: 3, title: 'Unduh Hasil', desc: 'Simpan PDF yang teksnya sudah bisa dicari dan disalin.' }
    ],
    faqsEn: [{ question: 'What languages are supported?', answer: 'Supports Indonesian, English, Spanish, German, and French.' }],
    faqsId: [{ question: 'Bahasa apa saja yang didukung?', answer: 'Mendukung Bahasa Indonesia, Inggris, Spanyol, Jerman, dan lainnya.' }]
  },
  {
    slug: 'compare-pdf',
    nameEn: 'Compare PDF Files',
    nameId: 'Bandingkan Dokumen PDF',
    shortDescEn: 'Compare two PDF document versions side-by-side to highlight differences and changes.',
    shortDescId: 'Bandingkan isi dua berkas PDF secara berdampingan untuk mendeteksi revisi dan perbedaan teks.',
    category: 'Organize',
    isPro: false,
    iconName: 'GitCompare',
    seoTitleEn: 'Compare PDF Files Online — Find Differences Between PDFs | PurePDF',
    seoTitleId: 'Bandingkan Berkas PDF Online Gratis — Deteksi Revisi | PurePDF',
    seoDescriptionEn: 'Side-by-side text diffing between two PDF documents. Instantly see added and deleted clauses.',
    seoDescriptionId: 'Bandingkan dua draft perjanjian atau kontrak untuk melihat perubahan pasal dan kalimat.',
    howToStepsEn: [
      { step: 1, title: 'Upload First File', desc: 'Select the original PDF draft.' },
      { step: 2, title: 'Upload Second File', desc: 'Select the revised PDF draft.' },
      { step: 3, title: 'Analyze Differences', desc: 'View highlighted additions, deletions, and edits.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih File Pertama', desc: 'Unggah draft dokumen asli.' },
      { step: 2, title: 'Pilih File Kedua', desc: 'Unggah draft dokumen hasil revisi.' },
      { step: 3, title: 'Lihat Perbedaan', desc: 'Periksa perbandingan teks yang ditambah atau dihapus.' }
    ],
    faqsEn: [{ question: 'Does it check formatting?', answer: 'Text diff engine parses textual contents across identical page indices.' }],
    faqsId: [{ question: 'Apakah memeriksa kata per kata?', answer: 'Ya, sistem menganalisis perbedaan kalimat per halaman secara teliti.' }]
  },
  {
    slug: 'pdf-to-grayscale',
    nameEn: 'PDF to Grayscale (B&W)',
    nameId: 'PDF ke Skala Abu-Abu',
    shortDescEn: 'Convert color PDF documents into monochrome black-and-white to save printer ink and space.',
    shortDescId: 'Ubah semua warna dokumen menjadi hitam putih untuk menghemat tinta cetak dan ukuran berkas.',
    category: 'Compress',
    isPro: false,
    iconName: 'Palette',
    seoTitleEn: 'PDF to Grayscale Online — Convert Color PDF to Black & White | PurePDF',
    seoTitleId: 'PDF ke Skala Abu-Abu Online — Ubah Warna ke Hitam Putih | PurePDF',
    seoDescriptionEn: 'Transform colored graphics, photos, and backgrounds into 8-bit grayscale for economical printing.',
    seoDescriptionId: 'Koreksi warna dokumen berwarna menjadi hitam putih bersih yang ramah printer.',
    howToStepsEn: [
      { step: 1, title: 'Upload Color PDF', desc: 'Select your colorful document.' },
      { step: 2, title: 'Convert Color Streams', desc: 'Desaturates image pixels into crisp monochrome tones.' },
      { step: 3, title: 'Save Grayscale PDF', desc: 'Download print-optimized document.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Dokumen', desc: 'Unggah berkas PDF berwarna.' },
      { step: 2, title: 'Konversi Warna', desc: 'Mengubah saturasi warna menjadi skala abu-abu tajam.' },
      { step: 3, title: 'Unduh Hasil', desc: 'Simpan PDF monokrom yang siap cetak hemat tinta.' }
    ],
    faqsEn: [{ question: 'Does text stay sharp?', answer: 'Yes, vector fonts and lines remain ultra-crisp.' }],
    faqsId: [{ question: 'Apakah tulisan tetap jelas?', answer: 'Tentu, teks vektor dan garis tetap sangat tajam.' }]
  },
  {
    slug: 'repair-pdf',
    nameEn: 'Repair Damaged PDF',
    nameId: 'Perbaiki Dokumen PDF Rusak',
    shortDescEn: 'Analyze and reconstruct damaged cross-reference tables and recover corrupted PDF streams.',
    shortDescId: 'Analisis dan bangun ulang tabel referensi silang (XRef) untuk memulihkan file PDF yang rusak atau corrupt.',
    category: 'Organize',
    isPro: false,
    iconName: 'Wrench',
    seoTitleEn: 'Repair Corrupt PDF Online — Fix Damaged PDF Files Free | PurePDF',
    seoTitleId: 'Perbaiki File PDF Rusak Online — Pulihkan Dokumen Corrupt | PurePDF',
    seoDescriptionEn: 'Reconstruct unreadable and corrupted PDF files directly in your browser without uploading to remote servers.',
    seoDescriptionId: 'Pulihkan file PDF yang tidak bisa dibuka akibat download terputus atau struktur rusak.',
    howToStepsEn: [
      { step: 1, title: 'Select Damaged File', desc: 'Upload the unreadable or corrupted PDF.' },
      { step: 2, title: 'Scan Stream Objects', desc: 'Parses binary trailer and rebuilds missing XRef offsets.' },
      { step: 3, title: 'Download Repaired PDF', desc: 'Export fully restored standard-compliant PDF.' }
    ],
    howToStepsId: [
      { step: 1, title: 'Pilih Berkas Rusak', desc: 'Unggah file PDF yang tidak bisa dibuka.' },
      { step: 2, title: 'Pindai Objek', desc: 'Sistem menganalisis objek data dan membangun ulang indeks yang hilang.' },
      { step: 3, title: 'Unduh Berkas Normal', desc: 'Simpan file PDF yang sudah dipulihkan dan bisa dibaca kembali.' }
    ],
    faqsEn: [{ question: 'Can all damaged files be fixed?', answer: 'Files with salvageable page streams can be reconstructed; completely blank or truncated files may have partial recovery.' }],
    faqsId: [{ question: 'Apakah semua file rusak bisa diperbaiki?', answer: 'File yang masih memuat data halaman dapat dipulihkan secara utuh.' }]
  }
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
