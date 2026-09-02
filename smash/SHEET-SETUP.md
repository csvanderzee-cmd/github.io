# Smash tournament — connecting the Google Sheet

The bracket page is **read only**. Everything on it comes from one Google
Sheet, and the page never writes anywhere, so nothing a visitor clicks can
change what anyone else sees. To fix a score, fix the sheet.

All the wiring lives in one file: **`data/smash.js`**.

---

## 1. Build the workbook

Two tabs. Column **order does not matter** and neither does capitalisation —
every column is found by its header text, so you can move things around or add
your own columns without touching the code.

### Tab: `Teams`

| Division | Team | Group | Player 1 | Player 2 | Alternate |
|---|---|---|---|---|---|
| Grade 5 & Under | Shadow Hills Red | A | Ava R. | Marcus T. | Jordan P. |
| Grade 5 & Under | Cactus Blue | A | Sam O. | Priya N. | |
| Grades 6–8 | Sage Silver | A | Omar H. | Zoe T. | |

- **Division** — `Grade 5 & Under` or `Grades 6-8`. Also accepts `G5`,
  `Grade 5 and Under`, `6-8`, `Middle School`, and a few others.
- **Group** — a single letter. This *is* the draw; the page reads group
  membership straight from this column.

### Tab: `Matches`

| Division | Stage | Group | Team A | Team B | Game 1 | Game 2 | Game 3 | Stock 1 | Stock 2 | Stock 3 | Station | Time |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Grade 5 & Under | Group | A | Shadow Hills Red | Cactus Blue | A | B | A | 3 | 2 | 1 | 1 | 9:00 AM |
| Grade 5 & Under | Group | A | Shadow Hills Red | Sage Red | A | A | | 4 | 5 | | 1 | 9:20 AM |
| Grade 5 & Under | SF1 | | | | A | A | | 3 | 2 | | 1 | 11:00 AM |
| Grade 5 & Under | FINAL | | | | B | A | B | 1 | 2 | 3 | 1 | 12:00 PM |

- **Stage** — `Group` for a group match. Otherwise the bracket slot:
  `QF1`–`QF4`, `SF1`, `SF2`, `FINAL`, `THIRD` (or `R16-1`…`R16-8` for sixteen).
- **Team A / Team B** — the two teams, **only on `Group` rows**. Leave them
  blank on bracket rows; the page works out who is in each slot from the group
  tables and the earlier rounds. Names must match the Teams tab exactly.
- **Game 1/2/3** — who won that game: `A`, `B`, or the team's name. Fill these
  in as the games finish. Two wins ends the match and game 3 is ignored.
- **Stock 1/2/3** — optional. The stock the **winner of that game** had left,
  1–6. Only used for the group tiebreaker; blank simply scores 0.
- **Station / Time** — optional, shown under the match on the page.

One row per match. Pre-fill every group pairing and every bracket slot before
the day starts, then the scorekeeper only ever types in the Game columns.

---

## 2. Choose how the page reads it

In `data/smash.js`, set `source`:

### `'gviz'` — recommended for tournament day

Share → General access → **Anyone with the link → Viewer**. Then copy the id
out of the normal sheet URL:

```
docs.google.com/spreadsheets/d/THIS_BIT_HERE/edit
```

into `sheetId`. Scores reach the site within seconds.

The trade-off: anyone with the link can open the workbook read-only. For a
public bracket that is usually fine — and often useful.

### `'published'` — if the workbook must stay private

File → Share → **Publish to web** → CSV. Paste the long `2PACX-...` id into
`publishId`. The workbook stays private, but Google caches the published CSV,
so a score can take a few minutes to appear. Fine for standings after the
fact, frustrating for a bracket people are watching in the room.

---

## 3. Paste the tab gids

Open each tab and read the number off the end of the URL after `#gid=`:

```js
tabs: {
  teams:   '0',
  matches: '123456789'
}
```

That is the whole setup. The page re-reads the sheet every 30 seconds
(`refreshSeconds`) and catches up immediately whenever someone brings the tab
back to the front.

---

## What the page does on its own

You do not enter any of this — it is computed from the games above, so the
tables and the bracket can never drift out of step with the recorded results:

- Group points (win = 3, loss = 0), games won/lost, stock differential
- Tiebreakers: points → head-to-head → stock differential → games won
- Who qualifies (top two per group)
- Bracket pairings, using the World Cup crossing when there are 2, 4 or 8
  groups, so the two teams out of any one group can only meet again in the
  final
- Byes, when the group count does not divide into a clean bracket
- The third-place match, from the two beaten semi-finalists

## If something looks wrong

An amber strip appears above the group stage naming any row the page could not
read — most often a team name in `Matches` that does not match the `Teams` tab,
or an unrecognised division. Those rows are not counted, so the strip is
telling you the standings are incomplete until you fix the cell it names.

If the sheet becomes unreachable mid-event, the page keeps the last good
bracket on screen and the status dot turns amber with "Reconnecting" rather
than blanking out.
