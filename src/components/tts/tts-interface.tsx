'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import TextInput from '@/components/tts/text-input';
import VoiceSettings from '@/components/tts/voice-settings';
import SSMLPreview from '@/components/tts/ssml-preview';
import AudioResult from '@/components/tts/audio-result';
import { VoiceList, TTSResult, TTSSettings } from '@/components/tts/types';
import { createTTSFormData, getDefaultSettings } from '@/components/tts/utils';
import { toast } from 'sonner';

export default function TTSInterface() {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [voicesAndLanguage, setVoicesAndLanguage] = useState<VoiceList[]>();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<TTSResult | null>(null);

  // TTS 设置
  const [settings, setSettings] = useState<TTSSettings>(getDefaultSettings());

  // 更新设置的辅助函数
  const updateSettings = (updates: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Fetch available languages and voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch(`/api/tts/voices`);
        if (response.ok) {
          const data = await response.json();
          if(data.length <= 0){
            return toast.error('No voices available. Please try again later.');
          }
          setLanguages(data.map((item: VoiceList) => item.locale));
          setVoicesAndLanguage(data);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    fetchVoices();
  }, []);

  // Get voices for selected language
  const getVoicesForLanguage = (language: string) => {
    if (!voicesAndLanguage) return [];
    const languageData = voicesAndLanguage.find(item => item.locale === language);
    return languageData?.voices || [];
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    const voices = getVoicesForLanguage(language);
    updateSettings({
      selectedLanguage: language,
      selectedVoice: voices.length > 0 ? voices[0].shortName : '',
      selectedStyle: '', // 重置风格选择
    });
  };

  // Handle voice change
  const handleVoiceChange = (voiceName: string) => {
    updateSettings({
      selectedVoice: voiceName,
      selectedStyle: '', // 重置风格选择
    });
  };

  // Handle TTS synthesis
  const handleSynthesize = async () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setResult(null);

    if (!text.trim()) {
      toast.error('Please enter some text to convert');
      return;
    }

    if (!session) {
      toast.error('Please sign in to use text-to-speech');
      return;
    }

    setIsLoading(true);

    try {
      const formData = createTTSFormData(text, settings);

      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to synthesize speech');
      }

      const data: TTSResult = await response.json();
      setResult(data);
      toast.success('Speech synthesized successfully!');
    } catch (error) {
      console.error('TTS error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to synthesize speech');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle audio playback
  const handlePlayPause = () => {
    if (!result?.audioUrl) return;

    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setIsPlaying(false);
    } else {
      if (currentAudio) {
        currentAudio.play();
      } else {
        const audio = new Audio(result.audioUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => {
          toast.error('Error playing audio');
          setIsPlaying(false);
        });
        setCurrentAudio(audio);
        audio.play();
      }
      setIsPlaying(true);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!result?.audioUrl) return;

    const link = document.createElement('a');
    link.href = result.audioUrl;
    link.download = `tts-audio-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset form
  const handleReset = () => {
    setText('');
    setResult(null);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main TTS Form */}
      <div className="lg:col-span-2">
        <TextInput
          text={text}
          setText={setText}
          onSynthesize={handleSynthesize}
          onReset={handleReset}
          isLoading={isLoading}
          isSignedIn={!!session}
        />

        <SSMLPreview
          text={text}
          settings={settings}
          voices={getVoicesForLanguage(settings.selectedLanguage)}
          onSettingsChange={updateSettings}
        />

        {result && (
          <AudioResult
            result={result}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onDownload={handleDownload}
          />
        )}
      </div>

      {/* Settings Panel */}
      <div>
        <VoiceSettings
          settings={settings}
          updateSettings={updateSettings}
          languages={languages}
          voices={getVoicesForLanguage(settings.selectedLanguage)}
          onLanguageChange={handleLanguageChange}
          onVoiceChange={handleVoiceChange}
        />
      </div>
    </div>
  );
}
