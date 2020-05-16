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

function emit(token) {
  const { type, tagName, content } = token;

  const top = stack[stack.length - 1];

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
 * @param {str} html html文本
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
