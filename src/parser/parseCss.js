const css = require('css');

/**
 * 解析选择器优先级
 * @param {string} selector
 */
function specificity(selector) {
  if(typeof selector !== 'string') {
    throw new Error('[specificity] unexpect selector: ', selector);
  }

  const parts = selector.split(' ');
  for (let part of parts) {

  }
}

/**
 * 计算选择器与元素的匹配关系
 * @desc 目前只支持id，class，tagName选择器
 * @param {object} el 元素
 * @param {string} selector 选择器
 * @return {bool}
 */
function matchSelector(el, selector) {
  if (!selector || !el || !el.attributes) {
    return false;
  }
  if (selector.charAt(0) === '#') {
    const attr = el.attributes.filter(attr => attr.name === 'id')[0];
    return attr && attr.value === selector.replace('#', '');
  }
  if (selector.charAt(0) === '.') {
    const attr = el.attributes.filter(attr => attr.name === 'class')[0];
    return attr && attr.value === selector.replace('.', '');
  }
  return el.tagName === selector;
}

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

module.exports = {
  matchSelector,
  parseCss,
}
