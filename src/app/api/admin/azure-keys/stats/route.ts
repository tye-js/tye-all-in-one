import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureKeysService } from '@/lib/azure-keys-service';

// GET /api/admin/azure-keys/stats - 获取配额统计
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await azureKeysService.getQuotaStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get quota stats:', error);
    return NextResponse.json(
      { error: 'Failed to get quota stats' },
      { status: 500 }
    );
  }
}
