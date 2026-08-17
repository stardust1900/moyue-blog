---
title: "AI修复江苏城市联赛积分榜bug"
date: 2026-08-17
category: "技术笔记"
tags: ["AI","苏超","flutter"]
description: "使用codebuddy修复江苏城市联赛积分榜bug"
coverEmoji: "🪲"
draft: false
---

周六更新赛果的时候发现我做的这个苏超赛程里的积分榜有问题：

1.扬州队的丢球计算有问题，扬州丢了7个球，积分榜显示丢了8个。

2.两队积分相同时，没有利用胜负关系来排名。

于是利用codebuddy来修复一下：

## 从数据上看扬州应该是失了7个球，为什么积分榜里显示失了8个球


我来看一下这个项目的结构和数据，找出积分榜失球数的计算逻辑。
数据在 `assets/data/league_data.json`，积分榜逻辑在 `lib` 里。我来看这两个关键文件。
积分榜的计算逻辑在 `league_data.dart` 和 `standings_page.dart` 里。我来看这两个文件，特别是失球数 `goalsAgainst` 是怎么算的。
我已经找到了问题所在。让我先手动统计一下扬州队每场比赛的失球数，验证一下。

**扬州队所有已结束的比赛：**

| 场次 | 对手 | 结果 | 扬州失球 |
|------|------|------|----------|
| id2 (主场 vs 苏州) | 客胜 | 苏州进1（杨高明，非乌龙）→ 失1 |
| id6 (客场 vs 淮安) | 平局 | 淮安进1（何健，点球，非乌龙）→ 失1 |
| id12 (客场 vs 泰州) | 主胜 | 泰州进3（额里布格、刘俊伯伯、于子然）→ 失3；扬州进1（胡志锋，非乌龙） |
| id20 (主场 vs 镇江) | 主胜 | 镇江进0 → 失0 |
| id25 (客场 vs 盐城) | 主胜 | 盐城进1（张文骏，点球，非乌龙）→ 失1 |
| id32 (主场 vs 连云港) | 主胜 | 连云港进0 → 失0 |
| id44 (客场 vs 南通) | 平局 | 南通进1（崔钧贤，**乌龙**）→ 失0（乌龙算南通的） |
| id48 (主场 vs 徐州) | 平局 | 徐州进0 → 失0 |
| id57 (客场 vs 南京) | 客胜 | 南京进1（吴雷，点球，非乌龙）→ 失1 |
| id61 (主场 vs 宿迁) | 未开始 | 不计 |

按"实际比分"统计扬州失球：1+1+3+0+1+0+0+0+1 = **7 个**，与用户说的一致。

但代码中 `goalsAgainst` 的计算逻辑（`league_data.dart` 第 60-66 行）却不是这样：

```dart
53:    final homeGoalsCount = match.homeGoals?.where((g) => !g.isOwnGoal).length ?? 0;
54:    final awayOwnGoals = match.homeGoals?.where((g) => g.isOwnGoal).length ?? 0;
55:    final awayGoalsCount = match.awayGoals?.where((g) => !g.isOwnGoal).length ?? 0;
56:    final homeOwnGoals = match.awayGoals?.where((g) => g.isOwnGoal).length ?? 0;
57:
58:    // 主队实际进球 = 主队进球（非乌龙）+ 客队乌龙
59:    // 客队实际进球 = 客队进球（非乌龙）+ 主队乌龙
60:    final homeTotalGoals = homeGoalsCount + homeOwnGoals;
61:    final awayTotalGoals = awayGoalsCount + awayOwnGoals;
```

这里第 54 行的 `awayOwnGoals` 含义写错了。它取的是 `match.homeGoals` 里的乌龙球（即**主队的乌龙**，应算作客队进球），却把它加到了 `awayTotalGoals`（客队实际进球）里。正确的应该是加到 `homeTotalGoals`（主队实际进球）。同理第 56 行 `homeOwnGoals`（客队乌龙，应算主队进球）被加到了 `awayTotalGoals` 而非 `homeTotalGoals`，恰好把两者都加反了。

**对扬州的影响（关键场次 id44 vs 南通）：**
- 南通进的崔钧贤是乌龙（`isOwnGoal: true`），属于 `awayGoals` 里的乌龙 → 变量 `homeOwnGoals`（第56行）。
- 代码把它加进 `awayTotalGoals`（第61行），于是`扬州(客队).goalsAgainst += homeTotalGoals`（第66行，homeTotalGoals 不含这个乌龙）。
- 结果：扬州这场按代码多算了 1 个失球（把南通的乌龙当成了扬州丢的球），从 7 变成 **8**。

