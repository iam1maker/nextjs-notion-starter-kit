import type { Metadata } from 'next'

import { NotionPageRoute } from '@/components/NotionPageRoute'
import { getPageData } from '@/lib/get-page-data'
import { getSiteMap } from '@/lib/get-site-map'
import { isDev, pageUrlOverrides } from '@/lib/config'
import { createPageMetadata } from '@/lib/page-metadata'

interface DynamicPageProps {
  params: Promise<{
    pageId: string
  }>
}

export const revalidate = 10
export const dynamicParams = true

export async function generateStaticParams() {
  if (isDev) {
    return []
  }

  const siteMap = await getSiteMap()
  const pageIds = [
    ...new Set([
      ...Object.keys(siteMap.canonicalPageMap),
      ...Object.keys(pageUrlOverrides)
    ])
  ]

  return pageIds.map((pageId) => ({ pageId }))
}

// non-ascii slugs (e.g. chinese page titles) may arrive percent-encoded
// depending on the hosting platform, but the site map keys are decoded
function decodePageId(pageId: string): string {
  try {
    return decodeURIComponent(pageId)
  } catch {
    return pageId
  }
}

export async function generateMetadata({
  params
}: DynamicPageProps): Promise<Metadata> {
  const pageId = decodePageId((await params).pageId)

  return createPageMetadata(await getPageData(pageId))
}

export default async function DynamicPage({ params }: DynamicPageProps) {
  const pageId = decodePageId((await params).pageId)
  const pageProps = await getPageData(pageId)

  return <NotionPageRoute pageProps={pageProps} />
}
