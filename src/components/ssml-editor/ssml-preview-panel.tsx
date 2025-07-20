'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code, 
  Play, 
  Download, 
  Copy, 
  Check,
  Volume2,
  FileAudio,
  Loader2
} from 'lucide-react';
import { SSMLSettings } from '@/types/ssml';

interface SSMLPreviewPanelProps {
  ssmlCode: string;
  text: string;
  settings: SSMLSettings;
}

export default function SSMLPreviewPanel({
  ssmlCode,
  text,
  settings,
}: SSMLPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 复制 SSML 代码
  const copySSMLCode = async () => {
    try {
      await navigator.clipboard.writeText(ssmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy SSML code:', error);
    }
  };

  // 生成语音
  const generateSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter some text first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ssmlCode,
          language: settings.globalLanguage,
          voice: settings.globalVoice,
          useSSML: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAudioUrl(data.audioUrl);
      } else {
        throw new Error(data.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate speech');
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载音频
  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `ssml-speech-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化 SSML 代码
  const formatSSMLCode = (code: string) => {
    return code
      .replace(/></g, '>\n<')
      .replace(/(<[^>]+>)/g, (match) => {
        const depth = (code.substring(0, code.indexOf(match)).match(/</g) || []).length;
        const indent = '  '.repeat(Math.max(0, depth - 1));
        return `\n${indent}${match}`;
      })
      .trim();
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">SSML Preview</TabsTrigger>
          <TabsTrigger value="audio">Audio Generation</TabsTrigger>
        </TabsList>

        {/* SSML 预览 */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Generated SSML Code
              </CardTitle>
              <CardDescription>
                The SSML markup generated from your text and voice settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-60">
                  <code>{formatSSMLCode(ssmlCode)}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copySSMLCode}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* SSML 统计信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-900">Total Characters</div>
                  <div className="text-blue-700">{text.length}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-medium text-green-900">Voice Segments</div>
                  <div className="text-green-700">{settings.segments.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 音频生成 */}
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Audio Generation
              </CardTitle>
              <CardDescription>
                Generate and preview the speech audio from your SSML
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 错误提示 */}
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* 生成按钮 */}
              <div className="flex gap-2">
                <Button
                  onClick={generateSpeech}
                  disabled={isGenerating || !text.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>

                {audioUrl && (
                  <Button variant="outline" onClick={downloadAudio}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>

              {/* 音频播放器 */}
              {audioUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                    <FileAudio className="w-4 h-4" />
                    Audio generated successfully!
                  </div>
                  
                  <audio
                    controls
                    src={audioUrl}
                    className="w-full"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* 使用提示 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Tips for Better Results</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use different voices for dialogue or character speech</li>
                  <li>• Adjust speaking rate for emphasis or clarity</li>
                  <li>• Add breaks between sentences for natural pauses</li>
                  <li>• Experiment with emotional styles for expressive speech</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