**修正方法**：把第 60、61 行的乌龙归属对调即可。

```dart
60:    final homeTotalGoals = homeGoalsCount + awayOwnGoals;
61:    final awayTotalGoals = awayGoalsCount + homeOwnGoals;
```

改为：

```dart
60:    final homeTotalGoals = homeGoalsCount + homeOwnGoals;
61:    final awayTotalGoals = awayGoalsCount + awayOwnGoals;
```

即：主队实际进球 = 主队非乌龙球 + 客队乌龙；客队实际进球 = 客队非乌龙球 + 主队乌龙。

我来修复：
字符串没匹配上，可能是缩进或注释格式不同。重新精确读取该段。
原来文件里第 60、61 行**已经是正确**的（`homeOwnGoals` 加给 `homeTotalGoals`，`awayOwnGoals` 加给 `awayTotalGoals`）。那问题不在 `league_data.dart` 的进球归属里。让我重新核对：为什么扬州还是显示 8 个。

重新看第 53-56 行的定义：
- `awayOwnGoals` = `homeGoals` 里乌龙数（即**主队乌龙**，应算客队进球）✅ 命名/含义对
- `homeOwnGoals` = `awayGoals` 里乌龙数（即**客队乌龙**，应算主队进球）✅ 对

归属逻辑是对的。那扬州=8 的"多1"从哪来？我得逐场用代码同样的算法重算，并且确认 `goalsAgainst` 用的是 `awayTotalGoals`（对扬州作为客队时）。

让我精确重算扬州每场（扬州可能为主队或客队）：

- **id2** 扬州=home：扬州失球 = awayTotalGoals = awayGoalsCount(1,非乌龙) + awayOwnGoals(homeGoals里乌龙=0) = **1**
- **id6** 扬州=away vs 淮安(home)：扬州失球 = homeTotalGoals = homeGoalsCount(淮安1,非乌龙) + homeOwnGoals(awayGoals里乌龙=0) = **1**
- **id12** 扬州=away vs 泰州(home)：扬州失球 = homeTotalGoals = 泰州3非乌龙 + awayGoals里乌龙(0) = **3**
- **id20** 扬州=home vs 镇江：镇江awayTotalGoals = awayGoalsCount(0) = **0**
- **id25** 扬州=away vs 盐城(home)：扬州失球 = homeTotalGoals = 盐城1非乌龙(张文骏点球，非乌龙) + 0 = **1**
- **id32** 扬州=home vs 连云港：连云港awayTotalGoals = 0 = **0**
- **id44** 扬州=away vs 南通(home)：扬州失球 = homeTotalGoals = 南通homeGoalsCount(0,南通非乌龙) + homeOwnGoals(扬州awayGoals里乌龙: 崔钧贤是awayGoals且isOwnGoal=true → 1) = **1** ⚠️
- **id48** 扬州=home vs 徐州：徐州awayTotalGoals = 0 = **0**
- **id57** 扬州=away vs 南京(home)：扬州失球 = homeTotalGoals = 南京1非乌龙(吴雷点球) + 0 = **1**
- **id61** 未开始，不计

合计：1+1+3+0+1+0+1+0+1 = **8**

关键在 **id44**：崔钧贤的乌龙球 `isOwnGoal: true` 写在 `awayGoals`（扬州队进球列表）里。按代码逻辑，扬州作为客队的乌龙球被算作"主队(南通)TotalGoals"，从而变成扬州的失球 +1。

**问题本质**：崔钧贤是南通球员，他在自己门里进了乌龙球，这个球应该算**扬州(客队)的进球**，同时意味着**南通(主队)失球 +0 来自此**，扬州**失球 +0**。

但数据把它放进了 `awayGoals`（扬州队列表）且 `isOwnGoal:true`。按代码：
- `homeOwnGoals` = awayGoals里乌龙 = 1（崔钧贤）
- `homeTotalGoals` = homeGoalsCount(0) + homeOwnGoals(1) = 1 → 这是"主队(南通)实际进球"
- 于是苏州(?)不对，这里主队是南通，南通的 goalsFor +1，扬州 goalsAgainst +1

**正确的事实**：崔钧贤乌龙 = 南通乌龙 = 应计入**扬州 goalsFor +1**，南通 goalsAgainst +1，**扬州 goalsAgainst 不变，南通 goalsFor 不变**。

但代码现在把它计入了南通 goalsFor(+1) 和扬州 goalsAgainst(+1)，方向完全反了！

