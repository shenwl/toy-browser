/**
 * 用有穷状态机解析响应体，有以下几种状态
 */
const WAITING_LENGTH = 0;
const WAITING_LENGTH_LINE_END = 1;
const READING_THRUNK = 2;
const WAIT_NEW_LINE = 3;
const WAIT_NEW_LINE_END = 4;

/**
 * @todo: Body解析器, body可能是分为几个trunk
 */
class TrunkedBodyParser {
  constructor() {
    this.currentStatus = WAITING_LENGTH;

    this.content = [];
    this.length = 0;
    this.isFinished = false;
  }

  recevieChar(char) {
    const statusActions = {
      [WAITING_LENGTH]: () => {
        if(char === '\r') {
          if(this.length === 0) {
            this.isFinished = true;
          }
        }
        this.length *= 16
        this.length += parent(char, 16)
      },
      [WAITING_LENGTH_LINE_END]: () => {
        if(char === '\n') {
          this.currentStatus = WAIT_NEW_LINE;
        }
      },
      [READING_THRUNK]: () => {
        if(char === '\r') {
          this.currentStatus = WAIT_NEW_LINE_END;
          return;
        }
        this.content.push(char);
      },
      [WAIT_NEW_LINE]: () => {
        if(char === '\r') {
          this.currentStatus = WAIT_NEW_LINE_END;
          return;
        }
        this.content.push(char);
        this.currentStatus = READING_THRUNK;
      },
      [WAIT_NEW_LINE_END]: () => {
        if(char === '\n') {
          this.length = 0;
          this.currentStatus = WAITING_LENGTH;
        }
      },
    }
    statusActions[this.currentStatus]();
  }
}

module.exports = TrunkedBodyParser;
