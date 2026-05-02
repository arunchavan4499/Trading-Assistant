# Risk Control - Quick Reference Card

## 🚨 When Breach is Detected

**You'll See**: "RISK BREACH DETECTED" message on Risk page with red border

**Current Breach**: GOOGL position at 25.62% exceeds 20% max

---

## 4️⃣ Your Options (In Order of Speed)

### ⚡ FASTEST: Option 1 - Reduce Positions (5-10 min)

**DO THIS:**
1. Go to `/portfolio` page
2. Find: GOOGL (25.62%), MSFT (24.69%)
3. Sell: 5% GOOGL, 4% MSFT
4. Check: `/risk` page → Status should be green ✓

**PROS**: Immediate, simple, direct
**CONS**: May realize losses
**RESULT**: Breach resolved instantly

---

### 🔧 EASIEST: Option 2 - Adjust Limits (2 min)

**DO THIS:**
1. Go to `/settings` page
2. Find: "Risk Tolerance" section
3. Change: Max Drawdown 20% → 25%
4. Change: Max Position 20% → 30%
5. Click: "Save Changes"

**PROS**: No trading needed, flexible
**CONS**: Increases risk exposure
**RESULT**: Breach immediately resolved

---

### 📈 BEST: Option 3 - Diversify (1-2 days)

**DO THIS:**
1. Go to `/portfolio` page
2. Add: 2-3 new assets from other sectors
3. Rebalance: All positions → ~7% each (15 total)
4. Check: `/risk` page → Safe ✓

**PROS**: Improves portfolio quality, permanent fix
**CONS**: Takes time, multiple trades
**RESULT**: Breach resolved + better long-term

---

### 🔍 SAFEST: Option 4 - Pause & Review (1-4 hours)

**DO THIS:**
1. Disable trading signals (if possible)
2. Go to `/backtest` page → Run latest test
3. Go to `/signals` page → Review recent trades
4. Ask: Does strategy still make sense?
5. Decide: Adjust or resume

**PROS**: Thoughtful, prevents worse problems
**CONS**: Opportunity cost, time
**RESULT**: Informed decision

---

## 📊 Decision Tree

```
RISK BREACH DETECTED
        ↓
  Choose your approach:
        ↓
  Time critical?
  ├─ YES → Option 1 (Reduce, 5 min)
  └─ NO → Option 3 (Diversify, 1-2 days)
        ↓
  Comfortable with higher risk?
  ├─ YES → Option 2 (Increase limits, 2 min)
  └─ NO → Options 1 or 3
        ↓
  Uncertain about strategy?
  ├─ YES → Option 4 (Review, 1-4 hours)
  └─ NO → Options 1-3
```

---

## ✅ Step-by-Step for Each Option

### Option 1: Reduce Positions

```
STEP 1: Open /risk page
STEP 2: Note which assets are > 20%
        (GOOGL 25.62%, MSFT 24.69%)
STEP 3: Go to /portfolio page
STEP 4: Find "GOOGL" position
STEP 5: Sell 5-6% of GOOGL
STEP 6: Find "MSFT" position  
STEP 7: Sell 4-5% of MSFT
STEP 8: Return to /risk page
STEP 9: Verify: "Portfolio Within Limits" ✓
```

---

### Option 2: Adjust Limits

```
STEP 1: Go to /settings page
STEP 2: Find "Risk Tolerance" section
STEP 3: Click field: "Max Drawdown Limit (%)"
STEP 4: Change from: 20
STEP 5: Change to: 25
STEP 6: Click field: "Max Position Size (%)"
STEP 7: Change from: 20
STEP 8: Change to: 30
STEP 9: Click "Save Changes" button
STEP 10: Return to /risk page
STEP 11: Verify: "Portfolio Within Limits" ✓
```

---

### Option 3: Diversify

