-- 添加会员等级枚举类型
DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('free', 'pro', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 添加会员字段到用户表
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_tier membership_tier DEFAULT 'free' NOT NULL,
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON users(membership_tier);
CREATE INDEX IF NOT EXISTS idx_users_membership_expires_at ON users(membership_expires_at);

-- 更新现有用户为免费会员
UPDATE users 
SET membership_tier = 'free' 
WHERE membership_tier IS NULL;

-- 添加注释
COMMENT ON COLUMN users.membership_tier IS 'User membership tier: free, pro, or premium';
COMMENT ON COLUMN users.membership_expires_at IS 'When the paid membership expires (NULL for free tier)';

-- 创建会员使用统计表
CREATE TABLE IF NOT EXISTS membership_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    characters_used INTEGER DEFAULT 0 NOT NULL,
    requests_made INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, month_year)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_membership_usage_user_month ON membership_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_membership_usage_month_year ON membership_usage(month_year);

-- 添加注释
COMMENT ON TABLE membership_usage IS 'Track monthly usage statistics for each user';
COMMENT ON COLUMN membership_usage.month_year IS 'Month and year in YYYY-MM format';
COMMENT ON COLUMN membership_usage.characters_used IS 'Total characters processed in TTS this month';
COMMENT ON COLUMN membership_usage.requests_made IS 'Total TTS requests made this month';

-- 创建每日使用统计表
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    requests_made INTEGER DEFAULT 0 NOT NULL,
    characters_used INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date);

-- 添加注释
COMMENT ON TABLE daily_usage IS 'Track daily usage statistics for each user';
COMMENT ON COLUMN daily_usage.requests_made IS 'Total TTS requests made on this date';
COMMENT ON COLUMN daily_usage.characters_used IS 'Total characters processed in TTS on this date';

-- 创建会员订阅历史表
CREATE TABLE IF NOT EXISTS membership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_tier membership_tier NOT NULL,
    to_tier membership_tier NOT NULL,
    started_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    payment_id VARCHAR(255), -- 支付系统的订单ID
    amount DECIMAL(10,2), -- 支付金额
    currency VARCHAR(3) DEFAULT 'USD', -- 货币代码
    status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled, refunded
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_membership_history_user_id ON membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_status ON membership_history(status);
CREATE INDEX IF NOT EXISTS idx_membership_history_expires_at ON membership_history(expires_at);

-- 添加注释
COMMENT ON TABLE membership_history IS 'Track membership subscription history and payments';
COMMENT ON COLUMN membership_history.payment_id IS 'External payment system order/transaction ID';
COMMENT ON COLUMN membership_history.status IS 'Subscription status: active, expired, cancelled, refunded';

-- 创建函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加触发器
DROP TRIGGER IF EXISTS update_membership_usage_updated_at ON membership_usage;
CREATE TRIGGER update_membership_usage_updated_at
    BEFORE UPDATE ON membership_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_usage_updated_at ON daily_usage;
CREATE TRIGGER update_daily_usage_updated_at
    BEFORE UPDATE ON daily_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_history_updated_at ON membership_history;
CREATE TRIGGER update_membership_history_updated_at
    BEFORE UPDATE ON membership_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入一些测试数据（可选）
-- 将第一个用户设置为 Pro 会员用于测试
-- UPDATE users 
-- SET membership_tier = 'pro', 
--     membership_expires_at = NOW() + INTERVAL '30 days'
-- WHERE id = (SELECT id FROM users LIMIT 1);

COMMIT;
