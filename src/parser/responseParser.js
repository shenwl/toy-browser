const Logger = require('../common/logger');
const TrunkedBodyParser = require('./trunkedBodyParser');

const _get = require('lodash/get');
const logger = new Logger('[ResponseParser]');


/**
 * 用有穷状态机解析响应文本，有以下几种状态
 */
const WAITING_STATUS_LINE = 0;      // 等待状态行
const WAITING_STATUS_LINE_END = 1;  // 等待状态行终结
const WAITING_HEADER_NAME = 2;      // 等待header key
const WAITING_HEADER_SPACE = 3;     // 等待header空格
const WAITING_HEADER_VALUE = 4;     // 等待header value
const WAITING_HEADER_LINE_END = 5;  // 等待header行终结
const WAITING_HEADER_BLOCK_END = 6; // 等待headers部分终结
const WAITING_BODY = 7;             // 等待body

/**
 * HTTP响应文本流解析器
 */
class ResponseParser {
  constructor() {
    this.currentStatus = WAITING_STATUS_LINE;

    this.statusLine = '';
    this.headers = {};

    this.headerName = '';
    this.headerValue = '';
    this.body = '';

    this.recevieChar = this.recevieChar.bind(this);
  }

  get response() {
    const parseStatus = this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);

    return {
      statusCode: _get(parseStatus, '[1]'),
      statusText: _get(parseStatus, '[2]'),
      headers: this.headers,
      body: this.bodyParser ? this.bodyParser.content : this.body,
    }
  }

  recevie(text) {
    if (typeof text !== 'string') {
      logger.error('unexpect type: ' + text);
    }
    text.split('').forEach(this.recevieChar);
  }

  recevieChar(char) {
    const statusActions = {
      [WAITING_STATUS_LINE]: () => {
        if (char == '\r') {
          return this.currentStatus = WAITING_STATUS_LINE_END;
        }
        if (char == '\n') {
          return this.currentStatus = WAITING_HEADER_NAME;
        }
        this.statusLine += char;
      },
      [WAITING_STATUS_LINE_END]: () => {
        if (char == '\n') {
          return this.currentStatus = WAITING_HEADER_NAME;
        }
      },
      [WAITING_HEADER_NAME]: () => {
        if(char === ':') {
          return this.currentStatus = WAITING_HEADER_SPACE;
        }
        if(char === '\r') {
          this.currentStatus = WAITING_HEADER_BLOCK_END;
          // body为chunked
          if(this.headers['Transfer-Encoding'] === 'chunked') {
            this.bodyParser = new TrunkedBodyParser();
          }
          return;
        }
        this.headerName += char;
      },
      [WAITING_HEADER_SPACE]: () => {
        if(char === ' ') {
          return this.currentStatus = WAITING_HEADER_VALUE;
        }
      },
      [WAITING_HEADER_VALUE]: () => {
        if(char === '\r') {
          this.current = WAITING_HEADER_LINE_END;
          this.headers[this.headerName] = this.headerValue;
          this.headerName = '';
          this.headerValue = '';
          return;
        }
        this.headerValue += char;
      },
      [WAITING_HEADER_LINE_END]: () => {
        if(char === '\n') {
          return this.currentStatus = WAITING_HEADER_NAME;
        }
      },
      [WAITING_HEADER_BLOCK_END]: () => {
        if(char === '\n') {
          return this.currentStatus = WAITING_BODY;
        }
      },
      [WAITING_BODY]: () => {
        if(this.bodyParser) {
          return this.bodyParser.recevieChar(char);
        }
        this.body += char;
      }
    };

    statusActions[this.currentStatus](char);
  }
}

module.exports = ResponseParser;
