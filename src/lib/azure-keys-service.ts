import { db } from '@/lib/db';
import { azureKeys, type AzureKey, type NewAzureKey } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export class AzureKeysService {
  /**
   * 获取所有 Azure Keys
   */
  async getAllKeys(): Promise<AzureKey[]> {
    try {
      return await db.select().from(azureKeys).orderBy(desc(azureKeys.createdAt));
    } catch (error) {
      console.error('❌ Failed to get Azure keys:', error);
      throw error;
    }
  }

  /**
   * 获取可用的 Azure Key（有剩余配额且激活的）
   */
  async getAvailableKey(): Promise<AzureKey | null> {
    try {
      const availableKeys = await db
        .select()
        .from(azureKeys)
        .where(
          and(
            eq(azureKeys.isActive, true),
            sql`${azureKeys.usedQuota} < ${azureKeys.totalQuota}`
          )
        )
        .orderBy(azureKeys.usedQuota); // 优先使用使用量较少的 key

      return availableKeys.length > 0 ? availableKeys[0] : null;
    } catch (error) {
      console.error('❌ Failed to get available Azure key:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取 Azure Key
   */
  async getKeyById(id: string): Promise<AzureKey | null> {
    try {
      const keys = await db.select().from(azureKeys).where(eq(azureKeys.id, id));
      return keys.length > 0 ? keys[0] : null;
    } catch (error) {
      console.error('❌ Failed to get Azure key by ID:', error);
      throw error;
    }
  }

  /**
   * 创建新的 Azure Key
   */
  async createKey(keyData: Omit<NewAzureKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<AzureKey> {
    try {
      const newKeys = await db.insert(azureKeys).values({
        ...keyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return newKeys[0];
    } catch (error) {
      console.error('❌ Failed to create Azure key:', error);
      throw error;
    }
  }

  /**
   * 更新 Azure Key
   */
  async updateKey(id: string, updates: Partial<Omit<AzureKey, 'id' | 'createdAt'>>): Promise<AzureKey | null> {
    try {
      const updatedKeys = await db
        .update(azureKeys)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(azureKeys.id, id))
        .returning();

      return updatedKeys.length > 0 ? updatedKeys[0] : null;
    } catch (error) {
      console.error('❌ Failed to update Azure key:', error);
      throw error;
    }
  }

  /**
   * 删除 Azure Key
   */
  async deleteKey(id: string): Promise<boolean> {
    try {
      console.log(id)
      const result = await db.delete(azureKeys).where(eq(azureKeys.id, id));
      console.log(result)
      return true
      // return result.at(0);
    } catch (error) {
      console.error('❌ Failed to delete Azure key:', error);
      throw error;
    }
  }
  /**
   * 使用配额（增加使用量）
   */
  async useQuota(id: string, charactersUsed: number): Promise<boolean> {
    try {
      // 检查当前配额
      const key = await this.getKeyById(id);
      if (!key) {
        throw new Error('Azure key not found');
      }

      if (!key.isActive) {
        throw new Error('Azure key is not active');
      }

      const newUsedQuota = key.usedQuota + charactersUsed;
      if (newUsedQuota > key.totalQuota) {
        throw new Error('Quota exceeded');
      }

      // 更新使用量和最后使用时间
      const updated = await this.updateKey(id, {
        usedQuota: newUsedQuota,
        lastUsedAt: new Date(),
      });

      return updated !== null;
    } catch (error) {
      console.error('❌ Failed to use quota:', error);
      throw error;
    }
  }

  /**
   * 重置配额
   */
  async resetQuota(id: string): Promise<boolean> {
    try {
      const updated = await this.updateKey(id, {
        usedQuota: 0,
        lastUsedAt: null,
      });

      return updated !== null;
    } catch (error) {
      console.error('❌ Failed to reset quota:', error);
      throw error;
    }
  }

  /**
   * 获取配额统计
   */
  async getQuotaStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    totalQuota: number;
    usedQuota: number;
    availableQuota: number;
    keysWithQuota: number;
  }> {
    try {
      const stats = await db
        .select({
          totalKeys: sql<number>`COUNT(*)`,
          activeKeys: sql<number>`COUNT(CASE WHEN ${azureKeys.isActive} = true THEN 1 END)`,
          totalQuota: sql<number>`SUM(${azureKeys.totalQuota})`,
          usedQuota: sql<number>`SUM(${azureKeys.usedQuota})`,
          keysWithQuota: sql<number>`COUNT(CASE WHEN ${azureKeys.usedQuota} < ${azureKeys.totalQuota} AND ${azureKeys.isActive} = true THEN 1 END)`,
        })
        .from(azureKeys);

      const result = stats[0];
      return {
        totalKeys: result.totalKeys || 0,
        activeKeys: result.activeKeys || 0,
        totalQuota: result.totalQuota || 0,
        usedQuota: result.usedQuota || 0,
        availableQuota: (result.totalQuota || 0) - (result.usedQuota || 0),
        keysWithQuota: result.keysWithQuota || 0,
      };
    } catch (error) {
      console.error('❌ Failed to get quota stats:', error);
      throw error;
    }
  }

  /**
   * 检查是否有可用配额
   */
  async hasAvailableQuota(charactersNeeded: number = 1): Promise<boolean> {
    try {
      const availableKey = await this.getAvailableKey();
      if (!availableKey) return false;

      return (availableKey.totalQuota - availableKey.usedQuota) >= charactersNeeded;
    } catch (error) {
      console.error('❌ Failed to check available quota:', error);
      return false;
    }
  }

  /**
   * 获取最佳可用的 Azure Key 配置
   */
  async getBestAvailableConfig(): Promise<{ speechKey: string; speechRegion: string; keyId: string } | null> {
    try {
      const availableKey = await this.getAvailableKey();
      if (!availableKey) return null;

      return {
        speechKey: availableKey.speechKey,
        speechRegion: availableKey.speechRegion,
        keyId: availableKey.id,
      };
    } catch (error) {
      console.error('❌ Failed to get best available config:', error);
      return null;
    }
  }
}

// 导出单例实例
export const azureKeysService = new AzureKeysService();
