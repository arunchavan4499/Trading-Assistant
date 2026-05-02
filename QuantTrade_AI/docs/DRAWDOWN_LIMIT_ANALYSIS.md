# Drawdown Limit Implementation Analysis

## Issue Summary

The drawdown limit (`user.drawdown_limit`, default 0.25 = 25%) is **defined but NOT actively enforced** in the trading workflows. It exists in multiple places but without proper integration.

---

## Where Drawdown Limit Exists

### 1. **Database Model** ✅
**File**: `app/models/database.py`
```python
class User(Base):
    __tablename__ = 'users'
    drawdown_limit = Column(Float, default=0.25)  # 25% max drawdown
```
- ✅ Persisted per user
- ✅ Has sensible default (25%)
- ✅ Can be updated

### 2. **RiskManager Service** ⚠️ Partial
**File**: `app/services/risk_manager.py` (lines 61-70)
```python
def check_drawdown(self, current_equity: float, peak_equity: float) -> Tuple[bool, str]:
    """Check drawdown against user.drawdown_limit"""
    if peak_equity <= 0:
        return True, "No peak equity recorded"
    drawdown = (peak_equity - current_equity) / peak_equity
    if drawdown > getattr(self.user, "drawdown_limit", 1.0):
        return False, f"Drawdown {drawdown*100:.2f}% exceeds user limit..."
    return True, "Drawdown OK"
```
- ✅ Correctly calculates drawdown: `(peak - current) / peak`
- ✅ Compares against `user.drawdown_limit`
- ⚠️ **PROBLEM**: Default fallback is `1.0` (100%) instead of `0.25` (25%)
  - If `user.drawdown_limit` is missing/None, it defaults to 100%—effectively disabling the check!

### 3. **Risk API Endpoint** ⚠️ Partially Functional
**File**: `app/api/routes/risk.py` (lines 59-77)

#### Problem 1: Manual drawdown calculation without RiskManager
```python
# Line 59: Manual calculation, doesn't use RiskManager.check_drawdown()
drawdown = (request.peak_equity - request.current_equity) / request.peak_equity
if request.peak_equity > 0 else 0

# Line 76: HARDCODED limit instead of reading from user.drawdown_limit
max_dd = request.limits.max_drawdown if request.limits else 0.20
```
- ❌ Duplicates logic from RiskManager (line 59)
- ❌ Doesn't use database user's limit
- ❌ Hardcodes default to 0.20 (20%) instead of using config

#### Problem 2: GET /risk/status doesn't track peak_equity
```python
@router.get("/status", response_model=ApiResponse)
async def get_risk_status(db: Session = Depends(get_db)):
    # ... lines 87-122 ...
    latest_backtest = db.query(BacktestRunModel).order_by(...).first()
    if latest_backtest:
        metrics = latest_backtest.metrics or {}
        drawdown_observed = metrics.get("max_drawdown") or 0.0  # ← gets max_drawdown from backtest
    
    # No calculation of CURRENT drawdown relative to peak!
    # Only retrieves historical max_drawdown from backtest
```
- ❌ **CRITICAL**: Only reads `max_drawdown` from historical backtest metrics
- ❌ Does NOT calculate current drawdown: `(peak_equity_to_date - current_equity) / peak_equity_to_date`
- ❌ No tracking of running peak equity

---

## Where Drawdown Limit is NOT Being Enforced

### 1. **Signal Generation Endpoints** ❌
**File**: `app/api/routes/signals.py`
- No drawdown check in `/signals/rebalance`
- No drawdown check in `/signals/simple`
- No risk validation before generating trades

### 2. **Portfolio Construction Endpoints** ❌
**File**: `app/api/routes/portfolio.py`
- No drawdown check in `/portfolio/construct`
- No risk validation after computing weights

### 3. **Backtest Endpoint** ❌
**File**: `app/api/routes/backtest.py`
- No real-time drawdown limit enforcement during simulation
- Only computes final `max_drawdown` in metrics

### 4. **Backend Scripts** ⚠️
**File**: `scripts/walkforward_backtest.py`
- No reference to `user.drawdown_limit`
- No stopping/adjustment when drawdown limit exceeded
- No peak equity tracking across rebalance periods

---

## Root Causes

| Issue | Location | Impact |
|-------|----------|--------|
| **No peak equity tracking** | Database schema missing | Can't calculate running drawdown |
| **Wrong default in RiskManager** | `getattr(self.user, "drawdown_limit", 1.0)` | Effectively disables check if None |
| **RiskManager not called in workflows** | API routes, scripts | Checks exist but never executed |
| **Manual drawdown calculation in risk.py** | Lines 59, 76 | Duplicates logic, hardcoded limits |
| **No trade validation** | signals.py routes | Trades generated without risk check |
| **No rebalance-time enforcement** | backtester.py, walkforward_backtest.py | Drawdown limit not respected during backtest |

---

## What SHOULD Happen

### Desired Workflow (Currently Missing)

