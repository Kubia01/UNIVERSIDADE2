import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/browser-compatibility-lite.css'
import AdaptiveColorsProvider from '@/components/providers/AdaptiveColorsProvider'
import OfflineNotification from '@/components/ui/OfflineNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Universidade Corporativa',
  description: 'Plataforma de treinamento e desenvolvimento para colaboradores',
  keywords: ['treinamento', 'educação', 'corporativo', 'desenvolvimento'],
  authors: [{ name: 'Universidade Corporativa' }],
  openGraph: {
    title: 'Universidade Corporativa',
    description: 'Plataforma de treinamento e desenvolvimento para colaboradores',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AdaptiveColorsProvider>
          <OfflineNotification />
          <div className="min-h-screen adaptive-bg">
            {children}
          </div>
        </AdaptiveColorsProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Compatibilidade leve inline
            if (navigator.userAgent.includes('Firefox')) {
              document.documentElement.style.setProperty('--font-weight-light', '400');
              document.documentElement.style.setProperty('--font-weight-normal', '500');
            }
          `
        }} />
      </body>
    </html>
  )
}