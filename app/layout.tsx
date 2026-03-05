import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PNL Vault — Trading Journal',
  description: 'Professional IBKR trading journal with analytics, AI insights, and performance tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz@9..40&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>V</text></svg>" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
