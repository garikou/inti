'use client'

import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline'

import { SwapQuote } from '@/lib/swapService'

interface SwapPreviewProps {
  swapData: SwapQuote
  onConfirm: () => void
}

export function SwapPreview({ swapData, onConfirm }: SwapPreviewProps) {
  return (
    <div className="bg-black border border-neon-500 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-neon-400 mb-4">
        Swap Preview
      </h3>
      
      <div className="space-y-4">
        {/* Swap Details */}
        <div className="bg-gray-900 border border-neon-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-neon-400">
                {swapData.fromAmount}
              </div>
              <div className="text-sm text-neon-300">
                {swapData.fromToken}
              </div>
              {swapData.amountInUsd && (
                <div className="text-xs text-neon-500">
                  ≈ ${swapData.amountInUsd}
                </div>
              )}
            </div>
            
            <div className="mx-4">
              <ArrowRightIcon className="w-6 h-6 text-neon-400" />
            </div>
            
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-neon-400">
                {swapData.toAmount}
              </div>
              <div className="text-sm text-neon-300">
                {swapData.toToken}
              </div>
              {swapData.amountOutUsd && (
                <div className="text-xs text-neon-500">
                  ≈ ${swapData.amountOutUsd}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Transaction Details */}
        <div className="bg-gray-900 border border-neon-500/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neon-300">Slippage Tolerance</span>
            <span className="font-medium text-neon-400">
              {swapData.slippage}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neon-300">Estimated Time</span>
            <span className="font-medium text-neon-400">
              {swapData.timeEstimate ? `${swapData.timeEstimate} minutes` : 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neon-300">Exchange Rate</span>
            <span className="font-medium text-neon-400">
              1 {swapData.fromToken} = {(parseFloat(swapData.toAmount) / parseFloat(swapData.fromAmount)).toFixed(6)} {swapData.toToken}
            </span>
          </div>
          
          {swapData.amountInUsd && swapData.amountOutUsd && (
            <div className="flex justify-between items-center">
              <span className="text-neon-300">Price Impact</span>
              <span className={`font-medium ${parseFloat(swapData.amountInUsd) > parseFloat(swapData.amountOutUsd) ? 'text-red-400' : 'text-green-400'}`}>
                {((parseFloat(swapData.amountInUsd) - parseFloat(swapData.amountOutUsd)) / parseFloat(swapData.amountInUsd) * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-neon hover:bg-neon-600 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 neon-glow"
          >
            <CheckIcon className="w-5 h-5" />
            <span>Confirm Swap</span>
          </button>
          
          <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors border border-gray-600">
            Cancel
          </button>
        </div>
        
        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center">
          By confirming this swap, you agree to the transaction details above. 
          Gas fees and slippage may vary based on network conditions.
        </div>
      </div>
    </div>
  )
}
