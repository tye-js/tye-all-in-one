import { Metadata } from 'next';
import { Suspense } from 'react';
import MainLayout from '@/components/layout/main-layout';
import TTSInterface from '@/components/tts/tts-interface';
import MembershipStatus from '@/components/membership/membership-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Text-to-Speech | TYE All-in-One',
  description: 'Convert your text to natural-sounding speech with multiple language and voice options. Powered by Azure Speech AI.',
  keywords: ['text-to-speech', 'TTS', 'voice synthesis', 'Azure Speech', 'AI voice', 'speech generation'],
  openGraph: {
    title: 'Text-to-Speech | TYE All-in-One',
    description: 'Convert your text to natural-sounding speech with multiple language and voice options. Powered by Azure Speech AI.',
    type: 'website',
    url: '/tts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text-to-Speech | TYE All-in-One',
    description: 'Convert your text to natural-sounding speech with multiple language and voice options.',
  },
  alternates: {
    canonical: '/tts',
  },
};

export default function TTSPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - 服务端渲染 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text-to-Speech</h1>
          <p className="text-gray-600">
            Convert your text to natural-sounding speech with multiple language and voice options.
          </p>
        </div>
        {/* Usage Instructions - 服务端渲染 */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
              <CardDescription>
                Follow these simple steps to convert your text to speech
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                    1
                  </div>
                  <h3 className="font-medium mb-2">Enter Text</h3>
                  <p className="text-sm text-gray-600">
                    Type or paste the text you want to convert to speech
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                    2
                  </div>
                  <h3 className="font-medium mb-2">Choose Settings</h3>
                  <p className="text-sm text-gray-600">
                    Select language, voice, and adjust speech parameters
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                    3
                  </div>
                  <h3 className="font-medium mb-2">Generate & Download</h3>
                  <p className="text-sm text-gray-600">
                    Click synthesize to generate speech and download the audio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 会员状态 - 客户端组件 */}
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse mb-6" />}>
          <MembershipStatus compact />
        </Suspense>

        {/* TTS Interface - 客户端组件 */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        }>
          <TTSInterface />
        </Suspense>


      </div>
    </MainLayout>
  );
}