```
STEP 1: Research 2-3 new assets
        (Choose different sectors, correlations)
STEP 2: Go to /portfolio page
STEP 3: Reduce each existing position by 20%
STEP 4: Add new assets at ~8% each
STEP 5: Result should be:
        - ~15 total positions
        - ~7% each position
STEP 6: Go to /backtest page
STEP 7: Run backtest with new weights
STEP 8: If good results: Execute rebalance
STEP 9: Return to /risk page
STEP 10: Verify: "Portfolio Within Limits" ✓
```

---

### Option 4: Pause & Review

```
STEP 1: Disable trading signals (if available)
STEP 2: Go to /backtest page
STEP 3: Create backtest with current holdings
STEP 4: Review: Sharpe, Return, Max Drawdown
STEP 5: Go to /signals page
STEP 6: Review: Recent trading signals
STEP 7: Go to /portfolio page
STEP 8: Analyze: Current positions, allocation
STEP 9: Ask yourself:
        ✓ Does strategy still work?
        ✓ Are market conditions changed?
        ✓ Should I adjust limits or positions?
STEP 10: Make decision
STEP 11: Execute chosen action (1-3 above)
```

---

## 🎯 What To Do RIGHT NOW

### Immediate (Next 5-10 min):
Choose ONE of these:
- [ ] Option 1: Reduce positions
- [ ] Option 2: Increase limits
- [ ] Option 4: Pause & review

### Short-term (This week):
Do Option 3:
- [ ] Add 2-3 new assets
- [ ] Rebalance to 15 positions
- [ ] Target ~7% each

### Ongoing (Daily):
- [ ] Check `/risk` page daily
- [ ] Act on new breaches quickly
- [ ] Keep positions reasonable

---

## 📍 Where Everything Is

| Action | Page | URL |
|--------|------|-----|
| Monitor Risk | Risk | http://localhost:5173/risk |
| Change Limits | Settings | http://localhost:5173/settings |
| Buy/Sell | Portfolio | http://localhost:5173/portfolio |
| Backtest | Backtester | http://localhost:5173/backtest |
| Review Trades | Signals | http://localhost:5173/signals |
| Dashboard | Dashboard | http://localhost:5173/dashboard |

---

## 🎨 On Risk Page - What to Look For

### Top Section:
- **Green Shield** = Safe ✓
- **Red Alert** = Breach ❌
- Message tells what violated

### Drawdown Monitor:
- Shows current drawdown vs limit
- Green = Safe
- Yellow = Warning  
- Red = Breach

### Exposure by Asset:
- Shows all positions
- Green = Below 80% of max
- Yellow = Above 80%

### NEW - Take Action Section:
- **Click to expand** each option
- Shows specific what to do
- Links to relevant pages

---

## ⚡ The Golden Rules

### DO ✓
- Check risk daily
- Act within hours of breach
- Keep positions ≤ 20%
- Diversify to 12-15 assets
- Rebalance when concentrated

### DON'T ✗
- Ignore breach alerts
- Let single position > 25%
- Forget to monitor
- Over-concentrate risk
- Set unrealistic limits

---

## 🎯 Success Metrics

### IMMEDIATE (Today):
- [ ] Status: "Portfolio Within Limits" ✓
- [ ] No violations shown
- [ ] All positions ≤ 20%

### SHORT-TERM (This week):
- [ ] 12-15 assets held
- [ ] Each ~7% (range 5-9%)
- [ ] Stable drawdown

### LONG-TERM (This month):
- [ ] No more breaches
- [ ] Consistent monitoring (daily)
- [ ] Improved risk metrics

---

## 📞 Need Help?

**For Settings changes**: Go to `/settings` → Risk Tolerance
**For Trading**: Go to `/portfolio` → Create orders
**For Backtesting**: Go to `/backtest` → Run simulation
**For Monitoring**: Go to `/risk` → Check daily

---

## 💾 Save This Card

This card is also available as:
- BREACH_ACTION_GUIDE.md (detailed)
- RISK_CONTROL_GUIDE.md (comprehensive)
- RISK_IMPLEMENTATION_SUMMARY.md (complete)

---

## 🎊 You're Ready!

Everything is set up. Just:
1. Open `/risk` page
2. Choose your action
3. Follow the steps
4. Verify breach is resolved

✨ **You've got this!**

