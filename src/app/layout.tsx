import type { Metadata } from 'next'
import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jobin | The Future of Career Elevation',
  description: 'Experience the antigravity state of hiring. Connect with world-class opportunities on the most transparent job portal.',
}

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UserProvider } from '@/components/providers/UserProvider';
import SidebarWrapper from '@/components/layout/SidebarWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <UserProvider>
          <Header />
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
          <Footer />
        </UserProvider>
      </body>
    </html>
  )
}
