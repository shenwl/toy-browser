const net = require('net');
const _toPairs = require('lodash/toPairs');
const _isEmpty = require('lodash/isEmpty');


/**
 * 创建HTTP Request文本
 * @param {str} method 请求HTTP方法
 * @param {str} path  请求path
 * @param {object<str, str>} headers 请求头
 * @param {object<str, str>} body 请求体
 */
function createRequest(
  method = 'GET',
  path = '/',
  headers = {
    'Content-Type': 'application/json'
  },
  body = {}
) {
  const requestLine = `${method} ${path} HTTP/1.1\r\n`;

  let bodyText;
  if (headers['Content-Type'] === 'application/json') {
    if(_isEmpty(body)) {
      bodyText = '{}';
    } else {
      bodyText = JSON.stringify(body);
    }
  } else if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    bodyText = _toPairs(body).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join(';');
  }

  const headersLines = _toPairs({
    ...headers,
    'Content-Length': bodyText.length,
  }).map(([k, v]) => `${k}: ${v}`).join('\r\n');

  return requestLine + headersLines + '\r\n\r\n' + bodyText;
}

/**
 * 创建net client，构建并发送发送HTTP请求
 * @param {str} host 请求域名
 * @param {str} method 请求HTTP方法
 * @param {str} path  请求path
 * @param {object<str, str>} headers 请求头
 * @param {object<str, str>} body 请求体
 */
function createConnect({
  host = 'localhost',
  port = 80,
  path = '/',
  method = 'GET',
  headers,
  body,
} = {}) {
  const client = net.connect({host, port}, function() {
    console.log('tcp已连接');
  });
  const httpRequestText = createRequest(method, path, headers, body);

  console.log('--------request text start-----------')
  console.log(httpRequestText)
  console.log('--------request text end-----------')

  client.write(httpRequestText);

  return client;
}

/**
 * 请求函数
 * @param {str} path
 * @param {object} data
 * @param {object} options {headers, method, host, port}
 * @todo: 根据path解析host，path，port; 同个host及port，net client可以复用，不用每次创建
 */
function request(url, data, options) {
  const client = createConnect({...options, path: url, body: data});

  return new Promise((resolve, reject) => {
    client.on('data', (data) => {
      resolve(data.toString());
      client.end();
    });
    client.on('error', (err) => {
      reject(err);
      client.end();
    });
  });
}

module.exports = request;
