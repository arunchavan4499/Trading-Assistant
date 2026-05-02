# Risk Management Control Guide

## Overview
When your portfolio triggers a **RISK BREACH DETECTED** alert, you have 4 actionable options to control and resolve the issue.

---

## 🚨 Risk Breach Detection

A breach occurs when:
- **Position Size Violation**: A single asset exceeds max position limit (20%)
- **Drawdown Violation**: Portfolio drawdown exceeds configured limit (20%)
- **Exposure Violation**: Total portfolio exposure exceeds 100%
- **Asset Limit Violation**: Too many assets in portfolio

**Current Status**: Your portfolio has **GOOGL at 25.62%**, exceeding the 20% max position limit.

---

## 4 Ways to Control Risk Breaches

### ✅ Option 1: Reduce Oversized Positions

**Best For**: Single/few assets exceeding limits

**Steps**:
1. Go to **Portfolio** page
2. Identify assets highlighted in red (exceeding max %)
3. Sell portion of oversized positions
4. Target: Bring each asset to 80% of max limit

**Example**:
- GOOGL is at 25.62% (exceeds 20% max)
- Action: Sell 5-6% of GOOGL position
- Result: Bring GOOGL down to ~19-20%

**Pros**:
- Immediate risk reduction
- Maintains other positions
- Quick to execute

**Cons**:
- May realize losses
- Reduces upside exposure

---

### ✅ Option 2: Adjust Risk Limits

**Best For**: Strategy allows higher risk tolerance

**Steps**:
1. Go to **Settings** page
2. Update "Max Drawdown Limit" or "Max Position Size"
3. Save changes
4. Risk limits apply to all new trades

**Configurable Limits**:
- **Max Drawdown Limit**: Currently 20%, increase to 25-30%
- **Max Position Size**: Currently 20%, increase to 25-30%
- **Max Assets in Portfolio**: Currently 15

**Current Settings in Settings Page**:
```
Max Drawdown Limit:    20.00%
Max Position Size:     30.00%  (in backend, 20% in validation)
Max Assets Portfolio:  15
```

**Pros**:
- No position selling needed
- Allows strategy to operate normally
- Flexible approach

**Cons**:
- Increases portfolio risk
- Requires higher risk tolerance
- May not match strategy goals

---

### ✅ Option 3: Diversify Holdings

**Best For**: Concentrated portfolio

**Steps**:
1. Review current positions (Risk page shows 6 assets)
2. Add 2-3 uncorrelated assets
3. Rebalance to smaller, equal weights
4. Spread risk across more positions

**Current Portfolio Analysis**:
```
AAPL:   18.10% ✓ OK
MSFT:   24.69% ⚠️ HIGH
GOOGL:  25.62% ❌ BREACH
AMZN:   13.54% ✓ OK
META:   15.20% ✓ OK
TSLA:    2.86% ✓ OK
```

**Diversification Targets**:
- Add 2-3 new assets (e.g., NVDA, NFLX, AMD)
- Target: 10-15 total assets
- Target position size: 6-10% each

**Pros**:
- Reduces concentration risk
- Better long-term stability
- Improves correlation benefits

**Cons**:
- Slower to implement
- More positions to manage
- May dilute strategy focus

---

### ✅ Option 4: Pause & Review Strategy

**Best For**: Uncertain about market conditions

**Steps**:
1. **Pause Trading**: Stop new trade signals
2. **Review Signals**: Check what triggered the breach
3. **Backtest**: Run simulations with current data
4. **Assess**: Verify strategy still makes sense
5. **Resume**: When confident in approach

**Review Checklist**:
- [ ] Check market conditions (trend, volatility)
- [ ] Verify signal generation parameters
- [ ] Run recent backtest on 2024-2025 data
- [ ] Compare with risk management rules
- [ ] Check for drawdown trends
- [ ] Review correlations between holdings

**Where to Review**:
- **Backtest**: Dashboard → Backtester page
- **Signals**: Dashboard → Signals page
- **Portfolio**: Portfolio → View runs
- **Features**: Features → Check correlations

