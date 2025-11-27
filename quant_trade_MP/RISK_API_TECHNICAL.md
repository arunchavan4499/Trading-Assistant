# Risk Control - Technical Implementation Guide

## Overview
This guide shows developers and advanced users how to control risk programmatically via the API.

---

## API Endpoints for Risk Control

### 1. Get Risk Status
```
GET /api/risk/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "is_safe": false,
    "current_drawdown": 0.0,
    "drawdown_limit": 0.2,
    "max_drawdown_limit": 0.2,
    "drawdown_warning": false,
    "violations": ["Max position 25.62% exceeds 20% threshold"],
    "message": "Risk limits breached",
    "timestamp": "2025-11-23T08:35:20.374176",
    "portfolio_id": 36,
    "max_position": 0.25624751518335337,
    "total_exposure": 1.0,
    "position_limits": {
      "AAPL": {"current": 0.1809, "max": 0.3},
      "MSFT": {"current": 0.2468, "max": 0.3},
      "GOOGL": {"current": 0.2562, "max": 0.3},
      "AMZN": {"current": 0.1354, "max": 0.3},
      "META": {"current": 0.1520, "max": 0.3},
      "TSLA": {"current": 0.0286, "max": 0.3}
    },
    "position_sizes": {
      "AAPL": 0.1809,
      "MSFT": 0.2468,
      "GOOGL": 0.2562,
      "AMZN": 0.1354,
      "META": 0.1520,
      "TSLA": 0.0286
    }
  }
}
```

---

### 2. Get Risk Limits Configuration
```
GET /api/risk/limits
```

**Response**:
```json
{
  "success": true,
  "data": {
    "limits": {
      "max_position_fraction": 0.2,
      "max_portfolio_exposure": 1.0,
      "min_cash_buffer": 0.0,
      "use_half_kelly": true,
      "max_drawdown": 0.2
    }
  }
}
```

---

### 3. Update Risk Limits
```
PUT /api/risk/limits

Body:
{
  "max_drawdown": 0.25,
  "max_position_size": 0.30,
  "min_cash_buffer": 0.05,
  "max_leverage": 1.5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "limits": {
      "max_position_fraction": 0.30,
      "max_portfolio_exposure": 1.0,
      "min_cash_buffer": 0.05,
      "use_half_kelly": true,
      "max_drawdown": 0.25
    }
  }
}
```

---

### 4. Validate Risk for Proposed Weights
```
POST /api/risk/validate

Body:
{
  "weights": {
    "AAPL": 0.15,
    "MSFT": 0.20,
    "GOOGL": 0.20,
    "AMZN": 0.15,
    "META": 0.15,
    "TSLA": 0.10,
    "NVDA": 0.05
  },
  "current_equity": 100000,
  "peak_equity": 100000,
  "limits": {
    "max_drawdown": 0.25,
    "max_position_size": 0.30,
    "min_cash_buffer": 0.0,
    "max_leverage": 1.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "is_safe": true,
    "current_drawdown": 0.0,
    "max_drawdown_limit": 0.25,
    "drawdown_warning": false,
    "violations": [],
    "message": "Portfolio is safe",
    "timestamp": "2025-11-23T08:35:20.374176"
  }
}
```

---

## Implementation Examples

### Python Example: Check and Auto-Resolve Breaches

