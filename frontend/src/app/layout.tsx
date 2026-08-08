import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/common/Providers';
import './globals.css';

/**
 * Font Configuration
 * Using Inter — clean, modern, and widely supported Google Font.
 * CSS variables make fonts available to Tailwind via var(--font-sans).
 */
const fontSans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Root Metadata
 * Structured for SEO and social sharing from day one.
 * Update title template when branding is finalized.
 */
export const metadata: Metadata = {
  title: {
    default: 'AI Chat Platform',
    template: '%s | AI Chat Platform',
  },
  description:
    'Enterprise-grade AI Chat Platform powered by Amazon Bedrock. Intelligent conversations, persistent history, and seamless collaboration.',
  keywords: ['AI', 'chat', 'artificial intelligence', 'enterprise', 'Amazon Bedrock'],
  authors: [{ name: 'AI Chat Platform Team' }],
  creator: 'AI Chat Platform',
  robots: {
    index: false, // Private enterprise app — not for public indexing
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'AI Chat Platform',
    description: 'Enterprise-grade AI Chat Platform',
    siteName: 'AI Chat Platform',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050a14' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    /**
     * suppressHydrationWarning is required when using next-themes.
     * next-themes modifies the class attribute on <html> during hydration
     * to apply the saved theme. Without this, React reports a mismatch
     * between server-rendered HTML and client hydration.
     */
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
