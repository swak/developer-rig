module.exports = function(app, extension) {
  const fs = require('fs');
  const jwt = require('jsonwebtoken');
  const parseUrl = require('url').parse;
  const dateFormat = require('dateformat');
  let sequenceNumber = 0;

  app.use(require('body-parser').json());

  // Create endpoints for API in local mode.
  app.get('/helix/users', (req, res) => {
    checkClientId(req.header('Client-ID'));
    const url = parseUrl(req.url, true);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    const data = {
      'data': [
        {
          'id': '999999999',
          'login': url.query.login,
          'display_name': url.query.login,
          'type': '',
          'broadcaster_type': '',
          'description': '',
          'profile_image_url': 'https://static-cdn.jtvnw.net/user-default-pictures/49988c7b-57bc-4dee-bd4f-6df4ad215d3a-profile_image-300x300.jpg',
          'offline_image_url': '',
          'view_count': 1,
        },
      ],
    };
    res.end(JSON.stringify(data));
  });

  app.post('/extensions/search', (req, res) => {
    checkClientId(req.header('Client-ID'));
    checkToken(req.header('Authorization'));
    res.setHeader('Content-Type', 'application/json');
    if (extension) {
      res.writeHead(200);
      const data = {
        _total: 1,
        extensions: [extension],
      };
      res.end(JSON.stringify(data));
    } else {
      res.writeHead(500);
      res.end(JSON.stringify({ message: 'Extension not provided' }));
    }
  });

  app.post('/extensions/message/:channelId', (req, res) => {
    checkToken(req.header('Authorization'));
    let message = {
      time_sent: dateFormat(new Date(), 'isoUtcDateTime'),
      content_type: req.body.content_type,
      content: [req.body.message],
      sequence: { number: ++sequenceNumber, start: '2018-06-18T17:32:55Z' },
    };
    message = {
      type: 'MESSAGE',
      data: {
        topic: `channel-ext-v1.${req.params.channelId}-${req.header('Client-ID')}-broadcast`,
        message: JSON.stringify(message) + '\r\n',
      }
    };
    broadcast(JSON.stringify(message));
    res.writeHead(204);
    res.end();
  });

  // Create a Web socket server for PubSub.
  const options = {
    key: fs.readFileSync('ssl/selfsigned.key'),
    cert: fs.readFileSync('ssl/selfsigned.crt')
  };
  const socketServer = require('https').createServer(options, (req, res) => {
    res.writeHead(200);
    res.end('live');
  });
  const WebSocket = new require('ws');
  const wss = new WebSocket.Server({ server: socketServer });
  wss.on('connection', function(socket) {
    socket.on('message', function(message) {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
        socket.send(JSON.stringify({ type: 'PONG' }));
      } else {
        wss.clients.forEach(function(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    });
  });
  socketServer.listen(3003);

  function checkClientId(clientIdHeaderValue) {
    if (process.env.EXT_CLIENT_ID && process.env.EXT_CLIENT_ID !== clientIdHeaderValue) {
      console.warn('Unexpected Client ID:', clientIdHeaderValue);
    }
  }

  function checkToken(authorizationHeaderValue) {
    if (process.env.EXT_SECRET) {
      const token = (authorizationHeaderValue || '').split(' ')[1] || '';
      try {
        jwt.verify(token, new Buffer(process.env.EXT_SECRET, 'base64'));
      } catch (ex) {
        console.warn('Invalid JWT:', token || '(none)');
      }
    }
  }

  function broadcast(data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  return { socketServer, wss };
};
