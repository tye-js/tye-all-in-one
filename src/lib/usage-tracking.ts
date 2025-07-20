import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface UsageStats {
  charactersUsed: number;
  charactersLimit: number;
  requestsUsed: number;
  requestsLimit: number;
  monthlyCharactersUsed: number;
  monthlyCharactersLimit: number;
}

/**
 * 记录 TTS 使用情况
 */
export async function trackTTSUsage(
  userId: string,
  charactersCount: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    // 更新每日使用统计
    await db.execute(sql`
      INSERT INTO daily_usage (user_id, date, requests_made, characters_used)
      VALUES (${userId}, ${today}, 1, ${charactersCount})
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        requests_made = daily_usage.requests_made + 1,
        characters_used = daily_usage.characters_used + ${charactersCount},
        updated_at = NOW()
    `);

    // 更新月度使用统计
    await db.execute(sql`
      INSERT INTO membership_usage (user_id, month_year, requests_made, characters_used)
      VALUES (${userId}, ${monthYear}, 1, ${charactersCount})
      ON CONFLICT (user_id, month_year)
      DO UPDATE SET
        requests_made = membership_usage.requests_made + 1,
        characters_used = membership_usage.characters_used + ${charactersCount},
        updated_at = NOW()
    `);
  } catch (error) {
    console.error('Error tracking TTS usage:', error);
    // 不抛出错误，避免影响主要功能
  }
}

/**
 * 获取用户的使用统计
 */
export async function getUserUsageStats(
  userId: string,
  membershipLimits: { maxCharactersPerMonth: number; maxRequestsPerDay: number }
): Promise<UsageStats> {
  const today = new Date().toISOString().split('T')[0];
  const monthYear = new Date().toISOString().slice(0, 7);

  try {
    // 获取今日使用情况
    const dailyUsage = await db.execute(sql`
      SELECT requests_made, characters_used
      FROM daily_usage
      WHERE user_id = ${userId} AND date = ${today}
    `);

    // 获取本月使用情况
    const monthlyUsage = await db.execute(sql`
      SELECT requests_made, characters_used
      FROM membership_usage
      WHERE user_id = ${userId} AND month_year = ${monthYear}
    `);

    const daily = dailyUsage[0] || { requests_made: 0, characters_used: 0 };
    const monthly = monthlyUsage[0] || { requests_made: 0, characters_used: 0 };

    return {
      charactersUsed: Number(daily.characters_used),
      charactersLimit: membershipLimits.maxCharactersPerMonth,
      requestsUsed: Number(daily.requests_made),
      requestsLimit: membershipLimits.maxRequestsPerDay,
      monthlyCharactersUsed: Number(monthly.characters_used),
      monthlyCharactersLimit: membershipLimits.maxCharactersPerMonth,
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      charactersUsed: 0,
      charactersLimit: membershipLimits.maxCharactersPerMonth,
      requestsUsed: 0,
      requestsLimit: membershipLimits.maxRequestsPerDay,
      monthlyCharactersUsed: 0,
      monthlyCharactersLimit: membershipLimits.maxCharactersPerMonth,
    };
  }
}

/**
 * 检查用户是否超出使用限制
 */
export async function checkUsageLimits(
  userId: string,
  charactersToUse: number,
  membershipLimits: { maxCharactersPerMonth: number; maxRequestsPerDay: number }
): Promise<{
  canUse: boolean;
  reason?: string;
  usage: UsageStats;
}> {
  const usage = await getUserUsageStats(userId, membershipLimits);

  // 检查每日请求限制
  if (usage.requestsUsed >= usage.requestsLimit) {
    return {
      canUse: false,
      reason: `Daily request limit reached (${usage.requestsLimit} requests per day)`,
      usage,
    };
  }

  // 检查月度字符限制
  if (usage.monthlyCharactersUsed + charactersToUse > usage.monthlyCharactersLimit) {
    return {
      canUse: false,
      reason: `Monthly character limit would be exceeded (${usage.monthlyCharactersLimit} characters per month)`,
      usage,
    };
  }

  return {
    canUse: true,
    usage,
  };
}

/**
 * 获取用户的使用历史
 */
export async function getUserUsageHistory(
  userId: string,
  months: number = 6
): Promise<Array<{
  monthYear: string;
  charactersUsed: number;
  requestsMade: number;
}>> {
  try {
    const result = await db.execute(sql`
      SELECT month_year, characters_used, requests_made
      FROM membership_usage
      WHERE user_id = ${userId}
      ORDER BY month_year DESC
      LIMIT ${months}
    `);

    return result.map(row => ({
      monthYear: row.month_year as string,
      charactersUsed: Number(row.characters_used),
      requestsMade: Number(row.requests_made),
    }));
  } catch (error) {
    console.error('Error getting usage history:', error);
    return [];
  }
}

/**
 * 清理旧的使用数据（保留最近12个月）
 */
export async function cleanupOldUsageData(): Promise<void> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const cutoffDate = twelveMonthsAgo.toISOString().slice(0, 7); // YYYY-MM

  try {
    // 清理旧的月度数据
    await db.execute(sql`
      DELETE FROM membership_usage
      WHERE month_year < ${cutoffDate}
    `);

    // 清理旧的每日数据（保留90天）
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDateDaily = ninetyDaysAgo.toISOString().split('T')[0];

    await db.execute(sql`
      DELETE FROM daily_usage
      WHERE date < ${cutoffDateDaily}
    `);

    console.log('Old usage data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up old usage data:', error);
  }
}

/**
 * 获取系统整体使用统计
 */
export async function getSystemUsageStats(): Promise<{
  totalUsers: number;
  activeUsersToday: number;
  totalRequestsToday: number;
  totalCharactersToday: number;
  totalRequestsThisMonth: number;
  totalCharactersThisMonth: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const monthYear = new Date().toISOString().slice(0, 7);

  try {
    const [totalUsers, dailyStats, monthlyStats] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM users`),
      db.execute(sql`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          SUM(requests_made) as total_requests,
          SUM(characters_used) as total_characters
        FROM daily_usage
        WHERE date = ${today}
      `),
      db.execute(sql`
        SELECT 
          SUM(requests_made) as total_requests,
          SUM(characters_used) as total_characters
        FROM membership_usage
        WHERE month_year = ${monthYear}
      `),
    ]);

    const daily = dailyStats[0] || { active_users: 0, total_requests: 0, total_characters: 0 };
    const monthly = monthlyStats[0] || { total_requests: 0, total_characters: 0 };

    return {
      totalUsers: Number(totalUsers[0]?.count || 0),
      activeUsersToday: Number(daily.active_users),
      totalRequestsToday: Number(daily.total_requests),
      totalCharactersToday: Number(daily.total_characters),
      totalRequestsThisMonth: Number(monthly.total_requests),
      totalCharactersThisMonth: Number(monthly.total_characters),
    };
  } catch (error) {
    console.error('Error getting system usage stats:', error);
    return {
      totalUsers: 0,
      activeUsersToday: 0,
      totalRequestsToday: 0,
      totalCharactersToday: 0,
      totalRequestsThisMonth: 0,
      totalCharactersThisMonth: 0,
    };
  }
}
