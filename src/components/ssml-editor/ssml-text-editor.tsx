'use client';

import { useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, X, Mic, Volume2 } from 'lucide-react';
import { SSMLSegment, VoiceCharacter } from '@/types/ssml';

interface SSMLTextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  segments: SSMLSegment[];
  selectedSegment: SSMLSegment | null;
  onTextSelection: (selection: { text: string; start: number; end: number }) => void;
  onSegmentSelect: (segment: SSMLSegment | null) => void;
  onSegmentRemove: (segmentId: string) => void;
  characters: VoiceCharacter[];
}

export default function SSMLTextEditor({
  text,
  onTextChange,
  segments,
  selectedSegment,
  onTextSelection,
  onSegmentSelect,
  onSegmentRemove,
  characters,
}: SSMLTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = text.substring(start, end);
      setSelectionRange({ start, end });
      onTextSelection({ text: selectedText, start, end });
    } else {
      setSelectionRange(null);
      onSegmentSelect(null);
    }
  }, [text, onTextSelection, onSegmentSelect]);

  // 获取文本段落的颜色
  const getSegmentColor = (segmentId: string) => {
    const colors = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-purple-100 border-purple-300',
      'bg-orange-100 border-orange-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300',
    ];
    const index = segments.findIndex(s => s.id === segmentId);
    return colors[index % colors.length];
  };

  // 渲染带有高亮的文本
  const renderHighlightedText = () => {
    if (segments.length === 0) {
      return (
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {text || (
            <span className="text-gray-400 italic">
              Enter your text here and select portions to apply voice effects...
            </span>
          )}
        </div>
      );
    }

    const sortedSegments = [...segments].sort((a, b) => a.startIndex - b.startIndex);
    const parts = [];
    let currentIndex = 0;

    for (const segment of sortedSegments) {
      // 添加段落前的普通文本
      if (currentIndex < segment.startIndex) {
        const beforeText = text.substring(currentIndex, segment.startIndex);
        if (beforeText) {
          parts.push(
            <span key={`before-${segment.id}`} className="text-gray-700">
              {beforeText}
            </span>
          );
        }
      }

      // 添加高亮的段落
      const isSelected = selectedSegment?.id === segment.id;
      parts.push(
        <span
          key={segment.id}
          className={`
            inline-block px-1 py-0.5 rounded cursor-pointer transition-all
            ${getSegmentColor(segment.id)}
            ${isSelected ? 'ring-2 ring-blue-500 shadow-sm' : 'hover:shadow-sm'}
          `}
          onClick={() => onSegmentSelect(segment)}
          title={`Voice: ${segment.voice || 'Default'}`}
        >
          {segment.text}
        </span>
      );

      currentIndex = segment.endIndex;
    }

    // 添加剩余文本
    if (currentIndex < text.length) {
      const afterText = text.substring(currentIndex);
      if (afterText) {
        parts.push(
          <span key="after" className="text-gray-700">
            {afterText}
          </span>
        );
      }
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
  };

  // 获取角色信息
  const getCharacterForSegment = (segment: SSMLSegment) => {
    return characters.find(c => c.id === segment.characterId);
  };

  return (
    <div className="space-y-4">
      {/* 文本输入区域 */}
      <Card className="h-[300px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Edit3 className="w-5 h-5" />
            Text Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)]">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onSelect={handleTextSelection}
            placeholder="Enter your text here. Select any portion to apply voice effects..."
            className="h-full resize-none border-0 p-0 focus-visible:ring-0 text-sm leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* 选择信息 */}
      {selectionRange && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-1">
            Selected: "{text.substring(selectionRange.start, selectionRange.end)}"
          </div>
          <div className="text-xs text-blue-700">
            Position: {selectionRange.start} - {selectionRange.end}
          </div>
        </div>
      )}

      {/* 文本预览区域 */}
      <Card className="h-[300px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="w-5 h-5" />
            Preview
            {segments.length > 0 && (
              <Badge variant="outline">{segments.length} segments</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
          <div className="text-sm leading-relaxed">
            {renderHighlightedText()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
