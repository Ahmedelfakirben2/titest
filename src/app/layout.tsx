
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Correctly import Geist (sans-serif)
import { Geist_Mono } from 'next/font/google'; // Keep Geist Mono if needed elsewhere
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { auth } from '@/lib/auth'; // Import auth
import SessionProvider from '@/components/session-provider'; // Import SessionProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'Device Agreement Signer',
  description: 'Sign your device usage agreement.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); // Fetch session on the server

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
         <SessionProvider session={session}> {/* Wrap with SessionProvider */}
           {children}
           <Toaster /> {/* Add Toaster here */}
         </SessionProvider>
      </body>
    </html>
  );
}
