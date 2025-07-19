-- 检查和添加会员字段的脚本

-- 1. 检查 membership_tier 枚举类型是否存在
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_tier') THEN
        CREATE TYPE membership_tier AS ENUM ('free', 'pro', 'premium');
        RAISE NOTICE 'Created membership_tier enum type';
    ELSE
        RAISE NOTICE 'membership_tier enum type already exists';
    END IF;
END $$;

-- 2. 检查 users 表中的会员字段
DO $$ 
BEGIN
    -- 检查 membership_tier 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'membership_tier'
    ) THEN
        ALTER TABLE users ADD COLUMN membership_tier membership_tier DEFAULT 'free' NOT NULL;
        RAISE NOTICE 'Added membership_tier column to users table';
    ELSE
        RAISE NOTICE 'membership_tier column already exists in users table';
    END IF;

    -- 检查 membership_expires_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'membership_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN membership_expires_at TIMESTAMP;
        RAISE NOTICE 'Added membership_expires_at column to users table';
    ELSE
        RAISE NOTICE 'membership_expires_at column already exists in users table';
    END IF;
END $$;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON users(membership_tier);
CREATE INDEX IF NOT EXISTS idx_users_membership_expires_at ON users(membership_expires_at);

-- 4. 显示当前用户表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name IN ('membership_tier', 'membership_expires_at')
ORDER BY ordinal_position;

-- 5. 显示当前用户的会员状态
SELECT 
    id,
    email,
    name,
    membership_tier,
    membership_expires_at,
    CASE 
        WHEN membership_tier = 'free' THEN 'Active (Free)'
        WHEN membership_expires_at IS NULL THEN 'Active (Lifetime)'
        WHEN membership_expires_at > NOW() THEN 'Active (Paid)'
        ELSE 'Expired'
    END as membership_status
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 6. 测试会员升级功能
-- 注意：这只是示例，实际使用时请替换为真实的用户ID
/*
UPDATE users 
SET 
    membership_tier = 'pro',
    membership_expires_at = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE email = 'your-test-email@example.com';
*/

COMMIT;
