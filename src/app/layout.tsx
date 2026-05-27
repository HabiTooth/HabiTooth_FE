import type { Metadata } from 'next';
import './globals.css';
import StyledComponentsRegistry from './registry';

export const metadata: Metadata = {
  title: 'HabiTooth',
  description: 'AI-powered oral health monitoring',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
