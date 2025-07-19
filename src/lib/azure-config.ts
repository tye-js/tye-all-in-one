/**
 * Azure Speech Service 配置检查和管理
 */

export interface AzureConfig {
  subscriptionKey: string;
  region: string;
  isConfigured: boolean;
  endpoint: string;
}

/**
 * 获取 Azure Speech Service 配置
 */
export function getAzureConfig(): AzureConfig {
  const subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
  const region = process.env.AZURE_SPEECH_REGION || '';
  
  const isConfigured = !!(subscriptionKey && region);
  const endpoint = region ? `https://${region}.tts.speech.microsoft.com` : '';

  return {
    subscriptionKey,
    region,
    isConfigured,
    endpoint,
  };
}

/**
 * 验证 Azure 配置是否有效
 */
export async function validateAzureConfig(): Promise<{
  isValid: boolean;
  error?: string;
  details?: any;
}> {
  const config = getAzureConfig();
  
  if (!config.isConfigured) {
    return {
      isValid: false,
      error: 'Azure Speech Service credentials not configured. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables.',
    };
  }

  try {
    // 测试 API 连接
    const response = await fetch(
      `${config.endpoint}/cognitiveservices/voices/list`,
      {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        },
      }
    );

    if (!response.ok) {
      return {
        isValid: false,
        error: `Azure API validation failed: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          region: config.region,
        },
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Azure API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    };
  }
}

/**
 * 获取 Azure 配置状态的人类可读描述
 */
export function getConfigStatusMessage(): string {
  const config = getAzureConfig();
  
  if (!config.subscriptionKey) {
    return '❌ AZURE_SPEECH_KEY environment variable is not set';
  }
  
  if (!config.region) {
    return '❌ AZURE_SPEECH_REGION environment variable is not set';
  }
  
  return `✅ Azure Speech Service configured for region: ${config.region}`;
}

/**
 * 获取配置帮助信息
 */
export function getConfigHelpMessage(): string {
  return `
🔧 Azure Speech Service Configuration Help:

1. Get your Azure Speech Service credentials:
   - Go to https://portal.azure.com
   - Create or find your Speech Service resource
   - Copy the subscription key and region

2. Set environment variables in your .env.local file:
   AZURE_SPEECH_KEY=your_subscription_key_here
   AZURE_SPEECH_REGION=your_region_here (e.g., eastus, westus2, etc.)

3. Common regions:
   - eastus (East US)
   - westus2 (West US 2)
   - westeurope (West Europe)
   - southeastasia (Southeast Asia)

4. Restart your development server after setting the variables.

For more information, visit:
https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/
`;
}

/**
 * 检查是否应该使用回退数据
 */
export function shouldUseFallback(): boolean {
  const config = getAzureConfig();
  return !config.isConfigured;
}

/**
 * 获取支持的区域列表
 */
export function getSupportedRegions(): Array<{ code: string; name: string }> {
  return [
    { code: 'eastus', name: 'East US' },
    { code: 'eastus2', name: 'East US 2' },
    { code: 'westus', name: 'West US' },
    { code: 'westus2', name: 'West US 2' },
    { code: 'westus3', name: 'West US 3' },
    { code: 'centralus', name: 'Central US' },
    { code: 'northcentralus', name: 'North Central US' },
    { code: 'southcentralus', name: 'South Central US' },
    { code: 'westcentralus', name: 'West Central US' },
    { code: 'canadacentral', name: 'Canada Central' },
    { code: 'canadaeast', name: 'Canada East' },
    { code: 'brazilsouth', name: 'Brazil South' },
    { code: 'northeurope', name: 'North Europe' },
    { code: 'westeurope', name: 'West Europe' },
    { code: 'uksouth', name: 'UK South' },
    { code: 'ukwest', name: 'UK West' },
    { code: 'francecentral', name: 'France Central' },
    { code: 'germanywestcentral', name: 'Germany West Central' },
    { code: 'norwayeast', name: 'Norway East' },
    { code: 'switzerlandnorth', name: 'Switzerland North' },
    { code: 'switzerlandwest', name: 'Switzerland West' },
    { code: 'swedencentral', name: 'Sweden Central' },
    { code: 'eastasia', name: 'East Asia' },
    { code: 'southeastasia', name: 'Southeast Asia' },
    { code: 'australiaeast', name: 'Australia East' },
    { code: 'australiasoutheast', name: 'Australia Southeast' },
    { code: 'centralindia', name: 'Central India' },
    { code: 'southindia', name: 'South India' },
    { code: 'westindia', name: 'West India' },
    { code: 'japaneast', name: 'Japan East' },
    { code: 'japanwest', name: 'Japan West' },
    { code: 'koreacentral', name: 'Korea Central' },
    { code: 'koreasouth', name: 'Korea South' },
    { code: 'southafricanorth', name: 'South Africa North' },
    { code: 'uaenorth', name: 'UAE North' },
  ];
}
