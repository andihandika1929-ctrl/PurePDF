import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { MotionProviders } from '@/components/providers/MotionProviders';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProPaywallModal } from '@/components/workspace/ProPaywallModal';
import { AuthModal } from '@/components/auth/AuthModal';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0C0B' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://purepdf-seven.vercel.app'),
  title: {
    default: 'PurePDF — Local-First PDF Utility & AI Toolkit',
    template: '%s | PurePDF',
  },
  description:
    'Compress, merge, split, convert, sign, redact, and unlock PDF files directly in browser memory. Zero server retention for standard tools, plus PRO AI processing.',
  keywords: [
    'pdf tools',
    'compress pdf',
    'pdf to word',
    'merge pdf',
    'sign pdf',
    'local pdf editor',
    'zero storage pdf',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://purepdf-seven.vercel.app',
    siteName: 'PurePDF',
    title: 'PurePDF — Precision PDF Tools. Zero Uploads.',
    description:
      'Compress, merge, split, sign, redact, and convert PDFs directly in browser memory with zero server retention.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'PurePDF — Local-First PDF Toolkit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PurePDF — Precision PDF Tools. Zero Uploads.',
    description:
      'Local-first PDF toolkit running inside your browser memory, plus PRO AI tools for complex documents.',
    images: ['/icons/icon-512.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PurePDF',
  },
  icons: {
    shortcut: '/icons/icon-192.png',
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans transition-colors duration-200 selection:bg-[var(--color-accent)] selection:text-[var(--color-on-accent)] bg-dot-grid">
        <MotionProviders>
          <AppProvider>
            <div className="flex flex-col min-h-screen relative overflow-x-hidden">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <ProPaywallModal />
            <AuthModal />
          </AppProvider>
        </MotionProviders>
      </body>
    </html>
  );
}
