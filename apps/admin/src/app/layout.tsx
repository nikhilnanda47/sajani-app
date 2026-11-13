import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sajani Admin',
  description: 'Sajani e-commerce admin panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
