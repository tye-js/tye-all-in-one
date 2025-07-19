import { Session } from 'next-auth';

export type MembershipTier = 'free' | 'pro' | 'premium';

export interface MembershipInfo {
  tier: MembershipTier;
  expiresAt?: Date | null;
  isActive: boolean;
  features: MembershipFeatures;
}

export interface MembershipFeatures {
  ssmlAdvanced: boolean;
  voiceCloning: boolean;
  batchProcessing: boolean;
  prioritySupport: boolean;
  customVoices: boolean;
  apiAccess: boolean;
  maxCharactersPerMonth: number;
  maxRequestsPerDay: number;
}

// 会员等级功能配置
export const MEMBERSHIP_FEATURES: Record<MembershipTier, MembershipFeatures> = {
  free: {
    ssmlAdvanced: false,
    voiceCloning: false,
    batchProcessing: false,
    prioritySupport: false,
    customVoices: false,
    apiAccess: false,
    maxCharactersPerMonth: 10000,
    maxRequestsPerDay: 10,
  },
  pro: {
    ssmlAdvanced: true,
    voiceCloning: false,
    batchProcessing: true,
    prioritySupport: true,
    customVoices: false,
    apiAccess: true,
    maxCharactersPerMonth: 100000,
    maxRequestsPerDay: 100,
  },
  premium: {
    ssmlAdvanced: true,
    voiceCloning: true,
    batchProcessing: true,
    prioritySupport: true,
    customVoices: true,
    apiAccess: true,
    maxCharactersPerMonth: 1000000,
    maxRequestsPerDay: 1000,
  },
};

/**
 * 检查用户的会员信息
 */
export function getMembershipInfo(user: any): MembershipInfo {
  if (!user) {
    return {
      tier: 'free',
      isActive: false,
      features: MEMBERSHIP_FEATURES.free,
    };
  }

  const tier = (user.membershipTier as MembershipTier) || 'free';
  const expiresAt = user.membershipExpiresAt ? new Date(user.membershipExpiresAt) : null;
  
  // 检查会员是否过期
  const isActive = tier === 'free' || !expiresAt || expiresAt > new Date();

  return {
    tier: isActive ? tier : 'free',
    expiresAt,
    isActive,
    features: MEMBERSHIP_FEATURES[isActive ? tier : 'free'],
  };
}

/**
 * 检查用户是否有特定功能权限
 */
export function hasFeatureAccess(
  membershipInfo: MembershipInfo,
  feature: keyof MembershipFeatures
): boolean {
  return membershipInfo.features[feature] as boolean;
}

/**
 * 检查用户是否为 Pro 或更高级别会员
 */
export function isProMember(membershipInfo: MembershipInfo): boolean {
  return membershipInfo.tier === 'pro' || membershipInfo.tier === 'premium';
}

/**
 * 检查用户是否为 Premium 会员
 */
export function isPremiumMember(membershipInfo: MembershipInfo): boolean {
  return membershipInfo.tier === 'premium';
}

/**
 * 获取会员等级的显示名称
 */
export function getMembershipDisplayName(tier: MembershipTier): string {
  const names = {
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
  };
  return names[tier];
}

/**
 * 获取会员等级的颜色
 */
export function getMembershipColor(tier: MembershipTier): string {
  const colors = {
    free: 'text-gray-600',
    pro: 'text-blue-600',
    premium: 'text-purple-600',
  };
  return colors[tier];
}

/**
 * 获取会员等级的背景颜色
 */
export function getMembershipBgColor(tier: MembershipTier): string {
  const colors = {
    free: 'bg-gray-100',
    pro: 'bg-blue-100',
    premium: 'bg-purple-100',
  };
  return colors[tier];
}

/**
 * 获取升级建议
 */
export function getUpgradeRecommendation(currentTier: MembershipTier): {
  targetTier: MembershipTier;
  benefits: string[];
} | null {
  if (currentTier === 'free') {
    return {
      targetTier: 'pro',
      benefits: [
        'Advanced SSML editing with visual interface',
        'Batch processing for multiple texts',
        'Priority customer support',
        'API access for integrations',
        '100,000 characters per month',
        '100 requests per day',
      ],
    };
  }
  
  if (currentTier === 'pro') {
    return {
      targetTier: 'premium',
      benefits: [
        'Voice cloning capabilities',
        'Custom voice training',
        'Unlimited characters per month',
        '1,000 requests per day',
        'White-label solutions',
        'Dedicated account manager',
      ],
    };
  }
  
  return null;
}
