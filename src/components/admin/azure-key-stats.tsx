'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Key, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface QuotaStats {
  totalKeys: number;
  activeKeys: number;
  totalQuota: number;
  usedQuota: number;
  availableQuota: number;
  keysWithQuota: number;
}

interface AzureKeyStatsProps {
  stats: QuotaStats;
}

export default function AzureKeyStats({ stats }: AzureKeyStatsProps) {
  const usagePercentage = stats.totalQuota > 0 ? Math.round((stats.usedQuota / stats.totalQuota) * 100) : 0;
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalKeys}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeKeys} active, {stats.totalKeys - stats.activeKeys} inactive
          </p>
        </CardContent>
      </Card>

      {/* Available Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Keys</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.keysWithQuota}</div>
          <p className="text-xs text-muted-foreground">
            Keys with remaining quota
          </p>
        </CardContent>
      </Card>

      {/* Total Quota Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quota Usage</CardTitle>
          {usagePercentage >= 90 ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usagePercentage}%</div>
          <div className="mt-2">
            <Progress value={usagePercentage} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatNumber(stats.usedQuota)} / {formatNumber(stats.totalQuota)} characters
          </p>
        </CardContent>
      </Card>

      {/* Available Quota */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Quota</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(stats.availableQuota)}
          </div>
          <p className="text-xs text-muted-foreground">
            Characters remaining
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
