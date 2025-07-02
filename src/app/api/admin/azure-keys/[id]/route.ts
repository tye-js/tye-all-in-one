import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureKeysService } from '@/lib/azure-keys-service';

// GET /api/admin/azure-keys/[id] - 获取单个 Azure Key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = await azureKeysService.getKeyById(id);
    
    if (!key) {
      return NextResponse.json({ error: 'Azure key not found' }, { status: 404 });
    }

    return NextResponse.json(key);
  } catch (error) {
    console.error('Failed to get Azure key:', error);
    return NextResponse.json(
      { error: 'Failed to get Azure key' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/azure-keys/[id] - 更新 Azure Key
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, speechKey, speechRegion, totalQuota, isActive, notes } = body;

    // 验证配额
    if (totalQuota && (totalQuota < 1 || totalQuota > 100000000)) {
      return NextResponse.json(
        { error: 'Total quota must be between 1 and 100,000,000' },
        { status: 400 }
      );
    }

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (speechKey !== undefined) updateData.speechKey = speechKey.trim();
    if (speechRegion !== undefined) updateData.speechRegion = speechRegion.trim();
    if (totalQuota !== undefined) updateData.totalQuota = totalQuota;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const updatedKey = await azureKeysService.updateKey(id, updateData);
    
    if (!updatedKey) {
      return NextResponse.json({ error: 'Azure key not found' }, { status: 404 });
    }

    return NextResponse.json(updatedKey);
  } catch (error) {
    console.error('Failed to update Azure key:', error);
    return NextResponse.json(
      { error: 'Failed to update Azure key' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/azure-keys/[id] - 删除 Azure Key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await azureKeysService.deleteKey(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Azure key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Azure key deleted successfully' });
  } catch (error) {
    console.error('Failed to delete Azure key:', error);
    return NextResponse.json(
      { error: 'Failed to delete Azure key' },
      { status: 500 }
    );
  }
}
