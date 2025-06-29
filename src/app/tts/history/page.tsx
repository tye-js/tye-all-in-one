'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import Pagination from '@/components/ui/pagination';
import { 
  Volume2, 
  Download, 
  Play, 
  Pause, 
  Calendar, 
  FileAudio, 
  Clock,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TTSRequest {
  id: string;
  text: string;
  language: string;
  voice: string;
  audioUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  duration?: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

interface TTSHistoryResponse {
  requests: TTSRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export default function TTSHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<TTSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const fetchHistory = async (page = 1) => {
    if (!session) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tts/synthesize?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) throw new Error('Failed to fetch history');

      const data: TTSHistoryResponse = await response.json();
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching TTS history:', error);
      toast.error('Failed to load TTS history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchHistory(1);
    }
  }, [session]);

  const handlePageChange = (page: number) => {
    fetchHistory(page);
  };

  const handlePlayPause = (request: TTSRequest) => {
    if (!request.audioUrl) return;

    if (playingId === request.id && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setPlayingId(null);
    } else {
      if (currentAudio) {
        currentAudio.pause();
      }

      const audio = new Audio(request.audioUrl);
      audio.addEventListener('ended', () => setPlayingId(null));
      audio.addEventListener('error', () => {
        toast.error('Error playing audio');
        setPlayingId(null);
      });
      
      setCurrentAudio(audio);
      setPlayingId(request.id);
      audio.play();
    }
  };

  const handleDownload = (request: TTSRequest) => {
    if (!request.audioUrl) return;

    const link = document.createElement('a');
    link.href = request.audioUrl;
    link.download = `tts-${request.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (requestId: string) => {
    try {
      const response = await fetch(`/api/tts/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete request');

      setRequests(requests.filter(req => req.id !== requestId));
      toast.success('TTS request deleted');
    } catch (error) {
      console.error('Error deleting TTS request:', error);
      toast.error('Failed to delete request');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (status === 'loading' || !session) {
    return (
      <MainLayout>
        <LoadingSpinner className="py-12" text="Loading..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TTS History</h1>
            <p className="text-gray-600">
              View and manage your text-to-speech conversion history.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchHistory(pagination.page)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => router.push('/tts')}>
              <Volume2 className="w-4 h-4 mr-2" />
              New TTS
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner className="py-12" text="Loading TTS history..." />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<FileAudio className="w-12 h-12" />}
            title="No TTS requests found"
            description="You haven't created any text-to-speech conversions yet."
            action={{
              label: 'Create Your First TTS',
              onClick: () => router.push('/tts'),
            }}
          />
        ) : (
          <>
            {/* Requests List */}
            <div className="space-y-4 mb-8">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {request.language} • {request.voice}
                          </span>
                        </div>
                        <CardTitle className="text-lg">
                          {truncateText(request.text, 100)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </span>
                          {request.duration && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {request.duration}s
                            </span>
                          )}
                          {request.fileSize && (
                            <span className="flex items-center">
                              <FileAudio className="w-4 h-4 mr-1" />
                              {formatFileSize(request.fileSize)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'completed' && request.audioUrl && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayPause(request)}
                            >
                              {playingId === request.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(request)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {request.status === 'failed' && request.errorMessage && (
                    <CardContent>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {request.errorMessage}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {Math.ceil(pagination.total / pagination.limit) > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={Math.ceil(pagination.total / pagination.limit)}
                onPageChange={handlePageChange}
                className="justify-center"
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
