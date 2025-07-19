'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMembershipInfo, hasFeatureAccess } from '@/lib/membership';
import { SSMLProGuard } from '@/components/membership/membership-guard';
import SSMLTextEditor from './ssml-text-editor';
import SSMLConfigPanel from './ssml-config-panel';
import { VoiceOption, SSMLSegment, SSMLSettings } from '@/types/ssml';

export default function SSMLEditorInterface() {
  const { data: session } = useSession();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SSML 编辑器状态
  const [text, setText] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<SSMLSegment | null>(null);
  const [ssmlSettings, setSSMLSettings] = useState<SSMLSettings>({
    globalVoice: 'zh-CN-XiaoxiaoNeural',
    globalLanguage: 'zh-CN',
    characters: [],
    segments: [],
  });

  // 检查会员权限
  const membershipInfo = getMembershipInfo(session?.user);
  const hasProAccess = hasFeatureAccess(membershipInfo, 'ssmlAdvanced');

  // 获取语音列表
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/tts/voices');
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setVoices(data|| []);
        } else {
          throw new Error('Failed to fetch voices');
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setError('Failed to load voices. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  // 处理文本选择
  const handleTextSelection = (selection: { text: string; start: number; end: number }) => {
    if (!selection.text.trim()) return;

    const newSegment: SSMLSegment = {
      id: Math.random().toString(36).substring(2, 9),
      text: selection.text,
      startIndex: selection.start,
      endIndex: selection.end,
      voice: ssmlSettings.globalVoice,
    };

    setSelectedSegment(newSegment);
  };

  // 应用设置到选中的文本段
  const applySegmentSettings = (settings: Partial<SSMLSegment>) => {
    if (!selectedSegment) return;

    const updatedSegment = { ...selectedSegment, ...settings };

    setSSMLSettings(prev => ({
      ...prev,
      segments: [
        ...prev.segments.filter(s => s.id !== selectedSegment.id),
        updatedSegment,
      ],
    }));

    setSelectedSegment(updatedSegment);
  };

  // 删除段落设置
  const removeSegment = (segmentId: string) => {
    setSSMLSettings(prev => ({
      ...prev,
      segments: prev.segments.filter(s => s.id !== segmentId),
    }));

    if (selectedSegment?.id === segmentId) {
      setSelectedSegment(null);
    }
  };

  // 音频生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 生成音频
  const generateAudio = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ssmlCode = generateSSML();
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ssmlCode,
          language: ssmlSettings.globalLanguage,
          voice: ssmlSettings.globalVoice,
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

  // 生成 SSML 代码
  const generateSSML = (): string => {
    if (!text.trim()) return '';

    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${ssmlSettings.globalLanguage}">`;
    
    if (ssmlSettings.segments.length === 0) {
      // 没有特殊段落，使用全局设置
      ssml += `<voice name="${ssmlSettings.globalVoice}">${text}</voice>`;
    } else {
      // 有特殊段落，按位置排序处理
      const sortedSegments = [...ssmlSettings.segments].sort((a, b) => a.startIndex - b.startIndex);
      let currentIndex = 0;

      for (const segment of sortedSegments) {
        // 添加段落前的普通文本
        if (currentIndex < segment.startIndex) {
          const beforeText = text.substring(currentIndex, segment.startIndex);
          if (beforeText.trim()) {
            ssml += `<voice name="${ssmlSettings.globalVoice}">${beforeText}</voice>`;
          }
        }

        // 添加特殊段落
        ssml += `<voice name="${segment.voice || ssmlSettings.globalVoice}">`;
        
        const prosodyAttrs = [];
        if (segment.rate) prosodyAttrs.push(`rate="${segment.rate}"`);
        if (segment.pitch) prosodyAttrs.push(`pitch="${segment.pitch > 0 ? '+' : ''}${segment.pitch}Hz"`);
        if (segment.volume) prosodyAttrs.push(`volume="${segment.volume}%"`);
        
        if (prosodyAttrs.length > 0) {
          ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
        }
        
        if (segment.style) {
          ssml += `<mstts:express-as style="${segment.style}">`;
        }
        
        ssml += segment.text;
        
        if (segment.style) {
          ssml += `</mstts:express-as>`;
        }
        
        if (prosodyAttrs.length > 0) {
          ssml += `</prosody>`;
        }
        
        if (segment.breakTime) {
          ssml += `<break time="${segment.breakTime}"/>`;
        }
        
        ssml += `</voice>`;
        
        currentIndex = segment.endIndex;
      }

      // 添加剩余文本
      if (currentIndex < text.length) {
        const afterText = text.substring(currentIndex);
        if (afterText.trim()) {
          ssml += `<voice name="${ssmlSettings.globalVoice}">${afterText}</voice>`;
        }
      }
    }
    
    ssml += `</speak>`;
    return ssml;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasProAccess) {
    return <SSMLProGuard><div /></SSMLProGuard>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧：文本编辑器 */}
      <div className="space-y-4">
        <SSMLTextEditor
          text={text}
          onTextChange={setText}
          segments={ssmlSettings.segments}
          selectedSegment={selectedSegment}
          onTextSelection={handleTextSelection}
          onSegmentSelect={setSelectedSegment}
          onSegmentRemove={removeSegment}
          characters={ssmlSettings.characters}
        />

        {/* 音频播放器 */}
        {audioUrl && (
          <div className="bg-white p-4 rounded-lg border">
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
      </div>

      {/* 右侧：配置面板 */}
      <div>
        <SSMLConfigPanel
          voices={voices}
          selectedSegment={selectedSegment}
          settings={ssmlSettings}
          onSettingsChange={(settings: Partial<SSMLSettings>) => setSSMLSettings(prev => ({ ...prev, ...settings }))}
          onSegmentChange={applySegmentSettings}
          onGenerateAudio={generateAudio}
          isGenerating={isGenerating}
          ssmlCode={generateSSML()}
        />
      </div>
    </div>
  );
}
