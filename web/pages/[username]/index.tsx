import {
  CashIcon,
  ChatAlt2Icon,
  CurrencyDollarIcon,
  PencilIcon,
  ScaleIcon,
} from '@heroicons/react/outline'
import { ChartBarIcon, LinkIcon } from '@heroicons/react/solid'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Head from 'next/head'

import { Post } from 'common/post'
import { getUserByUsername, User } from 'web/lib/firebase/users'
import Custom404 from 'web/pages/404'
import { BlockedUser } from 'web/components/profile/blocked-user'
import { usePrivateUser } from 'web/hooks/use-user'
import { Title } from 'web/components/widgets/title'
import { MoreOptionsUserButton } from 'web/components/buttons/more-options-user-button'
import { UserContractsList } from 'web/components/profile/user-contracts-list'
import { useFollowers, useFollows } from 'web/hooks/use-follows'
import { usePrefetchUsers, useUser, useUserById } from 'web/hooks/use-user'
import { useDiscoverUsers } from 'web/hooks/use-users'
import { UserBetsTable } from 'web/components/bet/user-bets-table'
import { TextButton } from 'web/components/buttons/text-button'
import { FollowButton } from 'web/components/buttons/follow-button'
import { UserCommentsList } from 'web/components/comments/comments-list'
import { FollowList } from 'web/components/follow-list'
import { Col } from 'web/components/layout/col'
import { Modal } from 'web/components/layout/modal'
import { Page } from 'web/components/layout/page'
import { Row } from 'web/components/layout/row'
import { Spacer } from 'web/components/layout/spacer'
import { QueryUncontrolledTabs, Tabs } from 'web/components/layout/tabs'
import { PortfolioValueSection } from 'web/components/portfolio/portfolio-value-section'
import { SEO } from 'web/components/SEO'
import { Avatar } from 'web/components/widgets/avatar'
import ImageWithBlurredShadow from 'web/components/widgets/image-with-blurred-shadow'
import { Linkify } from 'web/components/widgets/linkify'
import { linkClass } from 'web/components/widgets/site-link'
import { StackedUserNames } from 'web/components/widgets/user-link'
import { FullscreenConfetti } from 'web/components/widgets/fullscreen-confetti'
import { useSaveReferral } from 'web/hooks/use-save-referral'
import { UserLikedContractsButton } from 'web/components/profile/user-liked-contracts-button'
import { getPostsByUser } from 'web/lib/supabase/post'
import { useLeagueInfo } from 'web/hooks/use-leagues'
import { DIVISION_NAMES, getLeaguePath } from 'common/leagues'
import TrophyIcon from 'web/lib/icons/trophy-icon.svg'
import { DailyLeagueStat } from 'web/components/daily-league-stat'
import { QuestsOrStreak } from 'web/components/quests-or-streak'
import { useAdmin } from 'web/hooks/use-admin'
import { UserPayments } from 'web/pages/payments'
import { useQuery } from 'web/hooks/use-query'
import { getUserRating, getUserReviews } from 'web/lib/supabase/reviews'
import { LoadingIndicator } from 'web/components/widgets/loading-indicator'
import { removeUndefinedProps } from 'common/util/object'
import { Review } from 'web/components/reviews/review'
import { db } from 'web/lib/supabase/db'
import {
  CopyLinkOrShareButton,
  CopyLinkRow,
} from 'web/components/buttons/copy-link-button'
import { QRCode } from 'web/components/widgets/qr-code'
import { ENV_CONFIG } from 'common/envs/constants'
import { referralQuery } from 'common/util/share'
import { SendMessageButton } from 'web/components/messaging/send-message-button'
import { useIsMobile } from 'web/hooks/use-is-mobile'

