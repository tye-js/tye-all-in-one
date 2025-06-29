import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface ContentMetadata {
  tableOfContents: TocItem[];
  headingCount: number;
  wordCount: number;
  readingTime: number; // 分钟
  codeBlocks: number;
  paragraphs: number;
  links: number;
}

export interface ProcessedContent {
  html: string;
  metadata: ContentMetadata;
}

export class ContentProcessor {
  private processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(this.addHeadingIds.bind(this))
    .use(this.addCustomClasses.bind(this))
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true });

  async processContent(markdown: string): Promise<ProcessedContent> {
    // 处理 Markdown 生成 HTML
    const result = await this.processor.process(markdown);
    const html = result.toString();
    
    // 提取元数据
    const metadata = this.extractMetadata(markdown, html);
    
    return { html, metadata };
  }

  private addHeadingIds() {
    return (tree: any) => {
      visit(tree, 'element', (node: any) => {
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
          const text = this.extractTextFromNode(node);
          const id = this.generateHeadingId(text);
          
          node.properties = node.properties || {};
          node.properties.id = id;
          node.properties.className = [
            ...(node.properties.className || []),
            'scroll-mt-20' // 为锚点导航添加偏移
          ];
        }
      });
    };
  }

  private addCustomClasses() {
    return (tree: any) => {
      visit(tree, 'element', (node: any) => {
        node.properties = node.properties || {};
        node.properties.className = node.properties.className || [];

        switch (node.tagName) {
          case 'h1':
            node.properties.className.push('text-3xl', 'font-bold', 'mt-8', 'mb-4', 'text-gray-900');
            break;
          case 'h2':
            node.properties.className.push('text-2xl', 'font-bold', 'mt-6', 'mb-3', 'text-gray-900');
            break;
          case 'h3':
            node.properties.className.push('text-xl', 'font-bold', 'mt-4', 'mb-2', 'text-gray-900');
            break;
          case 'h4':
            node.properties.className.push('text-lg', 'font-semibold', 'mt-4', 'mb-2', 'text-gray-900');
            break;
          case 'h5':
            node.properties.className.push('text-base', 'font-semibold', 'mt-3', 'mb-2', 'text-gray-900');
            break;
          case 'h6':
            node.properties.className.push('text-sm', 'font-semibold', 'mt-3', 'mb-2', 'text-gray-900');
            break;
          case 'p':
            node.properties.className.push('mb-4', 'leading-relaxed', 'text-gray-700');
            break;
          case 'ul':
            node.properties.className.push('list-disc', 'list-inside', 'mb-4', 'space-y-1', 'text-gray-700');
            break;
          case 'ol':
            node.properties.className.push('list-decimal', 'list-inside', 'mb-4', 'space-y-1', 'text-gray-700');
            break;
          case 'blockquote':
            node.properties.className.push('border-l-4', 'border-blue-500', 'pl-4', 'italic', 'my-4', 'text-gray-700', 'bg-blue-50', 'py-2', 'rounded-r');
            break;
          case 'code':
            // 内联代码
            if (!node.properties.className.includes('hljs')) {
              node.properties.className.push('bg-gray-100', 'px-1', 'py-0.5', 'rounded', 'text-sm', 'font-mono', 'text-gray-800');
            }
            break;
          case 'pre':
            node.properties.className.push('bg-gray-900', 'text-gray-100', 'p-4', 'rounded-lg', 'overflow-x-auto', 'mb-4');
            break;
          case 'table':
            node.properties.className.push('w-full', 'border-collapse', 'border', 'border-gray-300', 'my-4');
            break;
          case 'th':
            node.properties.className.push('bg-gray-100', 'border', 'border-gray-300', 'px-4', 'py-2', 'text-left', 'font-semibold');
            break;
          case 'td':
            node.properties.className.push('border', 'border-gray-300', 'px-4', 'py-2');
            break;
          case 'a':
            node.properties.className.push('text-blue-600', 'hover:text-blue-800', 'underline', 'transition-colors');
            // 外部链接添加属性
            if (node.properties.href && node.properties.href.startsWith('http')) {
              node.properties.target = '_blank';
              node.properties.rel = 'noopener noreferrer';
            }
            break;
          case 'img':
            node.properties.className.push('rounded-lg', 'shadow-md', 'my-4', 'max-w-full', 'h-auto');
            node.properties.loading = 'lazy';
            break;
          case 'hr':
            node.properties.className.push('border-gray-300', 'my-8');
            break;
        }
      });
    };
  }

  private extractTextFromNode(node: any): string {
    if (node.type === 'text') {
      return node.value;
    }
    if (node.children) {
      return node.children.map((child: any) => this.extractTextFromNode(child)).join('');
    }
    return '';
  }

  private generateHeadingId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .replace(/(^-|-$)/g, ''); // 移除开头和结尾的连字符
  }

  private extractMetadata(markdown: string, html: string): ContentMetadata {
    // 提取目录
    const tableOfContents = this.extractTableOfContents(markdown);
    
    // 计算统计信息
    const headingCount = (markdown.match(/^#{1,6}\s+/gm) || []).length;
    const wordCount = this.calculateWordCount(markdown);
    const readingTime = Math.ceil(wordCount / 200); // 假设每分钟200字
    const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
    const paragraphs = (html.match(/<p[^>]*>/g) || []).length;
    const links = (html.match(/<a[^>]*>/g) || []).length;

    return {
      tableOfContents,
      headingCount,
      wordCount,
      readingTime,
      codeBlocks,
      paragraphs,
      links,
    };
  }

  private extractTableOfContents(markdown: string): TocItem[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = this.generateHeadingId(text);
      
      if (id && text) {
        items.push({ id, text, level });
      }
    }

    return items;
  }

  private calculateWordCount(markdown: string): number {
    // 移除 Markdown 语法，计算实际单词数
    const cleanText = markdown
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`[^`]+`/g, '') // 移除内联代码
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // 移除强调标记
      .replace(/\n+/g, ' ') // 换行替换为空格
      .trim();

    // 计算中英文字符数
    const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = cleanText.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(word => word.length > 0).length;
    
    // 中文字符按字计算，英文按单词计算
    return chineseChars + englishWords;
  }
}

// 单例实例
export const contentProcessor = new ContentProcessor();
