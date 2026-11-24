import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProPaywallModal } from '@/components/workspace/ProPaywallModal';
import { AuthModal } from '@/components/auth/AuthModal';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export const metadata: Metadata = {
  title: 'PurePDF — Fast, Clean & Private Online PDF Tools (26 Tools)',
  description:
    'Convert, compress, edit, merge, split, and analyze PDF files with zero cloud storage. 21 free client-side tools and 5 advanced PRO AI tools.',
  keywords: [
    'pdf tools',
    'compress pdf',
    'pdf to word',
    'merge pdf',
    'ai pdf editor',
    'free pdf editor',
    'zero storage pdf',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PurePDF',
  },
  icons: {
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa] transition-colors duration-200 selection:bg-[#ff3700] selection:text-white bg-dot-grid">
        <AppProvider>
          <div className="flex flex-col min-h-screen relative overflow-x-hidden">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ProPaywallModal />
          <AuthModal />
        </AppProvider>
      </body>
    </html>
  );
}