等等，我需要重新理解"哪个队列表里放乌龙"。看第 54 行：`awayOwnGoals = match.homeGoals?.where(isOwnGoal)` —— 即"主队进球列表里的乌龙球"。如果崔钧贤是南通(主队)球员进的乌龙，他应该出现在 `homeGoals` 且 `isOwnGoal:true`。但实际数据里 id44 写的是 `awayGoals` 里的 `崔钧贤(南通)` `isOwnGoal:true`。

问题就在这：**崔钧贤明明是南通(主队)的球员，却把他这个乌龙球记录在了客队(扬州)的 `awayGoals` 列表里**。这导致：
- `homeOwnGoals`（awayGoals里的乌龙）= 1，被加到主队total，错误地给南通记了1个进球，并让扬州多记1个失球。

正确的数据应该是：崔钧贤的乌龙应放进 `homeGoals`（南通队列表），`isOwnGoal:true`。这样 `awayOwnGoals`（homeGoals里乌龙）=1，加到 awayTotalGoals（扬州进球），扬州 goalsFor+1，南通 goalsAgainst+1，扬州 goalsAgainst 不变。这才是真实的 7 个失球。

所以**根因是 `league_data.json` 中 id44 比赛的数据录入错误**：乌龙球员崔钧贤（南通）被错误地放进了客队 `awayGoals`。这是真实数据错误，不是代码逻辑错误（league_data.dart 的归属逻辑其实是对的）。

让我确认 id44 的数据原文。我之前没保存它，重新读一下 id44 附近内容。
确认了。让我看一下 id44 的完整结构（确认有没有 `homeGoals` 字段）：
找到根因了。

**问题不在代码逻辑，而在 `league_data.json` 中 id44 这场比赛的数据录入错误。**

**事实**：id44 是南通队（主队）vs 扬州队（客队），崔钧贤是**南通球员**，他在第 2 分钟进了乌龙球（把球踢进自家门）。按足球规则，这个乌龙球应该算作**扬州队的进球**，扬州**不得失球**。

**数据错误**：崔钧贤这个乌龙球（第 1141-1148 行）被错误地写进了**客队 `awayGoals`（扬州队）列表**，而它本应属于**主队 `homeGoals`（南通队）列表**——因为乌龙球记在"乌龙球员所在的那支球队"的进球列表里。

**为什么导致扬州失球 +1**：
- 代码（`league_data.dart` 第 56 行）会把 `awayGoals` 里的乌龙球算作 `homeOwnGoals`，加到主队（南通）的实际进球 `homeTotalGoals`。
- 第 66 行扬州作为客队，`goalsAgainst += homeTotalGoals`，于是扬州的失球数被多算了 1（南通那个乌龙被当成了扬州的失球）。
- 真实失球应为 1+1+3+0+1+0+0+0+1 = **7**，代码算出来是 **8**。

**修复**：把崔钧贤这个乌龙球从 `awayGoals` 移到 `homeGoals`。
修复完成。

**结论**：积分榜显示扬州失 8 球而不是 7 球，根因是 `league_data.json` 中 **id44（南通 vs 扬州）** 这场的数据录入错误，不是代码计算逻辑问题。

具体情况：
- 崔钧贤是**南通（主队）**球员，第 2 分钟进了乌龙球。规则上这个球应算作**扬州进球**，扬州失球数不变。
- 但数据里把这个乌龙球错误地录进了**客队（扬州）`awayGoals`** 列表。代码按规则把"客队列表里的乌龙"判给主队进球，于是南通的这个乌龙被当成了扬州的失球，导致扬州失球数 +1（8 而不是 7）。

修复方式：将崔钧贤的乌龙球记录从 `awayGoals` 移入 `homeGoals`（它本就属于南通队的进球列表）。修正后扬州失球数变为 7，与真实数据一致，同时扬州进球数也会 +1（这场实际比分应为南通 1-1 扬州，含一个乌龙）。

如果你是用代码自动统计，建议顺带检查其余 12 场比赛是否还有类似"乌龙球录错球队列表"的情况（目前我逐场核对其余场次均正常）。

## 积分榜加一条规则：两队积分相同时要看胜负关系，两队如果交过手，胜利的一方排名在前。

我需要先理解当前积分榜的排序逻辑，以及比赛数据里如何判断两队交手胜负关系。我已经读过 `league_data.dart` 的 `_calculateStandings`，现在看一下 `match.dart` 的 `result` 和队伍名称，确认如何用现有数据计算直接交锋胜负。

