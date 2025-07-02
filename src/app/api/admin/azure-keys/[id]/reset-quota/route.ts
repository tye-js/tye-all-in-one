import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureKeysService } from '@/lib/azure-keys-service';

// POST /api/admin/azure-keys/[id]/reset-quota - 重置配额
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await azureKeysService.resetQuota(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Azure key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quota reset successfully' });
  } catch (error) {
    console.error('Failed to reset quota:', error);
    return NextResponse.json(
      { error: 'Failed to reset quota' },
      { status: 500 }
    );
  }
}
