
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, ForeignKey, BigInteger, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
from sqlalchemy import UniqueConstraint, Index, DateTime, BigInteger


# ... your models here (unchanged) ...
# change volume type to BigInteger (if desired) and date/time columns to timezone-aware
# e.g. date = Column(DateTime(timezone=True), index=True)
# created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

# Database connection (use settings.DATABASE_URL)
from app.core.config import settings

Base = declarative_base()

# User Profile Model
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    risk_tolerance = Column(Float)  # 0.0 to 1.0
    capital = Column(Float)
    max_assets = Column(Integer, default=20)
    drawdown_limit = Column(Float, default=0.25)  # 25% max drawdown
    max_position_size = Column(Float, default=0.20)  # 20% max per position
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    trades = relationship("Trade", back_populates="user")

# Market Data Model
class MarketData(Base):
    __tablename__ = 'market_data'
    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), index=True, nullable=False)
    date = Column(DateTime(timezone=True), index=True, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    adj_close = Column(Float)   # NEW
    volume = Column(BigInteger)

    __table_args__ = (
        UniqueConstraint('symbol', 'date', name='uix_symbol_date'),
        Index('ix_market_symbol_date', 'symbol', 'date'),
    )

# Portfolio Model
class Portfolio(Base):
    __tablename__ = 'portfolios'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    current_equity = Column(Float, default=0.0)  # Current portfolio value
    peak_equity = Column(Float, default=0.0)     # All-time high equity (for drawdown calc)
    assets = Column(JSON)  # {"AAPL": 0.15, "MSFT": 0.20, ...}
    method = Column(String(50))  # "sparse_mr", "ml_enhanced", etc.
    backtest_sharpe = Column(Float)
    backtest_max_drawdown = Column(Float)
    
    user = relationship("User", back_populates="portfolios")


# VAR runs metadata (dialect-agnostic)
class VarRun(Base):
    __tablename__ = 'var_runs'

    id = Column(Integer, primary_key=True)
    run_name = Column(String(200))
    symbols = Column(JSON)  # list of symbols
    ridge_lambda = Column(Float, default=0.0)
    a_matrix = Column(JSON)
    cov_matrix = Column(JSON)
    std_matrix = Column(JSON)
    diagnostics = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

# Trade Model
class Trade(Base):
    __tablename__ = 'trades'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    portfolio_id = Column(Integer, ForeignKey('portfolios.id'))
    timestamp = Column(DateTime, default=datetime.utcnow)
    symbol = Column(String(10))
    side = Column(String(4))  # 'BUY' or 'SELL'
    quantity = Column(Integer)
    price = Column(Float)
    slippage = Column(Float)
    commission = Column(Float)
    pnl = Column(Float)
    
    user = relationship("User", back_populates="trades")

# Portfolio run metadata (dialect-agnostic replacement for previous raw SQL)
class PortfolioRun(Base):
    __tablename__ = 'portfolio_runs'

    id = Column(Integer, primary_key=True)
    run_name = Column(String(200))
    symbols = Column(JSON)            # list of symbols
    weights_json = Column(JSON)       # weight mapping
    method = Column(String(100))
    link_run_id = Column(Integer, nullable=True)
    metrics = Column(JSON)            # metrics dictionary
    current_equity = Column(Float, default=0.0)  # Current portfolio value
    peak_equity = Column(Float, default=0.0)     # All-time high equity (for drawdown calc)
    created_at = Column(DateTime, default=datetime.utcnow)


class BacktestRun(Base):
    __tablename__ = 'backtest_runs'

    id = Column(Integer, primary_key=True)
    run_name = Column(String(200))
    symbols = Column(JSON)
    config = Column(JSON)
    metrics = Column(JSON)
    equity_curve = Column(JSON)
    trades = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Database connection


DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)