export const getStaticProps = async (props: {
  params: {
    username: string
  }
}) => {
  const { username } = props.params
  const user = await getUserByUsername(username)
  const posts = user ? await getPostsByUser(user.id) : []

  const { count, rating } = (user ? await getUserRating(user.id) : null) ?? {}

  return {
    props: removeUndefinedProps({
      user,
      username,
      posts,
      rating,
      reviewCount: count,
    }),
    revalidate: 60 * 5, // Regenerate after 5 minutes
  }
}

export const getStaticPaths = () => {
  return { paths: [], fallback: 'blocking' }
}

export default function UserPage(props: {
  user: User | null
  username: string
  posts: Post[]
  rating?: number
  reviewCount?: number
}) {
  const isAdmin = useAdmin()
  const { user, ...profileProps } = props
  const privateUser = usePrivateUser()
  const blockedByCurrentUser =
    privateUser?.blockedUserIds.includes(user?.id ?? '_') ?? false

  if (!user) return <Custom404 />
  else if (user.userDeleted && !isAdmin) return <DeletedUser />

  return privateUser && blockedByCurrentUser ? (
    <BlockedUser user={user} privateUser={privateUser} />
  ) : (
    <UserProfile user={user} {...profileProps} />
  )
}

const DeletedUser = () => {
  return (
    <Page trackPageView={'deleted user profile'}>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="flex h-full flex-col items-center justify-center">
        <Title>Deleted account page</Title>
        <p>This user has been deleted.</p>
        <p>If you didn't expect this, let us know on Discord!</p>
        <br />
        <iframe
          src="https://discord.com/widget?id=915138780216823849&theme=dark"
          width="350"
          height="500"
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        ></iframe>
      </div>
    </Page>
  )
}

