# Product Requirements Document (PRD): PurePDF

## 1. Product Overview & Business Model
* **Product Name:** PurePDF
* **Primary Language:** 100% English across all UI labels, URL slugs, SEO guides, FAQ schemas, and legal pages for global search reach and higher AdSense RPM.
* **Privacy Architecture:** Zero-file-storage policy. 21 standard tools process files 100% client-side in the browser. The 5 PRO tools process files temporarily in memory/temp buffer and auto-delete immediately after export. No user PDFs are ever saved to cloud storage.
* **Visual & UX System:** Modern Bento Minimalist extracted from `https://daniyalalam.online/` via `replica-skill` (stored in `reference-ui/`), built with `shadcn/ui`, tactile hover/click physics, scroll-triggered sticky glass navbar shadows, Light Mode default (AdSense-safe), and Dark Mode toggle.

## 2. Tech Stack
* **Frontend & SEO:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, `shadcn/ui`, Lucide Icons, Framer Motion.
* **Client PDF Engine:** `pdf-lib`, `pdfjs-dist`, `fabric` (Canvas editor).
* **Database, Auth & Realtime:** Supabase (PostgreSQL + Google OAuth + Realtime balance updates). *Do NOT use Supabase Storage.*
* **Payments:** Midtrans / Duitku (QRIS - IDR) & LemonSqueezy (Card/PayPal - USD) with server-side SHA512 Webhook verification.
* **Backend AI & Pro Engine (Phase 2):** Python 3.11 + FastAPI (`pymupdf`, `opencv-python-headless`, `numpy`, `easyocr`, `google-genai`, `pdf2docx`, Ghostscript).

## 3. Directory Structure
```text
PurePDF/
├── PRD.md
├── .agent/skills/replica-skill/
├── reference-ui/                           # Extracted design tokens & components from daniyalalam.online
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Sticky Glass Navbar, 5-Col Mega-Menu, Footer, AdSense & GA4
│   │   │   ├── page.tsx                    # Homepage: Search bar, 6 Category Pills, 26-Tool Bento Grid
│   │   │   ├── [toolSlug]/page.tsx         # Dynamic SEO tool pages
│   │   │   ├── download/[jobId]/page.tsx   # 12-second AdSense countdown & VIP skip page
│   │   │   ├── pricing/page.tsx            # Decoy Credit Packs & VVIP Subscription checkout
│   │   │   ├── [secretAdmin]/page.tsx      # Secret Admin Dashboard (validated via process.env.ADMIN_SECRET_PATH)
│   │   │   ├── api/webhooks/payment/route.ts # Server-side signature verification & auto credit top-up
│   │   │   ├── privacy-policy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── config/toolsConfig.ts           # Registry for all 26 tools, credit costs, SEO copy, & FAQs
│   │   ├── components/
│   │   │   ├── ui/                         # shadcn/ui styled with reference-ui
│   │   │   ├── layout/                     # Navbar.tsx, AdSlot.tsx, SeoContentBlock.tsx
│   │   │   └── workspace/                  # DropzoneUploader, PageGridBoard, PdfEditorCanvas, InspectorPanel, ProPaywallModal
│   │   └── lib/                            # clientPdfOps.ts, pdfExport.ts, supabaseClient.ts, apiClient.ts
└── backend/                                # Python FastAPI service