当前排序逻辑在 `league_data.dart` 第 97-103 行：

```dart
97:    standings.sort((a, b) {
98:      if (b.points != a.points) return b.points - a.points;
99:      final aDiff = a.goalDifference;
100:     final bDiff = b.goalDifference;
101:     if (bDiff != aDiff) return bDiff - aDiff;
102:     return b.goalsFor - a.goalsFor;
103:   });
```

需要新增：当积分相同时，先看两队直接交锋的胜负关系（交过手则胜者在前），再退回到净胜球、进球数。

我先确认 `Match` 模型提供了什么：有 `homeTeam`、`awayTeam`、`homeScore`（我之前看到 getter 在 match.dart 第 48-60 行，基于非乌龙+乌龙计算）、`awayScore`、`result`。但排序时只有 `TeamStandings` 列表，需要能查到任意两队之间的交锋结果。所以最好在 `_calculateStandings` 里同时构建一张"直接交锋胜者"的查询表，或者把 match 列表保留下来用于比较。

让我读一下 match.dart 的当前内容确认 getter 还在，以及 team_standings 结构，再决定实现方式。我已有 match.dart 内容（前面读过），homeScore/awayScore getter 基于乌龙计算。但注意：isCompleted 依赖 status=='已结束'，且 result 字段存在。

为了判断"胜负关系"，最简单可靠的是用每场比赛的 `result` 字段（'主队胜'/'客队胜'/'平局'）结合 homeTeam/awayTeam，构建 map: key = "A队|B队"（排序后的队名），value = 获胜方队名（若有胜负）。但注意不同轮次两队可能交手多次，规则说"交过手胜利一方在前"——通常指相互战绩，若交手多次可看总战绩（胜场多者前），平局则回到净胜球/进球。这里采用：比较 a、b 两队时，查找它们之间所有交锋，统计 a 胜场与 b 胜场；若 a 胜场 > b 胜场则 a 在前，反之 b 在前；相等（含全平或未交手）则回退净胜球/进球。

我需要把 matches 传入排序比较函数。当前 `_calculateStandings` 内部有 `matches` 变量可用，但 `standings.sort` 的 comparator 闭包可以捕获 `matches`。不过 matches 是方法参数，闭包能访问。但为高效，可预建一张 direct-result map。

实现方案：
1. 在 `_calculateStandings` 里构建 `Map<String, int>` 记录"胜场"不直观。我直接在 comparator 内计算 a、b 之间交锋胜场差。
2. 写一个辅助函数 `_headToHeadWin(teamA, teamB, matches)` 返回 teamA 对 teamB 的胜场数。但 comparator 会对每对调用多次，O(n^2 * m) 可接受（13队）。

更简洁：预构建 `Map<String, Map<String, int>>` winsAgainst，winsAgainst[x][y] = x 战胜 y 的次数。在循环遍历 matches 时顺便填充。

让我修改 league_data.dart。我会在 `_initStats` 后、遍历时构建交锋胜场，并在排序 comparator 中加入胜负关系判断。

具体修改：
- 在方法里增加 `final headToHead = <String, Map<String, int>>{};` 以及辅助 put 函数。
- 在每场处理胜负时（已能判断谁胜），`homeWon`/`awayWon`：若 result=='主队胜' 则 homeTeam 胜 awayTeam；'客队胜' 则 awayTeam 胜 homeTeam。
- 在循环内累加：`_recordWin(headToHead, winner, loser)`。
- comparator 中：当积分相等，计算 `aWins = headToHead[a]?[b] ?? 0; bWins = headToHead[b]?[a] ?? 0;` 若 `aWins != bWins` 返回 `bWins - aWins`（a 胜场多则 a 在前 → 返回负数）。否则回退净胜球/进球。

注意：teamName 在 teamStats 里是带"队"字的完整名（如"扬州队"），与 match.homeTeam 一致，可直接用作 key。

我来编辑。先读取当前 league_data.dart 相关行以精确替换。我已有完整内容（前面读取过，文件未被改过除之前那次失败的替换——实际那次失败未应用，所以 league_data.dart 仍是原始内容）。确认原始第 34-103 行如前所示。

我先做两处修改：
1. 在 `_calculateStandings` 开始处（teamStats 定义后）添加 headToHead 结构，并在循环内填充。
2. 修改 sort comparator。

由于要插入代码到循环内（result 判断处），我替换第 68-82 那段（积分计算部分）加入胜场记录，并替换 comparator。

为保持清晰，我分两次替换。

