import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'CDNetworks Platform — Web Performance · Cloud Security · Edge Computing',
  description:
    'Tăng tốc website, bảo vệ ứng dụng và triển khai workload tới biên với mạng lưới CDN toàn cầu của CDNetworks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
