import { useEffect, useState } from 'react'

import { CPMMContract } from 'common/contract'
import { LiquidityProvision } from 'common/liquidity-provision'
import { getUserLiquidityShares } from 'common/calculate-cpmm'
import { BinaryContract } from 'common/contract'
import { Bet } from 'common/bet'
import { listenForLiquidity } from 'web/lib/firebase/liquidity'

export const useLiquidity = (contractId: string) => {
  const [liquidities, setLiquidities] = useState<
    LiquidityProvision[] | undefined
  >(undefined)

  useEffect(() => {
    return listenForLiquidity(contractId, setLiquidities)
  }, [contractId])

  return liquidities
}

export const useUserLiquidity = (contract: CPMMContract, userId: string) => {
  const liquidities = useLiquidity(contract.id)

  const userShares = getUserLiquidityShares(userId, contract, liquidities ?? [])
  return userShares
}

export const useLiquidityData = (
  contract: BinaryContract,
  bets: Bet[],
  yesAmmount: number
) => {
  const liquidity = useLiquidity(contract.id)
  console.log('liquidity', liquidity)
  const data = [{ id: 'Yes', data: null, color: '#11b981' }]
  return data
}
