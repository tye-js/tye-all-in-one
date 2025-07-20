'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Settings, 
  Shield,
  Edit,
  Save,
  X
} from 'lucide-react';
import { 
  getMembershipInfo, 
  getMembershipDisplayName,
  getMembershipColor,
  getMembershipBgColor 
} from '@/lib/membership';
import MembershipStatus from '@/components/membership/membership-status';
import UpgradeModal from '@/components/membership/upgrade-modal';

export default function ProfileContent() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!session?.user) {
    return null;
  }

  const membershipInfo = getMembershipInfo(session.user);

  const handleSave = async () => {
    setIsSaving(true);
    setAlertMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        await update({ name });
        setIsEditing(false);
        setAlertMessage({
          type: 'success',
          message: 'Profile updated successfully!'
        });

        // 3秒后清除消息
        setTimeout(() => setAlertMessage(null), 3000);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(session?.user?.name || '');
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Alert 消息显示 */}
      {alertMessage && (
        <div className="lg:col-span-3">
          <Alert className={alertMessage.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
            <AlertDescription className={alertMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {alertMessage.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 主要信息 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your account details and personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={session.user.avatar || ''} alt={session.user.name || ''} />
                <AvatarFallback className="text-lg">
                  {getInitials(session.user.name || session.user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getMembershipBgColor(membershipInfo.tier)} ${getMembershipColor(membershipInfo.tier)}`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {getMembershipDisplayName(membershipInfo.tier)}
                  </Badge>
                  {membershipInfo.tier === 'free' && (
                    <UpgradeModal>
                      <Button size="sm" variant="outline">
                        Upgrade
                      </Button>
                    </UpgradeModal>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Member since {new Date(session.user.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{session.user.name || 'Not set'}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{session.user.email}</span>
                  {/* TODO: Add email verification status */}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 账户统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Account Activity
            </CardTitle>
            <CardDescription>
              Your usage statistics and activity overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Articles Read</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">TTS Requests</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Characters Processed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 侧边栏 */}
      <div className="space-y-6">
        {/* 会员状态 */}
        <MembershipStatus showUpgrade={true} />

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </a>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/tts">
                <Crown className="w-4 h-4 mr-2" />
                Text-to-Speech
              </a>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/articles">
                <Shield className="w-4 h-4 mr-2" />
                Browse Articles
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* 安全信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Two-Factor Auth</span>
              <Badge variant="outline">Not Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Login</span>
              <span className="text-sm text-gray-600">Today</span>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
