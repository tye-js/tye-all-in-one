'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/main-layout';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  const handleReportError = () => {
    // In a real application, you would send this to an error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.log('Error report:', errorReport);
    
    // You could integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error);
    
    alert('Error report has been logged. Thank you for helping us improve!');
  };

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Something went wrong!</CardTitle>
            <CardDescription>
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono text-gray-700 max-h-32 overflow-auto">
                <div className="font-bold mb-1">Error Details:</div>
                <div className="mb-2">{error.message}</div>
                {error.digest && (
                  <div className="text-gray-500">Digest: {error.digest}</div>
                )}
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <a href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReportError}
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-4">
              Error ID: {error.digest || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
