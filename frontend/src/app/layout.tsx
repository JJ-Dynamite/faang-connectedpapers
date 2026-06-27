import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Visualize and map research',
  description: 'Visualize and map research - Built with Rust + Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
