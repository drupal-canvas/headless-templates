import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DraftIndicator } from '../components/draft-indicator';
import './globals.css';

export const metadata: Metadata = {
  title: 'Canvas Headless — Next.js',
  description: 'A minimal Drupal Canvas headless frontend.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <DraftIndicator />
        {children}
      </body>
    </html>
  );
}
