import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/main-layout';
import { FileText, Volume2, Settings, TrendingUp, Users, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: FileText,
      title: 'Information Sharing',
      description: 'Stay updated with the latest server deals and AI tool announcements',
      href: '/articles',
      color: 'text-blue-600',
    },
    {
      icon: Volume2,
      title: 'Text-to-Speech',
      description: 'Convert text to natural-sounding speech with multiple language support',
      href: '/tts',
      color: 'text-green-600',
    },
    {
      icon: Settings,
      title: 'Content Management',
      description: 'Powerful admin tools for managing articles, categories, and content',
      href: '/admin',
      color: 'text-purple-600',
    },
  ];

  const stats = [
    { label: 'Articles Published', value: '500+', icon: FileText },
    { label: 'TTS Conversions', value: '10K+', icon: Volume2 },
    { label: 'Active Users', value: '1K+', icon: Users },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              TYE All-in-One
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your comprehensive platform for information sharing, text-to-speech conversion,
              and content management all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/articles">
                  <FileText className="mr-2 h-5 w-5" />
                  Browse Articles
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/tts">
                  <Volume2 className="mr-2 h-5 w-5" />
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
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover powerful features designed to enhance your productivity and streamline your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={feature.href}>
                        Learn More
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who trust TYE All-in-One for their daily needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                <Zap className="mr-2 h-5 w-5" />
                Sign Up Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/articles">
                <TrendingUp className="mr-2 h-5 w-5" />
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
