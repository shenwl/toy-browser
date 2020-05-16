const { parseCss, matchSelector } = require('./parseCss');

const TOKEN_TYPE = {
  EOF: 'EOF',
  TEXT: 'text',
  TAG_NAME: 'tagName',
  START_TAG: 'startTag',
  END_TAG: 'endTag',
  ATTRIBUTE_NAME: 'attributeName',
  ATTRIBUTE_VALUE: 'attributeValue',
}
const NODE_TYPE = {
  DOCUMENT: 'document',
  TEXT: 'text',
  ELEMENT: 'element',
}
const EOF = Symbol('EOF');

let currentToken;
let currentAttribute;
let currentTextNode;

// document为跟节点
const stack = [{type: NODE_TYPE.DOCUMENT, children: []}];

const rules = [];

function addCssRules(text) {
  rules.push(...parseCss(text).rules);
}

/**
 * 计算css
 * @param {object} el 元素
 */
function computeCss(el) {
  // 获取当前元素的所有父元素
  const elements = stack.slice().reverse();

  if (!el.computedStyle) {
    el.computedStyle = {};
  }

  for (let rule of rules) {
    const selectorParts = rule.selectors[0].split(' ').reverse();

    if (!matchSelector(el, selectorParts[0])) continue;

    let matched = false;
    let j = 1;

    elements.forEach(item => {
      if (matchSelector(item, selectorParts[j])) {
        j++;
      }
    })

    if (j >= selectorParts.length) {
      matched = true;
    }

    if (matched) {
      // 匹配到了，加入computedStyle
      console.log('[el]: ', el, '[rule]: ', rule)
      const computedStyle = el.computedStyle;
      for(let declaration of rule.declarations) {
        if(!computedStyle[declaration.property]) computedStyle[declaration.property] = {};
        // @todo: 优先级设置
        computedStyle[declaration.property].value = declaration.value;
      }
    }
  }
}

function emit(token) {
  const top = stack[stack.length - 1];

  const { type, tagName, content } = token;

  if (type === TOKEN_TYPE.TEXT) {
    top.children.push({
      type: NODE_TYPE.TEXT,
      content,
    })
    return;
  };

  if (type === TOKEN_TYPE.START_TAG) {
    const el = {
      type: NODE_TYPE.ELEMENT,
      attributes: [],
      children: [],
    }
    el.tagName = tagName;
    el.parent = top;
    return
  };

  if(type === TOKEN.END_TAG) {
    // if(top.tagName !)
  }
}

function selfClosingStartTag() {

}

function beforeAttributeName(c) {
  if (c.match(/^[\t\n\f]$/)) {
    return beforeAttributeName;
  }
}

function tagName(c) {
  if (c.match(/^[\t\n\f]$/)) {
    return beforeAttributeName;
  }
  if (c === '>') {
    emit(currentToken);
    return data;
  }
  if(c === '/') {
    return selfClosingStartTag;
  }
  if(c.match(/^[a-z|A-Z]$/)) {
    currentToken.tagName += c;
    return tagName;
  }
  return tagName;
}

function tagOpen(c) {
  if (c === '/') {
    return endTagOpen;
  }
  if(c.match(/^[a-z|A-Z]$/)) {
    currentToken.tagName += c;
    return tagName;
  }
}

function endTagOpen(c) {

}

function data(c) {
  if(c === '<') {
    return tagOpen;
  }
  if(c === EOF) {
    emit({
      type: TOKEN_TYPE.EOF,
      content: c,
    });
  }
  emit({
    type: TOKEN_TYPE.TEXT,
    content: c,
  });
}

/**
 * 有穷状态机解析html
 * @param {string} html html文本
 * @return {object} dom tree root(document node)
 */
function parseHtml(html) {
  if (typeof html !== 'string') {
    throw new Error('html must be string: ', html);
  }
  let state = data;

  for (let c of html) {
    state = state(c);
  }

  state = state(EOF);
  return stack[0];
}

module.exports = parseHtml;
