import { Metadata } from 'next';
import Link from 'next/link';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Volume2, Settings, Mic, Download , TrendingUp, Users, Zap, ArrowRight, Star } from 'lucide-react';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'TYE All-in-One | Comprehensive Web Application',
  description: 'Comprehensive web application with information sharing, TTS utility, and content management. Discover server deals, AI tools, and powerful text-to-speech features.',
  keywords: ['server deals', 'AI tools', 'text-to-speech', 'content management', 'web application', 'technology'],
  openGraph: {
    title: 'TYE All-in-One | Comprehensive Web Application',
    description: 'Comprehensive web application with information sharing, TTS utility, and content management.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TYE All-in-One | Comprehensive Web Application',
    description: 'Discover server deals, AI tools, and powerful text-to-speech features.',
  },
  alternates: {
    canonical: '/',
  },
};

// 获取最新文章
async function getLatestArticles() {
  try {
    const latestArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        category: articles.category,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt))
      .limit(3);

    return latestArticles;
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    return [];
  }
}

export default async function Home() {
  const latestArticles = await getLatestArticles();

  const features = [
    {
      icon: FileText,
      title: 'Articles & Insights',
      description: 'Discover the latest server deals, AI tool updates, and industry insights',
      href: '/articles',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Volume2,
      title: 'Text-to-Speech',
      description: 'Convert your text to natural-sounding speech with multiple language options',
      href: '/tts',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Settings,
      title: 'Admin Dashboard',
      description: 'Manage content, users, and system settings',
      href: '/admin',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const stats = [
    {
      icon: TrendingUp,
      label: 'Performance',
      value: '99.9%',
      description: 'Uptime',
    },
    {
      icon: Users,
      label: 'Users',
      value: '1,000+',
      description: 'Active users',
    },
    {
      icon: Zap,
      label: 'Speed',
      value: '<100ms',
      description: 'Response time',
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      server_deals: 'bg-green-100 text-green-800',
      ai_tools: 'bg-purple-100 text-purple-800',
      general: 'bg-blue-100 text-blue-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryName = (category: string) => {
    const names = {
      server_deals: 'Server Deals',
      ai_tools: 'AI Tools',
      general: 'General',
    };
    return names[category as keyof typeof names] || category;
  };

  return (
    <MainLayout locale="en">
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                TYE All-in-One
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Comprehensive web application with information sharing, TTS utility, and content management
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/articles">
                    Explore Articles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/tts">
                    Try Text-to-Speech
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need for content management and text-to-speech conversion
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" asChild className="w-full justify-start p-0">
                      <Link href={feature.href}>
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg font-medium text-gray-700 mb-1">{stat.label}</div>
                  <div className="text-gray-600">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Articles Section */}
        {latestArticles.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Latest Articles
                  </h2>
                  <p className="text-xl text-gray-600">
                    Stay updated with our latest insights and updates
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/articles">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {latestArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getCategoryColor(article.category)}>
                          {getCategoryName(article.category)}
                        </Badge>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
          {/* Features Overview - 服务端渲染 */}
        <section className="bg-gray-50 py-16">
                     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Text To Voice
                  </h2>
                  <p className="text-xl text-gray-600">
                    Convert your text to natural-sounding speech with multiple language options
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/tts">
                    Jump to
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Mic className="w-4 h-4 mr-2 text-blue-600" />
                Multiple Languages
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs">
                Support for Chinese, English, Japanese and more
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Volume2 className="w-4 h-4 mr-2 text-green-600" />
                Natural Voices
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs">
                High-quality neural voices with emotions
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Settings className="w-4 h-4 mr-2 text-purple-600" />
                Customizable
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs">
                Adjust speed, pitch, and voice styles
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Download className="w-4 h-4 mr-2 text-orange-600" />
                Download Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs">
                Save generated speech as MP3 files
              </CardDescription>
            </CardContent>
          </Card>
          </div>
        </div>
        </section>
        {/* CTA Section */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust TYE All-in-One for their content and TTS needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/articles">
                  Browse Articles
                </Link>
              </Button>
              <Button size="lg" variant="outline" className=" border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/tts">
                  Try TTS Now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}