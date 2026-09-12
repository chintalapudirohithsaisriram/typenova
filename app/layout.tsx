import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './typenova-overrides.css';

export const metadata: Metadata = {
  title: 'TypeNova — Typing Practice, Tests & Personalized Training',
  description: 'Learn touch typing, practice weak keys, take accurate WPM tests, and track real typing progress with TypeNova.',
  keywords: ['typing practice', 'typing test', 'touch typing', 'typing speed test', 'WPM test', 'typing accuracy'],
  openGraph: { title: 'TypeNova — Master Your Keyboard', description: 'Learn, practice, test, analyze, and improve your typing.' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, colorScheme: 'light dark' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
