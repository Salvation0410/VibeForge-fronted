const HTML_PROMPT = '请基于当前应用的完整代码优化页面。必须保留现有业务功能、数据内容和交互逻辑，只调整信息层级、排版、间距、配色、响应式表现和必要的操作反馈；不要新增与需求无关的模块、加载动画或模拟数据。请返回修改后的完整单文件 HTML，CSS 和 JavaScript 必须内联且结构完整。最终回复只能包含一个闭合的 html 代码块，代码块外不得输出标题、解释或总结；无法完整输出时不要提交部分代码。'

const MULTI_FILE_PROMPT = '请基于当前应用的完整代码优化页面。必须保留现有业务功能、数据内容和交互逻辑，只调整信息层级、排版、间距、配色、响应式表现和必要的操作反馈；不要新增与需求无关的模块、加载动画或模拟数据。请返回完整的 index.html、style.css 和 script.js，三个文件必须相互匹配且可直接运行。严格按当前三文件协议输出，围栏外不得输出标题、解释或总结；无法完整输出时不要提交部分代码。'

const VUE_PROMPT = '请在当前 Vue 工程内优化页面。必须保留现有路由、组件职责、业务功能、数据内容和交互逻辑，只修改完成本次视觉与体验优化所必需的文件；不要重建工程、替换技术栈、引入无关依赖、模块、动画或模拟数据。优先复用现有组件和样式约定，确保修改后项目能够正常构建，并完整完成所有必要文件修改。'

const MEDIA_PRESERVATION_PROMPT = '必须保留现有全部图片、图片地址、CSS 背景图和业务媒体数据；不得删除图片，不得替换为随机图、占位图或无关外链。允许调整图片尺寸、裁剪方式、响应式布局、懒加载和加载失败状态；原图片无法访问时仍保留原引用，不得伪造替代内容。'

/** 根据生成类型提供优化意图，并统一约束模型不得在视觉优化时静默删除业务图片。 */
export function buildOptimizePrompt(codeGenType?: string): string {
  let typePrompt: string
  switch (codeGenType?.toUpperCase()) {
    case 'HTML':
      typePrompt = HTML_PROMPT
      break
    case 'MULTI_FILE':
      typePrompt = MULTI_FILE_PROMPT
      break
    default:
      typePrompt = VUE_PROMPT
  }
  return `${typePrompt}${MEDIA_PRESERVATION_PROMPT}`
}
