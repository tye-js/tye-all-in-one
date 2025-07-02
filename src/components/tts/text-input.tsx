'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Volume2, RotateCcw } from 'lucide-react';

interface TextInputProps {
  text: string;
  setText: (text: string) => void;
  onSynthesize: () => void;
  onReset: () => void;
  isLoading: boolean;
  isSignedIn: boolean;
}

export default function TextInput({
  text,
  setText,
  onSynthesize,
  onReset,
  isLoading,
  isSignedIn
}: TextInputProps) {
  return (
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
            onClick={onSynthesize}
            disabled={isLoading || !text.trim() || !isSignedIn}
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
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {!isSignedIn && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Please <a href="/auth/signin" className="underline">sign in</a> to use the text-to-speech feature.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
