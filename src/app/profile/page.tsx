import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import MainLayout from '@/components/layout/main-layout';
import ProfileContent from '@/components/profile/profile-content';

export const metadata: Metadata = {
  title: 'Profile | TYE All-in-One',
  description: 'Manage your profile, membership, and account settings',
  robots: 'noindex, nofollow', // 个人资料页面不需要被搜索引擎索引
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/profile');
  }

  return (
    <MainLayout locale="en">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your account information and membership settings
            </p>
          </div>

          <ProfileContent />
        </div>
      </div>
    </MainLayout>
  );
}
