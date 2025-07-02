// 服务端 Header 组件 - 不依赖客户端 API
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadServerTranslations, createServerTranslation } from '@/lib/i18n/server';
import { type Locale } from '@/lib/i18n/types';
import HeaderClient from './header-client';

interface HeaderServerProps {
  locale: Locale;
}

export default async function HeaderServer({ locale }: HeaderServerProps) {
  // 安全地获取服务端会话 - 添加错误处理
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.warn('Failed to get server session:', error);
    // 在错误情况下继续渲染，但没有会话信息
  }

  // 加载翻译
  const translations = await loadServerTranslations(locale);
  const t = createServerTranslation(translations);

  // 导航项 - 服务端渲染（移除语言前缀，因为已禁用多语言路由）
  const navigation = [
    { name: t('navigation.home'), href: `/`, icon: 'Home' },
    { name: t('navigation.articles'), href: `/articles`, icon: 'FileText' },
    { name: t('navigation.tts'), href: `/tts`, icon: 'Volume2' },
  ];

  // 将数据传递给客户端组件
  return (
    <HeaderClient
      session={session}
      navigation={navigation}
      translations={{
        profile: t('common.profile'),
        admin: t('navigation.admin'),
        settings: t('common.settings'),
        signOut: t('auth.sign_out'),
        signIn: t('auth.sign_in'),
        signUp: t('auth.sign_up'),
        adminBadge: t('common.admin'),
      }}
      locale={locale}
    />
  );
}
