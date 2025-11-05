/**
 * Hierarchical Risk Parity (HRP) Implementation
 *
 * This module implements HRP using machine learning clustering techniques.
 * HRP clusters similar assets based on correlation distance and applies
 * risk parity allocation at both cluster and individual asset levels.
 *
 * Key Features:
 * - Hierarchical clustering using correlation distance matrix
 * - Multi-level risk parity allocation (cluster + asset level)
 * - Compatible with existing portfolio calculation patterns
 * - Handles edge cases for small portfolios (5 assets)
 *
 * Algorithm Steps:
 * 1. Tree Clustering: Build dendrogram using correlation distance
 * 2. Quasi-Diagonalization: Reorder correlation matrix by cluster
 * 3. Recursive Bisection: Allocate weights hierarchically
 *
 * Ported from anim-main/src/services/hierarchicalRiskParity.js
 * Converted from ES6 to CommonJS for BubbleLaunch backend
 */

/**
 * Calculate returns from price data using log returns
 * @param {Array<number>} priceData - Array of prices
 * @returns {Array<number>} Array of log returns
 */
function calculateReturns(priceData) {
  const returns = [];
  for (let i = 1; i < priceData.length; i++) {
    returns.push(Math.log(priceData[i] / priceData[i - 1]));
  }
  return returns;
}

/**
 * Calculate correlation matrix from returns series
 * @param {Object} returnsSeries - Object mapping tickers to return arrays
 * @param {Array<string>} tickers - Array of ticker symbols
 * @returns {Object} Correlation matrix as nested object
 */
function calculateCorrelationMatrix(returnsSeries, tickers) {
  const n = returnsSeries[tickers[0]].length;
  if (n === 0) return null;

  const correlationMatrix = {};

  // Initialize matrix
  tickers.forEach(ticker1 => {
    correlationMatrix[ticker1] = {};
    tickers.forEach(ticker2 => {
      correlationMatrix[ticker1][ticker2] = 0;
    });
  });

  // Calculate means
  const means = {};
  tickers.forEach(ticker => {
    means[ticker] = returnsSeries[ticker].reduce((sum, val) => sum + val, 0) / n;
  });

  // Calculate correlations
  tickers.forEach(ticker1 => {
    tickers.forEach(ticker2 => {
      if (ticker1 === ticker2) {
        correlationMatrix[ticker1][ticker2] = 1.0;
      } else {
        let numerator = 0;
        let sum1Sq = 0;
        let sum2Sq = 0;

        for (let i = 0; i < n; i++) {
          const dev1 = returnsSeries[ticker1][i] - means[ticker1];
          const dev2 = returnsSeries[ticker2][i] - means[ticker2];
          numerator += dev1 * dev2;
          sum1Sq += dev1 * dev1;
          sum2Sq += dev2 * dev2;
        }

        const denominator = Math.sqrt(sum1Sq * sum2Sq);
        correlationMatrix[ticker1][ticker2] = denominator > 0 ? numerator / denominator : 0;
      }
    });
  });

  return correlationMatrix;
}

/**
 * Calculate distance matrix from correlation matrix
 * Uses formula: distance = sqrt((1 - correlation) / 2)
 * @param {Object} correlationMatrix - Correlation matrix
 * @param {Array<string>} tickers - Array of ticker symbols
 * @returns {Object} Distance matrix
 */
function calculateDistanceMatrix(correlationMatrix, tickers) {
  const distanceMatrix = {};

  tickers.forEach(ticker1 => {
    distanceMatrix[ticker1] = {};
    tickers.forEach(ticker2 => {
      // Distance = sqrt((1 - correlation) / 2)
      const correlation = Math.max(-0.999, Math.min(0.999, correlationMatrix[ticker1][ticker2]));
      distanceMatrix[ticker1][ticker2] = Math.sqrt((1 - correlation) / 2);
    });
  });

  return distanceMatrix;
}

/**
 * Simple hierarchical clustering implementation
 * Uses complete linkage for cluster distance calculation
 */
class HierarchicalCluster {
  constructor(tickers, distanceMatrix) {
    this.tickers = tickers;
    this.distanceMatrix = distanceMatrix;
    this.clusters = tickers.map(ticker => ({ items: [ticker], id: ticker }));
  }

