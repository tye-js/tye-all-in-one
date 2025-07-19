'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Volume2, 
  Clock, 
  Palette,
  Save,
  Play,
  Download,
  Code
} from 'lucide-react';
import { VoiceOption, SSMLSegment, SSMLSettings, VoiceCharacter } from '@/types/ssml';

interface SSMLConfigPanelProps {
  voices: VoiceOption[];
  selectedSegment: SSMLSegment | null;
  settings: SSMLSettings;
  onSettingsChange: (settings: Partial<SSMLSettings>) => void;
  onSegmentChange: (segment: Partial<SSMLSegment>) => void;
  onGenerateAudio: () => void;
  isGenerating: boolean;
  ssmlCode: string;
}

export default function SSMLConfigPanel({
  voices,
  selectedSegment,
  settings,
  onSettingsChange,
  onSegmentChange,
  onGenerateAudio,
  isGenerating,
  ssmlCode,
}: SSMLConfigPanelProps) {
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Partial<VoiceCharacter>>({
    name: '',
    voice: settings.globalVoice,
    language: settings.globalLanguage,
  });

  // 获取语言列表
  const getLanguages = () => {
    const languages = new Set(voices.map(voice => voice.locale));
    return Array.from(languages).map(locale => ({
      code: locale,
      name: voices.find(v => v.locale === locale)?.localeName || locale,
    }));
  };

  // 获取指定语言的语音
  const getVoicesForLanguage = (language: string) => {
    return voices.filter(voice => voice.locale === language);
  };

  // 获取指定语音的风格
  const getVoiceStyles = (voiceName: string) => {
    const voice = voices.find(v => v.shortName === voiceName);
    return voice?.styleList || [];
  };

  // 创建新角色
  const createCharacter = () => {
    if (!newCharacter.name || !newCharacter.voice) return;

    const character: VoiceCharacter = {
      id: Math.random().toString(36).substring(2, 9),
      name: newCharacter.name,
      voice: newCharacter.voice,
      language: newCharacter.language || settings.globalLanguage,
      style: newCharacter.style,
      rate: newCharacter.rate || 1.0,
      pitch: newCharacter.pitch || 0,
      volume: newCharacter.volume || 100,
      description: newCharacter.description,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };

    onSettingsChange({
      characters: [...settings.characters, character],
    });

    setNewCharacter({
      name: '',
      voice: settings.globalVoice,
      language: settings.globalLanguage,
    });
    setIsCreatingCharacter(false);
  };

  // 删除角色
  const deleteCharacter = (characterId: string) => {
    onSettingsChange({
      characters: settings.characters.filter(c => c.id !== characterId),
    });
  };

  // 应用角色到选中文本
  const applyCharacterToSegment = (character: VoiceCharacter) => {
    if (!selectedSegment) return;

    onSegmentChange({
      characterId: character.id,
      voice: character.voice,
      style: character.style,
      rate: character.rate,
      pitch: character.pitch,
      volume: character.volume,
    });
  };

  // 复制 SSML 代码
  const copySSMLCode = async () => {
    try {
      await navigator.clipboard.writeText(ssmlCode);
    } catch (error) {
      console.error('Failed to copy SSML code:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 角色预设区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Voice Characters
          </CardTitle>
          <CardDescription>
            Create and manage voice characters for different roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 现有角色列表 */}
          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
            {settings.characters.map((character) => (
              <div
                key={character.id}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                  ${selectedSegment?.characterId === character.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}
                `}
                onClick={() => selectedSegment && applyCharacterToSegment(character)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8" style={{ backgroundColor: character.color }}>
                    <AvatarFallback className="text-white text-xs font-bold">
                      {character.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{character.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {voices.find(v => v.shortName === character.voice)?.displayName}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {character.style && (
                      <Badge variant="outline" className="text-xs">
                        {character.style}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCharacter(character.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 创建新角色 */}
          {isCreatingCharacter ? (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Character Name</Label>
                  <Input
                    value={newCharacter.name || ''}
                    onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Narrator"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Voice</Label>
                  <Select
                    value={newCharacter.voice || settings.globalVoice}
                    onValueChange={(value) => setNewCharacter(prev => ({ ...prev, voice: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getVoicesForLanguage(newCharacter.language || settings.globalLanguage).map((voice) => (
                        <SelectItem key={voice.shortName} value={voice.shortName}>
                          {voice.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createCharacter} className="flex-1">
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCreatingCharacter(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreatingCharacter(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Character
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 精细语音配置区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Settings
            {selectedSegment && (
              <Badge variant="outline">Selected Text</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedSegment 
              ? 'Adjust settings for the selected text segment'
              : 'Select text to customize voice settings'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSegment ? (
            <>
              {/* 选中文本信息 */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  "{selectedSegment.text}"
                </div>
                <div className="text-xs text-blue-700">
                  Position: {selectedSegment.startIndex} - {selectedSegment.endIndex}
                </div>
              </div>

              {/* 语音风格 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Speaking Style
                </Label>
                <Select
                  value={selectedSegment.style || 'default'}
                  onValueChange={(value) => onSegmentChange({ style: value === 'default' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {getVoiceStyles(selectedSegment.voice || settings.globalVoice).map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 语速 */}
              <div className="space-y-2">
                <Label>Speaking Rate: {selectedSegment.rate || 1.0}x</Label>
                <Slider
                  value={[selectedSegment.rate || 1.0]}
                  onValueChange={(value) => onSegmentChange({ rate: value[0] })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* 音调 */}
              <div className="space-y-2">
                <Label>Pitch: {selectedSegment.pitch || 0}Hz</Label>
                <Slider
                  value={[selectedSegment.pitch || 0]}
                  onValueChange={(value) => onSegmentChange({ pitch: value[0] })}
                  min={-50}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* 音量 */}
              <div className="space-y-2">
                <Label>Volume: {selectedSegment.volume || 100}%</Label>
                <Slider
                  value={[selectedSegment.volume || 100]}
                  onValueChange={(value) => onSegmentChange({ volume: value[0] })}
                  min={0}
                  max={200}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* 停顿时间 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Break Time (after this segment)
                </Label>
                <Select
                  value={selectedSegment.breakTime || 'none'}
                  onValueChange={(value) => onSegmentChange({ breakTime: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No break" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No break</SelectItem>
                    <SelectItem value="0.5s">0.5 seconds</SelectItem>
                    <SelectItem value="1s">1 second</SelectItem>
                    <SelectItem value="2s">2 seconds</SelectItem>
                    <SelectItem value="3s">3 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select text to customize voice settings</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 生成控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Generate Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={onGenerateAudio}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
            <Button variant="outline" onClick={copySSMLCode}>
              <Code className="w-4 h-4 mr-2" />
              Copy SSML
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