```python
import requests
import json

API_BASE = "http://localhost:8000/api"

class RiskController:
    def __init__(self, base_url=API_BASE):
        self.base_url = base_url
    
    def get_risk_status(self):
        """Get current risk status"""
        response = requests.get(f"{self.base_url}/risk/status")
        return response.json()['data']
    
    def is_breached(self):
        """Check if portfolio has breach"""
        status = self.get_risk_status()
        return not status['is_safe']
    
    def get_violations(self):
        """Get list of violations"""
        status = self.get_risk_status()
        return status.get('violations', [])
    
    def get_oversized_positions(self):
        """Identify positions exceeding limits"""
        status = self.get_risk_status()
        oversized = {}
        
        for symbol, limit_data in status.get('position_limits', {}).items():
            current = limit_data['current']
            max_limit = limit_data['max']
            
            if current > max_limit * 0.85:  # Flag if >85% of max
                oversized[symbol] = {
                    'current': current,
                    'max': max_limit,
                    'excess': current - (max_limit * 0.8)
                }
        
        return oversized
    
    def reduce_positions(self, target_ratio=0.8):
        """
        Generate reduction targets for oversized positions
        target_ratio: aim to keep position at X% of max limit
        """
        oversized = self.get_oversized_positions()
        reductions = {}
        
        for symbol, data in oversized.items():
            target = data['max'] * target_ratio
            to_sell = data['current'] - target
            reductions[symbol] = {
                'current': data['current'],
                'target': target,
                'to_sell': to_sell,
                'sell_pct': (to_sell / data['current']) * 100
            }
        
        return reductions
    
    def increase_limits(self, new_drawdown_limit=0.25, new_position_size=0.30):
        """Increase risk limits"""
        payload = {
            "max_drawdown": new_drawdown_limit,
            "max_position_size": new_position_size,
            "min_cash_buffer": 0.0,
            "max_leverage": 1.5
        }
        
        response = requests.put(
            f"{self.base_url}/risk/limits",
            json=payload
        )
        return response.json()['data']
    
    def validate_portfolio(self, weights):
        """
        Test if proposed weights are safe
        weights: dict of {symbol: weight}
        """
        status = self.get_risk_status()
        
        payload = {
            "weights": weights,
            "current_equity": 100000,
            "peak_equity": 100000,
            "limits": {
                "max_drawdown": status.get('max_drawdown_limit', 0.2),
                "max_position_size": 0.30,
                "min_cash_buffer": 0.0,
                "max_leverage": 1.5
            }
        }
        
        response = requests.post(
            f"{self.base_url}/risk/validate",
            json=payload
        )
        return response.json()['data']
    
    def auto_resolve(self, method='reduce'):
        """
        Automatically resolve breach
        method: 'reduce' | 'increase_limits' | 'diversify'
        """
        if not self.is_breached():
            print("No breach detected")
            return False
        
        violations = self.get_violations()
        print(f"Violations: {violations}")
        
        if method == 'reduce':
            reductions = self.reduce_positions()
            print("Position reductions needed:")
            for symbol, data in reductions.items():
                print(f"  {symbol}: Sell {data['sell_pct']:.1f}%")
            return reductions
        
        elif method == 'increase_limits':
            new_limits = self.increase_limits(0.25, 0.30)
            print("Limits increased to:")
            print(f"  Max Drawdown: 25%")
            print(f"  Max Position: 30%")
            return new_limits
        
        return None


# Usage Example
if __name__ == "__main__":
    controller = RiskController()
    
    # Check status
    print("=== Risk Status ===")
    status = controller.get_risk_status()
    print(f"Safe: {status['is_safe']}")
    print(f"Message: {status['message']}")
    
    # Check for breach
    if controller.is_breached():
        print("\n⚠️ BREACH DETECTED")
        print("Violations:")
        for violation in controller.get_violations():
            print(f"  • {violation}")
        
        # Auto-resolve
        print("\n=== Auto-Resolve Option 1: Reduce Positions ===")
        reductions = controller.auto_resolve('reduce')
        
        print("\n=== Auto-Resolve Option 2: Increase Limits ===")
        controller.auto_resolve('increase_limits')
    else:
        print("\n✓ Portfolio is safe")
```

---

### TypeScript/JavaScript Example: Risk Monitor

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

interface RiskStatus {
  is_safe: boolean;
  current_drawdown: number;
  drawdown_limit: number;
  violations: string[];
  position_limits: Record<string, { current: number; max: number }>;
}

interface PositionReduction {
  symbol: string;
  current: number;
  target: number;
  to_sell: number;
  sell_pct: number;
}

class RiskMonitor {
  private apiBase = API_BASE;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Get current risk status
   */
  async getRiskStatus(): Promise<RiskStatus> {
    const response = await axios.get(`${this.apiBase}/risk/status`);
    return response.data.data;
  }

  /**
   * Check if portfolio is in breach
   */
  async isBreached(): Promise<boolean> {
    const status = await this.getRiskStatus();
    return !status.is_safe;
  }

  /**
   * Get positions that need reduction
   */
  async getOversizedPositions(threshold = 0.85): Promise<PositionReduction[]> {
    const status = await this.getRiskStatus();
    const oversized: PositionReduction[] = [];

    for (const [symbol, limitData] of Object.entries(
      status.position_limits || {}
    )) {
      const current = limitData.current;
      const max = limitData.max;

      if (current > max * threshold) {
        const target = max * 0.8;
        oversized.push({
          symbol,
          current,
          target,
          to_sell: current - target,
          sell_pct: ((current - target) / current) * 100,
        });
      }
    }

    return oversized;
  }

