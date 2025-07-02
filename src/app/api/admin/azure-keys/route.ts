import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureKeysService } from '@/lib/azure-keys-service';

// GET /api/admin/azure-keys - 获取所有 Azure Keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await azureKeysService.getAllKeys();
    return NextResponse.json(keys);
  } catch (error) {
    console.error('Failed to get Azure keys:', error);
    return NextResponse.json(
      { error: 'Failed to get Azure keys' },
      { status: 500 }
    );
  }
}

// POST /api/admin/azure-keys - 创建新的 Azure Key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, speechKey, speechRegion, totalQuota, isActive, notes } = body;

    // 验证必填字段
    if (!name || !speechKey || !speechRegion) {
      return NextResponse.json(
        { error: 'Name, speechKey, and speechRegion are required' },
        { status: 400 }
      );
    }

    // 验证配额
    if (totalQuota && (totalQuota < 1 || totalQuota > 100000000)) {
      return NextResponse.json(
        { error: 'Total quota must be between 1 and 100,000,000' },
        { status: 400 }
      );
    }

    const newKey = await azureKeysService.createKey({
      name: name.trim(),
      speechKey: speechKey.trim(),
      speechRegion: speechRegion.trim(),
      totalQuota: totalQuota || 2000000,
      usedQuota: 0,
      isActive: isActive ?? true,
      notes: notes?.trim() || null,
    });

    return NextResponse.json(newKey, { status: 201 });
  } catch (error) {
    console.error('Failed to create Azure key:', error);
    return NextResponse.json(
      { error: 'Failed to create Azure key' },
      { status: 500 }
    );
  }
}
