# Smash tournament — the scoring sheet

The bracket pages are **read only**. Everything on them comes from one Google
Sheet, and the pages never write anywhere, so nothing a visitor clicks can
change what anyone else sees. To fix a score, fix the sheet.

- **One tab per division.** Grade 5 & Under and Grades 6–8 are drawn
  separately, so they can have different numbers of teams, different numbers
  of groups, even different bracket depths.
- All the wiring lives in one file: **`data/smash.js`**.

---

## The layout

Nothing in the code depends on a fixed row or column number — they move the
moment a group has three teams instead of four. Everything is found by
landmarks, so you can add rows, insert spacers and move blocks around freely.

The three landmarks that matter:

1. **Row 1** holds the group names, with that group's teams listed underneath.
2. **`Round Robin Matches`** starts the group section.
3. **`Elimination Matches`** starts the bracket section.

Inside each section, a header row carries **`R1` / `R2` / `R3`** markers. Every
`R1` marks a *band*: team names sit in the column immediately to its **left**,
and that game's stock in the three columns from `R1` rightwards.

```
        A          B     C     D        E          F     G     H
  1  | Group 1  |                   | Group 2  |
  2  | A        |                   | E        |
  3  | B        |                   | F        |
  4  | C        |                   | G        |
  5  | D        |                   | H        |
  6  | Round Robin Matches
  7  |          | R1  | R2  | R3  |            | R1  | R2  | R3
  8  | A        |  2  |  2  |     | E          |  1  |  0  |  3
  9  | B        |  0  |  0  |     | F          |  0  |  2  |  0
 10  | C        |     |     |     | G          |
 11  | D        |     |     |     | H          |
```

Two rows = one match. Add as many group bands across the page as you have
groups; add rows down as you have matches.

**Groups of 3 or 4 both work.** A group of three simply uses three match
pairs and leaves the rest of its column blank.

---

## What goes in the R1 / R2 / R3 cells

**Each team's remaining stock for that game, on that team's own row.** The
higher number wins the game. Leave both blank for a game that has not been
played — a best-of-three that finishes 2–0 never needs `R3`.

```
        R1   R2   R3
  A  |  4  |  0  |  2      A won games 1 and 3, so A wins the match 2–1
  B  |  0  |  3  |  0
```

Recording it per team rather than "winner's stock" is deliberate: it is the
only way a timed-out game, where **both** sides still have stock, comes out
with the right margin.

### When stock does not decide the game

| At the end of a game | Record |
|---|---|
| Someone's stock ran out | Winner's remaining stock, loser `0` |
| Timer ran out, **unequal** stock | Both teams' actual stock — e.g. `4` and `3` |
| Timer ran out, **equal** stock → Sudden Death | `1` and `0` |

In one sentence: **if stock did not decide it, write 1 and 0.**

Sudden Death is the console's own tiebreak — at TIME with the stock level, the
game puts the surviving fighters on one stock at 300% and the next KO settles
it. Whoever wins that gets the `1`. Do not carry the pre-Sudden-Death stock
over; the game was dead level, and `1` credits the winner the smallest amount
the differential can register, which is exactly what a coin-flip finish
deserves.

If you enter the **same non-zero number on both rows**, the page cannot tell
who won and will say so in the amber strip rather than guess.

---

## The elimination section

Same shape: a label row carrying `R1 / R2 / R3`, then two rows underneath for
the teams.

```
      A                  B     C     D
 21 | Quarter Final 1 | R1  | R2  | R3
 22 | A               |  2  |  0  |  2
 23 | F               |  0  |  3  |  0
```

Recognised labels: `Quarter Final 1`–`4`, `Semi Final 1`–`2`, `Final`,
`Third`, and `Round of 16 1`–`8` if you ever need that many.

**Type the team names in yourself** as each round is decided. The page does
*not* seed the bracket for you — a referee's call on the day, a forfeit or a
no-show beats anything computed, so the sheet is the authority here.

To help, an empty first-round slot shows who the group tables say belongs
there (`Winner Group 1`, `Runner-up Group 2`) using the World Cup crossing:
each group winner against the runner-up of its partner group, with the two
teams out of any one group in opposite halves so they can only meet again in
the final. That hint only appears when the group count divides into a clean
bracket — with 2, 4 or 8 groups. At any other count the seeding is your call.

---

## Connecting a tab

1. Share the workbook: **Share → General access → Anyone with the link →
   Viewer**. Copy the id out of the normal sheet URL:
   `docs.google.com/spreadsheets/d/`**`THIS_BIT`**`/edit`
2. Open each division's tab and read the number off the end of the URL after
   `#gid=`.
3. Put both into `data/smash.js`:

```js
divisions: [
  { id: 'jr', name: 'Grade 5 & Under', page: 'grade-5-under.html', gid: '0' },
  { id: 'sr', name: 'Grades 6–8',      page: 'grades-6-8.html',    gid: '86502539' }
]
```

The pages re-read the sheet every 30 seconds and catch up immediately when
someone brings the tab back to the front.

---

## What the pages work out for themselves

You never enter any of this — it is computed from the games above, so the
tables can never drift out of step with what was actually played:

- Points (win = 3, loss = 0), games won and lost, stock differential
- Tiebreakers, in order: **points → head-to-head → stock differential → games won**
- Who qualifies (top two per group)
- Which rounds the bracket has, and who has won each match

---

## If something looks wrong

An amber strip appears above the group stage naming anything the page could
not read. The usual causes:

- a team name in the match rows that is not in the list at the top of its group
- the same non-zero stock on both rows of a game
- an odd number of team rows in a band, leaving one without an opponent

Those rows are **not counted**, so the strip is telling you the standings are
incomplete until you fix the cell it names.

If the sheet becomes unreachable mid-event, the page keeps the last good
bracket on screen and the status dot turns amber with "Reconnecting" rather
than blanking out.
