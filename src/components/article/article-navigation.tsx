'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
}

interface ArticleNavigationProps {
  currentSlug: string;
  category: string;
}

export default function ArticleNavigation({ currentSlug, category }: ArticleNavigationProps) {
  const [prevArticle, setPrevArticle] = useState<NavigationArticle | null>(null);
  const [nextArticle, setNextArticle] = useState<NavigationArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await fetch(`/api/articles/navigation?current=${currentSlug}&category=${category}`);
        if (response.ok) {
          const data = await response.json();
          setPrevArticle(data.prev);
          setNextArticle(data.next);
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigation();
  }, [currentSlug, category]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!prevArticle && !nextArticle) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {/* Previous Article */}
      <div className="md:col-span-1">
        {prevArticle ? (
          <Link href={`/articles/${prevArticle.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous Article
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                  {prevArticle.title}
                </h3>
                {prevArticle.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {prevArticle.excerpt}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ) : (
          <div /> // 空占位符
        )}
      </div>

      {/* Next Article */}
      <div className="md:col-span-1">
        {nextArticle ? (
          <Link href={`/articles/${nextArticle.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-right">
                <div className="flex items-center justify-end text-sm text-gray-500 mb-2">
                  Next Article
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                  {nextArticle.title}
                </h3>
                {nextArticle.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {nextArticle.excerpt}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ) : (
          <div /> // 空占位符
        )}
      </div>
    </div>
  );
}
