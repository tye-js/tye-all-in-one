'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List } from 'lucide-react';
import { TocItem } from '@/types/article';

interface TableOfContentsProps {
  tableOfContents?: TocItem[];
  content?: string; // 降级选项
}

export default function TableOfContents({ tableOfContents, content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 优先使用预处理的目录数据
    if (tableOfContents) {
      setTocItems(tableOfContents);
      return;
    }

    // 降级到解析 Markdown 内容
    if (content) {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const items: TocItem[] = [];
      let match;

      while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/(^-|-$)/g, '');

        if (id && text) {
          items.push({ id, text, level });
        }
      }

      setTocItems(items);
    }
  }, [tableOfContents, content]);

  useEffect(() => {
    // 监听滚动事件，高亮当前章节
    const handleScroll = () => {
      const headings = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
      
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading && heading.getBoundingClientRect().top <= 100) {
          setActiveId(heading.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // 偏移量，避免被固定头部遮挡
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <List className="w-4 h-4 mr-2" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <nav className="space-y-1"> 
          {tocItems.map((item) => (
            <button
              id={item.text}
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`
                block w-full text-left text-sm py-1 px-2 rounded transition-colors
                ${item.level === 1 ? 'font-medium' : ''}
                ${item.level === 2 ? 'ml-2' : ''}
                ${item.level === 3 ? 'ml-4' : ''}
                ${item.level === 4 ? 'ml-6' : ''}
                ${item.level === 5 ? 'ml-8' : ''}
                ${item.level === 6 ? 'ml-10' : ''}
                ${activeId === item.id 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
