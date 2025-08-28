import { OpenAPI, OneClickService } from '@defuse-protocol/one-click-sdk-typescript'

export async function testJWTToken() {
  try {
    // Initialize the SDK
    OpenAPI.BASE = process.env.NEXT_PUBLIC_1CLICK_API_URL || 'https://1click.chaindefuser.com'
    OpenAPI.TOKEN = process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN || 'your-jwt-token'
    
    console.log('🔧 Testing JWT token configuration...')
    console.log('Base URL:', OpenAPI.BASE)
    console.log('Token configured:', !!OpenAPI.TOKEN && OpenAPI.TOKEN !== 'your-jwt-token')
    
    if (!OpenAPI.TOKEN || OpenAPI.TOKEN === 'your-jwt-token') {
      throw new Error('JWT token not properly configured')
    }
    
    // Test with a simple quote request using valid asset IDs from documentation
    const testQuote = {
      dry: true,
      depositMode: 'SIMPLE',
      swapType: 'EXACT_INPUT',
      slippageTolerance: 100,
      originAsset: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near', // USDC on Arbitrum
      depositType: 'ORIGIN_CHAIN',
      destinationAsset: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near', // USDC on Solana
      amount: '1000000', // 1 USDC (using the exact amount from documentation)
      refundTo: '0x2527D02599Ba641c19FEa793cD0F167589a0f10D',
      refundType: 'ORIGIN_CHAIN',
      recipient: '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK', // Solana address
      recipientType: 'DESTINATION_CHAIN',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    console.log('📡 Testing API connection...')
    console.log('📤 API Payload:', JSON.stringify(testQuote, null, 2))
    
    const result = await OneClickService.getQuote(testQuote)
    
    console.log('✅ JWT token is working! API response received.')
    console.log('📥 Test API Response:', JSON.stringify(result, null, 2))
    
    return { success: true, message: 'JWT token is working correctly' }
  } catch (error) {
    console.error('❌ JWT token test failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      error 
    }
  }
}
