'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Star, 
  Check, 
  Zap, 
  Mic, 
  Volume2, 
  Settings, 
  Code,
  Users,
  Shield,
  Headphones,
  Sparkles
} from 'lucide-react';
import { 
  getMembershipInfo, 
  getMembershipDisplayName,
  MEMBERSHIP_FEATURES,
  type MembershipTier 
} from '@/lib/membership';

interface UpgradeModalProps {
  children: React.ReactNode;
  targetTier?: MembershipTier;
}

export default function UpgradeModal({ children, targetTier = 'pro' }: UpgradeModalProps) {
  const { data: session, update } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<MembershipTier>(targetTier);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const membershipInfo = getMembershipInfo(session?.user);
  
  const plans = [
    {
      tier: 'pro' as MembershipTier,
      name: 'Pro',
      description: 'Perfect for content creators and professionals',
      monthlyPrice: 19,
      yearlyPrice: 190,
      color: 'blue',
      icon: Crown,
      popular: true,
      features: [
        'Advanced SSML editing with visual interface',
        'Batch processing for multiple texts',
        'Priority customer support',
        'API access for integrations',
        '100,000 characters per month',
        '100 requests per day',
        'Multiple voice styles and emotions',
        'Custom pronunciation controls',
      ],
    },
    {
      tier: 'premium' as MembershipTier,
      name: 'Premium',
      description: 'For teams and enterprise users',
      monthlyPrice: 49,
      yearlyPrice: 490,
      color: 'purple',
      icon: Sparkles,
      popular: false,
      features: [
        'Everything in Pro',
        'Voice cloning capabilities',
        'Custom voice training',
        'Unlimited characters per month',
        '1,000 requests per day',
        'White-label solutions',
        'Dedicated account manager',
        'Advanced analytics and reporting',
      ],
    },
  ];

  const currentPlan = plans.find(plan => plan.tier === selectedPlan);
  const savings = currentPlan ? Math.round(((currentPlan.monthlyPrice * 12 - currentPlan.yearlyPrice) / (currentPlan.monthlyPrice * 12)) * 100) : 0;

  const handleUpgrade = async () => {
    if (!session?.user) {
      setAlertMessage({
        type: 'error',
        message: 'Please sign in to upgrade your membership'
      });
      return;
    }

    setIsUpgrading(true);
    setAlertMessage(null);

    try {
      const response = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetTier: selectedPlan,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 更新会话信息
        await update();

        // 显示成功消息
        setAlertMessage({
          type: 'success',
          message: `🎉 Successfully upgraded to ${selectedPlan.toUpperCase()} membership!`
        });

        // 延迟关闭模态框和刷新页面
        setTimeout(() => {
          setIsOpen(false);
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setAlertMessage({
        type: 'error',
        message: `Failed to upgrade: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-blue-600" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Unlock advanced features and increase your usage limits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert 消息显示 */}
          {alertMessage && (
            <Alert className={alertMessage.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
              <AlertDescription className={alertMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {alertMessage.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 计费周期选择 */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                  Save {savings}%
                </Badge>
              </button>
            </div>
          </div>

          {/* 计划选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.tier}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.tier
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                } ${plan.popular ? 'border-blue-200' : ''}`}
                onClick={() => setSelectedPlan(plan.tier)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 bg-${plan.color}-100 rounded-full flex items-center justify-center`}>
                    <plan.icon className={`w-6 h-6 text-${plan.color}-600`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                      <span className="text-lg font-normal text-gray-600">/month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-gray-500">
                        Billed annually (${plan.yearlyPrice}/year)
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 功能对比 */}
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="features">Feature Comparison</TabsTrigger>
              <TabsTrigger value="usage">Usage Limits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="features" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    Voice Features
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Basic voice selection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-500" />
                      <span>Advanced SSML editing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Voice cloning</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-600" />
                    Processing
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Single text processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-500" />
                      <span>Batch processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>API access</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-600" />
                    Support
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Community support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-500" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Dedicated manager</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="usage" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(MEMBERSHIP_FEATURES).map(([tier, features]) => (
                  <Card key={tier} className={tier === membershipInfo.tier ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">{tier}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Characters/month</div>
                        <div className="font-semibold">
                          {features.maxCharactersPerMonth.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Requests/day</div>
                        <div className="font-semibold">
                          {features.maxRequestsPerDay}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* 升级按钮 */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isUpgrading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to {getMembershipDisplayName(selectedPlan)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