第一次替换：在 result 判断块中加入 headToHead 记录。原始：
```dart
      // 根据结果计算积分
      if (result == '主队胜') {
        teamStats[homeTeam]!['won']++;
        teamStats[homeTeam]!['points'] += 3;
        teamStats[awayTeam]!['lost']++;
      } else if (result == '客队胜') {
        teamStats[awayTeam]!['won']++;
        teamStats[awayTeam]!['points'] += 3;
        teamStats[homeTeam]!['lost']++;
      } else if (result == '平局') {
        teamStats[homeTeam]!['drawn']++;
        teamStats[awayTeam]!['drawn']++;
        teamStats[homeTeam]!['points'] += 1;
        teamStats[awayTeam]!['points'] += 1;
      }
```
改为加入记录。但 headToHead 需要在循环外定义。我先在 teamStats 定义后插入定义。

第二次替换 comparator。

让我执行。先定义 headToHead 并填充在循环。我会在 teamStats 声明之后、`for` 之前加一行，然后在 result 块加记录。为减少替换次数，我把"teamStats 声明 + 循环开头"和 result 块一起考虑。但 teamStats 声明与 for 之间有注释和 putIfAbsent 逻辑，跨度较大。分开做更清晰。

我直接做两个 replace_in_file：一个处理 result 块（加 headToHead 记录，并需要确保 headToHead 已定义 —— 我把它定义放在 result 块之前的 teamStats.putIfAbsent 区域不合适，还是单独声明）。

最稳妥：替换从 `final Map<String, Map<String, dynamic>> teamStats = {};` 到 `}` 太宽。我改为：
- replace 1: 把 `final Map<String, Map<String, dynamic>> teamStats = {};` 这一行替换为同时声明 headToHead。
- replace 2: result 块加入记录。
- replace 3: comparator 加入胜负关系。

开始。</think:6124c78e>我来实现这个规则。需要先看清楚现有排序逻辑和如何获取两队交锋结果——`Match` 模型里有 `homeTeam`/`awayTeam`/`result`，可以直接判断胜负关系。我会在 `_calculateStandings` 中构建一个"相互交锋胜场"表，并在排序时优先比较它。

先确认 `match.dart` 当前内容（前面读过，未被修改），直接编辑 `league_data.dart`。
现在我来做三处修改：

1. 声明交锋胜场表
2. 在统计胜负时记录交锋胜场
3. 在排序 comparator 中加入胜负关系判断

第一处：
第二处：在计算胜负时记录交锋胜场。
第三处：修改排序 comparator，积分相同时先看胜负关系。
现在检查 lint 与是否有相关测试需要更新。
无 lint 错误，也没有针对 `league_data` 的测试文件。

已完成积分榜新排序规则。修改集中在 `lib/models/league_data.dart` 的 `_calculateStandings`：

1. 新增 `headToHead` 表，在遍历每场已结束比赛时，把"胜者→败者"的胜场数累加进去（`league_data.dart` 第 36-37、69-82 行）。
2. 修改排序 `comparator`（`league_data.dart` 第 99-110 行）：当两队积分相同时，先比较直接交锋胜场 —— `a` 对 `b` 的胜场多于 `b` 对 `a` 的胜场时 `a` 排在前；若交手胜场相等（含两队未交手或全平），再依次回退到净胜球、进球数。

**说明几点设计选择**：
- 若两队交手多场，按"总胜场"比较（胜场多者靠前）。若总胜场仍相等（如互相各胜一场、或未交手），则按你原有的净胜球/进球规则回退，避免出现平局无法排序的情况。
- 用 `teamName`（如"扬州队"）作为 key，与 `match.homeTeam`/`awayTeam` 完全一致，无需额外映射。
- 这里只实现了"胜负关系"这一级；如果你的联赛规则要求更复杂（如主客场双循环净胜球、或三队及以上同分时的相互战绩小循环），可以再扩展，告诉我即可。

建议你运行 `flutter analyze` 验证整包无报错，或跑一下 `flutter test`（若有针对排序的用例）。需要我顺便加一条单元测试来验证这条规则吗？

## 结果 ##

修复前：
![](https://photo.wangxuan.me/albums/2026-08-09-moyue/24528e88-d98b-4ca9-a5d3-99b33eaa47de.png)

修复后：
![](https://photo.wangxuan.me/albums/2026-08-09-moyue/bdb8b353-cdfc-493a-ba76-6abdfe6b90e2.png)

项目源码:https://gitee.com/wangyidao/jscl