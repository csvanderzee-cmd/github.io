/* ==========================================================================
   PSD Esports — achievement badges. ONE definition, three consumers.

   rocket-league/badges.html          renders the guide from `defs`
   rocket-league/promise-league-stats.html
   rocket-league/jr-promise-league-stats.html
                                      award badges via `award()`

   Until this file existed the guide scaled its thresholds from its own GAMES
   constant while both stats pages hardcoded theirs, and the three had drifted:
   the guide advertised a "4 Goals" and "12 Wins" badge nobody could earn, the
   pages awarded a "50 Goals" and "15 Wins" the guide never mentioned, and
   "Summit" was documented but never granted. Names and thresholds now both
   come from the table below, so they cannot disagree again.

   ---- CHANGING THE SEASON LENGTH -----------------------------------------

   Set GAMES to the number of games a typical player will actually play, then
   commit. Every threshold and every badge name follows automatically.

   Working it out: each match is a best-of-3, so a player gets 2 games when
   their series is swept and 3 when it goes the distance — call it 2.5 on
   average. Multiply by the number of weeks that player's division plays, then
   allow for a missed week or two.

       2026-27  Late Release   9 series          ~22 games
                Early Release  8 series (1 bye)  ~20 games
                allowing for absences            -> GAMES = 18

   The two divisions differ by one week, and they share one badge set, so this
   is deliberately set nearer the shorter division: a threshold Late Release
   reaches slightly early is much better than one that nine of the thirteen
   schools cannot reach at all.
   ========================================================================== */

