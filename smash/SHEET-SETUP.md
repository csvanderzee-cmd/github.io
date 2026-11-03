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

**Groups of 3, 4 or 5 all work.** A group of three simply uses three match
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
| A team forfeits the game | Winner `0`, forfeiting team `F` (or `f`) |

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

Recognised labels: `Play-In 1`–`4`, `Quarter Final 1`–`4`, `Semi Final 1`–`2`,
`Final`, `Third`, and `Round of 16 1`–`8` if you ever need that many.

**The sheet fills in the team names.** Each division has a Standings tab next to
its Enter tab. When a group has played all its matches, its finishers move to the
play-in and quarter-final slots on the Enter tab, and the winners of each match
move up from there. The page reads those names like any others, so the sheet is
still the authority here.

A tie that needs a playoff leaves its slots empty and shows a message above the
knockout rounds. Enter the result in the yellow Playoff column on the Standings
tab: 1 for the winner, and 2 for the next team if three teams tied. For a referee's
call on the day, type the right team over the slot on the Enter tab. That replaces
the formula in that cell, so that slot no longer updates by itself.

An empty slot shows who belongs there. With four groups and a play-in round, the
pairings are:

| Match | Top slot | Bottom slot |
|---|---|---|
| Play-In 1 | 2nd place Group 3 | 3rd place Group 4 |
| Play-In 2 | 2nd place Group 2 | 3rd place Group 1 |
| Play-In 3 | 2nd place Group 4 | 3rd place Group 3 |
| Play-In 4 | 2nd place Group 1 | 3rd place Group 2 |
| Quarter Final 1 | Winner Group 1 | Winner Play-In 1 |
| Quarter Final 2 | Winner Group 4 | Winner Play-In 2 |
| Quarter Final 3 | Winner Group 2 | Winner Play-In 3 |
| Quarter Final 4 | Winner Group 3 | Winner Play-In 4 |
| Semi Final 1 | Winner Quarter Final 1 | Winner Quarter Final 2 |
| Semi Final 2 | Winner Quarter Final 3 | Winner Quarter Final 4 |

A name in a slot on the sheet always wins. A slot left empty shows `Playoff:` and
the teams while a tie is open. Gold italic names only appear if a formula on the
sheet has been cleared.

Stations appear on every group match and bracket match. Group stations are listed
in `data/smash.js` by the order of the match rows, so keep that order if you edit a
tab. In the play-in and quarter-finals, Station 1 goes to the match with the most
teams that have not been on the big screen. The other stations follow in order, top
down for the play-in and bottom up for the quarter-finals (QF 4 on 1 up to QF 1 on 4).

A group's top two can only meet again in the final. Without a play-in round the
page falls back to the World Cup crossing, when the qualifiers make a clean
bracket.

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
- Tiebreakers, in order: **points → head-to-head → stock differential → one-game playoff**. The page cannot
  see a playoff, so its group table lists a tie that gets that far by games won, then by name.
  The Standings tab holds the playoff result, and the formulas there follow the same order as
  `standings()` and `groupSeat()` in `data/smash-bracket.js`, so change both together
- Who qualifies (top three per group)
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
