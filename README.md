# usage-band

A Claude Code mod that draws a small band just above the chat input showing:

- **Week**: a bar with the share of your weekly (7-day) usage limit that is left, and when it resets.
- **Session**: tokens used in the current session, split into in, out and cached.

```
Week ████████░░░░ 63% left · resets in 2d 4h  │  Session 48.2k tokens (40.1k in · 8.1k out · 1.2M cached)
```

Claude Code reports the weekly limit only as a percentage, so the band shows what is left as a percentage, not as a token count. It shows `n/a` where the account reports no weekly limit. The session total is input plus output plus cache writes; cache reads are listed separately. The band is drawn on the terminal and desktop surfaces.

## Install

At the prompt of a terminal session:

```
/plugin install usage-band --marketplace Hornbaek/Token-visualization-mod
```

From a shell:

```
claude plugin install usage-band --marketplace Hornbaek/Token-visualization-mod
```

Answer `y` to add the marketplace, then pick a scope. The band appears right away in that session.