function UserProfile(props: {
  user: User
  posts: Post[]
  rating?: number
  reviewCount?: number
}) {
  const { rating, reviewCount } = props
  const user = useUserById(props.user.id) ?? props.user
  const isMobile = useIsMobile()
  const router = useRouter()
  const currentUser = useUser()
  useSaveReferral(currentUser, {
    defaultReferrerUsername: user?.username,
  })
  const isCurrentUser = user.id === currentUser?.id
  const [showConfetti, setShowConfetti] = useState(false)
  const [followsYou, setFollowsYou] = useState(false)

  useEffect(() => {
    const claimedMana = router.query['claimed-mana'] === 'yes'
    setShowConfetti(claimedMana)
    const query = { ...router.query }
    if (query.claimedMana || query.show) {
      const queriesToDelete = ['claimed-mana', 'show', 'badge']
      queriesToDelete.forEach((key) => delete query[key])
      router.replace(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true }
      )
    }
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.id !== user.id) {
      db.from('user_follows')
        .select('user_id')
        .eq('follow_id', currentUser.id)
        .eq('user_id', user.id)
        .then(({ data }) => {
          setFollowsYou(
            data?.some(({ user_id }) => user_id === user.id) ?? false
          )
        })
    }
  }, [currentUser?.id, user?.id])

  return (
    <Page
      key={user.id}
      trackPageView={'user page'}
      trackPageProps={{ username: user.username }}
    >
      <SEO
        title={`${user.name} (@${user.username})`}
        description={user.bio ?? ''}
        url={`/${user.username}`}
      />
      {(user.isBannedFromPosting || user.userDeleted) && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      )}
      {showConfetti && <FullscreenConfetti />}

      <Col className="mx-4 mt-1">
        <Row
          className={clsx(
            'flex-wrap gap-2 py-1',
            isMobile ? '' : 'justify-between'
          )}
        >
          <Row className={clsx('gap-2')}>
            <Col className={'relative max-h-14'}>
              <ImageWithBlurredShadow
                image={
                  <Avatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    size={'lg'}
                    className="bg-ink-1000"
                    noLink
                  />
                }
              />
              {isCurrentUser && (
                <Link
                  className=" bg-primary-600 shadow-primary-300 hover:bg-primary-700 text-ink-0 absolute bottom-0 right-0 h-6 w-6 rounded-full p-1.5 shadow-sm"
                  href="/profile"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PencilIcon className="text-ink-0 h-3.5 w-3.5 " />
                </Link>
              )}
            </Col>
            <StackedUserNames
              usernameClassName={'sm:text-base'}
              className={'font-bold sm:mr-0 sm:text-xl'}
              user={user}
              followsYou={followsYou}
            />
          </Row>
          {isCurrentUser ? (
            <Row className={'items-center gap-1 sm:gap-2'}>
              <DailyLeagueStat user={user} />
              <QuestsOrStreak user={user} />
            </Row>
          ) : isMobile ? (
            <>
              <div className={'my-auto'}>
                <SendMessageButton toUser={user} currentUser={currentUser} />
              </div>
              <div className={'my-auto'}>
                <FollowButton userId={user.id} />
              </div>
              <div className={'my-auto'}>
                <MoreOptionsUserButton user={user} />
              </div>
            </>
          ) : (
            <Row className="items-center gap-1 sm:gap-2">
              <SendMessageButton toUser={user} currentUser={currentUser} />
              <FollowButton userId={user.id} />
              <MoreOptionsUserButton user={user} />
            </Row>
          )}
        </Row>
        <Col className={'mt-1'}>
          <ProfilePublicStats
            user={user}
            currentUser={currentUser}
            rating={rating}
            reviewCount={reviewCount}
          />
          {user.bio && (
            <div className="sm:text-md mt-1 text-sm">
              <Linkify text={user.bio}></Linkify>
            </div>
          )}
          <Row className="text-ink-400 mt-2 flex-wrap items-center gap-2 sm:gap-4">
            {user.website && (
              <a
                href={
                  'https://' +
                  user.website.replace('http://', '').replace('https://', '')
                }
              >
                <Row className="items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-ink-400 text-sm">{user.website}</span>
                </Row>
              </a>
            )}

            {user.twitterHandle && (
              <a
                href={`https://twitter.com/${user.twitterHandle
                  .replace('https://www.twitter.com/', '')
                  .replace('https://twitter.com/', '')
                  .replace('www.twitter.com/', '')
                  .replace('twitter.com/', '')}`}
              >
                <Row className="items-center gap-1">
                  <img
                    src="/twitter-logo.svg"
                    className="h-4 w-4"
                    alt="Twitter"
                  />
                  <span className="text-ink-400 text-sm">
                    {user.twitterHandle}
                  </span>
                </Row>
              </a>
            )}

            {user.discordHandle && (
              <a href="https://discord.com/invite/eHQBNBqXuh">
                <Row className="items-center gap-1">
                  <img
                    src="/discord-logo.svg"
                    className="h-4 w-4"
                    alt="Discord"
                  />
                  <span className="text-ink-400 text-sm">
                    {user.discordHandle}
                  </span>
                </Row>
              </a>
            )}
          </Row>
        </Col>

        <Col className="mt-2">
          <QueryUncontrolledTabs
            trackingName={'profile tabs'}
            labelsParentClassName={'gap-0 sm:gap-4'}
            labelClassName={'pb-2 pt-1 sm:pt-4 '}
            tabs={[
              {
                title: 'Portfolio',
                stackedTabIcon: <CurrencyDollarIcon className="h-5" />,
                content: (
                  <>
                    <Spacer h={4} />
                    <PortfolioValueSection
                      userId={user.id}
                      defaultTimePeriod={
                        currentUser?.id === user.id ? 'daily' : 'monthly'
                      }
                      lastUpdatedTime={user.metricsLastUpdated}
                      isCurrentUser={isCurrentUser}
                    />
                    <Spacer h={4} />
                    <UserBetsTable user={user} />
                  </>
                ),
              },
              {
                title: 'Questions',
                stackedTabIcon: <ScaleIcon className="h-5" />,
                content: (
                  <>
                    <Spacer h={4} />
                    <UserContractsList creator={user} />
                  </>
                ),
              },
              {
                title: 'Comments',
                stackedTabIcon: <ChatAlt2Icon className="h-5" />,
                content: (
                  <Col>
                    <UserCommentsList user={user} />
                  </Col>
                ),
              },
              {
                title: 'Managrams',
                stackedTabIcon: <CashIcon className="h-5" />,
                content: (
                  <>
                    <Spacer h={4} />
                    <UserPayments userId={user.id} />
                  </>
                ),
              },
            ]}
          />
        </Col>
      </Col>
    </Page>
  )
}

