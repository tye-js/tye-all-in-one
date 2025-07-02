'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { TTSSettings } from './types';

interface SSMLPreviewProps {
  text: string;
  settings: TTSSettings;
}

export default function SSMLPreview({ text, settings }: SSMLPreviewProps) {
  // Generate SSML preview
  const generateSSMLPreview = (): string => {
    if (!settings.useSSML || !text.trim()) return text;

    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${settings.selectedLanguage}">`;
    
    // Voice selection
    ssml += `<voice name="${settings.selectedVoice}">`;
    
    // Prosody (rate, pitch, volume)
    const prosodyAttrs = [];
    if (settings.speakingRate[0] !== 1.0) prosodyAttrs.push(`rate="${settings.speakingRate[0]}"`);
    if (settings.pitch[0] !== 0) prosodyAttrs.push(`pitch="${settings.pitch[0] > 0 ? '+' : ''}${settings.pitch[0]}Hz"`);
    if (settings.volume[0] !== 100) prosodyAttrs.push(`volume="${settings.volume[0]}%"`);
    
    if (prosodyAttrs.length > 0) {
      ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
    }
    
    // Style and emotion intensity
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
    ssml += `</speak>`;
    
    return ssml;
  };

  if (!settings.useSSML || !text.trim()) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Code className="w-5 h-5 mr-2" />
          SSML Preview
        </CardTitle>
        <CardDescription>
          Generated SSML markup for your text
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {generateSSMLPreview()}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
