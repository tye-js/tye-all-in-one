'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Code, 
  Eye, 
  Edit3, 
  Volume2, 
  Clock, 
  Mic, 
  Palette,
  Plus,
  Trash2,
  Play,
  Crown
} from 'lucide-react';
import { TTSSettings, Voice, SSMLSegment, SSMLProSettings } from './types';

interface SSMLProEditorProps {
  text: string;
  settings: TTSSettings;
  voices: Voice[];
  onSettingsChange: (settings: Partial<TTSSettings>) => void;
}

export default function SSMLProEditor({ 
  text, 
  settings, 
  voices,
  onSettingsChange 
}: SSMLProEditorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [ssmlSegments, setSSMLSegments] = useState<SSMLSegment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selected = text.substring(start, end);
      setSelectedText(selected);
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
      setSelectionRange(null);
    }
  }, [text]);

  // 添加 SSML 段落
  const addSSMLSegment = useCallback((segmentData: Partial<SSMLSegment>) => {
    if (!selectionRange) return;

    const newSegment: SSMLSegment = {
      id: Math.random().toString(36).substr(2, 9),
      text: selectedText,
      startIndex: selectionRange.start,
      endIndex: selectionRange.end,
      ...segmentData,
    };

    setSSMLSegments(prev => [...prev, newSegment]);
    setSelectedText('');
    setSelectionRange(null);
  }, [selectedText, selectionRange]);

  // 删除 SSML 段落
  const removeSSMLSegment = useCallback((id: string) => {
    setSSMLSegments(prev => prev.filter(segment => segment.id !== id));
  }, []);

  // 生成 SSML 代码
  const generateSSMLCode = useCallback((): string => {
    if (!text.trim()) return '';

    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${settings.selectedLanguage}">`;
    
    // 如果没有段落，使用基本设置
    if (ssmlSegments.length === 0) {
      ssml += `<voice name="${settings.selectedVoice}">`;
      
      const prosodyAttrs = [];
      if (settings.speakingRate[0] !== 1.0) prosodyAttrs.push(`rate="${settings.speakingRate[0]}"`);
      if (settings.pitch[0] !== 0) prosodyAttrs.push(`pitch="${settings.pitch[0] > 0 ? '+' : ''}${settings.pitch[0]}Hz"`);
      if (settings.volume[0] !== 100) prosodyAttrs.push(`volume="${settings.volume[0]}%"`);
      
      if (prosodyAttrs.length > 0) {
        ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
      }
      
      if (settings.selectedStyle && settings.selectedStyle !== "default") {
        const styleAttrs = [`style="${settings.selectedStyle}"`];
        if (settings.emotionIntensity[0] !== 1.0) {
          styleAttrs.push(`styledegree="${settings.emotionIntensity[0]}"`);
        }
        ssml += `<mstts:express-as ${styleAttrs.join(' ')}>`;
        ssml += text;
        ssml += `</mstts:express-as>`;
      } else {
        ssml += text;
      }
      
      if (prosodyAttrs.length > 0) {
        ssml += `</prosody>`;
      }
      
      ssml += `</voice>`;
    } else {
      // 使用段落设置
      let currentIndex = 0;
      const sortedSegments = [...ssmlSegments].sort((a, b) => a.startIndex - b.startIndex);
      
      for (const segment of sortedSegments) {
        // 添加段落前的普通文本
        if (currentIndex < segment.startIndex) {
          const beforeText = text.substring(currentIndex, segment.startIndex);
          if (beforeText.trim()) {
            ssml += `<voice name="${settings.selectedVoice}">${beforeText}</voice>`;
          }
        }
        
        // 添加段落的 SSML
        ssml += `<voice name="${segment.voice || settings.selectedVoice}">`;
        
        const prosodyAttrs = [];
        if (segment.rate) prosodyAttrs.push(`rate="${segment.rate}"`);
        if (segment.pitch) prosodyAttrs.push(`pitch="${segment.pitch}"`);
        if (segment.volume) prosodyAttrs.push(`volume="${segment.volume}"`);
        
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
      
      // 添加剩余的普通文本
      if (currentIndex < text.length) {
        const afterText = text.substring(currentIndex);
        if (afterText.trim()) {
          ssml += `<voice name="${settings.selectedVoice}">${afterText}</voice>`;
        }
      }
    }
    
    ssml += `</speak>`;
    return ssml;
  }, [text, settings, ssmlSegments]);

  // 获取语音的可用风格
  const getVoiceStyles = useCallback((voiceName: string) => {
    const voice = voices.find(v => v.shortName === voiceName);
    return voice?.styleList || [];
  }, [voices]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Crown className="w-5 h-5 mr-2 text-blue-600" />
          SSML Pro Editor
          <Badge className="ml-2 bg-blue-100 text-blue-800">Pro</Badge>
        </CardTitle>
        <CardDescription>
          Advanced SSML editing with visual interface and fine-grained control
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'visual' | 'code')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              SSML Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-6">
            {/* 文本选择区域 */}
            <div className="space-y-2">
              <Label>Select text to apply SSML effects</Label>
              <Textarea
                ref={textareaRef}
                value={text}
                readOnly
                onSelect={handleTextSelection}
                className="min-h-[120px] font-mono text-sm"
                placeholder="Enter your text in the main input area..."
              />
              {selectedText && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Selected: "{selectedText}"
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSSMLSegment({ voice: settings.selectedVoice })}
                    >
                      <Mic className="w-4 h-4 mr-1" />
                      Change Voice
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSSMLSegment({ style: 'cheerful' })}
                    >
                      <Palette className="w-4 h-4 mr-1" />
                      Add Emotion
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSSMLSegment({ rate: 'slow' })}
                    >
                      <Volume2 className="w-4 h-4 mr-1" />
                      Adjust Speed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSSMLSegment({ breakTime: '1s' })}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Add Break
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* SSML 段落列表 */}
            {ssmlSegments.length > 0 && (
              <div className="space-y-2">
                <Label>SSML Segments</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ssmlSegments.map((segment) => (
                    <div key={segment.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            "{segment.text}"
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {segment.voice && (
                              <Badge variant="secondary">Voice: {segment.voice}</Badge>
                            )}
                            {segment.style && (
                              <Badge variant="secondary">Style: {segment.style}</Badge>
                            )}
                            {segment.rate && (
                              <Badge variant="secondary">Rate: {segment.rate}</Badge>
                            )}
                            {segment.pitch && (
                              <Badge variant="secondary">Pitch: {segment.pitch}</Badge>
                            )}
                            {segment.volume && (
                              <Badge variant="secondary">Volume: {segment.volume}</Badge>
                            )}
                            {segment.breakTime && (
                              <Badge variant="secondary">Break: {segment.breakTime}</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSSMLSegment(segment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <Label>Generated SSML Code</Label>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {generateSSMLCode()}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" variant="outline">
                Copy SSML
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
