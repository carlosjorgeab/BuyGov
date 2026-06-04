import type {Metadata} from 'next';
import { Work_Sans } from 'next/font/google';
import './globals.css'; // Global styles

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-work-sans',
});

export const metadata: Metadata = {
  title: 'BuyGov- Controle de Licitações',
  description: 'Plataforma inteligente de monitoramento e controle de licitações públicas.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${workSans.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
