import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMembershipInfo } from '@/lib/membership';
import { getUserUsageStats } from '@/lib/usage-tracking';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const membershipInfo = getMembershipInfo(session.user);
    const usageStats = await getUserUsageStats(session.user.id, membershipInfo.features);

    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
