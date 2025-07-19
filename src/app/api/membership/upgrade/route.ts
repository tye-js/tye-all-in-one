import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const upgradeSchema = z.object({
  targetTier: z.enum(['pro', 'premium']),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetTier, billingCycle = 'monthly' } = upgradeSchema.parse(body);

    // 计算会员到期时间
    const now = new Date();
    const expiresAt = new Date(now);
    
    if (billingCycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 更新用户会员等级
    const updatedUser = await db
      .update(users)
      .set({
        membershipTier: targetTier,
        membershipExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 记录会员历史（如果表存在）
    try {
      await db.execute(`
        INSERT INTO membership_history (
          user_id, 
          from_tier, 
          to_tier, 
          started_at, 
          expires_at, 
          status
        ) VALUES (
          '${session.user.id}', 
          'free', 
          '${targetTier}', 
          NOW(), 
          '${expiresAt.toISOString()}', 
          'active'
        )
      `);
    } catch (error) {
      // 如果会员历史表不存在，忽略错误
      console.warn('Membership history table not found, skipping history record');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${targetTier} membership!`,
      membership: {
        tier: targetTier,
        expiresAt: expiresAt.toISOString(),
        billingCycle,
      },
    });
  } catch (error) {
    console.error('Membership upgrade error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upgrade membership' },
      { status: 500 }
    );
  }
}

// 获取当前用户的会员信息
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await db
      .select({
        id: users.id,
        membershipTier: users.membershipTier,
        membershipExpiresAt: users.membershipExpiresAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      membership: {
        tier: user[0].membershipTier || 'free',
        expiresAt: user[0].membershipExpiresAt,
        isActive: user[0].membershipExpiresAt ? new Date(user[0].membershipExpiresAt) > new Date() : user[0].membershipTier === 'free',
      },
    });
  } catch (error) {
    console.error('Error fetching membership info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership info' },
      { status: 500 }
    );
  }
}
