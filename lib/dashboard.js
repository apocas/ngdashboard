var express = require('express');

var Dashboard = function(port, cache) {
  this.cache = cache;

  this.port = port;
  this.app = express();
  this.app.use(express.static(__dirname + '/../static'));

  this.httpServer = require('http').Server(this.app);
};

Dashboard.prototype.start = function() {
  var self = this;

  this.httpServer.listen(this.port);
  console.log('(server) Dashboard server listening on port ' + this.port);

  this.app.get('/cache', function(req, res) {
    res.json(self.cache.files);
  });

  this.app.get('/cache/:id', function(req, res) {
    if(self.cache[req.params.id]) {
      res.json(self.cache[req.params.id]);
    } else {
      res.status(404);
    }
  });

  this.app.delete('/cache/:id', function(req, res) {
    if(self.cache[req.params.id]) {
      delete self.cache[req.params.id];
      res.json({});
    } else {
      res.status(404);
    }
  });
};

module.exports = Dashboard;
