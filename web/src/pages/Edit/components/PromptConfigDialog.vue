<template>
  <el-dialog
    class="promptConfigDialog"
    :title="isEditMode ? '编辑提示词配置' : '新建提示词配置'"
    :visible.sync="dialogVisible"
    width="700px"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="promptConfigBox">
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="例如：我的自定义配置"
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>

        <el-form-item label="System 提示词" prop="system">
          <el-input
            type="textarea"
            v-model="formData.system"
            placeholder="输入系统提示词，定义 AI 的角色、回答框架等..."
            :autosize="{ minRows: 8, maxRows: 15 }"
            show-word-limit
          ></el-input>
          <div class="tip">定义 AI 的角色、回答风格和基本框架</div>
        </el-form-item>

        <el-form-item label="Contextual 提示词" prop="contextual">
          <el-input
            type="textarea"
            v-model="formData.contextual"
            placeholder="输入上下文提示词，用于处理追问时的行为..."
            :autosize="{ minRows: 8, maxRows: 15 }"
            show-word-limit
          ></el-input>
          <div class="tip">定义处理用户追问时的行为和策略</div>
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { saveCustomPrompt, validatePromptConfig } from '@/utils/promptStorage'

export default {
  name: 'PromptConfigDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    config: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      dialogVisible: false,
      isEditMode: false,
      formData: {
        id: '',
        name: '',
        system: '',
        contextual: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入配置名称', trigger: 'blur' },
          { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        system: [
          { required: true, message: '请输入 System 提示词', trigger: 'blur' },
          { min: 10, message: 'System 提示词至少 10 个字符', trigger: 'blur' }
        ],
        contextual: [
          { required: true, message: '请输入 Contextual 提示词', trigger: 'blur' },
          { min: 10, message: 'Contextual 提示词至少 10 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.initForm()
      }
    },
    dialogVisible(val, oldVal) {
      if (!val && oldVal) {
        this.close()
      }
    }
  },
  methods: {
    initForm() {
      if (this.config) {
        // 编辑模式
        this.isEditMode = true
        this.formData = {
          id: this.config.id,
          name: this.config.name,
          system: this.config.system,
          contextual: this.config.contextual
        }
      } else {
        // 新建模式
        this.isEditMode = false
        this.formData = {
          id: '',
          name: '',
          system: '',
          contextual: ''
        }
      }
      
      // 清除表单验证
      this.$nextTick(() => {
        if (this.$refs.formRef) {
          this.$refs.formRef.clearValidate()
        }
      })
    },

    close() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },

    cancel() {
      this.close()
    },

    confirm() {
      this.$refs.formRef.validate(valid => {
        if (valid) {
          // 额外验证
          const validation = validatePromptConfig(this.formData)
          if (!validation.valid) {
            this.$message.error(validation.errors[0])
            return
          }

          // 保存配置
          const savedId = saveCustomPrompt(this.formData)
          if (savedId) {
            this.$message.success(this.isEditMode ? '配置更新成功' : '配置创建成功')
            this.$emit('saved', savedId)
            this.close()
          } else {
            this.$message.error('保存配置失败，请重试')
          }
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.promptConfigDialog {
  /deep/ .el-dialog__body {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .promptConfigBox {
    .tip {
      margin-top: 5px;
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
    }

    /deep/ .el-textarea__inner {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
    }

    /deep/ .el-input__count {
      background: transparent;
    }
  }

  .dialog-footer {
    text-align: right;
  }
}
</style>


