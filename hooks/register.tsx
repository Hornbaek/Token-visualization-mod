import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { SessionTokens, WeekWindow } from '../types'

const empty: SessionTokens = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 }

const tokens = atom({ plugin: 'usage-band', key: 'tokens' } as const, empty)
const week = atom({ plugin: 'usage-band', key: 'week' } as const, null)

const BAR_WIDTH = 12

const toWeek = (limits: SessionRateLimit[]): WeekWindow | null => {
  const found = limits.find(limit => limit.kind === 'seven_day')

  return found ? { percentUsed: found.percentUsed, resetsAt: found.resetsAt } : null
}

const compact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`

  return String(n)
}

const bar = (percent: number): string => {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * BAR_WIDTH)

  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
}

const toneFor = (percentUsed: number) =>
  percentUsed >= 90 ? 'red' : percentUsed >= 70 ? 'yellow' : 'green'

const resetsIn = (resetsAt: string | undefined, now: number): string => {
  if (!resetsAt) return ''

  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms) || ms <= 0) return ''

  const hours = Math.floor(ms / 3_600_000)
  const label = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`

  return ` · resets in ${label}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    await update($, week, () => toWeek(usage.rateLimits))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, week, () => toWeek(e.rateLimits))
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const usage = e.usage

    if (usage) {
      await update($, tokens, t => ({
        input: t.input + usage.input_tokens,
        output: t.output + usage.output_tokens,
        cacheWrite: t.cacheWrite + usage.cache_creation_input_tokens,
        cacheRead: t.cacheRead + usage.cache_read_input_tokens
      }))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const [t, w, now] = await Promise.all([read($, tokens), read($, week), $.clock.now()])
    const { Box, Text } = $.ui.resolve(e)

    const sessionTotal = t.input + t.output + t.cacheWrite

    return (
      <Box>
        <Text dimColor>Week </Text>
        {w ? (
          <Text color={toneFor(w.percentUsed)}>
            {bar(100 - w.percentUsed)} {Math.round(100 - w.percentUsed)}% left
          </Text>
        ) : (
          <Text dimColor>n/a</Text>
        )}
        <Text dimColor>{w ? resetsIn(w.resetsAt, now) : ''}</Text>
        <Text dimColor>{'  │  '}Session </Text>
        <Text>{compact(sessionTotal)} tokens</Text>
        <Text dimColor>
          {' '}({compact(t.input + t.cacheWrite)} in · {compact(t.output)} out · {compact(t.cacheRead)} cached)
        </Text>
      </Box>
    )
  })
}
