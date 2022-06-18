import { DatumValue } from '@nivo/core'
import { ResponsiveStream } from '@nivo/stream'
import { memo } from 'react'
import { Bet } from 'common/bet'
import { getInitialProbability } from 'common/calculate'
import { CPMMContract } from 'common/contract'
import { useWindowSize } from 'web/hooks/use-window-size'

function getShares(prob: number, k: number, p: number) {
  return (
    (((((1 - p) / p) * prob) / (1 - prob)) * k ** (1 / p)) ** (p / (2 * p - 1))
  )
}

export const ContractPoolGraph = memo(function ContractProbGraph(props: {
  contract: CPMMContract
  bets: Bet[]
  height?: number
}) {
  const { contract, height } = props
  const { p, pool } = contract

  const buckets = Array.from(Array(101).keys())
  const distribution = Object.assign(
    {},
    ...buckets.map((prob) => ({ [prob]: getShares(prob, k, p) }))
  )

  const k = pool.YES ** p * pool.NO ** (1 - p)
  const bets = props.bets.filter((bet) => !bet.isAnte && !bet.isRedemption)

  const startProb = getInitialProbability(contract)

  const probs = [startProb, ...bets.map((bet) => bet.probAfter)]

  // Add a fake datapoint so the line continues to the right
  probs.push(probs[probs.length - 1])

  const yTickValues = [0, 25, 50, 75, 100]

  const { width } = useWindowSize()

  const numXTickValues = !width || width < 800 ? 2 : 5

  return (
    <div
      className="w-full overflow-visible"
      style={{ height: height ?? (!width || width >= 800 ? 350 : 250) }}
    >
      <ResponsiveStream
        data={distribution}
        keys={['all']}
        gridYValues={yTickValues}
        axisLeft={{
          tickValues: yTickValues,
          format: formatPercent,
        }}
        axisBottom={{
          tickValues: numXTickValues,
        }}
        colors={{ datum: 'color' }}
        curve="stepAfter"
        enableGridX={!!width && width >= 800}
        margin={{ top: 20, right: 20, bottom: 25, left: 40 }}
        animate={false}
      />
    </div>
  )
})

function formatPercent(y: DatumValue) {
  return `${Math.round(+y.toString())}%`
}
