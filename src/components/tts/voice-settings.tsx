'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { Voice, TTSSettings } from './types';

interface VoiceSettingsProps {
  settings: TTSSettings;
  updateSettings: (updates: Partial<TTSSettings>) => void;
  languages: string[];
  voices: Voice[];
  onLanguageChange: (language: string) => void;
  onVoiceChange: (voice: string) => void;
}

export default function VoiceSettings({
  settings,
  updateSettings,
  languages,
  voices,
  onLanguageChange,
  onVoiceChange
}: VoiceSettingsProps) {
  // Get current voice object
  const getCurrentVoice = (): Voice | null => {
    return voices.find(voice => voice.shortName === settings.selectedVoice) || null;
  };

  // Get available styles for current voice
  const getAvailableStyles = (): string[] => {
    const currentVoice = getCurrentVoice();
    return currentVoice?.styleList || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Voice Settings
        </CardTitle>
        <CardDescription>
          Customize the voice and speech parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SSML Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ssml-toggle">Advanced SSML Mode</Label>
            <p className="text-sm text-gray-500">Enable advanced voice control options</p>
          </div>
          <Switch
            id="ssml-toggle"
            checked={settings.useSSML}
            onCheckedChange={(checked) => updateSettings({ useSSML: checked })}
          />
        </div>

        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={settings.selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="voice">Voice</Label>
          <Select value={settings.selectedVoice} onValueChange={onVoiceChange}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.shortName} value={voice.shortName}>
                  {voice.localName} ({voice.gender === "Male" ? "男" : "女"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Style Selection */}
        {getAvailableStyles().length > 0 && (
          <div>
            <Label htmlFor="style">Voice Style</Label>
            <Select
              value={settings.selectedStyle || "default"}
              onValueChange={(style) => updateSettings({ selectedStyle: style === "default" ? "" : style })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select style (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {getAvailableStyles().map((style) => (
                  <SelectItem key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Speaking Rate: {settings.speakingRate[0]}</Label>
          <Slider
            value={settings.speakingRate}
            onValueChange={(value) => updateSettings({ speakingRate: value })}
            min={0.25}
            max={4.0}
            step={0.25}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>Normal</span>
            <span>Fast</span>
          </div>
        </div>

        <div>
          <Label>Pitch: {settings.pitch[0]}</Label>
          <Slider
            value={settings.pitch}
            onValueChange={(value) => updateSettings({ pitch: value })}
            min={-20}
            max={20}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>Normal</span>
            <span>High</span>
          </div>
        </div>

        {/* Advanced SSML Options */}
        {settings.useSSML && (
          <>
            {/* Volume Control */}
            <div>
              <Label>Volume: {settings.volume[0]}%</Label>
              <Slider
                value={settings.volume}
                onValueChange={(value) => updateSettings({ volume: value })}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Silent</span>
                <span>Normal</span>
                <span>Loud</span>
              </div>
            </div>

            {/* Quality Selection */}
            <div>
              <Label htmlFor="quality">Audio Quality</Label>
              <Select 
                value={settings.quality} 
                onValueChange={(quality) => updateSettings({ quality })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Faster)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (Better)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Emotion Intensity (for voices with styles) */}
            {settings.selectedStyle && settings.selectedStyle !== "default" && (
              <div>
                <Label>Emotion Intensity: {settings.emotionIntensity[0]}</Label>
                <Slider
                  value={settings.emotionIntensity}
                  onValueChange={(value) => updateSettings({ emotionIntensity: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Subtle</span>
                  <span>Normal</span>
                  <span>Strong</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
