/**
 * 布局缓存管理器
 * 负责缓存布局计算结果，提高性能
 */
export class LayoutCache {
  constructor(config = {}) {
    this.cache = new Map();
    this.config = {
      maxSize: config.maxSize || 100,
      ttl: config.ttl || 5000, // 缓存过期时间(毫秒)
      enableCompression: config.enableCompression || false
    };
    
    // 定期清理过期缓存
    this.startCleanupTimer();
  }

  /**
   * 生成缓存键
   * @param {Array} nodes - 节点数组
   * @param {Object} algorithmConfig - 算法配置
   * @returns {string} - 缓存键
   */
  generateKey(nodes, algorithmConfig) {
    // 创建节点快照，只包含影响布局的关键属性
    const nodeSnapshot = nodes.map(node => ({
      id: node.id,
      parentId: node.parentId,
      width: node.width,
      height: node.height,
      type: node.type,
      childrenIds: node.childrenIds ? [...node.childrenIds].sort() : []
    }));

    // 按id排序确保一致性
    nodeSnapshot.sort((a, b) => a.id.toString().localeCompare(b.id.toString()));

    // 创建配置快照
    const configSnapshot = {
      algorithm: algorithmConfig.algorithm,
      direction: algorithmConfig.direction,
      nodeHorizontalGap: algorithmConfig.nodeHorizontalGap,
      nodeVerticalGap: algorithmConfig.nodeVerticalGap,
      minNodeDistance: algorithmConfig.minNodeDistance
    };

    // 生成哈希键
    const data = {
      nodes: nodeSnapshot,
      config: configSnapshot,
      timestamp: Date.now()
    };

    return this.hashObject(data);
  }

  /**
   * 获取缓存的布局结果
   * @param {string} key - 缓存键
   * @returns {Array|null} - 缓存的节点数组或null
   */
  get(key) {
    const cacheEntry = this.cache.get(key);
    
    if (!cacheEntry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cacheEntry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问时间
    cacheEntry.lastAccess = Date.now();
    
    return this.config.enableCompression ? 
      this.decompress(cacheEntry.data) : 
      cacheEntry.data;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {Array} nodes - 节点数组
   */
  set(key, nodes) {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const cacheEntry = {
      data: this.config.enableCompression ? this.compress(nodes) : nodes,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      size: this.calculateSize(nodes)
    };

    this.cache.set(key, cacheEntry);
  }

  /**
   * 检查是否需要重新计算布局
   * @param {Array} currentNodes - 当前节点数组
   * @param {Array} cachedNodes - 缓存的节点数组
   * @returns {boolean} - 是否需要重新计算
   */
  needsRecalculation(currentNodes, cachedNodes) {
    if (!cachedNodes || currentNodes.length !== cachedNodes.length) {
      return true;
    }

    // 检查节点是否发生了影响布局的变化
    for (let i = 0; i < currentNodes.length; i++) {
      const current = currentNodes[i];
      const cached = cachedNodes.find(n => n.id === current.id);

      if (!cached) {
        return true;
      }

      // 检查关键属性
      if (
        current.parentId !== cached.parentId ||
        current.width !== cached.width ||
        current.height !== cached.height ||
        current.type !== cached.type ||
        JSON.stringify(current.childrenIds) !== JSON.stringify(cached.childrenIds)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    let totalSize = 0;
    let hitCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      totalSize += entry.size;
      
      if (now - entry.timestamp > this.config.ttl) {
        expiredCount++;
      } else {
        hitCount++;
      }
    }

    return {
      cacheSize: this.cache.size,
      totalMemoryUsage: totalSize,
      validEntries: hitCount,
      expiredEntries: expiredCount,
      hitRate: this.cache.size > 0 ? hitCount / this.cache.size : 0
    };
  }

  /**
   * 移除最旧的缓存项
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    return expiredKeys.length;
  }

  /**
   * 启动定期清理定时器
   */
  startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, this.config.ttl / 2);
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 计算数据大小
   * @param {any} data - 数据
   * @returns {number} - 大小(字节)
   */
  calculateSize(data) {
    return JSON.stringify(data).length * 2; // 粗略估计
  }

  /**
   * 简单的对象哈希函数
   * @param {Object} obj - 要哈希的对象
   * @returns {string} - 哈希值
   */
  hashObject(obj) {
    const str = JSON.stringify(obj);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash.toString(36);
  }

  /**
   * 压缩数据(简单实现)
   * @param {any} data - 要压缩的数据
   * @returns {string} - 压缩后的数据
   */
  compress(data) {
    // 这里使用简单的JSON压缩，实际项目中可以使用更好的压缩算法
    return JSON.stringify(data);
  }

  /**
   * 解压数据
   * @param {string} compressedData - 压缩的数据
   * @returns {any} - 解压后的数据
   */
  decompress(compressedData) {
    return JSON.parse(compressedData);
  }

  /**
   * 销毁缓存管理器
   */
  destroy() {
    this.stopCleanupTimer();
    this.clear();
  }
} 