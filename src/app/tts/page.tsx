'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Volume2, Download, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Voice {
  name: string;
  displayName: string;
  shortName: string;
  gender: string;
  locale: string;
  localName:string;
  localeName: string;
  voiceType: string;
  status: string;
  styleList:string[];
}

interface VoiceList {
  locale: string;
  voices: Voice[];
}


interface TTSResult {
  id: string;
  audioUrl: string;
  fileSize: number;
  duration?: number;
  status: string;
}

export default function TTSPage() {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN');
  const [selectedVoice, setSelectedVoice] = useState('zh-CN-XiaoxiaoNeural');
  const [speakingRate, setSpeakingRate] = useState([1.0]);
  const [pitch, setPitch] = useState([0.0]);
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [voicesAndLanguage, setVoicesAndLanguage] = useState<VoiceList[]>();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<TTSResult | null>(null);
  // const [voiceByLanguage, setVoiceByLanguage] = useState<Voice[]>([]);


  // Fetch available languages and voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch(`/api/tts/voices`);
        if (response.ok) {
          const data = await response.json();
          if(data.length<=0){
            return toast.error('No voices available. Please try again later.');
          }
          setLanguages(data.map((item:VoiceList) => item.locale))
          setVoicesAndLanguage(data)
          
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    fetchVoices();
  }, []);

  // Get voices for selected language
  const getVoicesForLanguage = (language: string): Voice[] => {
    if(voicesAndLanguage===undefined) return [];
  
    // setVoiceByLanguage(voicesAndLanguage?.filter((item:VoiceList) => item.locale === language)[0].voices);
    return (voicesAndLanguage!.filter(item=>item.locale===language))![0].voices;
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    const voices = getVoicesForLanguage(language);
    if (voices.length > 0) {
      setSelectedVoice(voices[0].displayName);
    }
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
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language: selectedLanguage,
          voice: selectedVoice,
          speakingRate: speakingRate[0],
          pitch: pitch[0],
        }),
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text-to-Speech</h1>
          <p className="text-gray-600">
            Convert your text to natural-sounding speech with multiple language and voice options.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main TTS Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Text Input
                </CardTitle>
                <CardDescription>
                  Enter the text you want to convert to speech (max 5000 characters)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="text">Text to Convert</Label>
                  <Textarea
                    id="text"
                    placeholder="Enter your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[200px] mt-2"
                    maxLength={5000}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {text.length}/5000 characters
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSynthesize}
                    disabled={isLoading || !text.trim() || !session}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {!session && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Please <a href="/auth/signin" className="underline">sign in</a> to use the text-to-speech feature.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Result */}
            {result && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Generated Audio</CardTitle>
                  <CardDescription>
                    Your speech has been generated successfully
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="text-sm text-gray-600">
                        Size: {formatFileSize(result.fileSize)}
                        {result.duration && ` • Duration: ${result.duration}s`}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Settings Panel */}
          <div>
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
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
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
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {getVoicesForLanguage(selectedLanguage).map((voice) => (
                        <SelectItem key={voice.shortName} value={voice.shortName}>
                          {voice.localName} ({voice.gender==="Male"?"男":"女"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* {
                  selectedVoice &&  <div>
                  <Label htmlFor="voice">Style List</Label>
                  <Select  onValueChange={setSelectedVoice}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select Style" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedVoice((voice) => (
                        <SelectItem key={voice.shortName} value={voice.shortName}>
                          {voice.localName} ({voice.gender==="Male"?"男":"女"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                } */}

                <div>
                  <Label>Speaking Rate: {speakingRate[0]}</Label>
                  <Slider
                    value={speakingRate}
                    onValueChange={setSpeakingRate}
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
                  <Label>Pitch: {pitch[0]}</Label>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
