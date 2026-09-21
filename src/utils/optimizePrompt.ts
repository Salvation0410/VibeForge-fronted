const SHARED_REQUEST =
  '请让当前页面更美观、更清晰，并适合电脑和手机使用。保留原有功能、文字、图片和操作方式。不要删除或替换原有图片，也不要添加无关内容。'

const HTML_PROMPT = `${SHARED_REQUEST}请只返回一个完整可运行的 HTML 文件，不要附带解释；如果无法完整生成，请不要输出残缺代码。`

const MULTI_FILE_PROMPT = `${SHARED_REQUEST}请完整返回 index.html、style.css 和 script.js，不要附带解释；如果无法完整生成，请不要输出残缺代码。`

const VUE_PROMPT = `${SHARED_REQUEST}只修改完成这次优化需要的文件，不要重建项目或添加无关功能，并确保修改后可以正常运行。请完整完成所有修改，不要附带解释；如果无法完整生成，请不要输出残缺内容。`

/** 根据应用类型生成简短易懂的优化要求，同时保护原有图片、功能和内容不被删除。 */
export function buildOptimizePrompt(codeGenType?: string): string {
  switch (codeGenType?.toUpperCase()) {
    case 'HTML':
      return HTML_PROMPT
    case 'MULTI_FILE':
      return MULTI_FILE_PROMPT
    default:
      return VUE_PROMPT
  }
}