(function (root) {
  'use strict';

  var GAMES = 18;
  var BASE  = 15;   // season the bases below were written against — do not edit

  /* ---- scaling ------------------------------------------------------------
     Counting stats scale with the season. Single-game feats (Hat Trick) and
     rate stats (Sharpshooter) do not — a 3-goal game is a 3-goal game in any
     season — so those are written as plain numbers further down. */

  function sc(base) { return base * GAMES / BASE; }

  function rScore(base) { return Math.max(500, Math.round(sc(base) / 500) * 500); }
  function rGoals(base) { var v = sc(base); return v < 10 ? Math.max(1, Math.round(v)) : Math.max(5, Math.round(v / 5) * 5); }
  function rShots(base) { var v = sc(base); return v < 15 ? Math.max(5, Math.round(v)) : Math.max(5, Math.round(v / 5) * 5); }
  function rSmall(base, min) { return Math.max(min, Math.round(sc(base))); }

  /** 9500 -> "9.5K", 900 -> "900". Keeps badge names short. */
  function fs(v) {
    if (v >= 1000) { var k = v / 1000; return (k % 1 === 0) ? k + 'K' : k.toFixed(1) + 'K'; }
    return String(v);
  }

  /* ---- the thresholds ----------------------------------------------------
     Every ladder runs highest tier first. Only the highest tier a player has
     reached is awarded, so these must stay in descending order. */

  var T = {
    goals:   [45, 35, 25, 17, 10, 5].map(rGoals),            // 55 40 30 20 10 6
    score:   [9000, 7000, 5500, 4000, 2500, 1500, 750].map(rScore),
    shots:   [70, 55, 35, 20, 10].map(rShots),               // 85 65 40 25 12
    saves:   [rSmall(18, 5), rSmall(12, 3), rSmall(7, 2)],   // 22 14 8
    assists: [rSmall(20, 6), rSmall(12, 3), rSmall(7, 2)],   // 24 14 8

    /* Wins deliberately do NOT scale. A win is capped by games played, so
       scaling this ladder with the season pushes the top tier towards a
       perfect record — at BASE it already sat at 15 wins in a 15-game season,
       which was unreachable. Held at 15/10/5, a longer season makes these
       properly earnable instead: 15 of ~20 games is a strong year, not a
       flawless one. */
    wins: [15, 10, 5],

    winStreak:    [rSmall(7, 5), rSmall(5, 4), rSmall(3, 3)],  // 8 6 4
    scorerStreak: [rSmall(5, 3), rSmall(3, 3)],                // 6 4

    tripleThreat: rSmall(5, 2),   // 6
    neverQuit:    rSmall(8, 4),   // 10
    flawlessWins: rSmall(4, 3),   // 5

    /* Fixed — single-game feats and rates, unaffected by season length. */
    fixed: {
      gameGoalsHigh: 5,  gameGoalsMid: 3,
      gameScore: [1000, 800, 600, 400, 250],
      gameSaves: 5,
      sniperMinShots: 20,
      perfectAimMinShots: 3, accuracyMinShots: 5,
      accuracyLaser: 70, accuracySharp: 50,
      avgScore: 350, avgGoals: 2, avgAssists: 1.5
    }
  };

  /* Names are built from T so the guide and the awarding code always agree. */
  var NAME = {
    goals:        function (i) { return T.goals[i] + ' Goals'; },
    score:        function (i) { return fs(T.score[i]) + ' Score'; },
    shots:        function (i) { return T.shots[i] + ' Shots'; },
    saves:        function (i) { return T.saves[i] + ' Saves'; },
    assists:      function (i) { return T.assists[i] + ' Assists'; },
    wins:         function (i) { return T.wins[i] + ' Wins'; },
    winStreak:    function (i) { return 'W' + T.winStreak[i] + ' Streak'; },
    scorerStreak: function (i) { return T.scorerStreak[i] + '-Game Scorer'; }
  };

  /* ---- guide metadata ---------------------------------------------------- */

  var TIER_ORDER = ['unique', 'legendary', 'epic', 'rare', 'uncommon', 'common', 'special'];
  var TIER_META  = {
    unique:    { icon: '💠', label: 'Unique' },
    legendary: { icon: '🏅', label: 'Legendary' },
    epic:      { icon: '⚡', label: 'Epic' },
    rare:      { icon: '🔥', label: 'Rare' },
    uncommon:  { icon: '✨', label: 'Uncommon' },
    common:    { icon: '🌱', label: 'Common' },
    special:   { icon: '🎖️', label: 'Special' }
  };

  var DEFS = [
    /* ══ UNIQUE ══ only ONE player holds each, and only outright ══ */
    { tier:'unique', emoji:'🔥', name:'On Fire',               desc:'Best single-game score in the entire league. Someone is always one great match away from stealing it.', pill:'top single-game score · entire league' },
    { tier:'unique', emoji:'👑', name:'Champion',              desc:'Most wins in the entire league. Hold it until the final whistle.', pill:'most wins · entire league' },
    { tier:'unique', emoji:'🏆', name:'Top Scorer',            desc:'Highest total season score in the entire league. The leaderboard throne.', pill:'highest season score · entire league' },
    { tier:'unique', emoji:'🥇', name:'Golden Boot',           desc:'Most goals in the entire league. Someone is always one game away from taking it.', pill:'most goals · entire league' },
    { tier:'unique', emoji:'🧤', name:'Golden Glove',          desc:'Most saves in the entire league. The throne is yours — until it isn\'t.', pill:'most saves · entire league' },
    { tier:'unique', emoji:'🎭', name:'Playmaker of the Year', desc:'Most assists in the entire league. Every week someone is trying to steal your crown.', pill:'most assists · entire league' },
    { tier:'unique', emoji:'💥', name:'Trigger Happy',         desc:'Most shots taken in the entire league. Keep pulling the trigger — someone\'s closing in.', pill:'most shots · entire league' },
    { tier:'unique', emoji:'🏹', name:'Sniper',                desc:'Best shooting percentage in the league (min ' + T.fixed.sniperMinShots + ' shots). Efficiency is the hardest crown to keep.', pill:'best SH% · ' + T.fixed.sniperMinShots + '+ shots · entire league' },

    /* ══ LEGENDARY ══ */
    { tier:'legendary', emoji:'🌊', name:'Tsunami',          desc:'Won ' + T.winStreak[0] + ' games in a row. The rarest streak badge — nearly unbeatable.', pill:T.winStreak[0] + '-game win streak' },
    { tier:'legendary', emoji:'🌠', name:NAME.goals(0),      desc:T.goals[0] + ' total goals scored this season. An elite finisher.', pill:T.goals[0] + ' season goals' },
    { tier:'legendary', emoji:'🎆', name:NAME.score(0),      desc:T.score[0].toLocaleString() + '+ total points this season. The ultimate stretch goal.', pill:T.score[0].toLocaleString() + '+ season pts' },
    { tier:'legendary', emoji:'💥', name:'Legendary',        desc:T.fixed.gameScore[0] + '+ points in a single game. An all-time performance.', pill:T.fixed.gameScore[0] + '+ pts · 1 game' },

    /* ══ EPIC ══ */
    { tier:'epic', emoji:'🌋', name:'Tidal Wave',    desc:'Scored ' + T.fixed.gameGoalsHigh + ' or more goals in a single game. Unstoppable.', pill:T.fixed.gameGoalsHigh + '+ goals · 1 game' },
    { tier:'epic', emoji:'🌟', name:'Superstar',     desc:T.fixed.gameScore[1] + '+ points in a single game. A dominant showing.', pill:T.fixed.gameScore[1] + '+ pts · 1 game' },
    { tier:'epic', emoji:'⚡', name:NAME.winStreak(1), desc:'Won ' + T.winStreak[1] + ' games in a row. On an incredible run.', pill:T.winStreak[1] + '-game win streak' },
    { tier:'epic', emoji:'👑', name:NAME.wins(0),    desc:T.wins[0] + ' match wins this season. A dominant competitor.', pill:T.wins[0] + ' season wins' },
    { tier:'epic', emoji:'💰', name:NAME.score(1),   desc:T.score[1].toLocaleString() + '+ total points. A massive scoring season.', pill:T.score[1].toLocaleString() + '+ season pts' },
    { tier:'epic', emoji:'☄️', name:NAME.goals(1),   desc:T.goals[1] + ' total goals this season. A true goal-scorer.', pill:T.goals[1] + ' season goals' },
    { tier:'epic', emoji:'🎱', name:'Perfect Aim',   desc:'100% shooting accuracy with at least ' + T.fixed.perfectAimMinShots + ' shots. Never missed.', pill:'100% SH% · ' + T.fixed.perfectAimMinShots + '+ shots' },
    { tier:'epic', emoji:'🎯', name:'Laser',         desc:T.fixed.accuracyLaser + '%+ shooting accuracy with at least ' + T.fixed.accuracyMinShots + ' shots on goal.', pill:T.fixed.accuracyLaser + '%+ SH% · ' + T.fixed.accuracyMinShots + '+ shots' },
    { tier:'epic', emoji:'🔱', name:NAME.score(2),   desc:T.score[2].toLocaleString() + '+ total points. Consistently dominant.', pill:T.score[2].toLocaleString() + '+ season pts' },
    { tier:'epic', emoji:'🌪️', name:NAME.shots(0),  desc:T.shots[0] + ' total shots this season. Always creating chances.', pill:T.shots[0] + ' season shots' },

    /* ══ RARE ══ */
    { tier:'rare', emoji:'🎸', name:'Rock Star',       desc:T.fixed.gameScore[2] + '+ points in a single game. An explosive performance.', pill:T.fixed.gameScore[2] + '+ pts · 1 game' },
    { tier:'rare', emoji:'🔥', name:NAME.winStreak(2), desc:'Won ' + T.winStreak[2] + ' games in a row. Building serious momentum.', pill:T.winStreak[2] + '-game win streak' },
    { tier:'rare', emoji:'🏆', name:NAME.wins(1),      desc:T.wins[1] + ' match wins this season. A proven winner.', pill:T.wins[1] + ' season wins' },
    { tier:'rare', emoji:'🚀', name:'Rocket',          desc:'Averaging ' + T.fixed.avgScore + '+ score per game. Lights out every match.', pill:'avg ' + T.fixed.avgScore + '+ score/game' },
    { tier:'rare', emoji:'🗿', name:NAME.saves(0),     desc:T.saves[0] + ' total saves this season. An immovable wall in goal.', pill:T.saves[0] + ' season saves' },
    { tier:'rare', emoji:'🎭', name:NAME.assists(0),   desc:T.assists[0] + ' total assists this season. The ultimate team player.', pill:T.assists[0] + ' season assists' },
    { tier:'rare', emoji:'🌟', name:NAME.score(3),     desc:T.score[3].toLocaleString() + '+ total points. A strong scorer all year.', pill:T.score[3].toLocaleString() + '+ season pts' },
    { tier:'rare', emoji:'🏰', name:'Fortress',        desc:T.fixed.gameSaves + '+ saves in a single game. An unbreakable defense.', pill:T.fixed.gameSaves + '+ saves · 1 game' },
    { tier:'rare', emoji:'🥅', name:'Finisher',        desc:'Averaging ' + T.fixed.avgGoals + '+ goals per game. Deadly in front of net.', pill:'avg ' + T.fixed.avgGoals + '+ goals/game' },
    { tier:'rare', emoji:'🎪', name:'Playmaker',       desc:'Averaging ' + T.fixed.avgAssists + '+ assists per game. Always setting up teammates.', pill:'avg ' + T.fixed.avgAssists + '+ assists/game' },
    { tier:'rare', emoji:'🌈', name:'Triple Threat',   desc:T.tripleThreat + '+ goals, ' + T.tripleThreat + '+ assists, AND ' + T.tripleThreat + '+ saves this season. Does it all.', pill:T.tripleThreat + '+ goals, assists & saves' },
    { tier:'rare', emoji:'💪', name:'Iron Man',        desc:'Played every week your school had a match. Never missed one.', pill:'played every match week' },
    { tier:'rare', emoji:'💥', name:NAME.goals(2),     desc:T.goals[2] + ' total goals this season. A prolific scorer.', pill:T.goals[2] + ' season goals' },
    { tier:'rare', emoji:'🔫', name:NAME.shots(1),     desc:T.shots[1] + ' total shots this season. Relentless on offense.', pill:T.shots[1] + ' season shots' },
    { tier:'rare', emoji:'🎯', name:NAME.scorerStreak(0), desc:'Scored at least 1 goal in ' + T.scorerStreak[0] + ' consecutive games. Impossible to shut down.', pill:'goal in ' + T.scorerStreak[0] + ' straight games' },
    { tier:'rare', emoji:'🔁', name:'Comeback Kid',    desc:'Lost 3 or more in a row, then won 3 or more in a row. Never counted out.', pill:'lost 3+ then won 3+ straight' },
    { tier:'rare', emoji:'⚖️', name:'All-Around',      desc:'Finished top half of the league in goals, assists, saves, AND shots. The complete player.', pill:'top half in all 4 stats' },
    { tier:'rare', emoji:'🗓️', name:'Seasoned Veteran',desc:'Played every week your school had a match AND finished with a winning record.', pill:'every match week · winning record' },
    { tier:'rare', emoji:'📉', name:'Bounced Back',    desc:'Followed your season-low score game with your season-high score game. Mental toughness.', pill:'worst game → best game' },

    /* ══ UNCOMMON ══ */
    { tier:'uncommon', emoji:'🎮', name:'Breakout',       desc:T.fixed.gameScore[3] + '+ points in a single game. A standout match.', pill:T.fixed.gameScore[3] + '+ pts · 1 game' },
    { tier:'uncommon', emoji:'🎩', name:'Hat Trick',      desc:'Scored ' + T.fixed.gameGoalsMid + '+ goals in a single game. A big moment.', pill:T.fixed.gameGoalsMid + '+ goals · 1 game' },
    { tier:'uncommon', emoji:'🎯', name:'Sharpshooter',   desc:T.fixed.accuracySharp + '%+ shooting accuracy with at least ' + T.fixed.accuracyMinShots + ' shots. Efficient and dangerous.', pill:T.fixed.accuracySharp + '%+ SH% · ' + T.fixed.accuracyMinShots + '+ shots' },
    { tier:'uncommon', emoji:'🧱', name:NAME.saves(1),    desc:T.saves[1] + ' total saves this season. A reliable last line of defense.', pill:T.saves[1] + ' season saves' },
    { tier:'uncommon', emoji:'🍎', name:NAME.assists(1),  desc:T.assists[1] + ' total assists this season. A great teammate and creator.', pill:T.assists[1] + ' season assists' },
    { tier:'uncommon', emoji:'💫', name:NAME.goals(3),    desc:T.goals[3] + ' total goals this season. Consistent in front of net.', pill:T.goals[3] + ' season goals' },
    { tier:'uncommon', emoji:'⭐', name:NAME.score(4),    desc:T.score[4].toLocaleString() + '+ total points. A solid overall performer.', pill:T.score[4].toLocaleString() + '+ season pts' },
    { tier:'uncommon', emoji:'🥇', name:NAME.wins(2),     desc:T.wins[2] + ' match wins this season. Winning more than losing.', pill:T.wins[2] + ' season wins' },
    { tier:'uncommon', emoji:'💨', name:NAME.shots(2),    desc:T.shots[2] + ' total shots this season. Keeping goalkeepers busy.', pill:T.shots[2] + ' season shots' },
    { tier:'uncommon', emoji:'✨', name:NAME.score(5),    desc:T.score[5].toLocaleString() + '+ total points. Contributing all season.', pill:T.score[5].toLocaleString() + '+ season pts' },
    { tier:'uncommon', emoji:'🎯', name:NAME.scorerStreak(1), desc:'Scored at least 1 goal in ' + T.scorerStreak[1] + ' consecutive games. Finding the net regularly.', pill:'goal in ' + T.scorerStreak[1] + ' straight games' },
    { tier:'uncommon', emoji:'⚡', name:'Balanced',       desc:'Had at least 1 goal, 1 assist, AND 1 save in a single game. The complete performance.', pill:'1+ goal, assist & save · 1 game' },
    { tier:'uncommon', emoji:'🌅', name:'Hot Start',      desc:'Won your first 3 games of the season. Came out firing.', pill:'won first 3 games' },
    { tier:'uncommon', emoji:'🏁', name:'Closer',         desc:'Won your last 3 games of the season. Finished strong.', pill:'won last 3 games' },
    { tier:'uncommon', emoji:'🏔️', name:'Summit',         desc:'Highest single-game score on your team all season. The peak performer.', pill:'top score on team · 1 game' },
    { tier:'uncommon', emoji:'🤝', name:'Team First',     desc:'More assists than goals scored this season. Always thinking about teammates.', pill:'season assists > season goals' },
    { tier:'uncommon', emoji:'🧱', name:'The Wall',       desc:'More saves than goals scored this season. Defense is your superpower.', pill:'season saves > season goals' },

    /* ══ COMMON ══ */
    { tier:'common', emoji:'⭐', name:'Solid Game',   desc:T.fixed.gameScore[4] + '+ points in a single game. A strong showing.', pill:T.fixed.gameScore[4] + '+ pts · 1 game' },
    { tier:'common', emoji:'🛡️', name:NAME.saves(2),  desc:T.saves[2] + ' total saves this season. Protecting the goal all season.', pill:T.saves[2] + ' season saves' },
    { tier:'common', emoji:'🤝', name:NAME.assists(2),desc:T.assists[2] + ' total assists. Helping the team score.', pill:T.assists[2] + ' season assists' },
    { tier:'common', emoji:'⚽', name:NAME.goals(4),  desc:T.goals[4] + ' total goals. Getting on the scoresheet regularly.', pill:T.goals[4] + ' season goals' },
    { tier:'common', emoji:'⚽', name:NAME.goals(5),  desc:T.goals[5] + ' total goals. Making an impact in attack.', pill:T.goals[5] + ' season goals' },
    { tier:'common', emoji:'💡', name:NAME.score(6),  desc:T.score[6].toLocaleString() + '+ total points. Contributing all year.', pill:T.score[6].toLocaleString() + '+ season pts' },
    { tier:'common', emoji:'💨', name:NAME.shots(3),  desc:T.shots[3] + ' total shots this season. Always taking chances.', pill:T.shots[3] + ' season shots' },
    { tier:'common', emoji:'🎰', name:NAME.shots(4),  desc:T.shots[4] + ' total shots. Getting involved in the offense.', pill:T.shots[4] + ' season shots' },
    { tier:'common', emoji:'🎮', name:'First Win',    desc:'Recorded your first ever league win. Every legend starts somewhere.', pill:'first league win' },

    /* ══ SPECIAL ══ */
    { tier:'special', emoji:'😤', name:'Never Quit',    desc:'Kept competing through ' + T.neverQuit + ' or more losses. That takes real heart.', pill:T.neverQuit + '+ losses · kept going' },
    { tier:'special', emoji:'💎', name:'Flawless',      desc:'Zero losses this season with at least ' + T.flawlessWins + ' wins. A perfect season story.', pill:'0 losses · ' + T.flawlessWins + '+ wins' },
    { tier:'special', emoji:'📈', name:'Most Improved', desc:'Higher average score in the second half of the season than the first. Put in the work.', pill:'better avg score 2nd half' },
    { tier:'special', emoji:'🐢', name:'Slow Burn',     desc:'Below .500 at the halfway point but finished with a winning record. Nobody saw it coming.', pill:'sub .500 at half · winning finish' }
  ];

  /* ---- awarding ---------------------------------------------------------- */

  var GOLD = '#ffd700';
  function num(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function weekOf(g) { var m = String(g['Week'] || '').match(/\d+/); return m ? parseInt(m[0], 10) : 0; }
  function played(p) { return p.games.filter(function (g) { return !g.__forfeit; }); }
  function maxOf(games, field) { return games.reduce(function (m, g) { return Math.max(m, num(g[field])); }, 0); }

  /**
   * Badges a player has earned.
   *
   * @param player      one aggregated player
   * @param allPlayers  every player in the division — needed for the unique
   *                    badges and for All-Around's top-half ranking
   * @param opts.lastCompletedWeek  used by the attendance badges
   */
  function award(player, allPlayers, opts) {
    var b = [];
    var all = allPlayers || [];
    var o = opts || {};
    var mine = played(player);

    /* ── UNIQUE: league-wide, and only the SOLE leader earns it ─────────── */
    if (all.length) {
      var sole = function (vals, v) { return v > 0 && vals.filter(function (x) { return x >= v; }).length === 1; };
      var best = function (p) { return maxOf(played(p), 'Score'); };
      var uq = function (icon, label, tip) { b.push({ icon:icon, label:label, color:GOLD, pri:20, unique:true, tip:tip }); };

      if (sole(all.map(best), best(player)))                       uq('🔥','On Fire','Best single-game score in the entire league');
      if (sole(all.map(function(p){return p.wins;}),    player.wins))    uq('👑','Champion','Most wins in the entire league');
      if (sole(all.map(function(p){return p.score;}),   player.score))   uq('🏆','Top Scorer','Highest total season score in the entire league');
      if (sole(all.map(function(p){return p.goals;}),   player.goals))   uq('🥇','Golden Boot','Most goals in the entire league');
      if (sole(all.map(function(p){return p.saves;}),   player.saves))   uq('🧤','Golden Glove','Most saves in the entire league');
      if (sole(all.map(function(p){return p.assists;}), player.assists)) uq('🎭','Playmaker of the Year','Most assists in the entire league');
      if (sole(all.map(function(p){return p.shots;}),   player.shots))   uq('💥','Trigger Happy','Most shots in the entire league');

      var min = T.fixed.sniperMinShots;
      var eligible = all.filter(function (p) { return p.shots >= min; });
      if (eligible.length && player.shots >= min &&
          sole(eligible.map(function (p) { return p.shootingPercentage; }), player.shootingPercentage))
        uq('🏹','Sniper','Best shooting % in the league (min ' + min + ' shots, sole leader)');
    }

    /* ── WIN / LOSS SEQUENCE ────────────────────────────────────────────── */
    var wlSeq = player.games
      .filter(function (g) { return ['W','L'].indexOf(String(g['Win/Lose']||'').toUpperCase()) !== -1; })
      .sort(function (a, c) { return weekOf(a) - weekOf(c); })
      .map(function (g) { return String(g['Win/Lose']).toUpperCase(); });

    var streak = 0;
    for (var i = wlSeq.length - 1; i >= 0; i--) { if (wlSeq[i] === 'W') streak++; else break; }
    if      (streak >= T.winStreak[0]) b.push({ icon:'🌊', label:'Tsunami',            color:'#4DABF7', pri:15, tip:'Won ' + T.winStreak[0] + ' games in a row' });
    else if (streak >= T.winStreak[1]) b.push({ icon:'⚡', label:NAME.winStreak(1),    color:'#FFD166', pri:9,  tip:'Won ' + T.winStreak[1] + ' games in a row' });
    else if (streak >= T.winStreak[2]) b.push({ icon:'🔥', label:NAME.winStreak(2),    color:'#FF6B6B', pri:6,  tip:'Won ' + T.winStreak[2] + ' games in a row' });

    for (var s = 0; s < wlSeq.length; s++) {
      var lRun = 0, j = s;
      while (j < wlSeq.length && wlSeq[j] === 'L') { lRun++; j++; }
      if (lRun >= 3) {
        var wRun = 0;
        while (j < wlSeq.length && wlSeq[j] === 'W') { wRun++; j++; }
        if (wRun >= 3) { b.push({ icon:'🔁', label:'Comeback Kid', color:'#FF6B6B', pri:8, tip:'Lost 3+ in a row then won 3+ in a row' }); break; }
      }
    }

    if (wlSeq.length >= 3 && wlSeq[0] === 'W' && wlSeq[1] === 'W' && wlSeq[2] === 'W')
      b.push({ icon:'🌅', label:'Hot Start', color:'#FFD166', pri:6, tip:'Won your first 3 games of the season' });
    if (wlSeq.length >= 3 && wlSeq.slice(-3).every(function (r) { return r === 'W'; }))
      b.push({ icon:'🏁', label:'Closer', color:'#FFD166', pri:6, tip:'Won your last 3 games of the season' });

    if (player.losses === 0 && player.wins >= T.flawlessWins)
      b.push({ icon:'💎', label:'Flawless', color:'#4DABF7', pri:11, tip:'Zero losses this season' });

    /* ── SINGLE-GAME HIGHS ──────────────────────────────────────────────── */
    var mG = maxOf(mine, 'Goals'), mSv = maxOf(mine, 'Saves'), mSc = maxOf(mine, 'Score');
    var F = T.fixed;

    if      (mG >= F.gameGoalsHigh) b.push({ icon:'🌋', label:'Tidal Wave', color:'#FF6B6B', pri:10, tip:'Scored ' + F.gameGoalsHigh + '+ goals in a single game' });
    else if (mG >= F.gameGoalsMid)  b.push({ icon:'🎩', label:'Hat Trick',  color:'#FFD166', pri:6,  tip:'Scored ' + F.gameGoalsMid + '+ goals in a single game' });

    var gs = F.gameScore;
    if      (mSc >= gs[0]) b.push({ icon:'💥', label:'Legendary',  color:GOLD,      pri:12, tip:gs[0] + '+ points in a single game' });
    else if (mSc >= gs[1]) b.push({ icon:'🌟', label:'Superstar',  color:'#c084fc', pri:10, tip:gs[1] + '+ points in a single game' });
    else if (mSc >= gs[2]) b.push({ icon:'🎸', label:'Rock Star',  color:'#FFD166', pri:9,  tip:gs[2] + '+ points in a single game' });
    else if (mSc >= gs[3]) b.push({ icon:'🎮', label:'Breakout',   color:'#4ade80', pri:6,  tip:gs[3] + '+ points in a single game' });
    else if (mSc >= gs[4]) b.push({ icon:'⭐', label:'Solid Game', color:'#9ca3af', pri:3,  tip:gs[4] + '+ points in a single game' });

    if (mSv >= F.gameSaves) b.push({ icon:'🏰', label:'Fortress', color:'#4DABF7', pri:7, tip:F.gameSaves + '+ saves in a single game' });

    if (mine.some(function (g) { return num(g['Goals']) >= 1 && num(g['Assists']) >= 1 && num(g['Saves']) >= 1; }))
      b.push({ icon:'⚡', label:'Balanced', color:'#4DABF7', pri:5, tip:'1+ goal, assist & save in a single game' });

    /* Summit — best single game on your own team. Documented for years but
       never actually granted until the definitions were merged. */
    if (all.length && mSc > 0) {
      var mates = all.filter(function (p) { return p.school === player.school; });
      if (mates.length > 1 && mates.every(function (p) { return p === player || maxOf(played(p), 'Score') < mSc; }))
        b.push({ icon:'🏔️', label:'Summit', color:'#FFD166', pri:6, tip:'Highest single-game score on your team' });
    }

    /* ── SEASON LADDERS ─────────────────────────────────────────────────── */
    var ladder = function (value, tiers, make) {
      for (var k = 0; k < tiers.length; k++) if (value >= tiers[k]) { b.push(make(k)); return; }
    };

    ladder(player.wins, T.wins, function (k) {
      return { icon:['👑','🏆','🥇'][k], label:NAME.wins(k), color:'#FFD166', pri:[10,8,5][k], tip:T.wins[k] + ' match wins this season' };
    });
    if (player.wins >= 1 && player.wins < T.wins[T.wins.length - 1])
      b.push({ icon:'🎮', label:'First Win', color:'#9ca3af', pri:2, tip:'Recorded your first league win' });

    if (player.shootingPercentage === 100 && player.shots >= F.perfectAimMinShots)
      b.push({ icon:'🎱', label:'Perfect Aim', color:'#FF6B6B', pri:9, tip:'100% shooting accuracy (min ' + F.perfectAimMinShots + ' shots)' });
    if (player.shootingPercentage < 100 && player.shots >= F.accuracyMinShots) {
      if      (player.shootingPercentage >= F.accuracyLaser) b.push({ icon:'🎯', label:'Laser',        color:'#FF6B6B', pri:9, tip:F.accuracyLaser + '%+ shooting accuracy (min ' + F.accuracyMinShots + ' shots)' });
      else if (player.shootingPercentage >= F.accuracySharp) b.push({ icon:'🎯', label:'Sharpshooter', color:'#FF6B6B', pri:7, tip:F.accuracySharp + '%+ shooting accuracy (min ' + F.accuracyMinShots + ' shots)' });
    }

    if (player.avgScore   >= F.avgScore)   b.push({ icon:'🚀', label:'Rocket',    color:'#FFD166', pri:8, tip:'Averaging ' + F.avgScore + '+ score per game' });
    if (player.avgGoals   >= F.avgGoals)   b.push({ icon:'🥅', label:'Finisher',  color:'#FF6B6B', pri:7, tip:'Averaging ' + F.avgGoals + '+ goals per game' });
    if (player.avgAssists >= F.avgAssists) b.push({ icon:'🎪', label:'Playmaker', color:'#FFD166', pri:7, tip:'Averaging ' + F.avgAssists + '+ assists per game' });

    ladder(player.goals, T.goals, function (k) {
      return { icon:['🌠','☄️','💥','💫','⚽','⚽'][k], label:NAME.goals(k), color:['#ffd700','#FF6B6B','#FF6B6B','#FF6B6B','#FFD166','#9ca3af'][k], pri:[11,9,7,6,5,3][k], tip:T.goals[k] + ' total goals this season' };
    });
    ladder(player.score, T.score, function (k) {
      return { icon:['🎆','💰','🔱','🌟','⭐','✨','💡'][k], label:NAME.score(k), color:['#ffd700','#FFD166','#FFD166','#FFD166','#FFD166','#FFD166','#9ca3af'][k], pri:[11,9,8,7,5,4,3][k], tip:T.score[k].toLocaleString() + '+ total points this season' };
    });
    ladder(player.shots, T.shots, function (k) {
      return { icon:['🌪️','🔫','💨','💨','🎰'][k], label:NAME.shots(k), color:['#4DABF7','#4DABF7','#4DABF7','#9ca3af','#9ca3af'][k], pri:[8,7,5,4,3][k], tip:T.shots[k] + ' total shots this season' };
    });
    ladder(player.saves, T.saves, function (k) {
      return { icon:['🗿','🧱','🛡️'][k], label:NAME.saves(k), color:['#4DABF7','#4DABF7','#9ca3af'][k], pri:[8,6,3][k], tip:T.saves[k] + ' total saves this season' };
    });
    ladder(player.assists, T.assists, function (k) {
      return { icon:['🎭','🍎','🤝'][k], label:NAME.assists(k), color:['#FFD166','#FFD166','#9ca3af'][k], pri:[8,6,3][k], tip:T.assists[k] + ' total assists this season' };
    });

    /* ── COMBINATION ────────────────────────────────────────────────────── */
    var tt = T.tripleThreat;
    if (player.goals >= tt && player.assists >= tt && player.saves >= tt)
      b.push({ icon:'🌈', label:'Triple Threat', color:'#4DABF7', pri:7, tip:tt + '+ goals, assists, AND saves this season' });
    if (player.assists > player.goals && player.goals > 0)
      b.push({ icon:'🤝', label:'Team First', color:'#FFD166', pri:5, tip:'More assists than goals this season' });
    if (player.saves > player.goals)
      b.push({ icon:'🧱', label:'The Wall', color:'#4DABF7', pri:5, tip:'More saves than goals this season' });

    if (all.length >= 4) {
      var rank = function (vals, v) { return vals.filter(function (x) { return x > v; }).length; };
      var half = Math.ceil(all.length / 2);
      if (rank(all.map(function(p){return p.goals;}),   player.goals)   < half &&
          rank(all.map(function(p){return p.assists;}), player.assists) < half &&
          rank(all.map(function(p){return p.saves;}),   player.saves)   < half &&
          rank(all.map(function(p){return p.shots;}),   player.shots)   < half)
        b.push({ icon:'⚖️', label:'All-Around', color:'#4DABF7', pri:7, tip:'Top half of the league in goals, assists, saves & shots' });
    }

    /* ── ATTENDANCE ─────────────────────────────────────────────────────────
       Measured against the weeks the player's OWN SCHOOL had a match, not
       against every week of the season. Early Release runs nine schools with a
       rotating bye, so a player there always has a week with no fixture —
       comparing against the full calendar made Iron Man and Seasoned Veteran
       unreachable for nine of the thirteen schools. Using the school's own
       active weeks also stops a week nobody reported from costing the badge. */
    var doneWeeks = o.lastCompletedWeek || 0;
    if (doneWeeks >= 2 && all.length) {
      var schoolWeeks = {};
      all.forEach(function (p) {
        if (p.school !== player.school) return;
        p.games.forEach(function (g) { var w = weekOf(g); if (w > 0 && w <= doneWeeks) schoolWeeks[w] = true; });
      });
      var myWeeks = {};
      player.games.forEach(function (g) { var w = weekOf(g); if (w > 0) myWeeks[w] = true; });

      var active = Object.keys(schoolWeeks);
      if (active.length >= 2 && active.every(function (w) { return myWeeks[w]; })) {
        if (player.wins > player.losses)
          b.push({ icon:'🗓️', label:'Seasoned Veteran', color:'#FF6B6B', pri:9, tip:'Played every week your school had a match AND has a winning record' });
        else
          b.push({ icon:'💪', label:'Iron Man', color:'#FF6B6B', pri:7, tip:'Played every week your school had a match' });
      }
    }

    /* ── SEASON ARC ─────────────────────────────────────────────────────── */
    var byWeek = mine.slice().sort(function (a, c) { return weekOf(a) - weekOf(c); });

    if (byWeek.length >= 4) {
      var mid = Math.floor(byWeek.length / 2);
      var avg = function (arr) { return arr.reduce(function (t, g) { return t + num(g['Score']); }, 0) / (arr.length || 1); };
      if (avg(byWeek.slice(mid)) > avg(byWeek.slice(0, mid)))
        b.push({ icon:'📈', label:'Most Improved', color:'#4ade80', pri:7, tip:'Higher avg score in the 2nd half of the season' });
    }
    if (wlSeq.length >= 4) {
      var h = Math.floor(wlSeq.length / 2);
      var fw = wlSeq.slice(0, h).filter(function (r) { return r === 'W'; }).length;
      if (fw <= h - fw && player.wins > player.losses)
        b.push({ icon:'🐢', label:'Slow Burn', color:'#f97316', pri:6, tip:'Sub-.500 at the halfway point, winning record at the end' });
    }
    if (byWeek.length >= 3) {
      var scores = byWeek.map(function (g) { return num(g['Score']); });
      var lo = Math.min.apply(null, scores), hi = Math.max.apply(null, scores), li = scores.indexOf(lo);
      if (li < scores.length - 1 && scores[li + 1] === hi && hi > lo)
        b.push({ icon:'📉', label:'Bounced Back', color:'#FF6B6B', pri:5, tip:'Followed your season-low score game with your season-high score game' });

      var run = 0, bestRun = 0;
      byWeek.forEach(function (g) { if (num(g['Goals']) >= 1) { run++; if (run > bestRun) bestRun = run; } else run = 0; });
      if      (bestRun >= T.scorerStreak[0]) b.push({ icon:'🎯', label:NAME.scorerStreak(0), color:'#FF6B6B', pri:7, tip:'Scored in ' + T.scorerStreak[0] + ' consecutive games' });
      else if (bestRun >= T.scorerStreak[1]) b.push({ icon:'🎯', label:NAME.scorerStreak(1), color:'#FF6B6B', pri:5, tip:'Scored in ' + T.scorerStreak[1] + ' consecutive games' });
    }

    if (player.losses >= T.neverQuit)
      b.push({ icon:'😤', label:'Never Quit', color:'#9ca3af', pri:4, tip:'Kept competing through ' + T.neverQuit + '+ losses' });

    /* Unique badges always show; the rest fill the remaining card slots. */
    var unique  = b.filter(function (x) { return x.unique; });
    var regular = b.filter(function (x) { return !x.unique; }).sort(function (a, c) { return c.pri - a.pri; });
    return unique.concat(regular.slice(0, Math.max(4, 5 - unique.length)));
  }

  root.PSD_BADGES = {
    GAMES: GAMES,
    thresholds: T,
    names: NAME,
    defs: DEFS,
    tierOrder: TIER_ORDER,
    tierMeta: TIER_META,
    award: award
  };

})(window);
