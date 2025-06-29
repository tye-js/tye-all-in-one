import { contentProcessor } from '@/lib/content-processor';
import { ContentMetadata } from '@/types/article';

interface ArticleContentProps {
  content: string;
  processedContent?: string | null;
  contentMetadata?: ContentMetadata | null;
}

export default async function ArticleContent({
  content,
  processedContent,
  contentMetadata
}: ArticleContentProps) {
  // 如果有预处理的内容，直接使用
  if (processedContent) {
    return (
      <div
        className="prose prose-lg max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  }

  // 降级到实时处理（用于兼容性）
  const processed = await contentProcessor.processContent(content);

  return (
    <div
      className="prose prose-lg max-w-none mb-8"
      dangerouslySetInnerHTML={{ __html: processed.html }}
    />
  );
}
