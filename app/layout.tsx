import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'TypeNova — Master Your Keyboard',
  description: 'Learn to type correctly. Build speed. Improve accuracy. Become faster every day.',
  openGraph: { title: 'TypeNova — Master Your Keyboard', description: 'A modern typing-learning platform.' }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
