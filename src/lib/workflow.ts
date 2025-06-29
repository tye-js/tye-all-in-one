import { db } from '@/lib/db';
import { articles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface WorkflowAction {
  type: 'publish' | 'unpublish' | 'archive' | 'restore';
  articleId: string;
  userId: string;
  reason?: string;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  article?: any;
}

export class ArticleWorkflow {
  static async executeAction(action: WorkflowAction): Promise<WorkflowResult> {
    try {
      // Get the article
      const article = await db
        .select()
        .from(articles)
        .where(eq(articles.id, action.articleId))
        .limit(1);

      if (!article[0]) {
        return {
          success: false,
          message: 'Article not found',
        };
      }

      // Get the user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, action.userId))
        .limit(1);

      if (!user[0]) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check permissions
      const canPerformAction = await this.checkPermissions(
        action.type,
        article[0],
        user[0]
      );

      if (!canPerformAction.allowed) {
        return {
          success: false,
          message: canPerformAction.reason || 'Permission denied',
        };
      }

      // Execute the action
      const result = await this.performAction(action, article[0]);
      
      if (result.success) {
        // Log the action (you could extend this to save to an audit log)
        console.log(`Workflow action executed: ${action.type} on article ${action.articleId} by user ${action.userId}`);
      }

      return result;
    } catch (error) {
      console.error('Workflow execution error:', error);
      return {
        success: false,
        message: 'Internal error occurred',
      };
    }
  }

  private static async checkPermissions(
    actionType: string,
    article: any,
    user: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Admin can do anything
    if (user.role === 'admin') {
      return { allowed: true };
    }

    // Author can manage their own articles
    if (article.authorId === user.id) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'You can only manage your own articles',
    };
  }

  private static async performAction(
    action: WorkflowAction,
    article: any
  ): Promise<WorkflowResult> {
    const now = new Date();

    switch (action.type) {
      case 'publish':
        if (article.status === 'published') {
          return {
            success: false,
            message: 'Article is already published',
          };
        }

        // Validate article before publishing
        const validation = this.validateForPublishing(article);
        if (!validation.valid) {
          return {
            success: false,
            message: validation.message || 'Article validation failed',
          };
        }

        const publishedArticle = await db
          .update(articles)
          .set({
            status: 'published',
            publishedAt: article.publishedAt || now,
            updatedAt: now,
          })
          .where(eq(articles.id, action.articleId))
          .returning();

        return {
          success: true,
          message: 'Article published successfully',
          article: publishedArticle[0],
        };

      case 'unpublish':
        if (article.status !== 'published') {
          return {
            success: false,
            message: 'Article is not published',
          };
        }

        const unpublishedArticle = await db
          .update(articles)
          .set({
            status: 'draft',
            updatedAt: now,
          })
          .where(eq(articles.id, action.articleId))
          .returning();

        return {
          success: true,
          message: 'Article unpublished successfully',
          article: unpublishedArticle[0],
        };

      case 'archive':
        if (article.status === 'archived') {
          return {
            success: false,
            message: 'Article is already archived',
          };
        }

        const archivedArticle = await db
          .update(articles)
          .set({
            status: 'archived',
            updatedAt: now,
          })
          .where(eq(articles.id, action.articleId))
          .returning();

        return {
          success: true,
          message: 'Article archived successfully',
          article: archivedArticle[0],
        };

      case 'restore':
        if (article.status !== 'archived') {
          return {
            success: false,
            message: 'Article is not archived',
          };
        }

        const restoredArticle = await db
          .update(articles)
          .set({
            status: 'draft',
            updatedAt: now,
          })
          .where(eq(articles.id, action.articleId))
          .returning();

        return {
          success: true,
          message: 'Article restored successfully',
          article: restoredArticle[0],
        };

      default:
        return {
          success: false,
          message: 'Unknown action type',
        };
    }
  }

  private static validateForPublishing(article: any): { valid: boolean; message?: string } {
    // Check required fields
    if (!article.title || article.title.trim() === '') {
      return { valid: false, message: 'Title is required' };
    }

    if (!article.content || article.content.trim() === '') {
      return { valid: false, message: 'Content is required' };
    }

    if (!article.slug || article.slug.trim() === '') {
      return { valid: false, message: 'Slug is required' };
    }

    // Check content length
    if (article.content.length < 100) {
      return { valid: false, message: 'Content must be at least 100 characters long' };
    }

    // Check if excerpt exists or can be generated
    if (!article.excerpt && article.content.length > 0) {
      // Auto-generate excerpt if not provided
      // This would be handled in the calling code
    }

    return { valid: true };
  }

  static async getArticleHistory(articleId: string): Promise<any[]> {
    // This would return the history of workflow actions for an article
    // For now, we'll return an empty array as we haven't implemented audit logging
    return [];
  }

  static async bulkAction(
    actionType: 'publish' | 'unpublish' | 'archive' | 'restore',
    articleIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const articleId of articleIds) {
      try {
        const result = await this.executeAction({
          type: actionType,
          articleId,
          userId,
        });

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`Article ${articleId}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Article ${articleId}: Internal error`);
      }
    }

    return { success, failed, errors };
  }
}

// Helper functions for workflow status
export function getWorkflowStatus(article: any): {
  status: string;
  canPublish: boolean;
  canUnpublish: boolean;
  canArchive: boolean;
  canRestore: boolean;
} {
  const status = article.status;
  
  return {
    status,
    canPublish: status === 'draft',
    canUnpublish: status === 'published',
    canArchive: status === 'draft' || status === 'published',
    canRestore: status === 'archived',
  };
}

export function getStatusColor(status: string): string {
  const colors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  };
  
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

export function getStatusIcon(status: string): string {
  const icons = {
    draft: '📝',
    published: '✅',
    archived: '📦',
  };
  
  return icons[status as keyof typeof icons] || '❓';
}
