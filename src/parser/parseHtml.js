const { parseCss, matchSelector } = require('./parseCss');
const _toPairs = require('lodash/toPairs');

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
    if(currentTextNode == null) {
      currentTextNode = {
        type: TOKEN_TYPE.TEXT,
        content: '',
      }
      top.children.push(currentTextNode)
    }
    currentTextNode.content += content;
    return;
  };

  if (type === TOKEN_TYPE.START_TAG) {
    const el = {
      type: NODE_TYPE.ELEMENT,
      attributes: [],
      children: [],
    }
    el.tagName = tagName;

    _toPairs(token).forEach(([k, v]) => {
      if (k !== 'type' && k !== 'tagName') {
        el.attributes.push({name: k, value: v})
      }
    });

    token.children.push(el);
    if (!token.isSelfClosing) {
      stack.push(el);
    }
    currentTextNode = null;
    return
  };

  if (type === TOKEN.END_TAG) {
    if (top.tagName !== tagName) {
      throw new Error(`Tag start end doesn't match! start: ${top.tagName}, end: ${tagName}`)
    }
    stack.pop();
  }
}

function selfClosingStartTag(c) {
  if (c === '>') {
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data;
  }
  return;
}


function tagOpen(c) {
  if (c === '/') {
    return endTagOpen;
  }
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: TOKEN_TYPE.START_TAG,
      tagName: '',
    }
    return tagName(c);
  }
  emit({
    type: 'text',
    content: c,
  });
  return;
}

function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: TOKEN_TYPE.END_TAG,
      tagName: '',
    }
    return tagName(c);
  }
}

function tagName(c) {
  if (c.match(/^[\t\n\f]$/)) {
    return beforeAttributeName;
  }
  if(c === '/') {
    return selfClosingStartTag;
  }
  if(c.match(/^[A-Z]$/)) {
    currentToken.tagName += c; //.toLowerCase();
    return tagName;
  }
  if (c === '>') {
    emit(currentToken);
    return data;
  }
  currentToken.tagName += c;
  return tagName;
}

function beforeAttributeName(c) {
  if (c.match(/^[\t\n\f]$/)) {
    return beforeAttributeName;
  }
  if (c === '/' || c === '>' || c === EOF) {
    return afterAttributeName(c);
  }
  if (c === '=') {
    // @todo
    return;
  }
  currentAttribute = {
    name: '',
    value: '',
  }
  return attributeName(c);
}

function attributeName(c) {
  if (c.match(/^[\t\n\f]$/) || c === '/' || c === '>' || c === EOF) {
    return afterAttributeName(c);
  }
  if (c === '=') {
    return beforeAttributeValue;
  }
  if (c === '\u0000') {
    // @todo
    return;
  }
  if (['\"', "'", '<'].includes(c)) {
    // @todo
    return;
  }
  currentAttribute.name += c;
  return attributeName;
}

function afterAttributeName(c) {
  if (c.match(/^[\t\n\f]$/)) {
    return afterAttributeName;
  }
  if (c === '/') {
    return selfClosingStartTag(c);
  }
  if (c === '=') {
    return beforeAttributeValue;
  }
  if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }
  if ( c === EOF) {
    return;
  }
  currentToken[currentAttribute.name] = currentAttribute.value;
  currentAttribute = {
    name: '',
    value: '',
  }
  return attributeName(c);
}

function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f]$/) || c === '/' || c === '>' || c === EOF) {
    return beforeAttributeValue(c);
  }
  if (c === '\"') {
    return doubleQuotedAttributeValue;
  }
  if (c === '\'') {
    return singleQuotedAttributeValue;
  }
  if (c === '>') {
    return;
  }
  return unquotedAttributeValue(c);
}

function doubleQuotedAttributeValue() {
  if (c === '\"') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  }
  if (c === '\u0000') {
    return;
  }
  if (c === EOF) {
    return;
  }
  currentAttribute.value += c;
  return doubleQuotedAttributeValue;
}

function singleQuotedAttributeValue() {
  if (c === '\'') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  }
  if (c === '\u0000') {
    return;
  }
  if (c === EOF) {
    return;
  }
  currentAttribute.value += c;
  return singleQuotedAttributeValue;
}

function afterQuotedAttributeValue() {
  if (c.match(/^[\t\n\f]$/)) {
    return beforeAttributeName;
  }
  if (c === '/') {
    return selfClosingStartTag;
  }
  if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }
  if (c === EOF) {
    return;
  }
  currentAttribute.value += c;
  return doubleQuotedAttributeValue;
}

function unquotedAttributeValue() {
  if (c.match(/^[\t\n\f]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  }
  if (c === '/') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  }
  if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }
  if (c === '\u0000') {
    return;
  }
  if (['\"', "'", '<', '=', '`'].includes(c)) {
    return;
  }
  if (c === EOF) {
    return;
  }
  currentAttribute.value += c;
  return doubleQuotedAttributeValue;
}

function data(c) {
  if(c === '<') {
    return tagOpen;
  }
  if(c === EOF) {
    emit({
      type: TOKEN_TYPE.EOF,
    });
    return;
  }
  emit({
    type: TOKEN_TYPE.TEXT,
    content: c,
  });
  return data;
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
