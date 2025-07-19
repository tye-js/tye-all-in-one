import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getAzureConfig, 
  validateAzureConfig, 
  getConfigStatusMessage,
  getConfigHelpMessage,
  getSupportedRegions 
} from '@/lib/azure-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 只有管理员可以查看配置状态
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const config = getAzureConfig();
    const statusMessage = getConfigStatusMessage();
    const helpMessage = getConfigHelpMessage();
    const supportedRegions = getSupportedRegions();

    // 如果配置了凭据，验证其有效性
    let validation = null;
    if (config.isConfigured) {
      validation = await validateAzureConfig();
    }

    return NextResponse.json({
      config: {
        isConfigured: config.isConfigured,
        region: config.region,
        endpoint: config.endpoint,
        // 不返回实际的密钥，只返回是否设置了
        hasSubscriptionKey: !!config.subscriptionKey,
      },
      validation,
      statusMessage,
      helpMessage,
      supportedRegions,
    });
  } catch (error) {
    console.error('Error checking Azure status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 只有管理员可以测试配置
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validation = await validateAzureConfig();
    
    return NextResponse.json({
      validation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error validating Azure config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
