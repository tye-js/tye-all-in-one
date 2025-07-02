import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// 支持的语言 - 暂时禁用多语言路由
const locales = ['en', 'zh', 'ja'];
const defaultLocale = 'en';
const ENABLE_I18N_ROUTING = false; // 设置为 false 禁用多语言路由

// 从 Accept-Language 头解析语言
function getLanguageFromAcceptLanguage(acceptLanguage: string): string {
  if (!acceptLanguage) return 'en';

  // 解析 Accept-Language 头
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // 查找支持的语言
  for (const { code } of languages) {
    // 精确匹配
    if (['en', 'zh', 'ja'].includes(code)) {
      return code;
    }

    // 语言代码匹配
    const langCode = code.split('-')[0];
    if (['en', 'zh', 'ja'].includes(langCode)) {
      return langCode;
    }
  }

  return 'en';
}

// 获取首选语言
function getPreferredLocale(request: any): string {
  // 1. 检查 cookie 中的偏好
  const cookieLocale = request.cookies.get('preferred-locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. 检查 Accept-Language 头
  const acceptLanguage = request.headers.get('accept-language');
  console.log(acceptLanguage)
  if (acceptLanguage) {
    const detectedLocale = getLanguageFromAcceptLanguage(acceptLanguage);
    if (locales.includes(detectedLocale)) {
      return detectedLocale;
    }
  }

  // 3. 默认语言
  return defaultLocale;
}

// 检查路径是否需要语言处理
function shouldHandleLocale(pathname: string): boolean {
  const excludedPaths = [
    '/api',
    '/auth',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/uploads',
    '/images',
    '/icons',
    '/public',
  ];

  return !excludedPaths.some(path => pathname.startsWith(path));
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 处理语言检测和重定向 - 仅在启用多语言路由时执行
    if (ENABLE_I18N_ROUTING && shouldHandleLocale(pathname)) {
      const preferredLocale = getPreferredLocale(req);

      // 检查路径是否已经包含语言前缀
      const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
      );

      // 如果没有语言前缀且不是默认语言的根路径，进行重定向
      if (!pathnameHasLocale && !(preferredLocale === defaultLocale && pathname === '/')) {
        const redirectUrl = new URL(`/${preferredLocale}${pathname}`, req.url);
        redirectUrl.search = req.nextUrl.search;

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set('preferred-locale', preferredLocale, {
          maxAge: 365 * 24 * 60 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        return response;
      }
    }

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Protected API routes (require authentication)
    const protectedApiRoutes = [
      '/api/tts/synthesize',
      '/api/profile',
    ];

    // Articles API: Allow GET requests for public access, protect other methods
    if (pathname.startsWith('/api/articles')) {
      if (!token && req.method !== 'GET') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname.startsWith('/articles') ||
          pathname.startsWith('/tts') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon')
        ) {
          return true;
        }

        // Allow GET requests to articles API
        if (pathname.startsWith('/api/articles') && req.method === 'GET') {
          return true;
        }

        // For all other routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
