class Logger {
  constructor(prefix) {
    this.prefix = prefix;
  }

  parseMsg(msg) {
    return `${this.prefix ? this.prefix + ' ' : ''}${msg}`;
  }

  error(msg) {
    throw new Error(this.parseMsg(msg));
  }

  log(msg) {
    console.log(this.parseMsg(msg));
  }

  warning(msg) {
    console.warning(this.parseMsg(msg))
  }
}

module.exports = Logger;
