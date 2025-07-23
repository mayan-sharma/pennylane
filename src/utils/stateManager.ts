import { 
  getStorageData, 
  setStorageData, 
  removeStorageData, 
  clearAllStorageData,
  getStorageInfo,
  cleanupExpiredData,
  getStorageQuota,
  createFullBackup,
  restoreFromFullBackup
} from './localStorage';
import type { StorageOptions } from './localStorage';

export interface StateManagerConfig {
  appName: string;
  version: string;
  maxStorageSize?: number; // in bytes
  autoCleanup?: boolean;
  autoBackup?: boolean;
  backupInterval?: number; // in ms
  compressionThreshold?: number; // size in bytes
}

export interface StateSnapshot {
  id: string;
  timestamp: number;
  data: Record<string, any>;
  metadata: {
    version: string;
    size: number;
    itemCount: number;
  };
}

export interface StateDiff {
  added: string[];
  modified: string[];
  removed: string[];
  changes: Record<string, { old: any; new: any }>;
}

class StateManager {
  private config: StateManagerConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private snapshots: StateSnapshot[] = [];
  private maxSnapshots = 10;

  constructor(config: StateManagerConfig) {
    this.config = {
      maxStorageSize: 50 * 1024 * 1024, // 50MB default
      autoCleanup: true,
      autoBackup: false,
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
      compressionThreshold: 1024, // 1KB
      ...config
    };

    this.initialize();
  }

  private initialize() {
    // Auto cleanup expired data on startup
    if (this.config.autoCleanup) {
      this.cleanup();
    }

    // Setup auto backup if enabled
    if (this.config.autoBackup && this.config.backupInterval) {
      setInterval(() => {
        this.createSnapshot();
      }, this.config.backupInterval);
    }

    // Monitor storage quota
    this.monitorStorageQuota();
  }

  // Enhanced data operations
  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    const finalOptions: StorageOptions = {
      version: this.config.version,
      ...options
    };

    // Auto-enable compression for large data
    if (!finalOptions.compress && this.config.compressionThreshold) {
      const size = new Blob([JSON.stringify(value)]).size;
      if (size > this.config.compressionThreshold) {
        finalOptions.compress = true;
      }
    }

    const oldValue = this.get(key, null);
    setStorageData(key, value, finalOptions);
    
    // Notify listeners
    this.notifyListeners(key, { old: oldValue, new: value });
    
