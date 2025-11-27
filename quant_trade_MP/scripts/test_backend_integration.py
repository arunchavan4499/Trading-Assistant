#!/usr/bin/env python
"""
Backend Integration Test Script
Tests all services to verify backend functionality before connecting frontend.
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_imports():
    """Test that all services can be imported."""
    print("=" * 60)
    print("BACKEND INTEGRATION TEST")
    print("=" * 60)
    print("\n1. Testing imports...")
    
    try:
        from app.core.config import settings
        print("   ✓ config imported")
        
        from app.models.database import init_db, engine, SessionLocal, User, MarketData, Portfolio, Trade
        print("   ✓ database models imported")
        
        from app.services.data_fetcher import DataFetcher
        print("   ✓ DataFetcher imported")
        
        from app.services.feature_engineer import FeatureEngineer
        print("   ✓ FeatureEngineer imported")
        
        from app.services.portfolio_constructor import construct_portfolio_from_var_and_cov, PCOptions
        print("   ✓ PortfolioConstructor imported")
        
        from app.services.trade_signal_engine import TradeSignalEngine, SignalType
        print("   ✓ TradeSignalEngine imported")
        
        from app.services.backtester import Backtester, BacktestConfig
        print("   ✓ Backtester imported")
        
        from app.services.risk_manager import RiskManager, RiskConfig
        print("   ✓ RiskManager imported")
        
        from app.services.performance_evaluator import PerformanceEvaluator
        print("   ✓ PerformanceEvaluator imported")
        
        print("\n   All imports successful! ✓")
        return True
    except Exception as e:
        print(f"\n   ✗ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database():
    """Test database initialization."""
    print("\n2. Testing database initialization...")
    
    try:
        from app.models.database import init_db, engine
        from sqlalchemy import text
        
        # Initialize tables
        init_db()
        print("   ✓ Database tables created")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
            print("   ✓ Database connection verified")
        
        return True
    except Exception as e:
        print(f"   ✗ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_data_fetcher():
    """Test DataFetcher service."""
    print("\n3. Testing DataFetcher service...")
    
    try:
        from app.services.data_fetcher import DataFetcher
        import pandas as pd
        
        fetcher = DataFetcher()
        print("   ✓ DataFetcher instantiated")
        
        # Test normalization logic (without actual download)
        sample_df = pd.DataFrame({
            'Open': [100, 101, 102],
            'High': [105, 106, 107],
            'Low': [99, 100, 101],
            'Close': [103, 104, 105],
            'Adj Close': [103, 104, 105],
            'Volume': [1000000, 1100000, 1200000]
        }, index=pd.date_range('2024-01-01', periods=3, freq='D'))
        
        normalized = fetcher._normalize_yf_df(sample_df, 'TEST')
        assert normalized is not None
        assert 'adj_close' in normalized.columns
        print("   ✓ DataFrame normalization works")
        
        return True
    except Exception as e:
        print(f"   ✗ DataFetcher test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_feature_engineer():
    """Test FeatureEngineer service."""
    print("\n4. Testing FeatureEngineer service...")
    
    try:
        from app.services.feature_engineer import FeatureEngineer, FeatureConfig
        import pandas as pd
        import numpy as np
        
        fe = FeatureEngineer()
        print("   ✓ FeatureEngineer instantiated")
        
        # Create sample data
        dates = pd.date_range('2024-01-01', periods=100, freq='D', tz='UTC')
        sample_data = pd.DataFrame({
            'open': np.random.randn(100).cumsum() + 100,
            'high': np.random.randn(100).cumsum() + 102,
            'low': np.random.randn(100).cumsum() + 98,
            'close': np.random.randn(100).cumsum() + 100,
            'adj_close': np.random.randn(100).cumsum() + 100,
            'volume': np.random.randint(1000000, 2000000, 100)
        }, index=dates)
        
        features = fe._compute_all_features(sample_data)
        assert not features.empty
        assert 'return' in features.columns
        print("   ✓ Feature computation works")
        
        return True
    except Exception as e:
        print(f"   ✗ FeatureEngineer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_portfolio_constructor():
    """Test PortfolioConstructor service."""
    print("\n5. Testing PortfolioConstructor service...")
    
    try:
        from app.services.portfolio_constructor import construct_portfolio_from_var_and_cov, PCOptions
        import pandas as pd
        import numpy as np
        
        # Create sample data
        n_assets = 5
        n_obs = 50
        symbols = [f'ASSET{i}' for i in range(n_assets)]
        
        # Standardized returns
        standardized = pd.DataFrame(
            np.random.randn(n_obs, n_assets),
            columns=symbols,
            index=pd.date_range('2024-01-01', periods=n_obs, freq='D')
        )
        
        # VAR matrix and covariance
        A = np.eye(n_assets) * 0.9 + np.random.randn(n_assets, n_assets) * 0.01
        cov = np.eye(n_assets) * 0.5 + np.random.randn(n_assets, n_assets) * 0.05
        cov = (cov + cov.T) / 2  # make symmetric
        
        opts = PCOptions(method='sparse_mean_reverting', sparsity_k=3, persist=False)
        
        weights, metrics = construct_portfolio_from_var_and_cov(
            standardized, A, cov, None, symbols, opts
        )
        
        assert len(weights) == n_assets
        assert abs(weights.sum() - 1.0) < 0.01  # weights sum to ~1
        print("   ✓ Portfolio construction works")
        print(f"      Weights sum: {weights.sum():.4f}")
        print(f"      Non-zero assets: {(weights != 0).sum()}")
        
        return True
    except Exception as e:
        print(f"   ✗ PortfolioConstructor test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_signal_engine():
    """Test TradeSignalEngine service."""
    print("\n6. Testing TradeSignalEngine service...")
    
    try:
        from app.services.trade_signal_engine import TradeSignalEngine, SignalType
        
        engine = TradeSignalEngine(deviation_threshold=0.02)
        print("   ✓ TradeSignalEngine instantiated")
        
        # Test signal generation
        target_weights = {'AAPL': 0.3, 'MSFT': 0.25, 'GOOGL': 0.2}
        current_qty = {'AAPL': 100, 'MSFT': 80, 'GOOGL': 50}
        prices = {'AAPL': 180.5, 'MSFT': 350.0, 'GOOGL': 140.5}
        
        plan = engine.generate_portfolio_rebalance(
            target_weights, current_qty, prices, capital=100000
        )
        
        assert 'trades' in plan
        assert 'summary' in plan
        print("   ✓ Rebalance plan generation works")
        print(f"      L1 Deviation: {plan['summary']['l1_deviation']:.4f}")
        
        return True
    except Exception as e:
        print(f"   ✗ TradeSignalEngine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_backtester():
    """Test Backtester service."""
    print("\n7. Testing Backtester service...")
    
    try:
        from app.services.backtester import Backtester, BacktestConfig
        import pandas as pd
        import numpy as np
        
        cfg = BacktestConfig(initial_capital=100000, persist_trades=False)
        backtester = Backtester(cfg)
        print("   ✓ Backtester instantiated")
        
        # Create sample price data
        dates = pd.date_range('2024-01-01', periods=30, freq='D')
        symbols = ['AAPL', 'MSFT']
        
        price_data = {}
        for sym in symbols:
            price_data[sym] = pd.DataFrame({
                'close': np.random.randn(30).cumsum() + 100,
                'volume': np.random.randint(1000000, 2000000, 30)
            }, index=dates)
        
        # Simple equal weight portfolio
        weights = {'AAPL': 0.5, 'MSFT': 0.5}
        
        equity_df, trades_df = backtester.simulate(
            weights, price_data, rebalance_dates=[dates[0], dates[15]]
        )
        
        assert not equity_df.empty
        print("   ✓ Backtesting works")
        print(f"      Final equity: ${equity_df['equity'].iloc[-1]:,.2f}")
        
        return True
    except Exception as e:
        print(f"   ✗ Backtester test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_risk_manager():
    """Test RiskManager service."""
    print("\n8. Testing RiskManager service...")
    
    try:
        from app.services.risk_manager import RiskManager, RiskConfig
        from app.models.database import User
        
        # Create mock user
        user = User(
            id=1,
            name="Test User",
            email="test@example.com",
            capital=100000,
            drawdown_limit=0.25
        )
        
        cfg = RiskConfig(max_position_fraction=0.20)
        rm = RiskManager(user, cfg)
        print("   ✓ RiskManager instantiated")
        
        # Test position size check
        weights = {'AAPL': 0.15, 'MSFT': 0.15, 'GOOGL': 0.10}
        ok, msg = rm.check_position_sizes(weights, capital=100000)
        assert ok
        print("   ✓ Position size validation works")
        
        # Test drawdown check
        ok, msg = rm.check_drawdown(current_equity=80000, peak_equity=100000)
        assert ok  # 20% DD < 25% limit
        print("   ✓ Drawdown validation works")
        
        return True
    except Exception as e:
        print(f"   ✗ RiskManager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_performance_evaluator():
    """Test PerformanceEvaluator service."""
    print("\n9. Testing PerformanceEvaluator service...")
    
    try:
        from app.services.performance_evaluator import PerformanceEvaluator
        import pandas as pd
        import numpy as np
        
        pe = PerformanceEvaluator()
        print("   ✓ PerformanceEvaluator instantiated")
        
        # Create sample equity curve
        dates = pd.date_range('2024-01-01', periods=252, freq='D')
        equity = pd.Series(
            100000 * (1 + np.random.randn(252).cumsum() * 0.01),
            index=dates
        )
        
        metrics = pe.summary_metrics(equity)
        assert 'sharpe' in metrics
        assert 'max_drawdown' in metrics
        print("   ✓ Performance metrics calculation works")
        print(f"      Sharpe Ratio: {metrics['sharpe']:.2f}")
        print(f"      Max Drawdown: {metrics['max_drawdown']*100:.2f}%")
        
        return True
    except Exception as e:
        print(f"   ✗ PerformanceEvaluator test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all integration tests."""
    tests = [
        test_imports,
        test_database,
        test_data_fetcher,
        test_feature_engineer,
        test_portfolio_constructor,
        test_signal_engine,
        test_backtester,
        test_risk_manager,
        test_performance_evaluator
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"\n   CRITICAL ERROR in {test.__name__}: {e}")
            import traceback
            traceback.print_exc()
            results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("\n✓ ALL BACKEND INTEGRATION TESTS PASSED!")
        print("\nBackend is ready for frontend integration.")
        print("\nNext steps:")
        print("  1. Fix frontend TypeScript errors")
        print("  2. Create backend API endpoints (FastAPI/Flask)")
        print("  3. Start backend server on port 8000")
        print("  4. Test frontend-backend communication")
        return 0
    else:
        print(f"\n✗ {total - passed} tests failed.")
        print("\nPlease fix the issues above before proceeding.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
