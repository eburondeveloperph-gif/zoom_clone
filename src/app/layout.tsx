import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';

import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Orbit',
  description: 'Orbit meetings and collaboration',
  icons: {
    icon: '/icons/logo.svg',
  },
  manifest: '/manifest.json',
};

// PWA viewport - no zoom, vertical scroll only
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Service Worker registration script (client-side only)
const swScript = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('SW registered: ', registration);
      }).catch(function(error) {
        console.log('SW registration failed: ', error);
      });
    });
  }
`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </head>
      <ClerkProvider
        appearance={{
          layout: {
            socialButtonsVariant: 'iconButton',
            logoImageUrl: '/icons/logo.svg',
          },
          variables: {
            colorText: '#111827',
            colorPrimary: '#2684FF',
            colorBackground: '#F4F5F7',
            colorInputBackground: '#FFFFFF',
            colorInputText: '#111827',
          },
        }}
      >
        <body className={`${inter.className} bg-orbit-surface text-orbit-text`}>
          <Toaster />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
