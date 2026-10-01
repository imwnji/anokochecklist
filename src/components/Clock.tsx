import { useEffect, useState } from 'react'

// "8:57 PM"
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
// "10月 1日 木曜日"
const WEEKDAYS = '日月火水木金土'
const formatDate = (d: Date) => `${d.getMonth() + 1}月 ${d.getDate()}日 ${WEEKDAYS[d.getDay()]}曜日`

const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Current time (left) and date (right), shown above the sticker sheet in the app font. */
export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    // tick on each new minute
    let id = 0
    const schedule = () => {
      id = window.setTimeout(
        () => {
          setNow(new Date())
          schedule()
        },
        60_000 - (Date.now() % 60_000) + 50,
      )
    }
    schedule()
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="flex items-baseline justify-between px-3 text-ink">
      <time dateTime={now.toISOString()} className="text-2xl">
        {timeFmt.format(now)}
      </time>
      <time dateTime={localDate(now)} className="text-xl text-ink-soft">
        {formatDate(now)}
      </time>
    </div>
  )
}