    // Check storage quota after write
    await this.checkStorageQuota();
  }

  get<T>(key: string, defaultValue: T, options?: StorageOptions): T {
    return getStorageData(key, defaultValue, {
      version: this.config.version,
      ...options
    });
  }

  remove(key: string): void {
    const oldValue = this.get(key, null);
    removeStorageData(key);
    this.notifyListeners(key, { old: oldValue, new: null });
  }

  clear(): void {
    const keys = this.getAllKeys();
    clearAllStorageData();
    keys.forEach(key => {
      this.notifyListeners(key, { old: this.get(key, null), new: null });
    });
  }

  // State monitoring and analytics
  getAllKeys(): string[] {
    return Object.keys(localStorage);
  }

  getStateSize(): number {
    return getStorageInfo().totalSize;
  }

  async getStorageStats() {
    const info = getStorageInfo();
    const quota = await getStorageQuota();
    
    return {
      ...info,
      quota,
      usage: quota.used > 0 ? (info.totalSize / quota.used) * 100 : 0,
      healthScore: this.calculateHealthScore(info, quota)
    };
  }

  private calculateHealthScore(info: any, quota: any): number {
    let score = 100;
    
    // Deduct points for high storage usage
    const usagePercent = quota.total > 0 ? (quota.used / quota.total) * 100 : 0;
    if (usagePercent > 90) score -= 30;
    else if (usagePercent > 75) score -= 15;
    else if (usagePercent > 50) score -= 5;
    
    // Deduct points for too many items
    if (info.itemCount > 1000) score -= 20;
    else if (info.itemCount > 500) score -= 10;
    
    return Math.max(0, score);
  }

  // Advanced state operations
  async batch(operations: Array<{
    type: 'set' | 'remove';
    key: string;
    value?: any;
    options?: StorageOptions;
  }>): Promise<void> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    // Execute all operations
    for (const op of operations) {
      const oldValue = this.get(op.key, null);
      
      if (op.type === 'set' && op.value !== undefined) {
        setStorageData(op.key, op.value, {
          version: this.config.version,
          ...op.options
        });
        changes[op.key] = { old: oldValue, new: op.value };
      } else if (op.type === 'remove') {
        removeStorageData(op.key);
        changes[op.key] = { old: oldValue, new: null };
      }
    }
    
    // Notify all listeners once
    Object.entries(changes).forEach(([key, change]) => {
      this.notifyListeners(key, change);
    });
    
    await this.checkStorageQuota();
  }

  // State snapshots and history
  createSnapshot(id?: string): StateSnapshot {
    const data: Record<string, any> = {};
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      data[key] = localStorage.getItem(key);
    });
    
    const snapshot: StateSnapshot = {
      id: id || `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      data,
      metadata: {
        version: this.config.version,
        size: JSON.stringify(data).length,
        itemCount: keys.length
      }
    };
    
    this.snapshots.push(snapshot);
    
    // Keep only last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
    
    return snapshot;
  }

  restoreSnapshot(id: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === id);
    if (!snapshot) return false;
    
    // Clear current state
    this.clear();
    
    // Restore snapshot data
    Object.entries(snapshot.data).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });
    
    return true;
  }

  getSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  compareStates(snapshot1Id: string, snapshot2Id: string): StateDiff | null {
    const s1 = this.snapshots.find(s => s.id === snapshot1Id);
    const s2 = this.snapshots.find(s => s.id === snapshot2Id);
    
    if (!s1 || !s2) return null;
    
    const keys1 = new Set(Object.keys(s1.data));
    const keys2 = new Set(Object.keys(s2.data));
    
    const added = Array.from(keys2).filter(k => !keys1.has(k));
    const removed = Array.from(keys1).filter(k => !keys2.has(k));
    const common = Array.from(keys1).filter(k => keys2.has(k));
    
    const modified: string[] = [];
    const changes: Record<string, { old: any; new: any }> = {};
    
    common.forEach(key => {
      if (s1.data[key] !== s2.data[key]) {
        modified.push(key);
        changes[key] = { old: s1.data[key], new: s2.data[key] };
      }
    });
    
    return { added, modified, removed, changes };
  }

  // Event system
  subscribe(key: string, callback: (change: { old: any; new: any }) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private notifyListeners(key: string, change: { old: any; new: any }): void {
    this.listeners.get(key)?.forEach(callback => {
      try {
        callback(change);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  // Maintenance operations
  cleanup(): number {
    return cleanupExpiredData();
  }

  async optimizeStorage(): Promise<{
    itemsCompressed: number;
    spaceReclaimed: number;
    itemsRemoved: number;
  }> {
    const beforeSize = this.getStateSize();
    let itemsCompressed = 0;
    let itemsRemoved = 0;
    
    const keys = this.getAllKeys();
    
    for (const key of keys) {
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        // Try to parse as enhanced storage data
        const parsed = JSON.parse(data);
        
        // Remove expired items
        if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
          this.remove(key);
          itemsRemoved++;
          continue;
        }
        
        // Compress large uncompressed items
        if (!parsed.compressed && data.length > (this.config.compressionThreshold || 1024)) {
          const value = parsed.value || parsed;
          await this.set(key, value, { compress: true });
          itemsCompressed++;
        }
      } catch {
        // Skip invalid data
      }
    }
    
    const afterSize = this.getStateSize();
    const spaceReclaimed = beforeSize - afterSize;
    
    return { itemsCompressed, spaceReclaimed, itemsRemoved };
  }

  async checkStorageQuota(): Promise<void> {
    if (!this.config.maxStorageSize) return;
    
    const quota = await getStorageQuota();
    
    if (quota.used > this.config.maxStorageSize) {
      console.warn('Storage quota exceeded, optimizing...');
      await this.optimizeStorage();
    }
  }

  private async monitorStorageQuota(): Promise<void> {
    setInterval(async () => {
      await this.checkStorageQuota();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // Import/Export with enhanced features
  exportState(includeSnapshots = false): string {
    const data = {
      config: this.config,
      state: createFullBackup(),
      snapshots: includeSnapshots ? this.snapshots : [],
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  importState(data: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.state) {
        const result = restoreFromFullBackup(parsed.state);
        if (!result.success) return result;
      }
      
      if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
        this.snapshots = parsed.snapshots;
      }
      
      return { success: true, message: 'State imported successfully' };
    } catch (error) {
      return { success: false, message: `Import failed: ${error}` };
    }
  }

  // Development helpers
  debug(): void {
    console.group('🔍 State Manager Debug Info');
    console.log('Config:', this.config);
    console.log('Storage Info:', getStorageInfo());
    console.log('Listeners:', Array.from(this.listeners.entries()).map(([key, listeners]) => ({
      key,
      listenerCount: listeners.size
    })));
    console.log('Snapshots:', this.snapshots.length);
    console.groupEnd();
  }
}

// Export singleton instance
export const stateManager = new StateManager({
  appName: 'PennyLane',
  version: '3.0.0'
});

// Export class for custom instances
export { StateManager };