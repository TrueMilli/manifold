import { DatumValue } from '@nivo/core'
import { ResponsiveStream } from '@nivo/stream'
import { memo } from 'react'
import { Bet } from 'common/bet'
import { getInitialProbability } from 'common/calculate'
import { CPMMContract } from 'common/contract'
import { useWindowSize } from 'web/hooks/use-window-size'

function getShares(prob: number, l: number, p: number) {
  return Math.exp(l + p * (Math.log(p) + Math.log(1-p) + Math.log(1-prob)))
  //return ((((((1 - p) / p) * prob) / (1 - prob)) * k ** (1 / p)) ** (p / (2 * p - 1)))
}

export const ContractPoolGraph = memo(function ContractProbGraph(props: {
  contract: CPMMContract
  bets: Bet[]
  height?: number
}) {
  const { contract, height } = props
  const { p, pool } = contract
  const l = Math.log(pool.YES) * p + Math.log(pool.NO) * (1 - p)
  const distribution = Array.from({ length: 101 }, (_, prob) => ({Foo:getShares(prob,l,p)}))

  const { width } = useWindowSize()
  const numXTickValues = !width || width < 800 ? 2 : 5
  return (
    <div
      className="w-full overflow-visible"
      style={{ height: height ?? (!width || width >= 800 ? 350 : 250) }}
    >
      <ResponsiveStream
        data={distribution}
        keys={['Foo']}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendOffset: -40,
        }}
        enableGridX={true}
        enableGridY={false}
        offsetType="diverging"
        colors={{ scheme: 'nivo' }}
        fillOpacity={0.85}
        borderColor={{ theme: 'background' }}
        dotSize={8}
        dotColor={{ from: 'color' }}
        dotBorderWidth={2}
        dotBorderColor={{
          from: 'color',
          modifiers: [['darker', 0.7]],
        }}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            translateX: 100,
            itemWidth: 80,
            itemHeight: 20,
            itemTextColor: '#999999',
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000000',
                },
              },
            ],
          },
        ]}
      />
      {/* <ResponsiveStream
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
      /> */}
    </div>
  )
})

function formatPercent(y: DatumValue) {
  return `${Math.round(+y.toString())}%`
}