**Pros**:
- Prevents worse breaches
- Time to reassess
- Safer approach

**Cons**:
- Misses trading opportunities
- Takes time
- Opportunity cost

---

## 📊 Risk Monitoring Dashboard

**Current Metrics** (Real-time from Risk page):

| Metric | Value | Status | Action |
|--------|-------|--------|--------|
| Portfolio Safe | No | ❌ BREACH | Immediate action |
| Current Drawdown | 0.00% | ✓ OK | No action |
| Max Drawdown Limit | 20.00% | - | Increase if needed |
| Max Position GOOGL | 25.62% | ❌ EXCESS | Reduce 5%+ |
| Total Exposure | 100.0% | ✓ OK | At max |
| # of Assets | 6 | ✓ OK | Can add more |

---

## 🎯 Recommended Action Plan

### For Your Current Breach:

**Primary**: **Option 1 - Reduce Oversized Positions**
- Sell 5-6% of GOOGL (from 25.62% → 19.62%)
- Sell 4-5% of MSFT (from 24.69% → 20%)
- Result: Portfolio moves to safe zone

**Secondary**: **Option 3 - Diversify**
- After reducing breach positions, add 2-3 new assets
- Spread existing capital across more positions
- Reduces future concentration risk

**Ongoing**: **Option 2 - Adjust Limits**
- Evaluate if 20% max position is realistic
- Consider 25% as more realistic max
- Balance between risk control and strategy viability

---

## 🔄 Implementation Flow

```
RISK BREACH DETECTED
        ↓
   [Choose Action]
        ↓
    ┌─→ Option 1: Reduce Positions → Sell oversized assets
    ├─→ Option 2: Adjust Limits → Settings page
    ├─→ Option 3: Diversify → Add new assets
    └─→ Option 4: Pause & Review → Stop trading
        ↓
   [Monitor Risk Page]
        ↓
   Is Safe? NO → Go to [Choose Action]
   Is Safe? YES → Resume normal operations
```

---

## 📱 UI Controls

### On Risk Page:
1. **Risk Status Card**: Shows breach status
2. **Drawdown Monitor**: Visual progress bar
3. **Exposure by Asset**: Shows all positions
4. **Risk Limits**: Current configuration
5. **Action Controls** (New!): 4 options with details

### Click each action to expand details:
- ✓ Specific assets to reduce
- ✓ Limits to adjust
- ✓ Diversification suggestions
- ✓ Review checklist

---

## 🔧 API Endpoints Used

### Get Risk Status:
```bash
GET /api/risk/status
```
Returns: current_drawdown, drawdown_limit, position_limits, violations

### Get Risk Limits:
```bash
GET /api/risk/limits
```
Returns: max_drawdown, max_position_size, max_assets

### Update Risk Limits:
```bash
PUT /api/risk/limits
```
Body: { max_drawdown: 0.25, max_position_size: 0.30, ... }

### Validate Risk:
```bash
POST /api/risk/validate
```
Body: { weights, current_equity, peak_equity }

---

## 📋 Quick Reference

**When Breach Occurs**:
1. Check Risk page → see what violated
2. Choose best action for your situation
3. Implement changes
4. Monitor until "is_safe: true"
5. Resume trading

**Best Practices**:
- ✓ Check risk daily
- ✓ Don't ignore breaches
- ✓ Act quickly on violations
- ✓ Keep position sizes reasonable
- ✓ Diversify regularly
- ✓ Review strategy monthly

**Avoid**:
- ✗ Ignoring risk alerts
- ✗ Overconcentration (>25% in 1 asset)
- ✗ Excessive leverage
- ✗ Too few assets
- ✗ Setting limits too tight

---

## 📞 Support

**For More Help**:
- Review TECHNICAL_GUIDE.md for API details
- Check Portfolio page for rebalancing tools
- Use Backtest page to validate changes
- Monitor Dashboard for real-time metrics
