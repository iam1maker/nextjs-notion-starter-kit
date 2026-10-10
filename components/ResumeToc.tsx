'use client'

import cs from 'classnames'
import type { ExtendedRecordMap, PageBlock } from 'notion-types'
import { getPageTableOfContents, uuidToId } from 'notion-utils'
import * as React from 'react'

import styles from './ResumeToc.module.css'

// a section counts as "current" once its heading crosses this viewport ratio
const ACTIVE_LINE_RATIO = 0.4

interface Section {
  id: string
  label: string
}

function getSections(block: PageBlock, recordMap: ExtendedRecordMap) {
  return getPageTableOfContents(block, recordMap)
    .filter((entry) => entry.type === 'sub_sub_header')
    .map((entry) => ({ id: uuidToId(entry.id), label: entry.text }))
}

function useActiveSection(sections: Section[]) {
  const [activeId, setActiveId] = React.useState<string>()

  React.useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const line = window.innerHeight * ACTIVE_LINE_RATIO
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2

      let current: string | undefined
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }

      setActiveId(atBottom ? sections.at(-1)?.id : current)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [sections])

  return activeId
}

function scrollToSection(event: React.MouseEvent, id: string) {
  const el = document.getElementById(id)
  if (!el) return

  event.preventDefault()
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  history.replaceState(null, '', `#${id}`)
}

export function ResumeToc({
  block,
  recordMap
}: {
  block: PageBlock
  recordMap: ExtendedRecordMap
}) {
  const sections = React.useMemo(
    () => getSections(block, recordMap),
    [block, recordMap]
  )
  const activeId = useActiveSection(sections)

  if (sections.length < 2) return null

  return (
    <nav className={styles.toc} aria-label='目录'>
      {sections.map(({ id, label }, index) => (
        <a
          key={id}
          href={`#${id}`}
          className={cs(styles.item, id === activeId && styles.active)}
          aria-current={id === activeId ? 'location' : undefined}
          onClick={(event) => scrollToSection(event, id)}
        >
          <span className={styles.label}>
            <span className={styles.num}>
              {String(index + 1).padStart(2, '0')}
            </span>
            {label}
          </span>
          <span className={styles.bar} />
        </a>
      ))}
    </nav>
  )
}
