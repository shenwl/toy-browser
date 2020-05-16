const request = require('./request');
const ResponseParser = require('../parser/responseParser');

(async () => {
  try {
    const resText = await request('/', {}, {
      port: 8088,
    });
    const responseParser = new ResponseParser();
    responseParser.recevie(resText);
    console.log('response', responseParser.response);
  } catch(e) {
    console.error('error: ', e);
  }
})()
