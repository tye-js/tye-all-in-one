'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Key, Activity, AlertTriangle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import AzureKeyForm from '@/components/admin/azure-key-form';
import AzureKeyStats from '@/components/admin/azure-key-stats';
import DeleteAzureKeyDialog from '@/components/admin/delete-azure-key-dialog';

interface AzureKey {
  id: string;
  name: string;
  speechKey: string;
  speechRegion: string;
  totalQuota: number;
  usedQuota: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  notes?: string;
}

interface QuotaStats {
  totalKeys: number;
  activeKeys: number;
  totalQuota: number;
  usedQuota: number;
  availableQuota: number;
  keysWithQuota: number;
}

export default function AzureKeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<AzureKey[]>([]);
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<AzureKey | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingKey, setDeletingKey] = useState<AzureKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 检查管理员权限
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // 加载数据
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 加载 Azure Keys
      const keysResponse = await fetch('/api/admin/azure-keys');
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setKeys(keysData);
      }

      // 加载统计数据
      const statsResponse = await fetch('/api/admin/azure-keys/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load Azure keys data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      loadData();
    }
  }, [session]);

  // 处理删除 - 显示确认对话框
  const handleDeleteClick = (key: AzureKey) => {
    setDeletingKey(key);
    setShowDeleteDialog(true);
  };

  // 确认删除
  const handleDeleteConfirm = async (id: string) => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/azure-keys/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Azure key deleted successfully');
        setShowDeleteDialog(false);
        setDeletingKey(null);
        loadData();
      } else {
        toast.error('Failed to delete Azure key');
      }
    } catch (error) {
      console.error('Failed to delete Azure key:', error);
      toast.error('Failed to delete Azure key');
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingKey(null);
    setIsDeleting(false);
  };

  // 处理激活/停用
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/azure-keys/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Azure key ${!isActive ? 'activated' : 'deactivated'} successfully`);
        loadData();
      } else {
        toast.error('Failed to update Azure key status');
      }
    } catch (error) {
      console.error('Failed to toggle Azure key status:', error);
      toast.error('Failed to update Azure key status');
    }
  };

  // 处理重置配额
  const handleResetQuota = async (id: string) => {
    if (!confirm('Are you sure you want to reset the quota for this key?')) return;

    try {
      const response = await fetch(`/api/admin/azure-keys/${id}/reset-quota`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Quota reset successfully');
        loadData();
      } else {
        toast.error('Failed to reset quota');
      }
    } catch (error) {
      console.error('Failed to reset quota:', error);
      toast.error('Failed to reset quota');
    }
  };

  // 处理表单提交
  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingKey(null);
    loadData();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // 计算使用百分比
  const getUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  // 获取状态颜色
  const getStatusColor = (used: number, total: number, isActive: boolean): "default" | "secondary" | "destructive" | "outline" => {
    if (!isActive) return 'secondary';
    const percentage = (used / total) * 100;
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'destructive'; // 改为 destructive，因为 Badge 不支持 warning
    return 'default';
  };

  if (status === 'loading' || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Azure Speech Keys</h1>
            <p className="text-gray-600 mt-1">
              Manage Azure Speech Service API keys and quotas
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Key
          </Button>
        </div>

        {/* Statistics */}
        {stats && <AzureKeyStats stats={stats} />}

        {/* Azure Keys List */}
        <div className="grid gap-6">
          {keys.map((key) => {
            const usagePercentage = getUsagePercentage(key.usedQuota, key.totalQuota);
            const statusColor = getStatusColor(key.usedQuota, key.totalQuota, key.isActive);

            return (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Key className="w-5 h-5 mr-2" />
                        {key.name}
                        <Badge variant={statusColor} className="ml-2">
                          {key.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Region: {key.speechRegion} • Created: {formatDate(key.createdAt)}
                        {key.lastUsedAt && ` • Last used: ${formatDate(key.lastUsedAt)}`}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetQuota(key.id)}
                        disabled={key.usedQuota === 0}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingKey(key);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={key.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(key.id, key.isActive)}
                      >
                        {key.isActive ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(key)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quota Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Quota Usage</span>
                        <span>
                          {key.usedQuota.toLocaleString()} / {key.totalQuota.toLocaleString()} characters ({usagePercentage}%)
                        </span>
                      </div>
                      <Progress value={usagePercentage} className="h-2" />
                    </div>

                    {/* Key Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">API Key:</span>
                        <span className="ml-2 font-mono text-xs">
                          {key.speechKey.substring(0, 8)}...{key.speechKey.substring(key.speechKey.length - 4)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Region:</span>
                        <span className="ml-2">{key.speechRegion}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {key.notes && (
                      <div className="text-sm">
                        <span className="font-medium">Notes:</span>
                        <span className="ml-2 text-gray-600">{key.notes}</span>
                      </div>
                    )}

                    {/* Status Indicators */}
                    <div className="flex items-center space-x-4 text-sm">
                      {usagePercentage >= 90 && (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Quota almost exhausted
                        </div>
                      )}
                      {key.isActive && (
                        <div className="flex items-center text-green-600">
                          <Activity className="w-4 h-4 mr-1" />
                          Available for use
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {keys.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Azure Keys</h3>
                <p className="text-gray-600 mb-4">
                  Get started by adding your first Azure Speech Service key.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Azure Key
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <AzureKeyForm
            key={editingKey?.id || 'new'}
            azureKey={editingKey}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingKey(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteAzureKeyDialog
          azureKey={deletingKey}
          isOpen={showDeleteDialog}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      </div>
    </AdminLayout>
  );
}
