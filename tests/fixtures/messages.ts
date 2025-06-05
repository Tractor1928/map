import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const testMessages = {
  basic: [
    { 
      role: 'system' as const, 
      content: '你是一个AI助手' 
    },
    { 
      role: 'user' as const, 
      content: '你好' 
    }
  ] satisfies ChatCompletionMessageParam[],
  
  conversation: [
    { 
      role: 'system' as const, 
      content: '你是一个AI助手' 
    },
    { 
      role: 'user' as const, 
      content: '今天天气怎么样？' 
    },
    { 
      role: 'assistant' as const, 
      content: '我是AI助手，无法直接感知天气。' 
    },
    { 
      role: 'user' as const, 
      content: '明白了' 
    }
  ] satisfies ChatCompletionMessageParam[]
}; 