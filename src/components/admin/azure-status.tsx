'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Globe,
  Key,
  Server,
  Info
} from 'lucide-react';

interface AzureStatus {
  config: {
    isConfigured: boolean;
    region: string;
    endpoint: string;
    hasSubscriptionKey: boolean;
  };
  validation?: {
    isValid: boolean;
    error?: string;
    details?: any;
  };
  statusMessage: string;
  helpMessage: string;
  supportedRegions: Array<{ code: string; name: string }>;
}

export default function AzureStatus() {
  const [status, setStatus] = useState<AzureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/azure-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Azure status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/admin/azure-status', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => prev ? { ...prev, validation: data.validation } : null);
      }
    } catch (error) {
      console.error('Error testing Azure connection:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Azure Speech Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Azure Speech Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Azure configuration status.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!status.config.isConfigured) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (status.validation?.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status.validation?.isValid === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusBadge = () => {
    if (!status.config.isConfigured) {
      return <Badge variant="destructive">Not Configured</Badge>;
    }
    if (status.validation?.isValid) {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    }
    if (status.validation?.isValid === false) {
      return <Badge variant="destructive">Connection Failed</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Azure Speech Service Status
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Monitor and configure Azure Speech Service integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Subscription Key</span>
                      {status.config.hasSubscriptionKey ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Region</span>
                      {status.config.region ? (
                        <Badge variant="outline">{status.config.region}</Badge>
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Endpoint</span>
                      {status.config.endpoint ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Status</span>
                      {status.validation?.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : status.validation?.isValid === false ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {status.validation?.error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Error:</strong> {status.validation.error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testing || !status.config.isConfigured}>
                {testing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button variant="outline" onClick={fetchStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {status.statusMessage}
              </AlertDescription>
            </Alert>

            {status.config.endpoint && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Endpoint:</label>
                <code className="block p-2 bg-gray-100 rounded text-sm">
                  {status.config.endpoint}
                </code>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Supported Regions:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {status.supportedRegions.map((region) => (
                  <Badge
                    key={region.code}
                    variant={region.code === status.config.region ? "default" : "outline"}
                    className="justify-start"
                  >
                    {region.code}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Follow these steps to configure Azure Speech Service
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded">
                {status.helpMessage}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
