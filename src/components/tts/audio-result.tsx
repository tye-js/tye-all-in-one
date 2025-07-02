'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AudioPlayer from '@/components/ui/audio-player';
import { TTSResult } from './types';

interface AudioResultProps {
  result: TTSResult;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
}

export default function AudioResult({
  result,
  isPlaying,
  onPlayPause,
  onDownload
}: AudioResultProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Generated Audio</CardTitle>
        <CardDescription>
          Your speech has been generated successfully
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AudioPlayer
            src={result.audioUrl}
            title="Generated TTS Audio"
            showDownload={true}
            onDownload={onDownload}
            autoPlay={false}
          />

          <div className="text-sm text-gray-600 text-center">
            File size: {formatFileSize(result.fileSize)}
            {result.duration && ` • Duration: ${result.duration}s`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
