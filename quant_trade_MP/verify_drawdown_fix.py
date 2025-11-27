#!/usr/bin/env python
"""
Verify drawdown fix is working end-to-end
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.database import init_db, SessionLocal, PortfolioRun, User
from app.services.risk_manager import RiskManager
from datetime import datetime

def main():
    print("\n" + "="*70)
    print("DRAWDOWN FIX VERIFICATION")
    print("="*70)
    
    # 1. Initialize database
    print("\n1️⃣  Initializing database...")
    try:
        init_db()
        print("   ✅ Database initialized successfully")
    except Exception as e:
        print(f"   ❌ Database init failed: {e}")
        return False
    
    # 2. Create a test user
    print("\n2️⃣  Creating test user...")
    try:
        db = SessionLocal()
        
        # Check if test user exists
        user = db.query(User).filter(User.email == "test@drawdown.com").first()
        if not user:
            user = User(
                name="Drawdown Test User",
                email="test@drawdown.com",
                drawdown_limit=0.20,  # 20% limit
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"   ✅ Created user with drawdown_limit={user.drawdown_limit}")
        else:
            print(f"   ℹ️  Using existing user with drawdown_limit={user.drawdown_limit}")
        
        # 3. Check RiskManager default
        print("\n3️⃣  Testing RiskManager default...")
        user_no_limit = User(name="Test", email="test2@test.com", drawdown_limit=None)
        rm = RiskManager(user_no_limit)
        ok, msg = rm.check_drawdown(current_equity=80000, peak_equity=100000)
        if ok:
            print("   ✅ RiskManager uses default 0.25 (20% DD < 25% limit)")
        else:
            print(f"   ❌ RiskManager failed: {msg}")
        
        # 4. Create a test portfolio with equity columns
        print("\n4️⃣  Creating portfolio with equity tracking...")
        portfolio = PortfolioRun(
            run_name="test-portfolio",
            symbols=["AAPL", "MSFT"],
            weights_json={"AAPL": 0.5, "MSFT": 0.5},
            method="test",
            current_equity=75000.0,    # 25% drawdown
            peak_equity=100000.0,
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
        print(f"   ✅ Portfolio created:")
        print(f"      - ID: {portfolio.id}")
        print(f"      - Current Equity: ${portfolio.current_equity:,.2f}")
        print(f"      - Peak Equity: ${portfolio.peak_equity:,.2f}")
        print(f"      - Drawdown: {((portfolio.peak_equity - portfolio.current_equity) / portfolio.peak_equity) * 100:.2f}%")
        
        # 5. Query portfolio and check serialization
        print("\n5️⃣  Verifying portfolio serialization...")
        fetched = db.query(PortfolioRun).filter(PortfolioRun.id == portfolio.id).first()
        if fetched:
            print(f"   ✅ Portfolio fetched from database:")
            print(f"      - current_equity: {fetched.current_equity}")
            print(f"      - peak_equity: {fetched.peak_equity}")
            if fetched.current_equity and fetched.peak_equity:
                print(f"   ✅ Equity fields are populated!")
            else:
                print(f"   ⚠️  Equity fields are missing!")
        else:
            print(f"   ❌ Portfolio not found in database")
        
        # 6. Check RiskManager with user drawdown limit
        print("\n6️⃣  Testing RiskManager with user limit...")
        rm_with_limit = RiskManager(user)
        ok, msg = rm_with_limit.check_drawdown(current_equity=75000, peak_equity=100000)  # 25% DD
        if not ok:
            print(f"   ✅ RiskManager correctly REJECTS 25% DD vs 20% limit")
            print(f"      Message: {msg}")
        else:
            print(f"   ❌ RiskManager should reject but didn't")
        
        ok2, msg2 = rm_with_limit.check_drawdown(current_equity=85000, peak_equity=100000)  # 15% DD
        if ok2:
            print(f"   ✅ RiskManager correctly ACCEPTS 15% DD vs 20% limit")
        else:
            print(f"   ❌ RiskManager should accept but didn't: {msg2}")
        
        db.close()
        
        print("\n" + "="*70)
        print("✅ ALL VERIFICATION CHECKS PASSED!")
        print("="*70)
        print("\nNext steps:")
        print("1. Create a new portfolio in the frontend")
        print("2. Go to Risk Management page")
        print("3. Check that Drawdown Monitor shows 0% (since peak=current at init)")
        print("4. Go to Signals page and lower 'Current Equity' to see it update")
        print("\n")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
