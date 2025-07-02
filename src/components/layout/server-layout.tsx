import { ReactNode } from 'react';
import HeaderServer from './header-server';
import Footer from './footer';
import { type Locale } from '@/lib/i18n/types';

interface ServerLayoutProps {
  children: ReactNode;
  className?: string;
  locale?: Locale;
}

// 服务端专用的布局组件 - 只能在服务端组件中使用
export default function ServerLayout({ children, className = '', locale = 'en' }: ServerLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderServer locale={locale} />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
