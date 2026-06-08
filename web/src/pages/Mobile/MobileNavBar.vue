<template>
  <div class="mobile-nav-bar">
    <!-- 左侧：返回导图视图 -->
    <div class="nav-left" @click="goToMindMap">
      <span class="back-icon">🗺️</span>
      <span class="back-text">导图</span>
    </div>

    <!-- 中间：面包屑路径 -->
    <div class="nav-center" v-if="breadcrumb.length > 0">
      <div class="breadcrumb-scroll" ref="breadcrumbScroll">
        <template v-for="(item, index) in breadcrumb">
          <span
            class="breadcrumb-item"
            :class="{ active: index === breadcrumb.length - 1, clickable: index < breadcrumb.length - 1 }"
            :key="item.id"
            @click="index < breadcrumb.length - 1 && $emit('navigate-to', item.id)"
          >
            {{ item.text }}
          </span>
          <span class="breadcrumb-separator" v-if="index < breadcrumb.length - 1" :key="'sep-' + index">
            ›
          </span>
        </template>
      </div>
    </div>

    <!-- 右侧：菜单 -->
    <div class="nav-right">
      <!-- 菜单按钮 -->
      <div class="menu-btn" @click="showMenu = !showMenu">
        <span class="menu-dot"></span>
        <span class="menu-dot"></span>
        <span class="menu-dot"></span>
      </div>
    </div>

    <!-- 下拉菜单 -->
    <transition name="menu-fade">
      <div class="nav-menu" v-if="showMenu" @click.stop>
        <div class="menu-item" @click="handleAction('outline')">
          📋 大纲视图
        </div>
        <div class="menu-item" @click="handleAction('search')">
          🔍 搜索节点
        </div>
        <div class="menu-item" @click="handleAction('mindmap')">
          🗺️ 切换到导图视图
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div class="menu-overlay" v-if="showMenu" @click="showMenu = false"></div>
  </div>
</template>

<script>
export default {
  name: 'MobileNavBar',
  props: {
    breadcrumb: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  watch: {
    breadcrumb: {
      handler() {
        this.$nextTick(() => {
          const el = this.$refs.breadcrumbScroll
          if (el) {
            el.scrollLeft = el.scrollWidth
          }
        })
      },
      immediate: true
    }
  },
  methods: {
    goToMindMap() {
      this.$router.push('/')
    },
    handleAction(action) {
      this.showMenu = false
      switch (action) {
        case 'outline':
          this.$emit('show-outline')
          break
        case 'search':
          this.$emit('show-search')
          break
        case 'mindmap':
          this.$router.push('/')
          break
      }
    }
  }
}
</script>

<style lang="less" scoped>
.mobile-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f6;
  z-index: 100;
  // iPhone 安全区域
  padding-top: env(safe-area-inset-top);
  height: calc(56px + env(safe-area-inset-top));
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f5fa;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;

  &:active {
    background: #e8e8f0;
  }

  .back-icon {
    font-size: 16px;
  }

  .back-text {
    font-size: 13px;
    font-weight: 500;
    color: #4a5568;
  }
}

.nav-center {
  flex: 1;
  margin: 0 10px;
  overflow: hidden;
}

.breadcrumb-scroll {
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0;

  &::-webkit-scrollbar {
    display: none;
  }
}

.breadcrumb-item {
  font-size: 14px;
  color: #9090a0;
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;

  &.active {
    color: #1a1a2e;
    font-weight: 600;
  }

  &.clickable {
    cursor: pointer;

    &:active {
      background: #f0f0f6;
      color: #409eff;
    }
  }
}

.breadcrumb-separator {
  color: #c0c0d0;
  margin: 0 2px;
  font-size: 14px;
  flex-shrink: 0;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.menu-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 8px;
  cursor: pointer;

  .menu-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #606080;
  }

  &:active .menu-dot {
    background: #409eff;
  }
}

// 下拉菜单
.nav-menu {
  position: fixed;
  top: calc(56px + env(safe-area-inset-top));
  right: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  z-index: 200;
  overflow: hidden;
  min-width: 180px;
}

.menu-item {
  padding: 14px 18px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f5f5fa;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f0f7ff;
  }
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 150;
}

// 过渡动画
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.menu-fade-enter,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
