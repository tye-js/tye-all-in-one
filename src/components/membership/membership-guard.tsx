'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Star, Zap } from 'lucide-react';
import {
  getMembershipInfo,
  hasFeatureAccess,
  getUpgradeRecommendation,
  getMembershipDisplayName,
  getMembershipColor,
  getMembershipBgColor,
  type MembershipFeatures
} from '@/lib/membership';
import UpgradeModal from './upgrade-modal';

interface MembershipGuardProps {
  feature: keyof MembershipFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export default function MembershipGuard({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true 
}: MembershipGuardProps) {
  const { data: session } = useSession();
  
  const membershipInfo = getMembershipInfo(session?.user);
  const hasAccess = hasFeatureAccess(membershipInfo, feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgrade) {
    return null;
  }
  
  const upgrade = getUpgradeRecommendation(membershipInfo.tier);
  
  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-gray-500" />
          Pro Feature
        </CardTitle>
        <CardDescription>
          This feature is available for Pro and Premium members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前会员状态 */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600">Current plan:</span>
          <Badge className={`${getMembershipBgColor(membershipInfo.tier)} ${getMembershipColor(membershipInfo.tier)}`}>
            {getMembershipDisplayName(membershipInfo.tier)}
          </Badge>
        </div>
        
        {/* 升级建议 */}
        {upgrade && (
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">
                Upgrade to {getMembershipDisplayName(upgrade.targetTier)}
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                {upgrade.benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
                {upgrade.benefits.length > 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{upgrade.benefits.length - 3} more features
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <UpgradeModal targetTier={upgrade.targetTier}>
                <Button className="flex-1" size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to {getMembershipDisplayName(upgrade.targetTier)}
                </Button>
              </UpgradeModal>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </div>
          </div>
        )}
        
        {/* 功能预览 */}
        <div className="bg-gray-50 rounded-lg p-4 opacity-50">
          <div className="text-xs text-gray-500 mb-2 text-center">
            Feature Preview
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 专门用于 SSML Pro 功能的守卫组件
export function SSMLProGuard({ children }: { children: ReactNode }) {
  return (
    <MembershipGuard 
      feature="ssmlAdvanced"
      fallback={
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-blue-900">SSML Pro Editor</CardTitle>
            <CardDescription className="text-blue-700">
              Advanced SSML editing with visual interface, multiple voices, and fine-grained control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                <span>Visual SSML Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                <span>Multiple Voices</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                <span>Emotion Control</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                <span>Break Timing</span>
              </div>
            </div>
            
            <UpgradeModal targetTier="pro">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </UpgradeModal>
            
            {/* 功能预览 */}
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <div className="text-xs text-blue-600 mb-2 font-medium">Pro Editor Preview</div>
              <div className="space-y-2 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="h-3 bg-blue-200 rounded flex-1"></div>
                  <div className="text-xs text-blue-500">Voice 1</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="h-3 bg-green-200 rounded flex-1"></div>
                  <div className="text-xs text-green-500">Voice 2</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="h-3 bg-purple-200 rounded w-2/3"></div>
                  <div className="text-xs text-purple-500">Emotion</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </MembershipGuard>
  );
}
