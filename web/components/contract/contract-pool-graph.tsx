import { ResponsiveLine } from '@nivo/line'
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
  const points = Array.from({ length: 99 }, (_, i) => ({
    x: i + 1,
    y:
      getShares((99 - i) / 100, k, 1 - p) * p +
      getShares((i + 1) / 100, k, p) * (1 - p),
  }))
  const data = [{ id: 'Yes', data: points, color: '#11b981' }]
  const { width } = useWindowSize()
  return (
    <div
      className="w-full overflow-visible"
      style={{ height: height ?? ((width ?? 0) >= 800 ? 350 : 250) }}
    >
      <ResponsiveLine
        data={data}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        axisBottom={{
          tickValues: [1, 20, 40, 60, 80, 99],
          legend: 'market price in [1,99]%',
          legendOffset: 30,
        }}
        axisLeft={{
          legend:
            'shares that someone has to buy to move the market price by 1%',
          legendOffset: -40,
        }}
        enableGridY={false}
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
