import { Metadata } from 'next';
import { Suspense } from 'react';
import MainLayout from '@/components/layout/main-layout';
import SSMLEditorInterface from '@/components/ssml-editor/ssml-editor-interface';
import MembershipStatus from '@/components/membership/membership-status';

export const metadata: Metadata = {
  title: 'SSML Editor | TYE All-in-One',
  description: 'Advanced SSML editor with visual interface for creating rich speech synthesis markup',
  keywords: ['SSML', 'Speech Synthesis', 'Text to Speech', 'Voice Editor', 'Audio'],
  openGraph: {
    title: 'SSML Editor - Advanced Speech Synthesis',
    description: 'Create rich speech synthesis with our visual SSML editor',
    type: 'website',
  },
};

export default function SSMLEditorPage() {
  return (
    <MainLayout locale="en">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 简洁的页面标题 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SSML Editor</h1>
              <p className="text-sm text-gray-600 mt-1">
                Professional speech synthesis markup editor
              </p>
            </div>
            <Suspense fallback={<div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />}>
              <MembershipStatus compact />
            </Suspense>
          </div>

          {/* SSML 编辑器界面 */}
          <Suspense fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse" />
            </div>
          }>
            <SSMLEditorInterface />
          </Suspense>
        </div>
      </div>
    </MainLayout>
  );
}
