const css = require('css');

/**
 * 解析css
 * @param {string} style 样式内容
 */
function parseCss(style) {
  if(typeof style !== 'string') {
    throw new Error('parseCss error, unexpect type: ', style);
  }

  const ast = css.parse(style);
  const { rules } = ast.stylesheet;

  return {
    rules,
  }
}
