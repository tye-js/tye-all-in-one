import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 从数据库获取用户信息
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        membershipTier: users.membershipTier,
        membershipExpiresAt: users.membershipExpiresAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const dbUser = user[0];

    return NextResponse.json({
      debug: {
        sessionUser: session.user,
        databaseUser: dbUser,
        membershipInfo: {
          tier: dbUser.membershipTier || 'free',
          expiresAt: dbUser.membershipExpiresAt,
          isActive: dbUser.membershipTier === 'free' || 
                   (dbUser.membershipExpiresAt ? new Date(dbUser.membershipExpiresAt) > new Date() : false),
        },
        comparison: {
          sessionHasMembershipTier: !!session.user.membershipTier,
          sessionMembershipTier: session.user.membershipTier,
          dbMembershipTier: dbUser.membershipTier,
          match: session.user.membershipTier === dbUser.membershipTier,
        }
      }
    });
  } catch (error) {
    console.error('Debug membership error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 测试升级功能
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
    const { action, targetTier } = body;

    if (action === 'test-upgrade') {
      // 测试升级到指定等级
      const tier = targetTier || 'pro';
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const updatedUser = await db
        .update(users)
        .set({
          membershipTier: tier,
          membershipExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Test upgrade to ${tier} completed`,
        updatedUser: updatedUser[0],
        instructions: 'Please refresh the page or call /api/auth/session to see updated session'
      });
    }

    if (action === 'reset-membership') {
      // 重置为免费会员
      const updatedUser = await db
        .update(users)
        .set({
          membershipTier: 'free',
          membershipExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Membership reset to free',
        updatedUser: updatedUser[0],
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "test-upgrade" or "reset-membership"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Debug membership POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
