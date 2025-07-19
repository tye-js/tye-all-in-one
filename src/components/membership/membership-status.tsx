'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Star, Zap, Calendar, TrendingUp } from 'lucide-react';
import {
  getMembershipInfo,
  getMembershipDisplayName,
  getMembershipColor,
  getMembershipBgColor,
  getUpgradeRecommendation
} from '@/lib/membership';
import { UsageStats } from '@/lib/usage-tracking';
import UpgradeModal from './upgrade-modal';

interface MembershipStatusProps {
  showUpgrade?: boolean;
  compact?: boolean;
}

// 内部组件，只在有用户会话时渲染
function MembershipStatusContent({ showUpgrade = true, compact = false, session }: MembershipStatusProps & { session: any }) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取使用情况
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/membership/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const membershipInfo = getMembershipInfo(session.user);
  const upgrade = getUpgradeRecommendation(membershipInfo.tier);

  // 使用默认值如果还在加载
  const displayUsage = usage || {
    charactersUsed: 0,
    charactersLimit: membershipInfo.features.maxCharactersPerMonth,
    requestsUsed: 0,
    requestsLimit: membershipInfo.features.maxRequestsPerDay,
    monthlyCharactersUsed: 0,
    monthlyCharactersLimit: membershipInfo.features.maxCharactersPerMonth,
  };
  
  const charactersPercentage = (displayUsage.monthlyCharactersUsed / displayUsage.monthlyCharactersLimit) * 100;
  const requestsPercentage = (displayUsage.requestsUsed / displayUsage.requestsLimit) * 100;
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Crown className={`w-4 h-4 ${getMembershipColor(membershipInfo.tier)}`} />
            <Badge className={`${getMembershipBgColor(membershipInfo.tier)} ${getMembershipColor(membershipInfo.tier)}`}>
              {getMembershipDisplayName(membershipInfo.tier)}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600">
            {loading ? '...' : `${displayUsage.monthlyCharactersUsed.toLocaleString()} / ${displayUsage.monthlyCharactersLimit.toLocaleString()} chars`}
          </div>
        </div>
        
        {showUpgrade && upgrade && (
          <UpgradeModal targetTier={upgrade.targetTier}>
            <Button size="sm" variant="outline">
              <Zap className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </UpgradeModal>
        )}
      </div>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${getMembershipBgColor(membershipInfo.tier)} rounded-full flex items-center justify-center`}>
              <Crown className={`w-6 h-6 ${getMembershipColor(membershipInfo.tier)}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {getMembershipDisplayName(membershipInfo.tier)} Plan
                </h3>
                <Badge className={`${getMembershipBgColor(membershipInfo.tier)} ${getMembershipColor(membershipInfo.tier)}`}>
                  {membershipInfo.isActive ? 'Active' : 'Expired'}
                </Badge>
              </div>
              {membershipInfo.expiresAt && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {membershipInfo.isActive ? 'Expires' : 'Expired'} on {membershipInfo.expiresAt.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          {showUpgrade && upgrade && (
            <UpgradeModal targetTier={upgrade.targetTier}>
              <Button>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to {getMembershipDisplayName(upgrade.targetTier)}
              </Button>
            </UpgradeModal>
          )}
        </div>
        
        {/* 使用情况 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Characters this month</span>
              <span className="font-medium">
                {loading ? '...' : `${displayUsage.monthlyCharactersUsed.toLocaleString()} / ${displayUsage.monthlyCharactersLimit.toLocaleString()}`}
              </span>
            </div>
            <Progress value={charactersPercentage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Requests today</span>
              <span className="font-medium">
                {loading ? '...' : `${displayUsage.requestsUsed} / ${displayUsage.requestsLimit}`}
              </span>
            </div>
            <Progress value={requestsPercentage} className="h-2" />
          </div>
        </div>
        
        {/* 功能列表 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${membershipInfo.features.ssmlAdvanced ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={membershipInfo.features.ssmlAdvanced ? 'text-gray-900' : 'text-gray-500'}>
              SSML Pro
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${membershipInfo.features.batchProcessing ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={membershipInfo.features.batchProcessing ? 'text-gray-900' : 'text-gray-500'}>
              Batch Processing
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${membershipInfo.features.apiAccess ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={membershipInfo.features.apiAccess ? 'text-gray-900' : 'text-gray-500'}>
              API Access
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${membershipInfo.features.prioritySupport ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={membershipInfo.features.prioritySupport ? 'text-gray-900' : 'text-gray-500'}>
              Priority Support
            </span>
          </div>
        </div>
        
        {/* 升级建议 */}
        {showUpgrade && upgrade && membershipInfo.tier === 'free' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Unlock Pro Features
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Get advanced SSML editing, batch processing, and 10x more usage limits.
                </p>
                <div className="flex gap-2">
                  <UpgradeModal targetTier="pro">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Crown className="w-4 h-4 mr-1" />
                      Upgrade Now
                    </Button>
                  </UpgradeModal>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 主导出组件，处理会话检查
export default function MembershipStatus({ showUpgrade = true, compact = false }: MembershipStatusProps) {
  const { data: session } = useSession();

  // 如果没有用户会话，返回 null
  if (!session?.user) {
    return null;
  }

  // 渲染内容组件
  return (
    <MembershipStatusContent
      showUpgrade={showUpgrade}
      compact={compact}
      session={session}
    />
  );
}