```
1. User sets drawdown_limit = 0.25 (25%)
2. Trade signal generated
   ↓
3. ✅ Validate against drawdown limit
   - Calculate: (peak_equity_to_date - current_equity) / peak_equity_to_date
   - If drawdown > 0.25: REJECT trade, return error
   - If drawdown ≤ 0.25: Approve trade
   ↓
4. Execute rebalance (if approved)
5. Update peak_equity tracker (if new all-time high)
6. On next signal: repeat from step 3
```

### Current Reality

```
1. User sets drawdown_limit = 0.25
2. Trade signal generated (NO validation)
3. ❌ SKIP drawdown check
4. Execute rebalance unconditionally
5. ❌ peak_equity never tracked
6. Drawdown limit completely ignored
```

---

## How to Fix

### Fix 1: Track Peak Equity (Required)
Add column to database to track all-time peak:
```python
# app/models/database.py
class Portfolio(Base):
    __tablename__ = 'portfolios'
    peak_equity = Column(Float, default=0.0)  # All-time high
    created_at = Column(DateTime, default=datetime.utcnow)
```

Or create separate table:
```python
class PortfolioSnapshot(Base):
    __tablename__ = 'portfolio_snapshots'
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey('portfolios.id'))
    timestamp = Column(DateTime, timezone=True)
    current_equity = Column(Float)
    peak_equity = Column(Float)  # Running all-time high
    drawdown = Column(Float)     # Current drawdown %
    created_at = Column(DateTime, timezone=True, default=datetime.utcnow)
```

### Fix 2: Fix RiskManager Default
```python
# app/services/risk_manager.py line 68
# BEFORE:
if drawdown > getattr(self.user, "drawdown_limit", 1.0):

# AFTER:
limit = getattr(self.user, "drawdown_limit", 0.25)  # Default 25%, not 100%!
if drawdown > limit:
```

### Fix 3: Call RiskManager in API Routes
```python
# app/api/routes/signals.py
@router.post("/rebalance", response_model=ApiResponse)
async def generate_rebalance_trades(request: GenerateRebalanceRequest):
    # ... existing code ...
    
    # ✅ ADD: Risk validation
    if hasattr(request, 'peak_equity') and hasattr(request, 'current_equity'):
        user = db.query(User).first()  # Get current user
        rm = RiskManager(user)
        ok, msg = rm.check_drawdown(request.current_equity, request.peak_equity)
        if not ok:
            return ApiResponse(success=False, message=msg, data=None)
    
    # Proceed with signal generation
    signal_engine = TradeSignalEngine()
    # ...
```

### Fix 4: Request/Response Models Need Peak Equity
```python
# app/models/schemas.py
class GenerateRebalanceRequest(BaseModel):
    target_weights: Dict[str, float]
    current_qty: Dict[str, int]
    prices: Dict[str, float]
    cash: Optional[float] = None
    capital: Optional[float] = None
    
    # ✅ ADD for risk checking:
    current_equity: Optional[float] = None
    peak_equity: Optional[float] = None
```

### Fix 5: Enforce in Backtester
```python
# app/services/backtester.py
def simulate(self, weights, price_data, ...):
    peak_equity = self.initial_capital
    
    for rebalance_idx, rebalance_date in enumerate(rebalance_dates):
        current_equity = equity_curve.iloc[...]['equity']
        drawdown = (peak_equity - current_equity) / peak_equity
        
        # ✅ Check against limit
        if self.user and drawdown > self.user.drawdown_limit:
            logger.warning(f"Drawdown {drawdown*100:.1f}% exceeds limit {self.user.drawdown_limit*100:.1f}%")
            # Option: Stop trading, reduce position size, or alert
            break  # Stop rebalancing
        
        # Update peak
        peak_equity = max(peak_equity, current_equity)
```

---

## Test Case to Verify Fix

```python
def test_drawdown_limit_enforcement():
    """
    Scenario:
    - User drawdown_limit = 0.20 (20%)
    - Peak equity = $100,000
    - Current equity = $75,000 (25% drawdown)
    - New trade requested
    
    Expected: Trade rejected with drawdown warning
    Current: Trade accepted ❌
    """
    user = User(drawdown_limit=0.20, capital=100000)
    rm = RiskManager(user)
    
    # Current drawdown: 25% > limit 20%
    ok, msg = rm.check_drawdown(current_equity=75000, peak_equity=100000)
    
    assert not ok, "Should reject trade when drawdown exceeds limit"
    assert "exceeds" in msg.lower()
    print(f"✅ Drawdown limit enforced: {msg}")
```

---

## Summary: What's Broken

| Component | Status | Issue |
|-----------|--------|-------|
| DB schema | ⚠️ Partial | Missing peak_equity tracking |
| RiskManager | ⚠️ Faulty | Wrong default (100% vs 25%) |
| API endpoints | ❌ Missing | No calls to RiskManager |
| Request models | ⚠️ Incomplete | Don't include peak_equity |
| Backtester | ❌ Missing | No real-time drawdown enforcement |
| Scripts | ❌ Missing | No drawdown limit reference |

**Severity**: HIGH - Risk limit is silently ignored, potentially allowing losses beyond user tolerance.