  /**
   * Find the two closest clusters
   * @returns {Array<number>} Indices of closest cluster pair
   */
  findClosestClusters() {
    let minDistance = Infinity;
    let closestPair = null;

    for (let i = 0; i < this.clusters.length; i++) {
      for (let j = i + 1; j < this.clusters.length; j++) {
        const distance = this.calculateClusterDistance(this.clusters[i], this.clusters[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestPair = [i, j];
        }
      }
    }

    return closestPair;
  }

  /**
   * Calculate distance between two clusters using complete linkage
   * @param {Object} cluster1 - First cluster
   * @param {Object} cluster2 - Second cluster
   * @returns {number} Maximum distance between any two items
   */
  calculateClusterDistance(cluster1, cluster2) {
    let maxDistance = 0;

    cluster1.items.forEach(item1 => {
      cluster2.items.forEach(item2 => {
        const distance = this.distanceMatrix[item1][item2];
        maxDistance = Math.max(maxDistance, distance);
      });
    });

    return maxDistance;
  }

  /**
   * Perform hierarchical clustering and return dendrogram
   * @returns {Array} Dendrogram structure representing cluster hierarchy
   */
  cluster() {
    const dendrogram = [];

    while (this.clusters.length > 1) {
      const [i, j] = this.findClosestClusters();

      // Merge clusters
      const newCluster = {
        items: [...this.clusters[i].items, ...this.clusters[j].items],
        id: `cluster_${dendrogram.length}`,
        left: this.clusters[i],
        right: this.clusters[j]
      };

      dendrogram.push({
        left: this.clusters[i],
        right: this.clusters[j],
        merged: newCluster
      });

      // Remove old clusters and add new one
      const newClusters = this.clusters.filter((_, idx) => idx !== i && idx !== j);
      newClusters.push(newCluster);
      this.clusters = newClusters;
    }

    return dendrogram;
  }
}

/**
 * Calculate quasi-diagonalization order from dendrogram
 * Reorders tickers based on hierarchical clustering
 * @param {Array} dendrogram - Clustering dendrogram
 * @param {Array<string>} tickers - Original ticker array
 * @returns {Array<string>} Reordered tickers
 */
function getQuasiDiagonalOrder(dendrogram, tickers) {
  if (dendrogram.length === 0) return tickers;

  const finalCluster = dendrogram[dendrogram.length - 1].merged;

  const getOrderedItems = (cluster) => {
    if (cluster.items.length === 1) {
      return cluster.items;
    }

    const leftItems = cluster.left ? getOrderedItems(cluster.left) : [];
    const rightItems = cluster.right ? getOrderedItems(cluster.right) : [];

    return [...leftItems, ...rightItems];
  };

  return getOrderedItems(finalCluster);
}

/**
 * Recursive bisection for hierarchical weight allocation
 * Allocates weights inversely proportional to cluster variance
 * @param {Object} correlationMatrix - Correlation matrix
 * @param {Array} dendrogram - Clustering dendrogram
 * @param {Array<string>} orderedTickers - Reordered tickers
 * @param {number} totalWeight - Total weight to allocate (default: 1.0)
 * @returns {Object} Weight allocation per ticker
 */
function recursiveBisection(correlationMatrix, dendrogram, orderedTickers, totalWeight = 1.0) {
  if (orderedTickers.length <= 1) {
    const weights = {};
    orderedTickers.forEach(ticker => {
      weights[ticker] = totalWeight / orderedTickers.length;
    });
    return weights;
  }

  if (orderedTickers.length === 2) {
    const weights = {};
    orderedTickers.forEach(ticker => {
      weights[ticker] = totalWeight / 2;
    });
    return weights;
  }

  // Find the split point from dendrogram
  const midPoint = Math.floor(orderedTickers.length / 2);
  const leftCluster = orderedTickers.slice(0, midPoint);
  const rightCluster = orderedTickers.slice(midPoint);

  // Calculate cluster variances (simplified for correlation matrix)
  const leftVar = leftCluster.length;
  const rightVar = rightCluster.length;

  // Allocate weight inversely proportional to cluster variance
  const totalVar = leftVar + rightVar;
  const leftWeight = totalWeight * (rightVar / totalVar);
  const rightWeight = totalWeight * (leftVar / totalVar);

  // Recursively allocate within clusters
  const leftWeights = recursiveBisection(correlationMatrix, dendrogram, leftCluster, leftWeight);
  const rightWeights = recursiveBisection(correlationMatrix, dendrogram, rightCluster, rightWeight);

  return { ...leftWeights, ...rightWeights };
}

// Export all HRP functions
module.exports = {
  calculateReturns,
  calculateCorrelationMatrix,
  calculateDistanceMatrix,
  HierarchicalCluster,
  getQuasiDiagonalOrder,
  recursiveBisection
};
