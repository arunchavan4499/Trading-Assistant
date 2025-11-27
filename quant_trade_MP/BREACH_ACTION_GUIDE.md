# RISK BREACH CONTROL - Quick Action Guide

## 🚨 Your Current Situation
- **Status**: RISK BREACH DETECTED ❌
- **Violation**: GOOGL position at 25.62% exceeds 20% max
- **Portfolio**: 6 assets, 100% exposure

---

## 📋 What You Need to Do - 4 Action Options

### Option 1️⃣ : REDUCE OVERSIZED POSITIONS (Quickest)

**Action**: Sell a portion of positions exceeding max limit

**Step-by-Step**:
1. Open **Portfolio** page
2. Find positions highlighted in RED:
   - **GOOGL**: 25.62% → Need to reduce by ~5%
   - **MSFT**: 24.69% → Consider reducing to ~20%
3. Create sell orders for:
   - Sell 5-6% of GOOGL 
   - Sell 4-5% of MSFT
4. Return to **Risk** page
5. Verify status changes to "Portfolio Within Limits" ✓

**Time**: 5-10 minutes
**Risk**: Lowest
**Impact**: Immediate

---

### Option 2️⃣ : ADJUST RISK LIMITS (Most Flexible)

**Action**: Increase your risk tolerance thresholds

**Step-by-Step**:
1. Open **Settings** page (top navigation)
2. Find "Risk Tolerance" section
3. Change limits:
   - **Max Drawdown Limit**: 20% → 25% (or higher)
   - **Max Position Size**: 20% → 25-30%
4. Click **Save Changes**
5. New limits apply immediately

**Current Settings**:
```
Max Drawdown Limit:    20.00%  ← Can increase to 25%
Max Position Size:     Currently 20% ← Can increase to 30%
Max Assets Portfolio:  15 (reasonable)
```

**Considerations**:
- ✓ Easier than selling
- ✓ Lets portfolio run naturally
- ⚠️ Increases risk exposure
- ⚠️ Only use if you're comfortable with higher risk

**Time**: 2 minutes
**Risk**: Medium (depends on new limits)
**Impact**: Strategy stays intact

---

### Option 3️⃣ : DIVERSIFY HOLDINGS (Best Long-Term)

**Action**: Add more assets to spread risk

**Step-by-Step**:
1. Review current holdings:
   - 6 assets (should have 10-15 ideally)
   - Concentrated in tech (AAPL, MSFT, GOOGL, AMZN, META, TSLA)
2. Add uncorrelated assets:
   - From other sectors: Utilities, Energy, Finance
   - Examples: XLY (Consumer), XLE (Energy), XLF (Finance)
   - Different market caps
3. Rebalance portfolio:
   - Target: Each position ~6-10% (instead of current 13-25%)
   - Add new positions while reducing large ones
4. Target: 12-15 total assets

**Benefits**:
- ✓ Reduces concentration risk
- ✓ Better diversification
- ✓ More stable returns
- ✓ Solves breach permanently

**Time**: 1-2 days
**Risk**: Lowest
**Impact**: Improves portfolio quality

---

### Option 4️⃣ : PAUSE & REVIEW (Most Cautious)

**Action**: Stop trading and assess strategy

**Step-by-Step**:
1. **Stop**: Disable trading signals temporarily
2. **Review**: Go to relevant pages:
   - **Signals** page: What signals triggered today?
   - **Backtest** page: Run latest backtest
   - **Portfolio** page: Review recent trades
   - **Features** page: Check correlations
3. **Assess**: Ask yourself:
   - Are market conditions changing?
   - Is concentration intentional?
   - Does strategy still make sense?
   - Do risk limits make sense?
4. **Resume**: When confident, re-enable trading

**When to use this**:
- Uncertain about market direction
- After significant portfolio loss
- Before major market events
- During high volatility

**Time**: 1-4 hours
**Risk**: Opportunity cost
**Impact**: Prevents worse breaches

---

## 🎯 RECOMMENDED FOR YOU RIGHT NOW

### Primary Action: **Option 1 + Option 3**

**Today (Option 1)**:
- Sell 5% of GOOGL (25.62% → 20.62%)
- Sell 4% of MSFT (24.69% → 20.69%)
- **Result**: Breach resolved ✓

**This Week (Option 3)**:
- Add 2-3 uncorrelated assets
- Rebalance all positions down
- Target: ~7% per asset with 12-14 total

---

## 📊 Current Portfolio Breakdown

```
AAPL:   18.10% ✓ Acceptable
MSFT:   24.69% ⚠️ HIGH (reduce 4-5%)
GOOGL:  25.62% ❌ BREACH (reduce 5%)
AMZN:   13.54% ✓ OK
META:   15.20% ✓ OK
TSLA:    2.86% ✓ OK
------
Total:  100%
```

---

## 🔧 Implementation Timeline

```
RIGHT NOW (Today)
└─ Check Risk page daily
└─ Note what's in breach

IMMEDIATE (Next 1-2 hours)
└─ Decide: Reduce, Adjust, or Diversify?
└─ Choose primary action

SHORT-TERM (Next 1-2 days)
└─ Implement chosen action
└─ Monitor Risk page
└─ Confirm status = Safe ✓

MEDIUM-TERM (This week)
└─ Implement secondary actions
└─ Improve portfolio quality
└─ Review limits and strategy

LONG-TERM (Monthly)
└─ Check Risk page regularly
└─ Rebalance as needed
└─ Adjust limits based on experience
```

---

## 💡 Best Practice Rules

### Daily:
- ✓ Check Risk page every trading session
- ✓ Note any violations
- ✓ Plan remediation if needed

### Weekly:
- ✓ Review position sizes
- ✓ Check if portfolio is diversified
- ✓ Ensure no single asset >20%

### Monthly:
- ✓ Review risk limits
- ✓ Run backtest with current holdings
- ✓ Adjust strategy if needed

### Never:
- ✗ Ignore risk breaches
- ✗ Let position grow >30%
- ✗ Ignore drawdown warnings
- ✗ Set limits too tight (<15% positions)

---

## 📱 UI Navigation to Execute Actions

| Action | Page | Steps |
|--------|------|-------|
| **Reduce Positions** | Portfolio | Find assets, create sell orders |
| **Adjust Limits** | Settings → Risk Tolerance | Edit drawdown_limit, max_position_size |
| **Add Assets** | Portfolio | Modify weights in new strategy |
| **Pause Trading** | Settings/Dashboard | Disable strategy toggle |
| **Review Signals** | Signals page | View recent trading signals |
| **Run Backtest** | Backtester page | Create new backtest with current holdings |

---

## ✅ Success Criteria

**Risk breach is RESOLVED when**:
- Risk page shows: "Portfolio Within Limits" ✓
- All positions ≤ 20% (or new limit)
- No violation messages
- Status: `is_safe: true`

**Portfolio quality is IMPROVED when**:
- 12-15 assets held
- Each position 6-10%
- Low correlation between assets
- Stable drawdown
- Consistent returns

---

## 🆘 Need Help?

**For Settings changes**: Go to `/settings` page
**For Trading**: Use `/portfolio` page to adjust positions
**For Strategy Review**: Check `/backtest` and `/signals` pages
**For Risk Monitoring**: Use `/risk` page (current page)

---

## 📖 Documentation

See detailed guide: `RISK_CONTROL_GUIDE.md` in project root

