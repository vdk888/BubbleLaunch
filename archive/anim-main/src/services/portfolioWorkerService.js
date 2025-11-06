// Portfolio Worker Service
// Manages web workers for heavy portfolio calculations

class PortfolioWorkerService {
  constructor() {
    this.workers = [];
    this.maxWorkers = Math.min(navigator.hardwareConcurrency || 2, 4); // Max 4 workers
    this.currentTaskId = 0;
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.isInitialized = false;
  }

  // Initialize workers
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create worker pool
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker('/portfolioWorker.js');
        worker.onmessage = this.handleWorkerMessage.bind(this);
        worker.onerror = this.handleWorkerError.bind(this);
        this.workers.push({
          worker,
          busy: false,
          id: i
        });
      }

      this.isInitialized = true;
      console.log(`Initialized ${this.maxWorkers} portfolio calculation workers`);
    } catch (error) {
      console.warn('Failed to initialize web workers, falling back to main thread:', error);
      this.isInitialized = false;
    }
  }

  // Handle messages from workers
  handleWorkerMessage(event) {
    const { type, id, result, error, progress, message } = event.data;
    const task = this.activeTasks.get(id);

    if (!task) return;

    switch (type) {
      case 'result':
        task.resolve(result);
        this.completeTask(id);
        break;
      case 'error':
        task.reject(new Error(error));
        this.completeTask(id);
        break;
      case 'progress':
        if (task.onProgress) {
          task.onProgress(progress, message);
        }
        break;
    }
  }

  // Handle worker errors
  handleWorkerError(event) {
    console.error('Worker error:', event);
    // Find tasks using this worker and reject them
    this.activeTasks.forEach((task, id) => {
      if (task.worker === event.target) {
        task.reject(new Error('Worker error occurred'));
        this.completeTask(id);
      }
    });
  }

  // Complete a task and process queue
  completeTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      // Mark worker as available
      const workerInfo = this.workers.find(w => w.worker === task.worker);
      if (workerInfo) {
        workerInfo.busy = false;
      }

      this.activeTasks.delete(taskId);

      // Process queued tasks
      this.processQueue();
    }
  }

  // Process queued tasks
  processQueue() {
    while (this.taskQueue.length > 0) {
      const availableWorker = this.workers.find(w => !w.busy);
      if (!availableWorker) break;

      const queuedTask = this.taskQueue.shift();
      this.executeTask(queuedTask, availableWorker);
    }
  }

  // Execute a task on a worker
  executeTask(task, workerInfo) {
    workerInfo.busy = true;
    task.worker = workerInfo.worker;

    this.activeTasks.set(task.id, task);

    workerInfo.worker.postMessage({
      type: task.type,
      payload: task.payload,
      id: task.id
    });
  }

  // Queue a calculation task
  async calculate(type, payload, onProgress = null) {
    await this.initialize();

    if (!this.isInitialized) {
      // Fallback to main thread calculation
      return this.calculateOnMainThread(type, payload);
    }

    return new Promise((resolve, reject) => {
      const taskId = ++this.currentTaskId;
      const task = {
        id: taskId,
        type,
        payload,
        resolve,
        reject,
        onProgress,
        worker: null
      };

      // Try to find available worker
      const availableWorker = this.workers.find(w => !w.busy);
      if (availableWorker) {
        this.executeTask(task, availableWorker);
      } else {
        // Queue the task
        this.taskQueue.push(task);
      }
    });
  }

  // Fallback calculations on main thread
  async calculateOnMainThread(type, payload) {
    // Import calculation functions dynamically
    const {
      calculateEqualWeightPortfolio,
      calculateSimpleRiskParity,
      calculateEnhancedRiskParity
    } = await import('./portfolioCalculations');

    switch (type) {
      case 'calculateEqualWeight':
        return calculateEqualWeightPortfolio(payload.normalizedData);
      case 'calculateSimpleRiskParity':
        const simpleResult = calculateSimpleRiskParity(
          payload.normalizedData,
          payload.rebalanceFreqDays,
          payload.lookbackDays
        );
        return simpleResult;
      case 'calculateEnhancedRiskParity':
        const enhancedResult = calculateEnhancedRiskParity(
          payload.normalizedData,
          payload.rebalanceFreqDays,
          payload.lookbackDays
        );
        return enhancedResult;
      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }
  }

  // Calculate Equal Weight Portfolio
  async calculateEqualWeight(normalizedData, onProgress) {
    return this.calculate('calculateEqualWeight', { normalizedData }, onProgress);
  }

  // Calculate Simple Risk Parity
  async calculateSimpleRiskParity(normalizedData, rebalanceFreqDays = 21, lookbackDays = 60, onProgress) {
    return this.calculate('calculateSimpleRiskParity', {
      normalizedData,
      rebalanceFreqDays,
      lookbackDays
    }, onProgress);
  }

  // Calculate Enhanced Risk Parity
  async calculateEnhancedRiskParity(normalizedData, rebalanceFreqDays = 21, lookbackDays = 60, onProgress) {
    return this.calculate('calculateEnhancedRiskParity', {
      normalizedData,
      rebalanceFreqDays,
      lookbackDays
    }, onProgress);
  }

  // Check if workers are supported and available
  isAvailable() {
    return this.isInitialized && this.workers.length > 0;
  }

  // Get worker status
  getStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized', workers: 0, busy: 0, queued: 0 };
    }

    const busyWorkers = this.workers.filter(w => w.busy).length;
    return {
      status: 'ready',
      workers: this.workers.length,
      busy: busyWorkers,
      queued: this.taskQueue.length,
      activeTasks: this.activeTasks.size
    };
  }

  // Terminate all workers
  terminate() {
    this.workers.forEach(workerInfo => {
      workerInfo.worker.terminate();
    });
    this.workers = [];
    this.activeTasks.clear();
    this.taskQueue = [];
    this.isInitialized = false;
  }
}

// Export singleton instance
export const portfolioWorkerService = new PortfolioWorkerService();