type FollowsDialogTab = 'following' | 'followers'

function ProfilePublicStats(props: {
  user: User
  currentUser: User | undefined | null
  rating?: number
  reviewCount?: number
  className?: string
}) {
  const { user, className, currentUser, rating, reviewCount = 0 } = props
  const isCurrentUser = user.id === currentUser?.id
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [followsOpen, setFollowsOpen] = useState(false)
  const [followsTab, setFollowsTab] = useState<FollowsDialogTab>('following')
  const followingIds = useFollows(user.id)
  const followerIds = useFollowers(user.id)
  const openFollowsDialog = (tabName: FollowsDialogTab) => {
    setFollowsOpen(true)
    setFollowsTab(tabName)
  }

  const leagueInfo = useLeagueInfo(user.id)

  return (
    <Row
      className={clsx(
        'text-ink-600 flex-wrap items-center gap-x-2 text-sm',
        className
      )}
    >
      <TextButton onClick={() => openFollowsDialog('following')}>
        <span className={clsx('font-semibold')}>
          {followingIds?.length ?? ''}
        </span>{' '}
        Following
      </TextButton>
      <TextButton onClick={() => openFollowsDialog('followers')}>
        <span className={clsx('font-semibold')}>
          {followerIds?.length ?? ''}
        </span>{' '}
        Followers
      </TextButton>

      {isCurrentUser && <UserLikedContractsButton user={user} />}

      {!isCurrentUser && leagueInfo && (
        <Link
          className={linkClass}
          href={getLeaguePath(
            leagueInfo.season,
            leagueInfo.division,
            leagueInfo.cohort,
            user.id
          )}
        >
          <TrophyIcon className="mb-1 mr-1 inline h-4 w-4" />
          <span className={clsx('font-semibold')}>
            {DIVISION_NAMES[leagueInfo.division ?? '']}
          </span>{' '}
          Rank {leagueInfo.rank}
        </Link>
      )}

      {reviewCount > 0 && (
        <button
          className="group flex gap-0.5"
          onClick={() => setReviewsOpen(true)}
        >
          <span className="decoration-primary-400 decoration-2 group-hover:underline">
            <span className="font-semibold">{reviewCount}</span> Review
            {reviewCount === 1 ? '' : 's'}
          </span>
        </button>
      )}

      <Link
        href={'/' + user.username + '/calibration'}
        className={clsx(linkClass, 'text-sm')}
      >
        <ChartBarIcon className="mb-1 mr-1 inline h-4 w-4" />
        Calibration
      </Link>
      <ShareButton user={user} currentUser={currentUser} />

      <FollowsDialog
        user={user}
        defaultTab={followsTab}
        followingIds={followingIds}
        followerIds={followerIds}
        isOpen={followsOpen}
        setIsOpen={setFollowsOpen}
      />
      <ReviewsDialog
        isOpen={reviewsOpen}
        setIsOpen={setReviewsOpen}
        userId={user.id}
        rating={rating ?? 4}
      />
      {/*{isCurrentUser && <ReferralsButton user={user} className={className} />}
      {isCurrentUser && (
        <UserLikedContractsButton user={user} className={className} />
      )} */}
    </Row>
  )
}

