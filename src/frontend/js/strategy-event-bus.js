/**
 * Strategy Event Bus
 * Facilitates communication between Chatbot and Simulator components
 * allowing backtests from chat to be visualized in the simulator
 */

class StrategyEventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {any} data - Data to pass to listeners
   */
  emit(event, data) {
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }

  // Event constants
  static EVENTS = {
    BACKTEST_COMPLETE: 'backtest:complete',
    ALLOCATION_CHANGED: 'allocation:changed',
    STRATEGY_SAVED: 'strategy:saved',
    SIMULATOR_READY: 'simulator:ready'
  };
}

// Export as global singleton
window.StrategyEventBus = new StrategyEventBus();
