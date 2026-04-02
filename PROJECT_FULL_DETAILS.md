    # Project Full Details — Quant Trading Pipeline (quant_trade_MP)

    This document gathers full, discoverable details about the repository to help you prepare a presentation (PPT) and to onboard developers or AI coding agents. It is written from the codebase and repository structure — use it as the canonical, exportable summary.

    ## Table of contents
    - Overview (big picture)
    - Architecture & Data Flow
    - Components and Key Files
    - Data Models, Persistence & Schema
    - Feature Engineering (VAR) details
    - Portfolio Construction (Box–Tiao) details
    - Trade Signal Engine
    - Backtesting (walk-forward) details
    - API & Frontend Integration
    - Configuration & Environment
    - Developer Workflows (commands)
    - Debugging Hotspots & Common Fixes
    - Conventions & Coding Patterns
    - PR Checklist & Best Practices
    - Suggested PPT Slide-by-slide Outline
    - Suggested Diagrams & Visuals
    - Appendix: Useful paths & quick commands

    ---

    **Overview (Big Picture)**

    This repository implements a deterministic, persistable quant trading pipeline with five main stages:

    1. Data fetching: collect OHLCV price data (yfinance + normalization). Persist to `market_data` table.
    2. Feature engineering: compute standardized returns and estimate VAR(1) (A matrix + covariance). Persist diagnostics and matrices in `data/processed/var_outputs/` and `data/processed/diagnostics/`.
    3. Portfolio construction: apply Box–Tiao decomposition on standardized returns / covariance structure to select sparse eigenvectors and build weights.
    4. Trade signal generation: rules (mean-reversion) compute rebalance trades from target weights and deviation thresholds.
    5. Backtesting: walk-forward backtest that simulates rebalances, includes transaction costs (commission + slippage), and writes `results/backtest_report.json` and per-run CSVs.

    Key principle: services are stateless functions which read inputs and write outputs; intermediate artifacts are persisted for reproducibility and diagnostics.

    ---

    **Architecture & Data Flow**

    - Data source (e.g., Yahoo via `yfinance`) → `DataFetcher` normalizes OHLCV (UTC-aware, prefer `adj_close`) → `market_data` DB.
    - `FeatureEngineer` reads market data → computes returns → StandardScaler (zero-mean, unit var) → VAR(1) estimation → outputs: A matrix, covariance, standardized returns → persisted under `data/processed/var_outputs/<run_ts>/` and `data/processed/diagnostics/`.
    - `PortfolioConstructor` reads covariance (or VAR outputs) → Box–Tiao eigenvector decomposition → select top-K sparse components → apply constraints (clamp, long-only projection) → weights persisted in `portfolio_runs` DB.
    - `TradeSignalEngine` compares current holdings to target weights and generates trade orders when deviation > threshold.
    - `Backtester` simulates execution with costs and slippage, produces equity curves and trade logs under `results/`.

    Simple ASCII flow:

    ```text
    Yahoo/yf -> DataFetcher -> market_data DB
                |
                v
        FeatureEngineer -> var_outputs/ + diagnostics/
                |
                v
        PortfolioConstructor -> portfolio_runs DB
                |
                v
        TradeSignalEngine -> trades (in-memory) -> Backtester
                |
                v
            results/backtest_report.json + equity_*.csv
    ```

    ---

    **Components and Key Files**

    - Project root: `quant_trade_MP/` contains backend, scripts, frontend.
    - Backend entrypoint: `quant_trade_MP/app/main.py` — FastAPI app.
    - API routes: `quant_trade_MP/app/api/` — route modules exposing endpoints.
    - Config & settings: `quant_trade_MP/app/core/config.py` — Pydantic `BaseSettings` for env-driven config.
    - Services: `quant_trade_MP/app/services/` contains core pipeline implementations:
    - `data_fetcher.py` — normalization and DB ingestion (look for `_normalize_yf_df()`)
    - `feature_engineer.py` — standardization and VAR estimation
    - `portfolio_constructor.py` — Box–Tiao decomposition and weight helpers (`_project_to_long_only()`, `_clamp_max_weight()`)
    - `trade_signal_engine.py` — rebalance decision logic
    - `backtester.py` — simulation and metrics
    - Scripts: `quant_trade_MP/scripts/` — orchestration and CLI-like jobs
    - `walkforward_backtest.py` — main pipeline orchestration (walk-forward)
    - Frontend: `quant_trade_MP/frontend/` (Vite + React + TypeScript)
    - `vite.config.ts` — dev server proxy `/api -> http://127.0.0.1:8000`
    - `frontend/src/*` — React pages, components and API calls
    - Tests & verification: root-level `test_*.py` files (pytest)

    Files that illustrate patterns: `quant_trade_MP/.github/copilot-instructions.md` (existing agent guidance), `quant_trade_MP/README.md`, and `quant_trade_MP/frontend/README.md`.

    ---

    **Data Models, Persistence & Schema**

    The repository stores both relational DB tables and filesystem artifacts.

    Key DB tables (discoverable from code and naming patterns):

    - `market_data`:
    - columns: `symbol`, `date` (UTC-aware datetime), `open`, `high`, `low`, `close`, `adj_close`, `volume`
    - constraints: `UNIQUE(symbol, date)`; indexed for lookups

    - `var_runs`:
    - fields: `run_id`, `run_name`, `symbols` (JSON), `method`, `diagnostics` (JSON), `created_at`
    - diagnostics contain: `n_obs`, `used_ridge_lambda`, `condition_number`, `eigenvalues`

    - `portfolio_runs`:
    - `run_name`, `symbols` (JSON), `weights_json`, `method`, `metrics` (JSON), `created_at`

    Filesystem persistence:

    - `data/processed/var_outputs/<timestamp>/` — saved A matrix, covariance matrix, standardized returns, and metadata (CSV/parquet/JSON).
    - `data/processed/diagnostics/` — VAR diagnostics JSON files (see `diag_*.json`).
    - `results/` — backtest outputs: `backtest_report.json`, `equity_<id>.csv`, `trades_<id>.csv`.

    Pattern: JSON columns used to avoid frequent DB migrations when adding diagnostics & metrics.

    ---

    **Feature Engineering (VAR) details**

    - VAR model: VAR(1) is the canonical model. Implementation standardizes returns (zero mean, unit variance) before estimating the transition matrix `A` and covariance.
    - Standardization: uses `sklearn.preprocessing.StandardScaler` (or a custom StandardScaler-equivalent). Always fit on the training window only (no look-ahead).
    - Ridge / regularization: VAR estimation uses ridge or numerical regularization to avoid singular covariance errors. Diagnostics record used regularization.
    - Outputs: A matrix (state transition), residual covariance matrix, standardized returns. Persisted for reproducibility and diagnostics.

    Important notes for modification:
    - Always persist any change in preprocessing (e.g., different standardization, winsorization) as a new `var_run` with metadata explaining the change.

    ---

    **Portfolio Construction (Box–Tiao) details**

    - Approach: Box–Tiao sparse eigenvector selection on VAR / covariance structure to find direction(s) with predictive structure.
    - Selection: pick top-K assets by absolute eigenvector loading; K is configurable (e.g., `DEFAULT_SPARSITY` in config).
    - Weight rules:
    - Long-only projection: `_project_to_long_only()` ensures non-negative weights and renormalizes to sum≈1.0.
    - Max position clamps via `_clamp_max_weight()` to enforce `MAX_POSITION_SIZE`.
    - If the algorithm produces NaNs, clamp and renormalize. Never allow NaN weights to flow to the backtester.

    Implementation notes:
    - Decompose on standardized returns; denormalize weights onto price levels only after selection (to avoid scale bias).

    ---

    **Trade Signal Engine**

    - Core rule: mean-reversion deviation threshold.

    Pseudocode:

    ```python
    deviation = (current_value - target_value) / target_value
    if deviation > DEVIATION_THRESHOLD:  # SELL
        action = 'sell'
    elif deviation < -DEVIATION_THRESHOLD: # BUY
        action = 'buy'
    else:
        action = 'hold'
    ```

    - `DEVIATION_THRESHOLD` default: ~0.02 (2%), configured in `app/core/config.py` or in `TradeSignal` config.
    - Trade generation converts target weight differences into trade quantities considering current holdings and position limits.

    ---

    **Backtesting (Walk-forward) details**

    - Walk-forward pipeline: for each rebalance date, training window is used to estimate VAR and compute weights. Weights are fixed until next rebalance.
    - Costs: commission and slippage (defaults: 0.05% commission + 0.05% slippage — configurable in `BacktestConfig`).
    - Outputs:
    - `results/backtest_report.json`: summary metrics (return, vol, sharpe, max drawdown).
    - `results/equity_<id>.csv`: daily equity curve and returns.
    - `results/trades_<id>.csv`: trade logs and execution details.

    Testing/backtest sanity checks:
    - Compare `var_runs` diagnostics across training windows when results diverge.
    - Check that weights persist and that trades were generated (no missing trades due to NaNs).

    ---

    **API & Frontend Integration**

    - Backend uses FastAPI (`app/main.py`). Routes are defined in `app/api/` and use Pydantic models in `app/models/` for request/response validation.
    - Swagger and OpenAPI docs available at `http://localhost:8000/docs` while dev backend runs.
    - Frontend (Vite + React + TypeScript): `quant_trade_MP/frontend/`.
    - Proxy: `vite.config.ts` redirects `/api` to backend during development.
    - Keep API shapes stable — update Pydantic models and mirror types in frontend when changing.

    Example API flows:
    - `POST /api/portfolio/construct` — triggers DataFetcher → FeatureEngineer → PortfolioConstructor (returns run id and weights).
    - `POST /api/backtest/run` — initiates backtest using stored or computed weights.

    ---

    **Configuration & Environment**

    - Env vars via `app/core/config.py` (Pydantic `BaseSettings`). Important entries:
    - `DATABASE_URL` — example: `sqlite:///./test.db` or a PostgreSQL URI.
    - `DEFAULT_SPARSITY` — top-K for Box–Tiao selection.
    - `DEVIATION_THRESHOLD` — rebalance rule.
    - `MAX_POSITION_SIZE` — per-asset cap.

    - Recommended local dev patterns:
    - Create `.env` at repository root with `DATABASE_URL=sqlite:///./test.db`.
    - Use a virtual environment; tests assume dependencies from `requirements.txt` or `requirements-server.txt`.

    ---

    **Developer Workflows (commands)**

    Start backend (PowerShell):

    ```powershell
    cd quant_trade_MP
    .\.venv\Scripts\Activate.ps1
    uvicorn app.main:app --reload --port 8000
    # visit http://127.0.0.1:8000/docs
    ```

    Run the full walk-forward backtest:

    ```powershell
    cd quant_trade_MP
    python scripts/walkforward_backtest.py
    # outputs go to results/
    ```

    Run tests (PowerShell):

    ```powershell
    cd quant_trade_MP
    .\.venv\Scripts\Activate.ps1
    pytest -q
    ```

    Start frontend dev server:

    ```powershell
    cd quant_trade_MP/frontend
    npm install   # first time
    npm run dev
    ```

    Inspect persisted artifacts:

    ```powershell
    ls data/processed/diagnostics/
    ls data/processed/var_outputs/
    ls results/
    ```

    ---

    **Debugging Hotspots & Common Fixes**

    - Symptom: `TypeError: can't compare naive/aware datetime`
    - Cause: Missing `.tz_localize('UTC')` on a `DatetimeIndex`.
    - Fix: Check `_normalize_yf_df()` in `data_fetcher.py`; ensure all merges and joins use UTC-aware datetimes.

    - Symptom: Singular covariance or VAR estimation fails
    - Cause: Too few observations or near-perfect collinearity.
    - Fixes: increase ridge regularization, reduce symbol set, extend date range. Diagnostics in `var_runs` show condition numbers.

    - Symptom: NaN weights or weights not summing to 1
    - Cause: Numerical instability or selection returned zeros
    - Fix: Inspect `portfolio_constructor.py` selection logic and call `_clamp_max_weight()` then `_project_to_long_only()`.

    - Symptom: Frontend 404 on `/api/*`
    - Cause: Backend not running or proxy misconfigured.
    - Fix: Start the backend (see commands above); confirm `frontend/vite.config.ts` proxies `/api` to `http://127.0.0.1:8000`.

    ---

    **Conventions & Coding Patterns**

    - Stateless services: most `app/services/*` modules are pure functions taking inputs and returning outputs; persistence is handled separately.
    - Persist diagnostics and matrices under `data/processed/` — this is a crucial reproducibility requirement.
    - Use `adj_close` for strategy logic; fallback to `close` is handled in normalizer but avoid changing this globally.
    - Use Pydantic models to define API contracts and mirror those types into the frontend TypeScript definitions.

    ---

    **PR Checklist & Best Practices**

    1. Preserve persisted artifacts (don't delete `data/processed/` without a migration note).
    2. Preserve UTC-awareness for all datetimes.
    3. Run `pytest` locally and run a small walk-forward run if your change affects pipeline outputs.
    4. Update Pydantic models and frontend types when API contracts change; verify on `/docs`.
    5. If you change VAR or weight-selection logic, add a `var_run` entry and store diagnostics for traceability.

    ---

    **Suggested PPT Slide-by-slide Outline**

    1. Title: Project name, short tagline, and author
    2. Executive Summary: one-paragraph overview and key results (e.g., backtest returns)
    3. Architecture Diagram: 5-stage pipeline flow (Data → Features → Portfolio → Signals → Backtest)
    4. Data Sources & Normalization: `yfinance`, `adj_close`, UTC handling
    5. Feature Engineering: VAR(1) overview and what is persisted
    6. Portfolio Construction: Box–Tiao idea and weight constraints
    7. Signal Rules: mean-reversion and deviation threshold
    8. Backtest Design: walk-forward logic, costs, and outputs
    9. Results: Example metrics and equity curve snapshot (use `results/*` CSVs)
    10. Persistence & Reproducibility: `data/processed/` and `var_runs`/`portfolio_runs`
    11. Developer Workflow: commands to run backend, tests, frontend, backtest
    12. Debugging & Common Issues: top 5 hotspots and fixes
    13. Next Steps & Roadmap: experimental ideas, parameter sweeps, live deployment
    14. Appendix: key file references and important config settings

    Tips for slides:
    - Keep diagrams simple: use arrows for data flow and boxes for services.
    - Use sample output charts from `results/equity_*.csv` for visuals.

    ---

    **Suggested Diagrams & Visuals**

    - Pipeline flow diagram (box + arrow): DataFetcher → FeatureEngineer → PortfolioConstructor → TradeSignalEngine → Backtester.
    - VAR explanation: small block showing input returns → Standardization → A matrix + covariance → eigenvectors.
    - Equity curve: plot `equity_*.csv` — show cumulative return, drawdown band.
    - Table showing `var_runs` diagnostics (n_obs, cond_number, ridge lambda) across consecutive windows.

    ---

    **Appendix: Useful paths & quick commands**

    - Backend entry: `quant_trade_MP/app/main.py`
    - Pipeline script: `quant_trade_MP/scripts/walkforward_backtest.py`
    - Services: `quant_trade_MP/app/services/` (data_fetcher, feature_engineer, portfolio_constructor, trade_signal_engine, backtester)
    - Frontend: `quant_trade_MP/frontend/` (Vite, `vite.config.ts`)
    - Persisted artifacts: `data/processed/var_outputs/`, `data/processed/diagnostics/`, `results/`

    Quick commands (PowerShell):

    ```powershell
    # Backend dev
    cd quant_trade_MP; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000

    # Full pipeline
    cd quant_trade_MP; python scripts/walkforward_backtest.py

    # Tests
    cd quant_trade_MP; .\.venv\Scripts\Activate.ps1; pytest -q

    # Frontend
    cd quant_trade_MP/frontend; npm install; npm run dev
    ```

    ---

    If you want, I can:

    - extract sample metrics and a small equity-curve image from `results/` for slide inclusion (I can generate a small PNG),
    - produce a slide deck (PowerPoint) with the slides described above (I can generate a basic PPTX), or
    - expand any section above into detailed speaker notes or slide text.

    Please tell me which next step you prefer (generate PPTX, export images from `results/`, or expand particular sections into deeper detail).
