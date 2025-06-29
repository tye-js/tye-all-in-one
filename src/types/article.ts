export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface ContentMetadata {
  tableOfContents: TocItem[];
  headingCount: number;
  wordCount: number;
  readingTime: number;
  codeBlocks: number;
  paragraphs: number;
  links: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  processedContent: string | null; // 预处理的 HTML
  contentMetadata: ContentMetadata | null; // 内容元数据
  featuredImage: string | null;
  status: string;
  category: string;
  publishedAt: string;
  processedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author | null;
  categoryInfo: CategoryInfo | null;
  tags: Tag[];
}

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string;
  viewCount: number;
  author: {
    name: string | null;
    avatar: string | null;
  } | null;
}
