import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}