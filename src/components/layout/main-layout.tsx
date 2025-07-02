import { ReactNode } from 'react';
import SimpleHeader from './simple-header';
import Footer from './footer';
import { type Locale } from '@/lib/i18n/types';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  locale?: Locale;
}

// 客户端兼容的主布局组件 - 使用简化的 header
export default function MainLayout({ children, className = '', locale = 'en' }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
