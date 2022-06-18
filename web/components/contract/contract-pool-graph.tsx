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
  const data = [
    {
      Raoul: 42,
      Josiane: 190,
      Marcel: 137,
      René: 93,
      Paul: 75,
      Jacques: 11,
    },
    {
      Raoul: 119,
      Josiane: 84,
      Marcel: 46,
      René: 69,
      Paul: 167,
      Jacques: 11,
    },
    {
      Raoul: 101,
      Josiane: 79,
      Marcel: 22,
      René: 63,
      Paul: 105,
      Jacques: 192,
    },
    {
      Raoul: 165,
      Josiane: 70,
      Marcel: 57,
      René: 30,
      Paul: 82,
      Jacques: 46,
    },
    {
      Raoul: 147,
      Josiane: 86,
      Marcel: 87,
      René: 60,
      Paul: 59,
      Jacques: 104,
    },
    {
      Raoul: 11,
      Josiane: 195,
      Marcel: 140,
      René: 149,
      Paul: 98,
      Jacques: 131,
    },
    {
      Raoul: 73,
      Josiane: 159,
      Marcel: 125,
      René: 43,
      Paul: 49,
      Jacques: 70,
    },
    {
      Raoul: 168,
      Josiane: 136,
      Marcel: 199,
      René: 174,
      Paul: 121,
      Jacques: 189,
    },
    {
      Raoul: 151,
      Josiane: 170,
      Marcel: 138,
      René: 177,
      Paul: 71,
      Jacques: 52,
    },
  ]
  return (
    <div
      className="w-full overflow-visible"
      style={{ height: height ?? (!width || width >= 800 ? 350 : 250) }}
    >
      <ResponsiveStream
        data={data}
        keys={['Raoul', 'Josiane', 'Marcel', 'René', 'Paul', 'Jacques']}
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
        defs={[
          {
            id: 'dots',
            type: 'patternDots',
            background: 'inherit',
            color: '#2c998f',
            size: 4,
            padding: 2,
            stagger: true,
          },
          {
            id: 'squares',
            type: 'patternSquares',
            background: 'inherit',
            color: '#e4c912',
            size: 6,
            padding: 2,
            stagger: true,
          },
        ]}
        fill={[
          {
            match: {
              id: 'Paul',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'Marcel',
            },
            id: 'squares',
          },
        ]}
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
