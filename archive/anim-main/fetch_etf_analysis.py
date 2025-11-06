#!/usr/bin/env python3
"""
ETF Historical Analysis Script
Fetches 20 years of daily data for 5 major ETFs and creates base 100 normalized chart
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import logging
from datetime import datetime, timedelta
import yfinance as yf

# Commented out the IBKR-specific import that might cause issues
# import sys
# import os
# sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'app', 'services', 'implementations', 'legacy', 'ib_utils'))
# from fetch import fetch_etf_historical_performance

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fetch_etf_data():
    """Fetch 20 years of daily data for 5 major ETFs"""

    # Selected ETFs representing different asset classes (optimized for 20-year history)
    etfs = {
        'SPY': 'S&P 500 (US Large Cap)',
        'IEF': '7-10Y Treasury Bonds',
        'GLD': 'Gold',
        'EFA': 'Developed Markets (MSCI EAFE)',
        'VNQ': 'REITs'
    }

    # Calculate date range for 20 years
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=20*365)).strftime('%Y-%m-%d')

    logger.info(f"Fetching ETF data from {start_date} to {end_date}")

    etf_data = {}

    for ticker, description in etfs.items():
        logger.info(f"Fetching data for {ticker} ({description})")

        try:
            # Use the ETF historical performance function from fetch.py
            performance_data = fetch_etf_historical_performance(
                etf_ticker=ticker,
                start_date=start_date,
                end_date=end_date
            )

            if performance_data:
                logger.info(f"Successfully fetched data for {ticker}")
                etf_data[ticker] = performance_data
            else:
                logger.warning(f"No data received for {ticker}")

        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {str(e)}")

    return etf_data

def get_price_series_directly():
    """Alternative approach: fetch price data directly using yfinance"""
    import yfinance as yf

    etfs = ['SPY', 'IEF', 'GLD', 'EFA', 'VNQ']

    # Calculate date range for 20 years
    end_date = datetime.now()
    start_date = end_date - timedelta(days=20*365)

    logger.info(f"Fetching price series directly from {start_date.date()} to {end_date.date()}")

    price_data = {}

    for ticker in etfs:
        logger.info(f"Fetching price series for {ticker}")

        try:
            etf = yf.Ticker(ticker)
            hist = etf.history(start=start_date, end=end_date, interval='1d')

            if not hist.empty:
                price_data[ticker] = hist['Close']
                logger.info(f"Fetched {len(hist)} days of data for {ticker}")
            else:
                logger.warning(f"No price data for {ticker}")

        except Exception as e:
            logger.error(f"Error fetching price data for {ticker}: {str(e)}")

    return price_data

def normalize_to_base_100(price_data):
    """Normalize all price series to base 100"""
    normalized_data = {}

    for ticker, prices in price_data.items():
        if len(prices) > 0:
            # Normalize to base 100 using first available price
            first_price = prices.iloc[0]
            normalized_prices = (prices / first_price) * 100
            normalized_data[ticker] = normalized_prices
            logger.info(f"Normalized {ticker}: {len(normalized_prices)} data points, base price: ${first_price:.2f}")

    return normalized_data

def calculate_equal_weight_portfolio(normalized_data):
    """Calculate equal weight portfolio (20% allocation to each ETF)"""
    if not normalized_data:
        return None

    # Get common dates for all ETFs
    all_dates = None
    for ticker, prices in normalized_data.items():
        if all_dates is None:
            all_dates = prices.index
        else:
            all_dates = all_dates.intersection(prices.index)

    if len(all_dates) == 0:
        logger.warning("No common dates found between ETFs")
        return None

    # Calculate equal weight portfolio (20% each)
    equal_weight_portfolio = pd.Series(index=all_dates, dtype=float)
    equal_weight_portfolio = equal_weight_portfolio.fillna(0.0)

    weight = 0.2  # 20% allocation to each ETF

    for ticker, prices in normalized_data.items():
        # Align prices to common dates and add to portfolio
        aligned_prices = prices.reindex(all_dates, method='ffill')
        equal_weight_portfolio += weight * aligned_prices

    logger.info(f"Equal weight portfolio: {len(equal_weight_portfolio)} data points, 20% allocation each")

    return equal_weight_portfolio

def calculate_leveraged_equal_weight_portfolio(normalized_data, leverage=2.0, borrowing_rate=0.08):
    """Calculate equal weight portfolio with leverage and borrowing costs"""
    if not normalized_data:
        return None

    # Get common dates for all ETFs
    all_dates = None
    for ticker, prices in normalized_data.items():
        if all_dates is None:
            all_dates = prices.index
        else:
            all_dates = all_dates.intersection(prices.index)

    if len(all_dates) == 0:
        logger.warning("No common dates found for leveraged equal weight portfolio")
        return None

    # Sort dates and convert to list for easier indexing
    all_dates = sorted(all_dates)
    tickers = list(normalized_data.keys())

    # Equal weights (20% each)
    equal_weights = {ticker: 1.0/len(tickers) for ticker in tickers}

    # Initialize portfolio values
    leveraged_portfolio_values = pd.Series(index=all_dates, dtype=float)

    # Track previous portfolio value for borrowing cost calculation
    previous_portfolio_val = 100.0  # Starting value

    logger.info(f"Calculating leveraged equal weight portfolio: {leverage}x leverage, {borrowing_rate:.1%} borrowing rate")

    for i, date in enumerate(all_dates):
        # Calculate unleveraged equal weight portfolio value
        unleveraged_portfolio_val = sum(equal_weights[ticker] * normalized_data[ticker].loc[date]
                                       for ticker in tickers)

        if i == 0:
            # First day: start with base 100, no leverage effect yet
            portfolio_val = 100.0
        else:
            # Calculate daily returns for leveraged portfolio
            prev_unleveraged = sum(equal_weights[ticker] * normalized_data[ticker].loc[all_dates[i-1]]
                                 for ticker in tickers)

            if prev_unleveraged > 0:
                daily_unleveraged_return = (unleveraged_portfolio_val / prev_unleveraged) - 1.0
                daily_leveraged_return = leverage * daily_unleveraged_return

                # Apply leveraged return to previous portfolio value
                portfolio_val_before_cost = previous_portfolio_val * (1.0 + daily_leveraged_return)

                # Calculate daily borrowing cost (8% annual on borrowed amount)
                equity_amount = previous_portfolio_val / leverage  # Our actual equity
                borrowed_amount = previous_portfolio_val - equity_amount  # Amount borrowed
                daily_borrowing_rate = borrowing_rate / 252
                daily_borrowing_cost = borrowed_amount * daily_borrowing_rate

                # Final portfolio value after borrowing costs
                portfolio_val = portfolio_val_before_cost - daily_borrowing_cost
            else:
                portfolio_val = previous_portfolio_val

        leveraged_portfolio_values.loc[date] = portfolio_val
        previous_portfolio_val = portfolio_val

    logger.info(f"Leveraged equal weight portfolio: {len(leveraged_portfolio_values)} data points, {leverage}x leverage")

    return leveraged_portfolio_values

def calculate_ewma_volatility(returns, lambda_=0.94):
    """
    Calculate EWMA (Exponentially Weighted Moving Average) volatility
    Formula: σ²_t = λ * σ²_{t-1} + (1-λ) * r²_{t-1}

    Args:
        returns: pandas Series of returns
        lambda_: decay factor (default 0.94)

    Returns:
        Annualized EWMA volatility
    """
    if len(returns) == 0:
        return 0.15  # Default fallback

    if len(returns) == 1:
        return abs(returns.iloc[0]) * np.sqrt(252)  # Annualize single return

    # Initialize with first squared return
    variance = returns.iloc[0] ** 2

    # Iterate through returns to calculate EWMA variance
    for i in range(1, len(returns)):
        variance = lambda_ * variance + (1 - lambda_) * (returns.iloc[i] ** 2)

    # Convert to annualized volatility
    return np.sqrt(variance * 252)

def calculate_trailing_volatility(price_series, window_days=252):
    """Calculate trailing volatility (annualized) for a price series"""
    # Calculate daily returns
    returns = price_series.pct_change().dropna()

    # Calculate rolling volatility (annualized)
    rolling_vol = returns.rolling(window=window_days).std() * np.sqrt(252)

    return rolling_vol

def calculate_enhanced_risk_parity_weights(normalized_data, rebalance_freq_days=21, lookback_days=60):
    """
    Calculate enhanced risk parity weights with periodic rebalancing based on trailing volatility (NO LEVERAGE)
    rebalance_freq_days: rebalancing frequency (21 ≈ monthly)
    lookback_days: days to look back for volatility calculation (60 = ~3 months)
    """
    if not normalized_data:
        return None, None

    # Get common dates for all ETFs
    all_dates = None
    for ticker, prices in normalized_data.items():
        if all_dates is None:
            all_dates = prices.index
        else:
            all_dates = all_dates.intersection(prices.index)

    if len(all_dates) == 0:
        logger.warning("No common dates found for enhanced risk parity calculation")
        return None, None

    # Sort dates and convert to list for easier indexing
    all_dates = sorted(all_dates)
    tickers = list(normalized_data.keys())

    # Initialize DataFrames
    weights_df = pd.DataFrame(index=all_dates, columns=tickers, dtype=float)
    portfolio_values = pd.Series(index=all_dates, dtype=float)

    # Start with equal weights
    current_weights = {ticker: 1.0/len(tickers) for ticker in tickers}

    logger.info(f"Starting enhanced risk parity calculation (unleveraged) with EWMA + Correlation Adjusted volatility estimation")

    for i, date in enumerate(all_dates):
        # Rebalance check: either we have enough history and it's a rebalance date, or we're at the start
        should_rebalance = (i >= lookback_days and i % rebalance_freq_days == 0) or i == lookback_days

        if should_rebalance and i >= lookback_days:
            # Calculate multi-horizon volatilities
            volatilities = {}

            for ticker in tickers:
                # Multi-horizon volatility estimation
                vol_21d = None  # Short-term (21 days)
                vol_60d = None  # Medium-term (60 days) - original baseline
                vol_252d = None  # Long-term (252 days)

                # Calculate 21-day EWMA volatility (short-term)
                if i >= 21:
                    end_idx = i
                    start_idx = max(0, end_idx - 21)
                    price_slice_21 = []
                    for j in range(start_idx, end_idx):
                        price_slice_21.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice_21) >= 15:  # Need minimum data points
                        price_series_21 = pd.Series(price_slice_21)
                        returns_21 = price_series_21.pct_change().dropna()
                        if len(returns_21) > 5:
                            vol_21d = calculate_ewma_volatility(returns_21, lambda_=0.94)

                # Calculate 60-day EWMA volatility (medium-term)
                if i >= 60:
                    end_idx = i
                    start_idx = max(0, end_idx - 60)
                    price_slice_60 = []
                    for j in range(start_idx, end_idx):
                        price_slice_60.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice_60) >= 20:  # Need minimum data points
                        price_series_60 = pd.Series(price_slice_60)
                        returns_60 = price_series_60.pct_change().dropna()
                        if len(returns_60) > 5:
                            vol_60d = calculate_ewma_volatility(returns_60, lambda_=0.94)

                # Calculate 252-day EWMA volatility (long-term)
                if i >= 252:
                    end_idx = i
                    start_idx = max(0, end_idx - 252)
                    price_slice_252 = []
                    for j in range(start_idx, end_idx):
                        price_slice_252.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice_252) >= 100:  # Need minimum data points
                        price_series_252 = pd.Series(price_slice_252)
                        returns_252 = price_series_252.pct_change().dropna()
                        if len(returns_252) > 20:
                            vol_252d = calculate_ewma_volatility(returns_252, lambda_=0.94)

                # Combine volatilities using weighted approach
                if vol_21d is not None and vol_60d is not None and vol_252d is not None:
                    # Multi-horizon approach: 20% short-term + 50% medium-term + 30% long-term
                    final_volatility = 0.2 * vol_21d + 0.5 * vol_60d + 0.3 * vol_252d
                elif vol_60d is not None and vol_252d is not None:
                    # Fallback: combine available medium and long term
                    final_volatility = 0.6 * vol_60d + 0.4 * vol_252d
                elif vol_60d is not None:
                    # Fallback: use medium-term only (original approach)
                    final_volatility = vol_60d
                else:
                    # Fallback: use default value
                    final_volatility = 0.15

                volatilities[ticker] = max(final_volatility, 0.05)  # Floor at 5%

            # Calculate correlation matrix for adjustment (using 60-day window)
            correlation_matrix = None
            avg_correlations = {ticker: 0.0 for ticker in tickers}

            if i >= 60:  # Need sufficient data for correlation calculation
                returns_matrix = []
                for ticker in tickers:
                    end_idx = i
                    start_idx = max(0, end_idx - 60)
                    price_slice = []
                    for j in range(start_idx, end_idx):
                        price_slice.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice) >= 20:
                        price_series = pd.Series(price_slice)
                        returns = price_series.pct_change().dropna()
                        returns_matrix.append(returns.values)

                if len(returns_matrix) == len(tickers):
                    # Ensure all return series have the same length
                    min_length = min(len(r) for r in returns_matrix)
                    returns_matrix = [r[-min_length:] for r in returns_matrix]

                    if min_length > 10:  # Need minimum observations
                        returns_df = pd.DataFrame({ticker: returns_matrix[i] for i, ticker in enumerate(tickers)})
                        correlation_matrix = returns_df.corr()

                        # Calculate average correlation for each asset with all others
                        for ticker in tickers:
                            other_correlations = []
                            for other_ticker in tickers:
                                if ticker != other_ticker:
                                    corr_val = correlation_matrix.loc[ticker, other_ticker]
                                    if not np.isnan(corr_val):
                                        other_correlations.append(abs(corr_val))  # Use absolute correlation

                            if other_correlations:
                                avg_correlations[ticker] = np.mean(other_correlations)

            # Calculate correlation-adjusted inverse volatility weights
            correlation_penalty_factor = 0.5  # Moderate penalty
            inv_vols = {}

            for ticker, vol in volatilities.items():
                base_inv_vol = 1.0 / vol
                correlation_penalty = 1.0 + correlation_penalty_factor * avg_correlations[ticker]
                adjusted_inv_vol = base_inv_vol / correlation_penalty
                inv_vols[ticker] = adjusted_inv_vol

            total_inv_vol = sum(inv_vols.values())

            if total_inv_vol > 0:
                # Calculate base weights (sum to 1.0)
                base_weights = {ticker: inv_vol / total_inv_vol
                              for ticker, inv_vol in inv_vols.items()}
                current_weights = base_weights.copy()

                # Log rebalancing info (reduced frequency)
                if i % (rebalance_freq_days * 12) == 0:  # Log every ~year
                    vol_str = ", ".join([f"{ticker}:{vol:.2f}" for ticker, vol in volatilities.items()])
                    corr_str = ", ".join([f"{ticker}:{corr:.2f}" for ticker, corr in avg_correlations.items()])
                    weight_str = ", ".join([f"{ticker}:{w:.1%}" for ticker, w in current_weights.items()])
                    logger.info(f"Enhanced Risk Parity (Unleveraged) Rebalancing on {date.strftime('%Y-%m-%d')}: Vols=[{vol_str}] Avg Corrs=[{corr_str}] Weights=[{weight_str}]")

        # Store weights for this date
        for ticker in tickers:
            weights_df.loc[date, ticker] = current_weights[ticker]

        # Calculate portfolio value (unleveraged)
        portfolio_val = sum(current_weights[ticker] * normalized_data[ticker].loc[date]
                           for ticker in tickers)

        portfolio_values.loc[date] = portfolio_val

    logger.info(f"Enhanced risk parity portfolio (unleveraged): {len(portfolio_values)} data points, rebalanced every {rebalance_freq_days} days")

    return portfolio_values, weights_df

def calculate_leveraged_risk_parity_weights(normalized_data, rebalance_freq_days=21, lookback_days=60, leverage=2.0, borrowing_rate=0.08):
    """
    Calculate enhanced risk parity weights with periodic rebalancing based on trailing volatility (WITH LEVERAGE)
    rebalance_freq_days: rebalancing frequency (21 ≈ monthly)
    lookback_days: days to look back for volatility calculation (60 = ~3 months)
    leverage: leverage multiplier (e.g., 2.0 for 2x leverage)
    borrowing_rate: annual borrowing rate for leveraged positions (e.g., 0.08 for 8%)
    """
    if not normalized_data:
        return None, None

    # Get common dates for all ETFs
    all_dates = None
    for ticker, prices in normalized_data.items():
        if all_dates is None:
            all_dates = prices.index
        else:
            all_dates = all_dates.intersection(prices.index)

    if len(all_dates) == 0:
        logger.warning("No common dates found for risk parity calculation")
        return None, None

    # Sort dates and convert to list for easier indexing
    all_dates = sorted(all_dates)
    tickers = list(normalized_data.keys())

    # Initialize DataFrames
    weights_df = pd.DataFrame(index=all_dates, columns=tickers, dtype=float)
    portfolio_values = pd.Series(index=all_dates, dtype=float)

    # Start with equal weights
    current_weights = {ticker: 1.0/len(tickers) for ticker in tickers}

    logger.info(f"Starting enhanced risk parity calculation (leveraged) with EWMA + Correlation Adjusted volatility estimation, {leverage}x leverage, {borrowing_rate:.1%} borrowing rate")

    # Track previous portfolio value for borrowing cost calculation
    previous_portfolio_val = 100.0  # Starting value

    for i, date in enumerate(all_dates):
        # Rebalance check: either we have enough history and it's a rebalance date, or we're at the start
        should_rebalance = (i >= lookback_days and i % rebalance_freq_days == 0) or i == lookback_days

        if should_rebalance and i >= lookback_days:
            # Calculate multi-horizon volatilities
            volatilities = {}

            for ticker in tickers:
                # Multi-horizon volatility estimation
                vol_21d = None  # Short-term (21 days)
                vol_60d = None  # Medium-term (60 days) - original baseline
                vol_252d = None  # Long-term (252 days)

                # Calculate 21-day EWMA volatility (short-term)
                if i >= 21:
                    end_idx = i
                    start_idx = max(0, end_idx - 21)
                    price_slice_21 = []
                    for j in range(start_idx, end_idx):
                        price_slice_21.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice_21) >= 15:  # Need minimum data points
                        price_series_21 = pd.Series(price_slice_21)
                        returns_21 = price_series_21.pct_change().dropna()
                        if len(returns_21) > 5:
                            vol_21d = calculate_ewma_volatility(returns_21, lambda_=0.94)

                # Calculate 60-day EWMA volatility (medium-term)
                if i >= 60:
                    end_idx = i
                    start_idx = max(0, end_idx - 60)
                    price_slice_60 = []
                    for j in range(start_idx, end_idx):
                        price_slice_60.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice_60) >= 20:  # Need minimum data points
                        price_series_60 = pd.Series(price_slice_60)
                        returns_60 = price_series_60.pct_change().dropna()
                        if len(returns_60) > 5:
                            vol_60d = calculate_ewma_volatility(returns_60, lambda_=0.94)

                # Calculate 252-day EWMA volatility (long-term)
                if i >= 252:
                    end_idx = i
                    start_idx = max(0, end_idx - 252)
                    price_slice_252 = []
                    for j in range(start_idx, end_idx):
                        price_slice_252.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice_252) >= 100:  # Need minimum data points
                        price_series_252 = pd.Series(price_slice_252)
                        returns_252 = price_series_252.pct_change().dropna()
                        if len(returns_252) > 20:
                            vol_252d = calculate_ewma_volatility(returns_252, lambda_=0.94)

                # Combine volatilities using weighted approach
                if vol_21d is not None and vol_60d is not None and vol_252d is not None:
                    # Multi-horizon approach: 20% short-term + 50% medium-term + 30% long-term
                    final_volatility = 0.2 * vol_21d + 0.5 * vol_60d + 0.3 * vol_252d
                elif vol_60d is not None and vol_252d is not None:
                    # Fallback: combine available medium and long term
                    final_volatility = 0.6 * vol_60d + 0.4 * vol_252d
                elif vol_60d is not None:
                    # Fallback: use medium-term only (original approach)
                    final_volatility = vol_60d
                else:
                    # Fallback: use default value
                    final_volatility = 0.15

                volatilities[ticker] = max(final_volatility, 0.05)  # Floor at 5%

            # Calculate correlation matrix for adjustment (using 60-day window)
            correlation_matrix = None
            avg_correlations = {ticker: 0.0 for ticker in tickers}

            if i >= 60:  # Need sufficient data for correlation calculation
                returns_matrix = []
                for ticker in tickers:
                    end_idx = i
                    start_idx = max(0, end_idx - 60)
                    price_slice = []
                    for j in range(start_idx, end_idx):
                        price_slice.append(normalized_data[ticker].loc[all_dates[j]])

                    if len(price_slice) >= 20:
                        price_series = pd.Series(price_slice)
                        returns = price_series.pct_change().dropna()
                        returns_matrix.append(returns.values)

                if len(returns_matrix) == len(tickers):
                    # Ensure all return series have the same length
                    min_length = min(len(r) for r in returns_matrix)
                    returns_matrix = [r[-min_length:] for r in returns_matrix]

                    if min_length > 10:  # Need minimum observations
                        returns_df = pd.DataFrame({ticker: returns_matrix[i] for i, ticker in enumerate(tickers)})
                        correlation_matrix = returns_df.corr()

                        # Calculate average correlation for each asset with all others
                        for ticker in tickers:
                            other_correlations = []
                            for other_ticker in tickers:
                                if ticker != other_ticker:
                                    corr_val = correlation_matrix.loc[ticker, other_ticker]
                                    if not np.isnan(corr_val):
                                        other_correlations.append(abs(corr_val))  # Use absolute correlation

                            if other_correlations:
                                avg_correlations[ticker] = np.mean(other_correlations)

            # Calculate correlation-adjusted inverse volatility weights
            correlation_penalty_factor = 0.5  # Moderate penalty
            inv_vols = {}

            for ticker, vol in volatilities.items():
                base_inv_vol = 1.0 / vol
                correlation_penalty = 1.0 + correlation_penalty_factor * avg_correlations[ticker]
                adjusted_inv_vol = base_inv_vol / correlation_penalty
                inv_vols[ticker] = adjusted_inv_vol

            total_inv_vol = sum(inv_vols.values())

            if total_inv_vol > 0:
                # Calculate base weights (sum to 1.0)
                base_weights = {ticker: inv_vol / total_inv_vol
                              for ticker, inv_vol in inv_vols.items()}
                current_weights = base_weights.copy()

                # Log rebalancing info (reduced frequency)
                if i % (rebalance_freq_days * 12) == 0:  # Log every ~year
                    vol_str = ", ".join([f"{ticker}:{vol:.2f}" for ticker, vol in volatilities.items()])
                    corr_str = ", ".join([f"{ticker}:{corr:.2f}" for ticker, corr in avg_correlations.items()])
                    weight_str = ", ".join([f"{ticker}:{w:.1%}" for ticker, w in current_weights.items()])
                    leveraged_weight_str = ", ".join([f"{ticker}:{w*leverage:.1%}" for ticker, w in current_weights.items()])
                    logger.info(f"Enhanced Risk Parity (Leveraged) Rebalancing on {date.strftime('%Y-%m-%d')}: Vols=[{vol_str}] Avg Corrs=[{corr_str}] Base Weights=[{weight_str}] Leveraged=[{leveraged_weight_str}]")

        # Store base weights for this date (for stacked chart display)
        for ticker in tickers:
            weights_df.loc[date, ticker] = current_weights[ticker]

        # Calculate portfolio value with proper leverage mechanics
        unleveraged_portfolio_val = sum(current_weights[ticker] * normalized_data[ticker].loc[date]
                                       for ticker in tickers)

        if i == 0:
            # First day: start with base 100, no leverage effect yet
            portfolio_val = 100.0
        else:
            # Calculate daily returns for leveraged portfolio
            prev_unleveraged = sum(current_weights[ticker] * normalized_data[ticker].loc[all_dates[i-1]]
                                 for ticker in tickers)

            if prev_unleveraged > 0:
                daily_unleveraged_return = (unleveraged_portfolio_val / prev_unleveraged) - 1.0
                daily_leveraged_return = leverage * daily_unleveraged_return

                # Apply leveraged return to previous portfolio value
                portfolio_val_before_cost = previous_portfolio_val * (1.0 + daily_leveraged_return)

                # Calculate daily borrowing cost (8% annual on borrowed amount)
                equity_amount = previous_portfolio_val / leverage  # Our actual equity
                borrowed_amount = previous_portfolio_val - equity_amount  # Amount borrowed
                daily_borrowing_rate = borrowing_rate / 252
                daily_borrowing_cost = borrowed_amount * daily_borrowing_rate

                # Final portfolio value after borrowing costs
                portfolio_val = portfolio_val_before_cost - daily_borrowing_cost
            else:
                portfolio_val = previous_portfolio_val

        portfolio_values.loc[date] = portfolio_val
        previous_portfolio_val = portfolio_val

    logger.info(f"Enhanced risk parity portfolio (leveraged): {len(portfolio_values)} data points, {leverage}x leverage, rebalanced every {rebalance_freq_days} days")

    return portfolio_values, weights_df

def create_dual_charts(normalized_data):
    """Create dual charts: price performance and allocation history"""

    # ETF descriptions for legend
    descriptions = {
        'SPY': 'S&P 500 (US Large Cap)',
        'IEF': '7-10Y Treasury Bonds',
        'GLD': 'Gold',
        'EFA': 'Developed Markets (MSCI EAFE)',
        'VNQ': 'REITs'
    }

    # Calculate portfolios
    equal_weight_portfolio = calculate_equal_weight_portfolio(normalized_data)
    leveraged_equal_weight_portfolio = calculate_leveraged_equal_weight_portfolio(
        normalized_data, leverage=2.0, borrowing_rate=0.08)
    enhanced_risk_parity_portfolio, enhanced_risk_parity_weights = calculate_enhanced_risk_parity_weights(
        normalized_data, rebalance_freq_days=21, lookback_days=60)
    leveraged_risk_parity_portfolio, leveraged_risk_parity_weights = calculate_leveraged_risk_parity_weights(
        normalized_data, rebalance_freq_days=21, lookback_days=60, leverage=2.0, borrowing_rate=0.08)

    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 12))

    # === CHART 1: Price Performance ===
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']

    # Plot each ETF with thinner lines
    for i, (ticker, prices) in enumerate(normalized_data.items()):
        ax1.plot(prices.index, prices.values,
                label=f"{ticker} - {descriptions.get(ticker, ticker)}",
                linewidth=1.5,
                color=colors[i % len(colors)],
                alpha=0.8)

    # Plot equal weight portfolio
    if equal_weight_portfolio is not None:
        ax1.plot(equal_weight_portfolio.index, equal_weight_portfolio.values,
                label="EQUAL WEIGHT PORTFOLIO (20% each)",
                linewidth=4,
                color='#000000',
                linestyle='-',
                alpha=0.9,
                zorder=10)

    # Plot leveraged equal weight portfolio
    if leveraged_equal_weight_portfolio is not None:
        ax1.plot(leveraged_equal_weight_portfolio.index, leveraged_equal_weight_portfolio.values,
                label="EQUAL WEIGHT PORTFOLIO (2x Lev, 8% Cost)",
                linewidth=4,
                color='#0066CC',  # Blue color for distinctiveness
                linestyle='-',
                alpha=0.9,
                zorder=11)

    # Plot enhanced risk parity portfolio (unleveraged)
    if enhanced_risk_parity_portfolio is not None:
        ax1.plot(enhanced_risk_parity_portfolio.index, enhanced_risk_parity_portfolio.values,
                label="ENHANCED RISK PARITY (EWMA + Corr Adj)",
                linewidth=4,
                color='#9467bd',  # Purple color for distinctiveness
                linestyle='-',
                alpha=0.9,
                zorder=11)

    # Plot leveraged risk parity portfolio
    if leveraged_risk_parity_portfolio is not None:
        ax1.plot(leveraged_risk_parity_portfolio.index, leveraged_risk_parity_portfolio.values,
                label="ENHANCED RISK PARITY (2x Lev, 8% Cost)",
                linewidth=4,
                color='#FF0000',  # Red color for distinctiveness
                linestyle='--',
                alpha=0.9,
                zorder=12)

    # Formatting for Chart 1
    ax1.set_title('20-Year ETF Performance: Individual Assets vs Portfolio Strategies\n(Base 100 Normalized)',
                  fontsize=16, fontweight='bold')
    ax1.set_xlabel('Date', fontsize=12)
    ax1.set_ylabel('Normalized Price (Base 100)', fontsize=12)
    ax1.grid(True, alpha=0.3)
    ax1.legend(loc='upper left', fontsize=9)
    ax1.axhline(y=100, color='gray', linestyle='--', alpha=0.5, linewidth=1)

    # === CHART 2: Enhanced Risk Parity Allocation History (Stacked Area) ===
    if enhanced_risk_parity_weights is not None:
        # Prepare data for stacked area chart
        # Ensure all data is numeric and convert to float
        weights_clean = enhanced_risk_parity_weights.astype(float).fillna(0.0)
        weights_matrix = weights_clean.values.T  # Transpose for stacking
        dates = weights_clean.index

        # Create stacked area chart
        ax2.stackplot(dates, *weights_matrix,
                     labels=[f"{ticker} - {descriptions.get(ticker, ticker)}" for ticker in weights_clean.columns],
                     colors=colors,
                     alpha=0.8)

        # Formatting for Chart 2
        ax2.set_title('Enhanced Risk Parity Portfolio: Historical Asset Allocation\n(Monthly Rebalancing Based on EWMA + Correlation Adjusted Volatility)',
                      fontsize=16, fontweight='bold')
        ax2.set_xlabel('Date', fontsize=12)
        ax2.set_ylabel('Portfolio Weight (%)', fontsize=12)
        ax2.set_ylim(0, 1)
        ax2.grid(True, alpha=0.3)
        ax2.legend(loc='center left', bbox_to_anchor=(1, 0.5), fontsize=9)

        # Format y-axis as percentages
        ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda y, _: '{:.0%}'.format(y)))

    # Improve x-axis formatting for both charts
    for ax in [ax1, ax2]:
        ax.tick_params(axis='x', rotation=45)

    plt.tight_layout()

    return equal_weight_portfolio, leveraged_equal_weight_portfolio, enhanced_risk_parity_portfolio, leveraged_risk_parity_portfolio, enhanced_risk_parity_weights

def calculate_comprehensive_metrics(price_series, name="Asset"):
    """Calculate comprehensive performance and risk metrics for a price series"""
    if len(price_series) < 2:
        return {}

    # Calculate returns
    returns = price_series.pct_change().dropna()

    if len(returns) == 0:
        return {}

    # Performance metrics
    start_val = price_series.iloc[0]
    end_val = price_series.iloc[-1]
    total_return = (end_val - start_val) / start_val * 100

    # Annualized metrics
    years = len(price_series) / 252
    if years > 0:
        annualized_return = ((end_val / start_val) ** (1/years) - 1) * 100
    else:
        annualized_return = 0

    # Risk metrics
    volatility = returns.std() * np.sqrt(252) * 100  # Annualized volatility in %

    # Sharpe ratio (assuming risk-free rate of 2%)
    risk_free_rate = 0.02
    if volatility > 0:
        sharpe_ratio = (annualized_return/100 - risk_free_rate) / (volatility/100)
    else:
        sharpe_ratio = 0

    # Maximum drawdown
    running_max = price_series.expanding().max()
    drawdown = (price_series - running_max) / running_max
    max_drawdown = drawdown.min() * 100

    return {
        'name': name,
        'total_return': total_return,
        'annualized_return': annualized_return,
        'volatility': volatility,
        'sharpe_ratio': sharpe_ratio,
        'max_drawdown': max_drawdown,
        'start_value': start_val,
        'end_value': end_val
    }

def create_performance_summary(normalized_data, equal_weight_portfolio, leveraged_equal_weight_portfolio, enhanced_risk_parity_portfolio, leveraged_risk_parity_portfolio):
    """Create and display comprehensive performance summary with risk metrics"""

    # ETF descriptions for legend
    descriptions = {
        'SPY': 'S&P 500 (US Large Cap)',
        'IEF': '7-10Y Treasury Bonds',
        'GLD': 'Gold',
        'EFA': 'Developed Markets (MSCI EAFE)',
        'VNQ': 'REITs'
    }

    # Calculate comprehensive metrics for all assets
    all_metrics = []

    # Individual ETFs
    for ticker, prices in normalized_data.items():
        desc = descriptions.get(ticker, ticker)
        metrics = calculate_comprehensive_metrics(prices, f"{ticker} - {desc}")
        all_metrics.append(metrics)

    # Portfolio strategies
    if equal_weight_portfolio is not None:
        eq_metrics = calculate_comprehensive_metrics(equal_weight_portfolio, "Equal Weight Portfolio")
        all_metrics.append(eq_metrics)

    if leveraged_equal_weight_portfolio is not None:
        lev_eq_metrics = calculate_comprehensive_metrics(leveraged_equal_weight_portfolio, "Equal Weight Portfolio (2x Leveraged)")
        all_metrics.append(lev_eq_metrics)

    if enhanced_risk_parity_portfolio is not None:
        erp_metrics = calculate_comprehensive_metrics(enhanced_risk_parity_portfolio, "Enhanced Risk Parity Portfolio")
        all_metrics.append(erp_metrics)

    if leveraged_risk_parity_portfolio is not None:
        lrp_metrics = calculate_comprehensive_metrics(leveraged_risk_parity_portfolio, "Enhanced Risk Parity Portfolio (2x Leveraged)")
        all_metrics.append(lrp_metrics)

    # Print comprehensive performance summary
    print("\n" + "="*120)
    print("COMPREHENSIVE 20-YEAR PERFORMANCE & RISK ANALYSIS")
    print("="*120)
    print(f"{'Asset':<35} {'Total Ret':<10} {'Ann. Ret':<9} {'Volatility':<10} {'Sharpe':<7} {'Max DD':<8}")
    print("-"*120)

    # Individual ETFs
    portfolio_count = sum(1 for p in [equal_weight_portfolio, leveraged_equal_weight_portfolio, enhanced_risk_parity_portfolio, leveraged_risk_parity_portfolio] if p is not None)
    individual_etf_metrics = all_metrics[:-portfolio_count] if portfolio_count > 0 else all_metrics
    for metrics in individual_etf_metrics:
        print(f"{metrics['name']:<35} "
              f"{metrics['total_return']:>8.2f}%  "
              f"{metrics['annualized_return']:>7.2f}%  "
              f"{metrics['volatility']:>8.2f}%  "
              f"{metrics['sharpe_ratio']:>6.2f}  "
              f"{metrics['max_drawdown']:>6.2f}%")

    print("-"*120)

    # Portfolio strategies
    portfolio_metrics = all_metrics[-portfolio_count:] if portfolio_count > 0 else []
    for metrics in portfolio_metrics:
        print(f"{metrics['name']:<35} "
              f"{metrics['total_return']:>8.2f}%  "
              f"{metrics['annualized_return']:>7.2f}%  "
              f"{metrics['volatility']:>8.2f}%  "
              f"{metrics['sharpe_ratio']:>6.2f}  "
              f"{metrics['max_drawdown']:>6.2f}%")

    print("="*120)
    print("Legend: Ann. Ret = Annualized Return, Sharpe = Sharpe Ratio (vs 2% risk-free), Max DD = Maximum Drawdown")
    print("Note: Leveraged portfolios include 2x leverage with 8% annual borrowing cost")
    print("="*120)

    # Show the plot
    plt.show()

    return all_metrics

def main():
    """Main execution function"""
    logger.info("Starting enhanced 20-year ETF historical analysis with EWMA + Correlation Adjusted risk parity")

    # Fetch price data directly using yfinance
    logger.info("Fetching price series data...")
    price_data = get_price_series_directly()

    if not price_data:
        logger.error("No price data fetched. Exiting.")
        return

    # Normalize to base 100
    logger.info("Normalizing price data to base 100...")
    normalized_data = normalize_to_base_100(price_data)

    # Create dual charts and calculate portfolios
    logger.info("Creating dual charts: performance and allocation history...")
    equal_weight_portfolio, leveraged_equal_weight_portfolio, enhanced_risk_parity_portfolio, leveraged_risk_parity_portfolio, enhanced_risk_parity_weights = create_dual_charts(normalized_data)

    # Display comprehensive performance summary
    logger.info("Generating performance summary...")
    performance_summary = create_performance_summary(normalized_data, equal_weight_portfolio, leveraged_equal_weight_portfolio, enhanced_risk_parity_portfolio, leveraged_risk_parity_portfolio)

    logger.info("Enhanced EWMA + Correlation Adjusted analysis complete!")

if __name__ == "__main__":
    main()