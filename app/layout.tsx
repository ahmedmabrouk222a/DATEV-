import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DATEV Kanzlei-Rechnungswesen – Schulungsumgebung',
  description: 'DATEV ERP Training System – Buchführung, Jahresabschluss, Stammdaten',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
