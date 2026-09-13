import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'LSOR-Sport',
  description: 'La compétition entre potes : jeux, classements et matchs IRL.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <BottomNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
