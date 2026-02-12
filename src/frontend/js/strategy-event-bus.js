/**
 * Strategy Event Bus
 * Facilitates communication between Chatbot and Simulator/Playground components
 * Enables bidirectional chat ↔ UI synchronization:
 * - Chat can update simulator allocations
 * - Chat can update user profile
 * - Simulator changes can be reflected in chat context
 */

class StrategyEventBus {
  constructor() {
    this.listeners = {};
    this._debug = false; // Set to true for debugging
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    if (this._debug) {
      console.log(`[StrategyEventBus] Subscribed to ${event}, total listeners: ${this.listeners[event].length}`);
    }

    // Return unsubscribe function for convenience
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event (one-time only)
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    
    if (this._debug) {
      console.log(`[StrategyEventBus] Unsubscribed from ${event}, remaining listeners: ${this.listeners[event].length}`);
    }
  }

  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {any} data - Data to pass to listeners
   */
  emit(event, data) {
    if (this._debug) {
      console.log(`[StrategyEventBus] Emitting ${event}:`, data);
    }

    const callbacks = this.listeners[event];
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[StrategyEventBus] Error in listener for ${event}:`, err);
        }
      });
    } else if (this._debug) {
      console.log(`[StrategyEventBus] No listeners for ${event}`);
    }
  }

  /**
   * Check if there are listeners for an event
   * @param {string} event - Event name
   * @returns {boolean} True if listeners exist
   */
  hasListeners(event) {
    return this.listeners[event] && this.listeners[event].length > 0;
  }

  /**
   * Clear all listeners for an event
   * @param {string} event - Event name (optional, clears all if not provided)
   */
  clear(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  // Event constants for type safety and documentation
  static EVENTS = {
    // Backtest events
    BACKTEST_COMPLETE: 'backtest:complete',
    
    // Allocation events (Chat → Simulator)
    ALLOCATION_CHANGED: 'allocation:changed',
    STRATEGY_APPLIED: 'strategy:applied',
    
    // Strategy events
    STRATEGY_SAVED: 'strategy:saved',
    
    // Profile events (Chat → BubbleAgentMemory)
    PROFILE_UPDATED: 'profile:updated',
    
    // Simulator state events
    SIMULATOR_READY: 'simulator:ready',
    
    // Sync events (for cross-component communication)
    REQUEST_ALLOCATION_SYNC: 'sync:allocation:request',
    ALLOCATION_SYNCED: 'sync:allocation:done'
  };
}

// Export as global singleton
window.StrategyEventBus = new StrategyEventBus();

// Also export the class for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StrategyEventBus;
}
