import { ResponsiveStream } from '@nivo/stream'
import { CPMMContract } from 'common/contract'
import { useWindowSize } from 'web/hooks/use-window-size'

function getShares(prob: number, k: number, p: number) {
  //return k * ((1-p)/p*prob/(1-prob)) ** p * p / (1-prob) / prob // no shares per %
  return k * ((((1 - p) / p) * prob) / (1 - prob)) ** p // total no shares
}

export const ContractPoolGraph = function ContractPoolGraph(props: {
  contract: CPMMContract
  height?: number
}) {
  const { contract, height } = props
  const { p, pool } = contract
  const k = pool.YES ** p + pool.NO ** (1 - p)
  const data = Array.from({ length: 99 }, (_, i) => ({
    YES: getShares((99 - i) / 100, k, 1 - p),
    NO: getShares((i + 1) / 100, k, p),
  }))

  const defaultHeight = (useWindowSize().height ?? 0) > 800 ? 350 : 250
  return (
    <div
      className="w-full overflow-visible"
      style={{ height: height ?? defaultHeight }}
    >
      <ResponsiveStream
        data={data}
        keys={['YES', 'NO']}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        axisBottom={{
          tickValues: [],
          legend: 'market price in [1,99]%',
          legendOffset: 30,
        }}
        axisLeft={{
          legend: 'shares that would be in the liquidity pool',
          legendOffset: -40,
        }}
        enableGridY={false}
        offsetType="diverging"
        colors={['green', 'red']}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            translateX: 100,
            itemWidth: 80,
            itemHeight: 20,
          },
        ]}
      />
    </div>
  )
}
