import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppHeader } from './AppHeader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'PrepTool', template: '%s · PrepTool' },
  description: 'Interview preparation, organised: roadmap, progress and review in one place.',
};

// Runs before first paint so the page never flashes the wrong theme: the saved choice wins,
// otherwise the system setting.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <TooltipProvider>
          <AppHeader />
          <main>{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
