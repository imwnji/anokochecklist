import { useEffect, useState } from 'react'

const timeFmt = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

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
        {dateFmt.format(now)}
      </time>
    </div>
  )
}
