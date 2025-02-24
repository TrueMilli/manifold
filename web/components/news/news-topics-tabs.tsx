import { HomeIcon } from '@heroicons/react/solid'
import { Col } from 'web/components/layout/col'
import { QueryUncontrolledTabs, Tab } from 'web/components/layout/tabs'
import { track } from 'web/lib/service/analytics'

import { buildArray } from 'common/util/array'
import { newsContent } from 'web/components/news/news-content'
import { NewsDashboard } from './news-dashboard'

export function NewsTopicsTabs(props: {
  homeContent?: JSX.Element
  dontScroll?: boolean
}) {
  const { homeContent, dontScroll } = props

  const topics = buildArray<Tab>(
    !!homeContent && {
      title: 'For you',
      inlineTabIcon: <HomeIcon className="h-4 w-4" />,
      content: homeContent,
    },
    newsContent.map((content) => ({
      title: content.title,
      content: <NewsDashboard slug={content.slug} />,
    }))
  )
  return (
    <Col className="w-full gap-2 px-1 pb-8 sm:mx-auto sm:gap-6">
      <QueryUncontrolledTabs
        className={'bg-canvas-50 sticky top-0 z-20 px-1'}
        trackingName="news tabs"
        scrollToTop={!dontScroll}
        tabs={topics.map((tab) => ({
          ...tab,
          onClick: () => {
            track('news topic clicked', { tab: tab.title })
          },
        }))}
      />
    </Col>
  )
}
