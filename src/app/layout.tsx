
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Consulta CNPJ Pro',
  description: 'Pesquise dados de empresas de forma rápida e inteligente.',
  icons: {
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2320405c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='16' height='20' x='4' y='2' rx='2' ry='2'/%3E%3Cpath d='M9 22v-4h6v4'/%3E%3Cpath d='M8 6h.01'/%3E%3Cpath d='M16 6h.01'/%3E%3Cpath d='M8 10h.01'/%3E%3Cpath d='M16 10h.01'/%3E%3Cpath d='M8 14h.01'/%3E%3Cpath d='M16 14h.01'/%3E%3Cpath d='M15 2H9'/%3E%3C/svg%3E`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
