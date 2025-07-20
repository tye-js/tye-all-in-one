// 首先加载环境变量
import * as fs from 'fs';
import * as path from 'path';

// 从 .env.local 读取环境变量
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

// TypeScript 类型断言，确保 DATABASE_URL 不是 undefined
const dbUrl: string = DATABASE_URL;

async function createAzureKeysTable() {
  try {
    console.log('🔧 Creating Azure Keys table...\n');
    
    const client = postgres(dbUrl, { prepare: false });

    // 创建 Azure Keys 表
    await client`
      CREATE TABLE IF NOT EXISTS azure_keys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        speech_key TEXT NOT NULL,
        speech_region VARCHAR(50) NOT NULL,
        total_quota INTEGER NOT NULL DEFAULT 2000000,
        used_quota INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_used_at TIMESTAMP,
        notes TEXT
      )
    `;

    console.log('✅ Azure Keys table created successfully');

    // 创建索引
    await client`
      CREATE INDEX IF NOT EXISTS idx_azure_keys_is_active ON azure_keys(is_active)
    `;

    await client`
      CREATE INDEX IF NOT EXISTS idx_azure_keys_used_quota ON azure_keys(used_quota, total_quota)
    `;

    console.log('✅ Indexes created successfully');

    // 插入示例数据（如果表为空）
    const existingKeys = await client`
      SELECT COUNT(*) as count FROM azure_keys
    `;

    if (existingKeys[0].count === 0) {
      console.log('📝 Inserting sample data...');
      
      await client`
        INSERT INTO azure_keys (name, speech_key, speech_region, notes)
        VALUES 
        ('Primary Key', 'your-azure-speech-key-1', 'eastus', 'Primary Azure Speech Service key'),
        ('Backup Key', 'your-azure-speech-key-2', 'westus2', 'Backup Azure Speech Service key')
      `;

      console.log('✅ Sample data inserted');
      console.log('⚠️  Please update the speech_key values with your actual Azure keys');
    }

    // 显示表结构
    const tableInfo = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'azure_keys'
      ORDER BY ordinal_position
    `;

    console.log('\n📊 Table structure:');
    tableInfo.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });

    // 显示当前数据
    const currentData = await client`
      SELECT id, name, speech_region, total_quota, used_quota, is_active, created_at
      FROM azure_keys
      ORDER BY created_at
    `;

    console.log('\n📋 Current data:');
    currentData.forEach(key => {
      const usagePercent = ((key.used_quota / key.total_quota) * 100).toFixed(1);
      console.log(`   • ${key.name} (${key.speech_region}): ${key.used_quota.toLocaleString()}/${key.total_quota.toLocaleString()} (${usagePercent}%) - ${key.is_active ? 'Active' : 'Inactive'}`);
    });

    await client.end();
    
    console.log('\n🎉 Azure Keys table setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update the speech_key values with your actual Azure Speech Service keys');
    console.log('2. Configure the regions according to your Azure setup');
    console.log('3. Access the admin panel to manage keys and quotas');

  } catch (error) {
    console.error('❌ Failed to create Azure Keys table:', error);
    process.exit(1);
  }
}

// 运行迁移
console.log('🔧 Azure Keys Table Migration\n');
createAzureKeysTable();
