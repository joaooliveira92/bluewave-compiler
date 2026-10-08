# Action grid and nav reconciliation

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question
Map each of the 15 RTW3 action buttons (Design Ship, Research, Messages, Build ship/sub/fort, Doctrine, Mobilization, Air groups, Aircraft types, Division editor, Fleet Exercise, Show history, Preferences, All reserve) to a Bluewave target: existing screen, deferred item, or hidden. Decide how this grid coexists with the BottomNav and sidebar sections without duplicating navigation, and whether it is a grid at all.

## Answer

Owner delegated the call ("you decide on the best approach", 2026-10-08); the orchestrator adopted its six recommendations.

1. **No action grid.** BottomNav is the only inter-screen navigation; RTW3's buttons become contextual actions on the screens/panels they belong to.
2. **Existing screens:** Design Ship + Build ship -> Construction (Fleet and Construction carry a "Design ship" action); Research -> Research & Technology; Division editor -> Fleet; Preferences -> Campaign Preferences; Show history + Messages -> the month report panel on the home screen.
3. **Deferred buttons** (Doctrine, Mobilization, All reserve, Build sub, Build fort/base, Air groups, Aircraft types, Fleet Exercise) are not buttons. Each appears as a "Not yet modelled" item inside its eventual screen (Doctrine/Mobilization under Government, Air groups/Aircraft types under Fleet, Build fort/base and Build sub under Construction, Fleet Exercise under Fleet), per ADR-0059.
4. **Resign** is skipped; Close campaign covers it.
5. **Save, Copy game, Close** live in one "Campaign" menu in the header, not on the home screen.
6. **BottomNav labels** are short so none truncate (Research, Diplomacy, Prefs); full names stay in tooltips and screen titles. Dev-only screens stay debug-gated.

Consequence for ticket 05: the tab strip likewise adds no navigation surface; per-tab lens/drawer/link choices remain to settle there.
