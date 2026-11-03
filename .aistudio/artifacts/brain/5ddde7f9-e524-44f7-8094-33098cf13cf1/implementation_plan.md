# Implementation Plan: AIQX Foundation Matrix & Forsage UI Alignment

This plan addresses all identified **mathematical/protocol logic mistakes** and **UI discrepancies** identified between the AIQX Foundation application and the Forsage benchmark references (`image_5cb511c8.jpeg` dashboard and `image_7c682682.png` 2022 DeFi platform overview).

---

## 1. Architectural & Logic Reconciliation

### A. Strict Treasury Isolation & Missing Upline Handling
* **Issue**: The Treasury address (`2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o`) must strictly receive **only** the 15% slot activation fee. If unallocated upline commissions (e.g. when ID 2 joins under ID 1 with no Upline 2 or 3) are routed to Treasury, it violates the non-negotiable protocol rule.
* **Resolution**:
  - Route the exact 15% slot activation fee directly to `2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o`.
  - Route any unallocated commissions (e.g., missing 2nd/3rd line uplines or unallocated crossover shares) to a dedicated, segregated `COMMUNITY_GROWTH_RESERVE` pool.
  - Exclude reserved funds from withdrawable earnings while surfacing them in transparent community stats.

### B. 14-Level Doubling Matrix & Visual Representation
* **Resolution**:
  - Preserve the 14-level mathematical progression ($100 \times 2^{L-1}$ AIQX per level; 50% Direct, 30% Indirect, 5% Third Line, 15% Slot Activation).
  - Map the 14 levels cleanly onto the Forsage **2x2 Program Card Grid**:
    1. **AIQX Starter (Levels 1–3)**: 100, 200, 400 AIQX (Blue glow)
    2. **AIQX Builder (Levels 4–7)**: 800, 1,600, 3,200, 6,400 AIQX (Purple glow)
    3. **AIQX Leader (Levels 8–11)**: 12,800, 25,600, 51,200, 102,400 AIQX (Pink glow)
    4. **AIQX Whale (Levels 12–14)**: 204,800, 409,600, 819,200 AIQX (Gold glow)
  - Implement a slot-preview modal with a visual bubble tree (Upline circle, Member circle, Downline spot bubbles, and Recycle 🔁 indicator) when clicking **[Preview ➔]** on any program card.

### C. Auto-Crossover & Overtake Resolution
* If a downline activates Level $L$ before their direct sponsor, the engine crawls the upline chain to locate the nearest active Level $\ge L$ sponsors, splitting the eligible commission among qualified uplines without duplicate claims or unfunded payouts.

---

## 2. UI / UX Redesign (Faithful Forsage Benchmark)

### A. Top Navigation Bar (`src/components/Header.tsx`)
* Replace the bright electric blue header with the Forsage dark navy slate bar (`bg-[#121622]`), featuring:
  - Clean inset pill for "Preview ID" input.
  - High-contrast "Go" button.
  - High-contrast "Connect wallet" button with wallet status.
  - Responsive mobile drawer toggle.

### B. User Card & Personal Link Card (`src/components/ForsageDashboard.tsx`)
* **Left Card (User ID Card)**:
  - Large avatar circle with verified gold crown badge.
  - Bold `ID [X]` typography.
  - Copyable Solana address with copy feedback.
  - Subtitle: `invited [date] by ID [sponsorID]`.
* **Right Card (Personal Link Card)**:
  - `Personal link` with tooltip icon.
  - URL display: `aiqx.foundation/join?ref=[ID]` with one-click copy.
  - Dedicated callout: *"Not a member yet? Sign up with this upline"* with an immediate **[Sign up]** button triggering the 1-click registration flow.

### C. 4 Metric Stat Cards with Staircase Sparkline
* `Partners` (direct referrals count + green `↑ 0`).
* `Team` (network downlines count + green `↑ 0`).
* `Ratio` (profit ratio percentage + green `↑ 0%`).
* `Profits` (total AIQX profits + green `↑ [amount] AIQX`) with the embedded SVG staircase sparkline on the right.

### D. 2x2 Forsage Program Cards
* 4 cards arranged in a responsive 2x2 grid with exact glowing ambient gradients:
  - Active level square matrix indicators (filled cyan/purple/pink/gold vs. dark locked slots).
  - Accumulated profits per tier with top-right external link arrow `↗`.
  - Actionable **[Preview ➔]** button launching the interactive slot matrix viewer.

### E. Interactive Visual Tree Modal (`src/components/ForsageSlotModal.tsx`)
* Visual representation of matrix positions:
  - Sponsor node at the top.
  - Active member node in the center.
  - Downline place circles with member IDs, filled status, and the recycle spot 🔁.
  - Direct level upgrade button with fee calculation and single-transaction execution.

---

## 3. Implementation Steps

1. **Backend & Referral Engine Refinements** (`src/lib/referral-engine.ts`, `server.ts`):
   - Refactor distribution routing to isolate `2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o` strictly to the 15% slot fee.
   - Route unallocated 2nd/3rd-line rewards to the Community Reserve pool.
   - Ensure `/api/user/:wallet` and `/api/matrix/slot-detail` provide all required data for the 4 program cards and visual tree.

2. **UI Component Restyling**:
   - Update `src/components/Header.tsx` for the refined dark navy slate banner.
   - Update `src/components/ForsageDashboard.tsx` with the 2-card header, 4 metric cards (staircase sparkline), and 2x2 program cards.
   - Enhance the slot matrix modal with the bubble tree and cycle counter.
   - Ensure seamless preview switching when querying ID 1, ID 2, or custom IDs.

3. **Verification & Testing**:
   - Run unit tests (`referral-engine.test.ts` and `marketData.test.ts`).
   - Run type checks (`tsc --noEmit`) and `compile_applet`.
   - Test UI responsiveness and interactive preview flows.
