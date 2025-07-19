'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchInput from '@/components/ui/search-input';
import { Filter } from 'lucide-react';

export default function ArticlesFilters() {
  console.log("ArticlesFilters");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'publishedAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  // 更新 URL 参数
  const updateURL = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    // 重置页码
    newSearchParams.delete('page');
    
    const newURL = `/articles?${newSearchParams.toString()}`;
    router.push(newURL);
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("search");
    updateURL({ q: query, category: selectedCategory, sortBy, sortOrder });
  };

  // 处理分类变化
  const handleCategoryChange = (category: string) => {
    console.log("category");
    setSelectedCategory(category);
    updateURL({ q: searchQuery, category, sortBy, sortOrder });
  };

  // 处理排序变化
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    updateURL({ q: searchQuery, category: selectedCategory, sortBy: newSortBy, sortOrder: newSortOrder });
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="server_deals">Server Deals</SelectItem>
              <SelectItem value="ai_tools">AI Tools</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt-desc">Latest First</SelectItem>
              <SelectItem value="publishedAt-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="viewCount-desc">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
