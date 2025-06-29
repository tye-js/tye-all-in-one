'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { 
  FileText, 
  Users, 
  Volume2, 
  TrendingUp, 
  Eye,
  Calendar,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalUsers: number;
  totalTTSRequests: number;
  totalViews: number;
}

interface RecentActivity {
  id: string;
  type: 'article' | 'user' | 'tts';
  title: string;
  description: string;
  createdAt: string;
  href?: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [session]);

  if (status === 'loading' || !session || session.user.role !== 'admin') {
    return (
      <AdminLayout>
        <LoadingSpinner className="py-12" text="Loading..." />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Articles',
      value: stats?.totalArticles || 0,
      description: `${stats?.publishedArticles || 0} published, ${stats?.draftArticles || 0} drafts`,
      icon: FileText,
      color: 'text-blue-600',
      href: '/admin/articles',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: 'Registered users',
      icon: Users,
      color: 'text-green-600',
      href: '/admin/users',
    },
    {
      title: 'TTS Requests',
      value: stats?.totalTTSRequests || 0,
      description: 'Text-to-speech conversions',
      icon: Volume2,
      color: 'text-purple-600',
      href: '/admin/tts',
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      description: 'Article page views',
      icon: Eye,
      color: 'text-orange-600',
      href: '/admin/analytics',
    },
  ];

  const quickActions = [
    {
      title: 'Create Article',
      description: 'Write a new article',
      icon: FileText,
      href: '/admin/articles/new',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Manage Users',
      description: 'View and manage users',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'View Analytics',
      description: 'Check site analytics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user.name}. Here's what's happening with your site.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner className="py-12" text="Loading dashboard..." />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                      <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                      <Button variant="ghost" size="sm" asChild className="mt-2 p-0 h-auto">
                        <Link href={stat.href} className="flex items-center text-sm">
                          View details
                          <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.title}
                          asChild
                          className={`w-full justify-start ${action.color} text-white`}
                        >
                          <Link href={action.href}>
                            <Icon className="w-4 h-4 mr-2" />
                            <div className="text-left">
                              <div className="font-medium">{action.title}</div>
                              <div className="text-xs opacity-90">{action.description}</div>
                            </div>
                          </Link>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest updates across your site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentActivity.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {activity.type === 'article' && (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              {activity.type === 'user' && (
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                              {activity.type === 'tts' && (
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Volume2 className="w-4 h-4 text-purple-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.href ? (
                                  <Link href={activity.href} className="hover:underline">
                                    {activity.title}
                                  </Link>
                                ) : (
                                  activity.title
                                )}
                              </p>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
