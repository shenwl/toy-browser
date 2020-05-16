const http = require('http');

const htmlDemo = `
  <html maaa=a >
  <head>
      <style>
  body div #myid{
      width:100px;
      background-color: #ff5000;
  }
  body div img{
      width:30px;
      background-color: #ff1111;
  }
      </style>
  </head>
  <body>
      <div>
          <img id="myid"/>
          <img />
      </div>
  </body>
  </html>
`

const server = http.createServer((req, res) => {
  console.log(req)
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.end(htmlDemo);
});

server.on('clientError', (err, socket) => {
  console.log('clientError', err)
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8088);
