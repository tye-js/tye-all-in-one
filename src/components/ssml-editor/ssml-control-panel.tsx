'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mic, 
  Volume2, 
  Clock,
  Globe,
  Save,
  RotateCcw
} from 'lucide-react';
import { VoiceList } from '@/components/tts/types';
import { SSMLSegment, SSMLSettings } from './ssml-editor-interface';

interface SSMLControlPanelProps {
  voices: VoiceList[];
  selectedSegment: SSMLSegment | null;
  globalSettings: SSMLSettings;
  onGlobalSettingsChange: (settings: Partial<SSMLSettings>) => void;
  onSegmentSettingsChange: (settings: Partial<SSMLSegment>) => void;
}

export default function SSMLControlPanel({
  voices,
  selectedSegment,
  globalSettings,
  onGlobalSettingsChange,
  onSegmentSettingsChange,
}: SSMLControlPanelProps) {
  const [segmentSettings, setSegmentSettings] = useState<Partial<SSMLSegment>>({
    voice: selectedSegment?.voice || globalSettings.globalVoice,
    style: selectedSegment?.style || '',
    rate: selectedSegment?.rate || 1.0,
    pitch: selectedSegment?.pitch || 0,
    volume: selectedSegment?.volume || 100,
    breakTime: selectedSegment?.breakTime || '',
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
    console.log(voices.find(item => item.locale === language));
    return voices.find(voice => voice.locale === language)?.voices;
  };

  // 获取指定语音的风格
  // 应用段落设置
  const applySegmentSettings = () => {
    if (!selectedSegment) return;
    onSegmentSettingsChange(segmentSettings);
  };

  // 重置段落设置
  const resetSegmentSettings = () => {
    if (!selectedSegment) return;
    const resetSettings = {
      voice: globalSettings.globalVoice,
      style: '',
      rate: 1.0,
      pitch: 0,
      volume: 100,
      breakTime: '',
    };
    setSegmentSettings(resetSettings);
    onSegmentSettingsChange(resetSettings);
  };

  // 更新段落设置
  const updateSegmentSetting = (key: keyof SSMLSegment, value: any) => {
    setSegmentSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="segment" disabled={!selectedSegment}>
            Segment Settings
            {selectedSegment && <Badge className="ml-2 bg-blue-500">Active</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* 全局设置 */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Global Voice Settings
              </CardTitle>
              <CardDescription>
                Default settings applied to all text without specific voice effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={globalSettings.globalLanguage}
                  onValueChange={(value) => onGlobalSettingsChange({ globalLanguage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Voice</Label>
                <Select
                  value={globalSettings.globalVoice}
                  onValueChange={(value) => onGlobalSettingsChange({ globalVoice: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getVoicesForLanguage(globalSettings.globalLanguage)!.map((voice) => (
                      <SelectItem key={voice.shortName} value={voice.shortName}>
                        <div className="flex items-center gap-2">
                          <span>{voice.localName}</span>
                          <Badge variant="outline" className="text-xs">
                            {voice.gender}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 段落设置 */}
        <TabsContent value="segment" className="space-y-4">
          {selectedSegment ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Selected Text
                  </CardTitle>
                  <CardDescription>
                    Customize voice settings for the selected text segment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <div className="text-sm font-medium text-blue-900">
                      &quot;{selectedSegment.text}&quot;
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Position: {selectedSegment.startIndex} - {selectedSegment.endIndex}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 语音选择 */}
                    {/* <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select
                        value={segmentSettings.voice || globalSettings.globalVoice}
                        onValueChange={(value) => updateSegmentSetting('voice', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getVoicesForLanguage(globalSettings.globalLanguage)!.map((voice) => (
                            <SelectItem key={voice.shortName} value={voice.shortName}>
                              <div className="flex items-center gap-2">
                                <span>{voice.localName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {voice.gender}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div> */}

                    {/* 语音风格 */}
                    {/* <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Speaking Style
                      </Label>
                      <Select
                        value={segmentSettings.style || ''}
                        onValueChange={(value) => updateSegmentSetting('style', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select style (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Default</SelectItem>
                          {getVoiceStyles(segmentSettings.voice || globalSettings.globalVoice).map((style) => (
                            <SelectItem key={style} value={style}>
                              {style.charAt(0).toUpperCase() + style.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div> */}

                    {/* 语速 */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Speaking Rate: {segmentSettings.rate || 1.0}x
                      </Label>
                      <Slider
                        value={[segmentSettings.rate || 1.0]}
                        onValueChange={(value) => updateSegmentSetting('rate', value[0])}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.5x (Slow)</span>
                        <span>1.0x (Normal)</span>
                        <span>2.0x (Fast)</span>
                      </div>
                    </div>

                    {/* 音调 */}
                    <div className="space-y-2">
                      <Label>
                        Pitch: {segmentSettings.pitch || 0}Hz
                      </Label>
                      <Slider
                        value={[segmentSettings.pitch || 0]}
                        onValueChange={(value) => updateSegmentSetting('pitch', value[0])}
                        min={-50}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>-50Hz (Lower)</span>
                        <span>0Hz (Normal)</span>
                        <span>+50Hz (Higher)</span>
                      </div>
                    </div>

                    {/* 音量 */}
                    <div className="space-y-2">
                      <Label>
                        Volume: {segmentSettings.volume || 100}%
                      </Label>
                      <Slider
                        value={[segmentSettings.volume || 100]}
                        onValueChange={(value) => updateSegmentSetting('volume', value[0])}
                        min={0}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0% (Silent)</span>
                        <span>100% (Normal)</span>
                        <span>200% (Loud)</span>
                      </div>
                    </div>

                    {/* 停顿时间 */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Break Time (after this segment)
                      </Label>
                      <Select
                        value={segmentSettings.breakTime || ''}
                        onValueChange={(value) => updateSegmentSetting('breakTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No break" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No break</SelectItem>
                          <SelectItem value="0.5s">0.5 seconds</SelectItem>
                          <SelectItem value="1s">1 second</SelectItem>
                          <SelectItem value="2s">2 seconds</SelectItem>
                          <SelectItem value="3s">3 seconds</SelectItem>
                          <SelectItem value="5s">5 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-4">
                      <Button onClick={applySegmentSettings} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Apply Settings
                      </Button>
                      <Button variant="outline" onClick={resetSegmentSettings}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500 mb-2">
                  <Settings className="w-8 h-8 mx-auto mb-2" />
                  No text selected
                </div>
                <p className="text-sm text-gray-600">
                  Select text in the editor to customize voice settings for that segment
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
