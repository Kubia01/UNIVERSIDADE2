import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdaptiveColorsProvider } from '@/components/providers/AdaptiveColorsProvider'
import OfflineNotification from '@/components/ui/OfflineNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Treinamento',
  description: 'Plataforma de treinamento e capacitação empresarial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{
          __html: `
            .browser-adjusting * {
              transition: none !important;
              animation: none !important;
            }
          `
        }} />
      </head>
      <body className={inter.className} suppressHydrationWarnings>
        <AdaptiveColorsProvider>
          <OfflineNotification />
          {children}
        </AdaptiveColorsProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // CÓDIGO DE DETECÇÃO ESPECÍFICA REMOVIDO - FUNCIONAMENTO SILENCIOSO
            `,
          }}
        />
      </body>
    </html>
  )
}