const ShareButton = (props: {
  user: User
  currentUser: User | undefined | null
}) => {
  const { user, currentUser } = props
  const isSameUser = currentUser?.id === user.id
  const url = `https://${ENV_CONFIG.domain}/${user.username}${
    !isSameUser && currentUser ? referralQuery(currentUser.username) : ''
  }`
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Row className={'items-center'}>
      <CopyLinkOrShareButton
        url={url}
        iconClassName={'h-3'}
        className={'gap-1 p-0'}
        eventTrackingName={'share user page'}
        tooltip={'Copy link to profile'}
        size={'2xs'}
      >
        <span className={'text-sm'}>Share</span>
      </CopyLinkOrShareButton>

      <Modal open={isOpen} setOpen={setIsOpen}>
        <Col className="bg-canvas-0 max-h-[90vh] rounded pt-6">
          <div className="px-6 pb-1 text-center text-xl">{user.name}</div>
          <CopyLinkRow url={url} eventTrackingName="copy referral link" />
          <QRCode url={url} className="mt-4 self-center" />
        </Col>
      </Modal>
    </Row>
  )
}

function FollowsDialog(props: {
  user: User
  followingIds: string[] | undefined
  followerIds: string[] | undefined
  defaultTab: FollowsDialogTab
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  const { user, followingIds, followerIds, defaultTab, isOpen, setIsOpen } =
    props

  const currentUser = useUser()
  const myFollowedIds = useFollows(currentUser?.id)
  const suggestedUserIds = useDiscoverUsers(
    isOpen ? user.id : undefined, // don't bother fetching this unless someone looks
    myFollowedIds ?? [],
    50
  )

  usePrefetchUsers([
    ...(followerIds ?? []),
    ...(followingIds ?? []),
    ...(suggestedUserIds ?? []),
  ])

  return (
    <Modal open={isOpen} setOpen={setIsOpen}>
      <Col className="bg-canvas-0 max-h-[90vh] rounded pt-6">
        <div className="px-6 pb-1 text-center text-xl">{user.name}</div>
        <Tabs
          className="mx-6"
          tabs={[
            {
              title: 'Following',
              content: <FollowList userIds={followingIds} />,
            },
            {
              title: 'Followers',
              content: <FollowList userIds={followerIds} />,
            },
            {
              title: 'Similar',
              content: <FollowList userIds={suggestedUserIds} />,
            },
          ]}
          defaultIndex={defaultTab === 'following' ? 0 : 1}
        />
      </Col>
    </Modal>
  )
}

function ReviewsDialog(props: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  userId: string
  rating: number
}) {
  const { isOpen, setIsOpen, userId, rating } = props

  const reviews = useQuery(() => getUserReviews(userId))

  const ratingLabel =
    rating > 4.8 ? (
      <span className="font-semibold text-green-600">Exceptional</span>
    ) : rating > 4.5 ? (
      <span className="font-semibold text-green-600">Great</span>
    ) : rating > 3.3 ? (
      <span className="font-semibold text-green-600">Good</span>
    ) : rating > 2.5 ? (
      <span className="font-semibold text-yellow-600">Okay</span>
    ) : rating > 2 ? (
      <span className="font-semibold text-red-600">Poor</span>
    ) : (
      <span className="font-semibold text-red-600">Very Poor</span>
    )

  return (
    <Modal open={isOpen} setOpen={setIsOpen}>
      <div className="bg-canvas-0 max-h-[90vh] overflow-y-auto rounded p-6">
        <Title>Reviews</Title>

        <div className="mb-4">Resolution reliability: {ratingLabel}</div>
        {reviews.isLoading && <LoadingIndicator className="text-center" />}

        <Col className="divide-ink-300 divide-y-2">
          {reviews.data?.map((review, i) => (
            <Review
              key={i}
              userId={review.reviewer_id}
              rating={review.rating}
              created={review.created_time}
              contractId={review.market_id}
              text={review.content as any}
            />
          ))}
        </Col>
      </div>
    </Modal>
  )
}
