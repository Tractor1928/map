/**
 * 手势识别 Mixin
 *
 * 用于移动端卡片滑动交互。同时支持 Touch 和 Mouse 事件（便于桌面调试）。
 * 识别四个方向的滑动：up / down / left / right
 *
 * 使用方式：
 *   import { swipeMixin } from './useSwipeGesture'
 *   export default {
 *     mixins: [swipeMixin],
 *     methods: {
 *       onSwipe(direction) {
 *         // direction: 'up' | 'down' | 'left' | 'right'
 *       }
 *     }
 *   }
 *
 * 配置（组件中通过 swipeOptions data 覆盖）：
 *   swipeOptions: {
 *     threshold: 50,     // 最小滑动距离（px）
 *     maxTime: 300,      // 最大滑动时间（ms）
 *     restraint: 60,     // 垂直/水平约束（防止斜向滑动误判）
 *     enabled: true      // 是否启用手势
 *   }
 */

const defaultOptions = {
  threshold: 50,
  maxTime: 300,
  restraint: 80,
  enabled: true
}

export const swipeMixin = {
  data() {
    return {
      swipeOptions: { ...defaultOptions },
      // 内部状态
      _swipeStartX: 0,
      _swipeStartY: 0,
      _swipeStartTime: 0,
      _swipeActive: false
    }
  },

  methods: {
    /**
     * 绑定滑动事件到指定元素
     * @param {HTMLElement|string} el - 元素或 ref 名称
     */
    bindSwipeEvents(el) {
      if (typeof el === 'string') {
        el = this.$refs[el]
      }
      if (!el) return

      el.addEventListener('touchstart', this._handleTouchStart, { passive: true })
      el.addEventListener('touchmove', this._handleTouchMove, { passive: false })
      el.addEventListener('touchend', this._handleTouchEnd)

      // 桌面调试：鼠标事件
      el.addEventListener('mousedown', this._handleMouseDown)
      el.addEventListener('mousemove', this._handleMouseMove)
      el.addEventListener('mouseup', this._handleMouseUp)
      el.addEventListener('mouseleave', this._handleMouseUp)
    },

    /**
     * 解绑滑动事件
     * @param {HTMLElement|string} el
     */
    unbindSwipeEvents(el) {
      if (typeof el === 'string') {
        el = this.$refs[el]
      }
      if (!el) return

      el.removeEventListener('touchstart', this._handleTouchStart)
      el.removeEventListener('touchmove', this._handleTouchMove)
      el.removeEventListener('touchend', this._handleTouchEnd)

      el.removeEventListener('mousedown', this._handleMouseDown)
      el.removeEventListener('mousemove', this._handleMouseMove)
      el.removeEventListener('mouseup', this._handleMouseUp)
      el.removeEventListener('mouseleave', this._handleMouseUp)
    },

    // ==================== Touch 事件 ====================

    _handleTouchStart(e) {
      if (!this.swipeOptions.enabled) return
      const touch = e.touches[0]
      this._swipeStartX = touch.clientX
      this._swipeStartY = touch.clientY
      this._swipeStartTime = Date.now()
      this._swipeActive = true
    },

    _handleTouchMove(e) {
      if (!this._swipeActive) return
      // 阻止默认滚动行为（当检测到明确的水平滑动时）
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - this._swipeStartX)
      const dy = Math.abs(touch.clientY - this._swipeStartY)
      if (dx > 20 && dx > dy * 1.2) {
        e.preventDefault()
      }
    },

    _handleTouchEnd(e) {
      if (!this._swipeActive) return
      this._swipeActive = false
      const touch = e.changedTouches[0]
      this._detectSwipe(touch.clientX, touch.clientY)
    },

    // ==================== Mouse 事件（调试用） ====================

    _handleMouseDown(e) {
      if (!this.swipeOptions.enabled) return
      this._swipeStartX = e.clientX
      this._swipeStartY = e.clientY
      this._swipeStartTime = Date.now()
      this._swipeActive = true
    },

    _handleMouseMove(e) {
      // 鼠标移动不阻止默认行为
    },

    _handleMouseUp(e) {
      if (!this._swipeActive) return
      this._swipeActive = false
      this._detectSwipe(e.clientX, e.clientY)
    },

    // ==================== 方向检测 ====================

    _detectSwipe(endX, endY) {
      const dx = endX - this._swipeStartX
      const dy = endY - this._swipeStartY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const elapsed = Date.now() - this._swipeStartTime
      const { threshold, maxTime, restraint } = this.swipeOptions

      // 时间过长或距离过短，忽略
      if (elapsed > maxTime) return
      if (absDx < threshold && absDy < threshold) return

      // 确定主方向
      let direction = null
      if (absDx > absDy && absDx > restraint) {
        direction = dx > 0 ? 'right' : 'left'
      } else if (absDy > absDx && absDy > restraint) {
        direction = dy > 0 ? 'down' : 'up'
      } else if (absDx >= absDy && absDx >= threshold) {
        direction = dx > 0 ? 'right' : 'left'
      } else if (absDy >= absDx && absDy >= threshold) {
        direction = dy > 0 ? 'down' : 'up'
      }

      if (direction && typeof this.onSwipe === 'function') {
        this.$emit('swipe', direction)
        this.onSwipe(direction)
      }
    },

    /**
     * 振动反馈
     */
    vibrate(duration = 10) {
      if (navigator.vibrate) {
        navigator.vibrate(duration)
      }
    }
  },

  beforeDestroy() {
    // 组件销毁时不需要手动清理，因为事件绑定在特定元素上
  }
}

export default swipeMixin