  /**
   * Increase risk limits
   */
  async increaseLimits(
    drawdownLimit = 0.25,
    positionSize = 0.3
  ): Promise<any> {
    const response = await axios.put(`${this.apiBase}/risk/limits`, {
      max_drawdown: drawdownLimit,
      max_position_size: positionSize,
      min_cash_buffer: 0,
      max_leverage: 1.5,
    });
    return response.data.data;
  }

  /**
   * Monitor risk continuously
   */
  startMonitoring(intervalMs = 60000): void {
    console.log(`Starting risk monitoring (every ${intervalMs}ms)`);

    this.checkInterval = setInterval(async () => {
      try {
        const isBreached = await this.isBreached();

        if (isBreached) {
          const status = await this.getRiskStatus();
          console.warn('⚠️ RISK BREACH DETECTED');
          console.warn(`Message: ${status.violations[0]}`);

          // Get recommendations
          const oversized = await this.getOversizedPositions();
          console.warn('Recommended reductions:');
          oversized.forEach((pos) => {
            console.warn(
              `  ${pos.symbol}: Sell ${pos.sell_pct.toFixed(1)}%`
            );
          });
        } else {
          console.log('✓ Portfolio safe');
        }
      } catch (error) {
        console.error('Error monitoring risk:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      console.log('Stopped risk monitoring');
    }
  }
}

// Usage
const monitor = new RiskMonitor();

// Check once
monitor.getRiskStatus().then((status) => {
  console.log('Status:', status.is_safe);
  console.log('Drawdown:', (status.current_drawdown * 100).toFixed(2) + '%');
});

// Monitor continuously
monitor.startMonitoring(30000); // Check every 30 seconds

// Later...
// monitor.stopMonitoring();
```

---

### cURL Examples

**Get Risk Status**:
```bash
curl -X GET "http://localhost:8000/api/risk/status" \
  -H "Content-Type: application/json"
```

**Get Risk Limits**:
```bash
curl -X GET "http://localhost:8000/api/risk/limits" \
  -H "Content-Type: application/json"
```

**Update Risk Limits**:
```bash
curl -X PUT "http://localhost:8000/api/risk/limits" \
  -H "Content-Type: application/json" \
  -d '{
    "max_drawdown": 0.25,
    "max_position_size": 0.30,
    "min_cash_buffer": 0.0,
    "max_leverage": 1.5
  }'
```

**Validate Portfolio**:
```bash
curl -X POST "http://localhost:8000/api/risk/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {
      "AAPL": 0.15,
      "MSFT": 0.20,
      "GOOGL": 0.20,
      "AMZN": 0.15,
      "META": 0.15,
      "TSLA": 0.10,
      "NVDA": 0.05
    },
    "current_equity": 100000,
    "peak_equity": 100000,
    "limits": {
      "max_drawdown": 0.25,
      "max_position_size": 0.30,
      "min_cash_buffer": 0.0,
      "max_leverage": 1.5
    }
  }'
```

---

## Risk Control Workflow

```
START
  ↓
[Call GET /api/risk/status]
  ↓
Is is_safe = true?
  ├─ YES → No action needed ✓
  └─ NO → Risk breach detected ⚠️
      ↓
      [Analyze violations]
      ↓
      Choose action:
      ├─ Option 1: Reduce positions
      │   ├─ Get oversized from position_limits
      │   ├─ Calculate reduction amounts
      │   └─ Execute sells
      │
      ├─ Option 2: Increase limits
      │   ├─ Call PUT /api/risk/limits
      │   ├─ Update max_drawdown, max_position_size
      │   └─ New limits apply
      │
      ├─ Option 3: Validate new weights
      │   ├─ Call POST /api/risk/validate
      │   ├─ Check is_safe in response
      │   └─ If safe, execute trades
      │
      └─ Option 4: Pause & review
          └─ Disable strategy
      ↓
[Call GET /api/risk/status again]
  ↓
is_safe = true?
  ├─ YES → Breach resolved ✓
  └─ NO → Need more action (repeat)
```

---

## Monitoring Best Practices

1. **Check Daily**: Call GET /risk/status every trading session
2. **Alert on Breach**: Log/notify when is_safe = false
3. **Auto-Reduce**: Automatically reduce oversized positions
4. **Validate Changes**: Use POST /risk/validate before executing trades
5. **Track History**: Log all risk changes for analysis

---

## Performance Considerations

- **Status calls**: Can make frequently (< 1 second overhead)
- **Limit updates**: Cache locally, update every hour
- **Validation**: Heavy computation, use when needed (~500ms)
- **Monitoring**: Every 30-60 seconds is recommended

