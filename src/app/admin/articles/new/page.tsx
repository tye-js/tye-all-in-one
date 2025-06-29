'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/ui/rich-text-editor';
import MediaUpload from '@/components/ui/media-upload';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { createArticleSchema, createSlug } from '@/lib/validations';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

type ArticleFormData = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  category: 'server_deals' | 'ai_tools' | 'general';
  categoryId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ArticleFormData>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
      category: 'general',
      tags: [],
    },
  });

  const watchedTitle = watch('title');

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchCategories();
    }
  }, [session]);

  // Auto-generate slug from title
  useEffect(() => {
    if (watchedTitle) {
      const slug = createSlug(watchedTitle);
      setValue('slug', slug);
    }
  }, [watchedTitle, setValue]);

  const onSubmit = async (data: ArticleFormData) => {
    console.log("onSubmit called with data:", data);
    setIsLoading(true);

    try {
      const articleData = {
        ...data,
        content,
        featuredImage: featuredImage || undefined,
        tags: data.tags?.filter(tag => tag.trim() !== '') || [],
      };

      console.log("Final article data to submit:", articleData);
      console.log("Making API request to /api/articles");

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      console.log("API response status:", response.status);
      console.log("API response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);

        let errorMessage = 'Failed to create article';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const article = await response.json();
      console.log("Article created successfully:", article);
      toast.success('Article created successfully!');
      // router.push(`/admin/articles/${article.slug}`);
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    console.log("handleSaveDraft called");

    // 手动验证必填字段
    const currentValues = watch();

    if (!currentValues.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!currentValues.slug?.trim()) {
      toast.error('Slug is required');
      return;
    }

    if (!content?.trim()) {
      toast.error('Content is required');
      return;
    }

    // 设置状态为草稿
    setValue('status', 'draft');

    // 等待一个 tick 确保 setValue 生效
    await new Promise(resolve => setTimeout(resolve, 0));

    // 手动调用 onSubmit
    const formData = {
      ...currentValues,
      status: 'draft' as const,
      content,
      featuredImage: featuredImage || undefined,
      tags: currentValues.tags?.filter(tag => tag.trim() !== '') || [],
    };

    console.log("Saving draft:", formData);
    await onSubmit(formData);
  };

  const handlePublish = async () => {
    console.log("handlePublish called");

    // 手动验证必填字段
    const currentValues = watch();
    console.log("Current form values:", currentValues);
    console.log("Current content:", content);

    if (!currentValues.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!currentValues.slug?.trim()) {
      toast.error('Slug is required');
      return;
    }

    if (!content?.trim()) {
      toast.error('Content is required');
      return;
    }

    // 设置状态为已发布
    setValue('status', 'published');

    // 等待一个 tick 确保 setValue 生效
    await new Promise(resolve => setTimeout(resolve, 0));

    // 手动调用 onSubmit
    const formData = {
      ...currentValues,
      status: 'published' as const,
      content,
      featuredImage: featuredImage || undefined,
      tags: currentValues.tags?.filter(tag => tag.trim() !== '') || [],
    };

    console.log("Submitting data:", formData);
    await onSubmit(formData);
  };

  const handleMediaUpload = (files: { url: string; filename: string }[]) => {
    if (files.length > 0) {
      setFeaturedImage(files[0].url);
      toast.success('Image uploaded successfully!');
    }
  };

  if (status === 'loading' || !session || session.user.role !== 'admin') {
    return (
      <AdminLayout>
        <LoadingSpinner className="py-12" text="Loading..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/admin/articles">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Articles
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Article</h1>
              <p className="text-gray-600 mt-1">
                Write and publish a new article.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Slug */}
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Enter article title"
                      className="mt-1"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      {...register('slug')}
                      placeholder="article-slug"
                      className="mt-1"
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      {...register('excerpt')}
                      placeholder="Brief description of the article"
                      className="mt-1"
                      rows={3}
                    />
                    {errors.excerpt && (
                      <p className="text-sm text-red-600 mt-1">{errors.excerpt.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>
                    Write your article content using Markdown syntax.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Start writing your article..."
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                </CardContent>
              </Card>

              {/* Article Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={watch('category')}
                      onValueChange={(value) => setValue('category', value as 'server_deals' | 'ai_tools' | 'general')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server_deals">Server Deals</SelectItem>
                        <SelectItem value="ai_tools">AI Tools</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="tag1, tag2, tag3"
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim());
                        setValue('tags', tags);
                      }}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent>
                  {featuredImage ? (
                    <div className="space-y-3">
                      <Image
                        src={featuredImage}
                        alt="Featured"
                        className="w-full h-32 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFeaturedImage('')}
                        className="w-full"
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <MediaUpload
                      onUpload={handleMediaUpload}
                      accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] }}
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024} // 5MB
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
