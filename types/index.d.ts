export type SessionTokens = {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

export type WeekWindow = { percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': {
      tokens: SessionTokens
      week: WeekWindow | null
    }
  }
}
