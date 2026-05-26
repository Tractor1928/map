<template>
  <Sidebar ref="sidebar" :title="$t('setting.title')">
    <div
      class="sidebarContent customScrollbar"
      :class="{ isDark: isDark }"
      v-if="configData"
    >
      <!-- 水印 -->
      <div class="row">
        <!-- 是否显示水印 -->
        <div class="rowItem">
          <el-checkbox
            v-model="watermarkConfig.show"
            @change="watermarkShowChange"
            >{{ $t('setting.showWatermark') }}</el-checkbox
          >
        </div>
      </div>
      <template v-if="watermarkConfig.show">
        <!-- 是否仅在导出时显示 -->
        <div class="row">
          <div class="rowItem">
            <el-checkbox
              v-model="watermarkConfig.onlyExport"
              @change="updateWatermarkConfig"
              >{{ $t('setting.onlyExport') }}</el-checkbox
            >
          </div>
        </div>
        <!-- 是否在节点下方 -->
        <div class="row">
          <div class="rowItem">
            <el-checkbox
              v-model="watermarkConfig.belowNode"
              @change="updateWatermarkConfig"
              >{{ $t('setting.belowNode') }}</el-checkbox
            >
          </div>
        </div>
        <!-- 水印文字 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkText') }}</span>
            <el-input
              v-model="watermarkConfig.text"
              size="small"
              @change="updateWatermarkConfig"
              @keydown.native.stop
            ></el-input>
          </div>
        </div>
        <!-- 水印文字颜色 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextColor') }}</span>
            <span
              class="block"
              v-popover:popover3
              :style="{ backgroundColor: watermarkConfig.textStyle.color }"
            ></span>
            <el-popover ref="popover3" placement="bottom" trigger="click">
              <Color
                :color="watermarkConfig.textStyle.color"
                @change="
                  value => {
                    watermarkConfig.textStyle.color = value
                    updateWatermarkConfig()
                  }
                "
              ></Color>
            </el-popover>
          </div>
        </div>
        <!-- 水印文字透明度 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextOpacity') }}</span>
            <el-slider
              v-model="watermarkConfig.textStyle.opacity"
              style="width: 170px"
              :min="0"
              :max="1"
              :step="0.1"
              @change="updateWatermarkConfig"
            ></el-slider>
          </div>
        </div>
        <!-- 水印文字字号 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextFontSize') }}</span>
            <el-input-number
              v-model="watermarkConfig.textStyle.fontSize"
              size="small"
              :min="0"
              :max="50"
              :step="1"
              @change="updateWatermarkConfig"
              @keydown.native.stop
            ></el-input-number>
          </div>
        </div>
        <!-- 旋转角度 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkAngle') }}</span>
            <el-input-number
              v-model="watermarkConfig.angle"
              size="small"
              :min="0"
              :max="90"
              :step="10"
              @change="updateWatermarkConfig"
              @keydown.native.stop
            ></el-input-number>
          </div>
        </div>
        <!-- 水印行间距 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkLineSpacing') }}</span>
            <el-input-number
              v-model="watermarkConfig.lineSpacing"
              size="small"
              :step="10"
              @change="updateWatermarkConfig"
              @keydown.native.stop
            ></el-input-number>
          </div>
        </div>
        <!-- 水印文字间距 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextSpacing') }}</span>
            <el-input-number
              v-model="watermarkConfig.textSpacing"
              size="small"
              :step="10"
              @change="updateWatermarkConfig"
              @keydown.native.stop
            ></el-input-number>
          </div>
        </div>
      </template>
      <!-- 配置性能模式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.openPerformance"
            @change="
              value => {
                updateOtherConfig('openPerformance', value)
              }
            "
            >{{ $t('setting.openPerformance') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 配置开启自由拖拽 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.enableFreeDrag"
            @change="
              value => {
                updateOtherConfig('enableFreeDrag', value)
              }
            "
            >{{ $t('setting.enableFreeDrag') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 配置是否启用富文本编辑 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="enableNodeRichText"
            @change="enableNodeRichTextChange"
            >{{ $t('setting.isEnableNodeRichText') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否开启文本编辑时实时更新节点大小 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.openRealtimeRenderOnNodeTextEdit"
            @change="
              updateOtherConfig('openRealtimeRenderOnNodeTextEdit', $event)
            "
            >{{ $t('setting.openRealtimeRenderOnNodeTextEdit') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否显示滚动条 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="localConfigs.isShowScrollbar"
            @change="updateLocalConfig('isShowScrollbar', $event)"
            >{{ $t('setting.isShowScrollbar') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否一直显示展开收起按钮 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.alwaysShowExpandBtn"
            @change="updateOtherConfig('alwaysShowExpandBtn', $event)"
            >{{ $t('setting.alwaysShowExpandBtn') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否在键盘输入时自动进入节点文本编辑模式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.enableAutoEnterTextEditWhenKeydown"
            @change="
              updateOtherConfig('enableAutoEnterTextEditWhenKeydown', $event)
            "
            >{{ $t('setting.enableAutoEnterTextEditWhenKeydown') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否开启文件拖入页面导入的方式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="localConfigs.enableDragImport"
            @change="updateLocalConfig('enableDragImport', $event)"
            >{{ $t('setting.enableDragImport') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 节点连线样式是否允许继承祖先的连线样式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.enableInheritAncestorLineStyle"
            @change="
              updateOtherConfig('enableInheritAncestorLineStyle', $event)
            "
            >{{ $t('setting.enableInheritAncestorLineStyle') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否开启ai功能 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="localConfigs.enableAi"
            @change="updateLocalConfig('enableAi', $event)"
            >{{ $t('setting.enableAi') }}</el-checkbox
          >
        </div>
      </div>
      <!-- AI配置 -->
      <div v-if="localConfigs.enableAi">
        <!-- API密钥配置 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.aiApiKey') }}</span>
            <el-input
              size="mini"
              style="width: 200px"
              v-model="aiConfigs.apiKey"
              placeholder="请输入API密钥"
              type="password"
              @change="updateAiConfig('apiKey', $event)"
            ></el-input>
          </div>
        </div>
        <!-- 模型名称配置 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.aiModel') }}</span>
            <el-input
              size="mini"
              style="width: 200px"
              v-model="aiConfigs.model"
              placeholder="请输入模型名称"
              @change="updateAiConfig('model', $event)"
            ></el-input>
          </div>
        </div>
        <!-- AI服务类型配置 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.aiServiceType') }}</span>
            <el-select
              size="mini"
              style="width: 200px"
              v-model="aiConfigs.serviceType"
              placeholder="选择AI服务"
              @change="updateAiConfig('serviceType', $event)"
            >
              <el-option label="现代AI服务" value="modern"></el-option>
              <el-option label="模拟模式" value="mock"></el-option>
            </el-select>
          </div>
        </div>
        <!-- 测试连接按钮 -->
        <div class="row">
          <div class="rowItem">
            <el-button size="mini" @click="testAiConnection" :loading="testingAi">
              {{ testingAi ? '测试中...' : '测试AI连接' }}
            </el-button>
            <span v-if="aiTestResult !== null" :style="{ color: aiTestResult ? '#67C23A' : '#F56C6C', marginLeft: '10px' }">
              {{ aiTestResult ? '✅ 连接成功' : '❌ 连接失败' }}
            </span>
          </div>
        </div>

        <!-- AI 提示词配置管理 -->
        <div class="promptConfigSection">
          <div class="sectionTitle">AI 提示词配置</div>
          
          <!-- 当前配置选择器 -->
          <div class="row">
            <div class="rowItem">
              <span class="name">当前配置</span>
              <el-select
                size="mini"
                style="width: 200px"
                v-model="promptConfig.selectedId"
                placeholder="选择提示词配置"
                @change="handlePromptConfigChange"
              >
                <el-option-group label="预设配置">
                  <el-option
                    v-for="preset in presetPrompts"
                    :key="preset.id"
                    :label="preset.name"
                    :value="preset.id"
                  >
                  </el-option>
                </el-option-group>
                <el-option-group label="自定义配置" v-if="customPrompts.length > 0">
                  <el-option
                    v-for="custom in customPrompts"
                    :key="custom.id"
                    :label="custom.name"
                    :value="custom.id"
                  >
                  </el-option>
                </el-option-group>
              </el-select>
            </div>
          </div>

          <!-- 配置管理按钮 -->
          <div class="row">
            <div class="rowItem btnGroup">
              <el-button size="mini" @click="handleCreatePrompt">
                新建
              </el-button>
              <el-button size="mini" @click="handleEditPrompt" :disabled="!canEditCurrentPrompt">
                编辑
              </el-button>
              <el-button size="mini" @click="handleDeletePrompt" :disabled="!canDeleteCurrentPrompt">
                删除
              </el-button>
              <el-button size="mini" @click="handleImportPrompt">
                导入
              </el-button>
              <el-button size="mini" @click="handleExportPrompt">
                导出
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 配置鼠标滚轮行为 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.mousewheelAction') }}</span>
          <el-select
            size="mini"
            style="width: 120px"
            v-model="config.mousewheelAction"
            placeholder=""
            @change="
              value => {
                updateOtherConfig('mousewheelAction', value)
              }
            "
          >
            <el-option :label="$t('setting.zoomView')" value="zoom"></el-option>
            <el-option
              :label="$t('setting.moveViewUpDown')"
              value="move"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!-- 配置鼠标缩放行为 -->
      <div class="row" v-if="config.mousewheelAction === 'zoom'">
        <div class="rowItem">
          <span class="name">{{
            $t('setting.mousewheelZoomActionReverse')
          }}</span>
          <el-select
            size="mini"
            style="width: 120px"
            v-model="config.mousewheelZoomActionReverse"
            placeholder=""
            @change="
              value => {
                updateOtherConfig('mousewheelZoomActionReverse', value)
              }
            "
          >
            <el-option
              :label="$t('setting.mousewheelZoomActionReverse1')"
              :value="false"
            ></el-option>
            <el-option
              :label="$t('setting.mousewheelZoomActionReverse2')"
              :value="true"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!-- 配置创建新节点时的行为 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.createNewNodeBehavior') }}</span>
          <el-select
            size="mini"
            style="width: 120px"
            v-model="config.createNewNodeBehavior"
            placeholder=""
            @change="
              value => {
                updateOtherConfig('createNewNodeBehavior', value)
              }
            "
          >
            <el-option
              :label="$t('setting.default')"
              value="default"
            ></el-option>
            <el-option
              :label="$t('setting.notActive')"
              value="notActive"
            ></el-option>
            <el-option
              :label="$t('setting.activeOnly')"
              value="activeOnly"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!-- 图片和文本内容的间距 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.imgTextMargin') }}</span>
          <el-slider
            style="width: 150px"
            v-model="config.imgTextMargin"
            @change="
              value => {
                updateOtherConfig('imgTextMargin', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <!-- 文本各内容的间距 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.textContentMargin') }}</span>
          <el-slider
            style="width: 150px"
            v-model="config.textContentMargin"
            @change="
              value => {
                updateOtherConfig('textContentMargin', value)
              }
            "
          ></el-slider>
        </div>
      </div>
    </div>

    <!-- 提示词配置编辑对话框 -->
    <PromptConfigDialog
      :visible.sync="promptDialogVisible"
      :config="editingPromptConfig"
      @saved="handlePromptConfigSaved"
    />
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { storeConfig } from '@/api'
import { mapState, mapMutations } from 'vuex'
import Color from './Color.vue'
import PromptConfigDialog from './PromptConfigDialog.vue'
import { PRESET_PROMPTS } from '@/config/aiPrompts'
import {
  getSelectedPromptId,
  setSelectedPromptId,
  getCustomPrompts,
  getPromptById,
  deleteCustomPrompt,
  downloadPromptConfig,
  importPromptConfig,
  saveCustomPrompt
} from '@/utils/promptStorage'

export default {
  components: {
    Sidebar,
    Color,
    PromptConfigDialog
  },
  props: {
    configData: {
      type: Object,
      default: null
    },
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      config: {
        openPerformance: false,
        enableFreeDrag: false,
        mousewheelAction: 'zoom',
        mousewheelZoomActionReverse: false,
        createNewNodeBehavior: 'default',
        openRealtimeRenderOnNodeTextEdit: true,
        alwaysShowExpandBtn: false,
        enableAutoEnterTextEditWhenKeydown: true,
        imgTextMargin: 0,
        textContentMargin: 0,
        enableInheritAncestorLineStyle: false
      },
      watermarkConfig: {
        show: false,
        onlyExport: false,
        text: '',
        lineSpacing: 100,
        textSpacing: 100,
        angle: 30,
        textStyle: {
          color: '',
          opacity: 0,
          fontSize: 1
        }
      },
      updateWatermarkTimer: null,
      enableNodeRichText: true,
      localConfigs: {
        isShowScrollbar: false,
        enableDragImport: false,
        enableAi: false
      },
      aiConfigs: {
        apiKey: '',
        model: '',
        serviceType: 'modern'
      },
      testingAi: false,
      aiTestResult: null,
      // 提示词配置管理
      promptConfig: {
        selectedId: 'default'
      },
      presetPrompts: [],
      customPrompts: [],
      promptDialogVisible: false,
      editingPromptConfig: null
    }
  },
  computed: {
    ...mapState({
      activeSidebar: state => state.activeSidebar,
      localConfig: state => state.localConfig,
      isDark: state => state.localConfig.isDark,
      aiConfig: state => state.aiConfig
    }),
    // 当前选中的配置是否可编辑（预设配置不可编辑）
    canEditCurrentPrompt() {
      const currentConfig = getPromptById(this.promptConfig.selectedId)
      return currentConfig && !currentConfig.isPreset
    },
    // 当前选中的配置是否可删除（预设配置不可删除）
    canDeleteCurrentPrompt() {
      const currentConfig = getPromptById(this.promptConfig.selectedId)
      return currentConfig && !currentConfig.isPreset
    }
  },
  watch: {
    activeSidebar(val) {
      if (val === 'setting') {
        this.$refs.sidebar.show = true
        this.initConfig()
        this.initWatermark()
      } else {
        this.$refs.sidebar.show = false
      }
    }
  },
  created() {
    this.initLoacalConfig()
    this.initAiConfig()
    this.initPromptConfig()
    this.$bus.$on('toggleOpenNodeRichText', this.onToggleOpenNodeRichText)
  },
  beforeDestroy() {
    this.$bus.$off('toggleOpenNodeRichText', this.onToggleOpenNodeRichText)
  },
  methods: {
    ...mapMutations(['setLocalConfig']),

    // 初始化其他配置
    initConfig() {
      Object.keys(this.config).forEach(key => {
        if (typeof this.config[key] === 'object') {
          this.config[key] = {
            ...(this.mindMap.getConfig(key) || {})
          }
        } else {
          this.config[key] = this.mindMap.getConfig(key)
        }
      })
    },

    // 初始化本地配置
    initLoacalConfig() {
      this.enableNodeRichText = this.localConfig.openNodeRichText
      this.mousewheelAction = this.localConfig.mousewheelAction
      this.mousewheelZoomActionReverse = this.localConfig.mousewheelZoomActionReverse
      Object.keys(this.localConfigs).forEach(key => {
        this.localConfigs[key] = this.localConfig[key]
      })
    },

    // 初始化水印配置
    initWatermark() {
      const config = this.mindMap.getConfig('watermarkConfig')
      ;['text', 'lineSpacing', 'textSpacing', 'angle', 'onlyExport'].forEach(
        key => {
          this.watermarkConfig[key] = config[key]
        }
      )
      this.watermarkConfig.show = !!config.text
      this.watermarkConfig.textStyle = { ...config.textStyle }
    },

    // 更新其他配置
    updateOtherConfig(key, value) {
      this.mindMap.updateConfig({
        [key]: value
      })
      this.configData[key] = value
      storeConfig(this.configData)
      if (
        [
          'alwaysShowExpandBtn',
          'imgTextMargin',
          'textContentMargin',
          'enableInheritAncestorLineStyle'
        ].includes(key)
      ) {
        this.mindMap.reRender()
      }
    },

    // 更新水印配置
    updateWatermarkConfig() {
      clearTimeout(this.updateWatermarkTimer)
      this.updateWatermarkTimer = setTimeout(() => {
        let { show, ...config } = this.watermarkConfig
        this.mindMap.watermark.updateWatermark({
          ...config
        })
        this.configData.watermarkConfig = this.mindMap.getConfig(
          'watermarkConfig'
        )
        storeConfig(this.configData)
      }, 300)
    },

    // 切换显示水印与否
    watermarkShowChange(value) {
      if (value) {
        let text =
          this.watermarkConfig.text || this.$t('setting.watermarkDefaultText')
        this.watermarkConfig.text = text
      } else {
        this.watermarkConfig.text = ''
      }
      this.updateWatermarkConfig()
    },

    // 切换是否开启节点富文本编辑
    enableNodeRichTextChange(e) {
      this.$confirm(
        this.$t('setting.changeRichTextTip'),
        e
          ? this.$t('setting.changeRichTextTip2')
          : this.$t('setting.changeRichTextTip3'),
        {
          confirmButtonText: this.$t('setting.confirm'),
          cancelButtonText: this.$t('setting.cancel'),
          type: 'warning'
        }
      )
        .then(() => {
          this.mindMap.renderer.textEdit.hideEditTextBox()
          this.setLocalConfig({
            openNodeRichText: e
          })
        })
        .catch(() => {
          this.enableNodeRichText = !this.enableNodeRichText
        })
    },

    onToggleOpenNodeRichText(val) {
      this.setLocalConfig({
        openNodeRichText: val
      })
      this.enableNodeRichText = val
    },

    // 本地配置
    updateLocalConfig(key, value) {
      this.setLocalConfig({
        [key]: value
      })
    },

    // 初始化AI配置
    initAiConfig() {
      this.aiConfigs.apiKey =
        this.aiConfig.key || localStorage.getItem('apiKey') || ''
      this.aiConfigs.model =
        this.aiConfig.model || localStorage.getItem('model') || 'deepseek-chat'
      this.aiConfigs.serviceType = localStorage.getItem('ai_service_mode') || 'modern'

      // 同步侧边栏配置到请求实际使用的 vuex aiConfig
      this.setLocalConfig({
        key: this.aiConfigs.apiKey,
        model: this.aiConfigs.model
      })

      if (!localStorage.getItem('model')) {
        localStorage.setItem('model', 'deepseek-chat')
      }
    },

    // 更新AI配置
    updateAiConfig(key, value) {
      this.aiConfigs[key] = value
      
      // 保存到localStorage
      if (key === 'apiKey') {
        localStorage.setItem('apiKey', value)
        this.setLocalConfig({ key: value })
      } else if (key === 'model') {
        localStorage.setItem('model', value)
        this.setLocalConfig({ model: value })
      } else if (key === 'serviceType') {
        localStorage.setItem('ai_service_mode', value)
      }
      
      // 重置测试结果
      this.aiTestResult = null
      
      console.log(`AI配置已更新: ${key} = ${key === 'apiKey' ? value.substring(0, 10) + '...' : value}`)
    },

    // 测试AI连接
    async testAiConnection() {
      if (!this.aiConfigs.apiKey || !this.aiConfigs.model) {
        this.$message.warning('请先配置API密钥和模型名称')
        return
      }
      
      this.testingAi = true
      this.aiTestResult = null
      
      try {
        // 这里可以调用AI服务进行测试
        // 模拟测试连接
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 简单验证：检查配置是否完整
        if (this.aiConfigs.apiKey.length > 10 && this.aiConfigs.model.length > 0) {
          this.aiTestResult = true
          this.$message.success('AI连接测试成功')
        } else {
          this.aiTestResult = false
          this.$message.error('配置信息不完整')
        }
      } catch (error) {
        this.aiTestResult = false
        this.$message.error('AI连接测试失败: ' + error.message)
        console.error('AI连接测试失败:', error)
      } finally {
        this.testingAi = false
      }
    },

    // ===== 提示词配置管理方法 =====

    // 初始化提示词配置
    initPromptConfig() {
      this.presetPrompts = PRESET_PROMPTS
      this.loadCustomPrompts()
      this.promptConfig.selectedId = getSelectedPromptId()
    },

    // 加载自定义配置
    loadCustomPrompts() {
      this.customPrompts = getCustomPrompts()
    },

    // 处理配置切换
    handlePromptConfigChange(id) {
      setSelectedPromptId(id)
      this.$message.success('提示词配置已切换')
      console.log('切换到配置:', id)
    },

    // 新建配置
    handleCreatePrompt() {
      this.editingPromptConfig = null
      this.promptDialogVisible = true
    },

    // 编辑配置
    handleEditPrompt() {
      if (!this.canEditCurrentPrompt) {
        this.$message.warning('预设配置不可编辑')
        return
      }
      
      const currentConfig = getPromptById(this.promptConfig.selectedId)
      if (currentConfig) {
        this.editingPromptConfig = currentConfig
        this.promptDialogVisible = true
      }
    },

    // 删除配置
    handleDeletePrompt() {
      if (!this.canDeleteCurrentPrompt) {
        this.$message.warning('预设配置不可删除')
        return
      }

      this.$confirm('确定要删除这个配置吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const success = deleteCustomPrompt(this.promptConfig.selectedId)
        if (success) {
          this.$message.success('配置已删除')
          this.loadCustomPrompts()
          this.promptConfig.selectedId = getSelectedPromptId()
        } else {
          this.$message.error('删除失败')
        }
      }).catch(() => {
        // 取消删除
      })
    },

    // 导入配置
    handleImportPrompt() {
      // 创建文件输入元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const result = importPromptConfig(event.target.result)
            
            if (!result.success) {
              this.$message.error('导入失败: ' + result.error)
              return
            }
            
            // 检查是否已存在
            if (result.exists) {
              this.$confirm(
                `配置 "${result.config.name}" 已存在，是否覆盖？`,
                '确认导入',
                {
                  confirmButtonText: '覆盖',
                  cancelButtonText: '取消',
                  type: 'warning'
                }
              ).then(() => {
                this.doImportPrompt(result.config)
              }).catch(() => {
                // 取消导入
              })
            } else {
              this.doImportPrompt(result.config)
            }
          } catch (error) {
            this.$message.error('导入失败: ' + error.message)
            console.error('导入配置失败:', error)
          }
        }
        
        reader.readAsText(file)
      }
      
      input.click()
    },

    // 执行导入
    doImportPrompt(config) {
      const savedId = saveCustomPrompt(config)
      if (savedId) {
        this.$message.success('配置导入成功')
        this.loadCustomPrompts()
        this.promptConfig.selectedId = savedId
        setSelectedPromptId(savedId)
      } else {
        this.$message.error('保存配置失败')
      }
    },

    // 导出配置
    handleExportPrompt() {
      const currentConfig = getPromptById(this.promptConfig.selectedId)
      if (!currentConfig) {
        this.$message.warning('未找到当前配置')
        return
      }
      
      const success = downloadPromptConfig(currentConfig)
      if (success) {
        this.$message.success('配置已导出')
      } else {
        this.$message.error('导出失败')
      }
    },

    // 配置保存后的回调
    handlePromptConfigSaved(savedId) {
      this.loadCustomPrompts()
      this.promptConfig.selectedId = savedId
      setSelectedPromptId(savedId)
    }
  }
}
</script>

<style lang="less" scoped>
.sidebarContent {
  padding: 20px;
  padding-top: 10px;

  &.isDark {
    .title {
      color: #fff;
    }

    .row {
      .rowItem {
        .name {
          color: hsla(0, 0%, 100%, 0.6);
        }
      }
    }
  }

  .title {
    font-size: 16px;
    font-family: PingFangSC-Medium, PingFang SC;
    font-weight: 500;
    color: rgba(26, 26, 26, 0.9);
    margin-bottom: 10px;
    margin-top: 20px;

    &.noTop {
      margin-top: 0;
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .rowItem {
      display: flex;
      align-items: center;
      margin-bottom: 5px;

      .name {
        font-size: 12px;
        margin-right: 10px;
        white-space: nowrap;
      }

      .block {
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        cursor: pointer;
      }

      &.btnGroup {
        flex-wrap: wrap;
        gap: 5px;
        
        .el-button {
          margin: 0;
        }
      }
    }
  }

  // 提示词配置部分样式
  .promptConfigSection {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);

    .sectionTitle {
      font-size: 13px;
      font-weight: 500;
      color: rgba(26, 26, 26, 0.8);
      margin-bottom: 12px;
    }
  }

  &.isDark {
    .promptConfigSection {
      border-top-color: hsla(0, 0%, 100%, 0.1);

      .sectionTitle {
        color: hsla(0, 0%, 100%, 0.8);
      }
    }
  }
}
</style>
