var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  INotifyWait = require('inotifywait'),
  async = require('async');


var Cache = function(path) {
  this.path = path;
  this.cache = {};
  this.directories = {};

  this.watch = new INotifyWait(this.path, {
    recursive: true
  });
};


Cache.prototype.start = function() {
  var self = this;

  this.find(function(err) {
    if(err) {
      throw err;
    }

    console.log(self.cache);

    self.watch.on('ready', function(filename) {
      console.log('Watchers initiated.');
    });

    self.watch.on('unlink', function(filename) {
      console.log(filename + ' deleted');
      if (self.cache[filename]) {
        delete self.cache[filename];
        console.log(filename + ' DELETED OK');
      }
    });
    self.watch.on('add', function(filename) {
      console.log(filename + ' added');
      var file = filename.split('.')[0];
      if (file.charAt(file.length - 1) !== '/') {
        console.log(file + ' ADDED OK');
        self._findFile(file);
      }
    });
    self.watch.on('change', function(filename) {
      console.log(filename + ' changed');
    });
  });
};


Cache.prototype.find = function(callback) {
  this.directories = {};
  this._findDirectory(this.path, callback);
};


Cache.prototype._findDirectory = function(directory, callback) {
  var self = this;
  fs.readdir(directory, function(err, files) {
    if (err) {
      if (err.code === 'EACCES' && directory === self.directory) {
        callback(new Error('Permission denied to read files in root of cache directory ' + directory));
      } else {
        console.log('Failed to open directory ' + directory + ': ' + err);
      }
    } else {
      async.eachSeries(files, function(file, done) {
        var child = path.join(directory, file);
        fs.stat(child, function(err, stat) {
          if (err) {
            console.log('Failed to stat ' + child + ': ' + err);
          } else {
            if (stat.isFile()) {
              self._findFile(child);
            } else if (stat.isDirectory()) {
              self.directories[child] = 1;
              self._findDirectory(child, callback);
            }
          }
          done();
        });
      }, function() {
        delete self.directories[directory];
        if (Object.keys(self.directories).length === 0) {
          callback();
        }
      });
    }
  });
};


Cache.prototype._findFile = function(file) {
  var self = this;
  fs.open(file, 'r', function(err, fd) {
    if (err) {
      console.log('Failed to open cache file ' + file + ': ' + err);
    } else {
      var buffer = new Buffer(1024);
      fs.read(fd, buffer, 0, buffer.length, 0, function(err, bytesRead, data) {
        if (err) {
          console.log('Failed to read cache file ' + file + ': ' + err);
        } else {
          console.log(file);
          var packet = self._parse(data, bytesRead);
          if (packet.key) {
            packet.file = file;
            self.cache[packet.key] = packet;
          }
        }
        fs.close(fd);
      });
    }
  });
};

Cache.prototype._parse = function(buffer, callback) {
  var packet = {};
  var start = buffer.indexOf('KEY:');
  var end = buffer.indexOf('\n', start);
  var aux = [];

  aux = buffer.toString('utf8', start, end).split(':');
  if(aux.length < 2) {
    return packet;
  }
  packet.key = aux[1].trim();

  start = end + 1;
  end = buffer.indexOf('\n', start);
  packet.status = buffer.toString('utf8', start, end).trim();

  var str = '';

  do {
    start = end + 1;
    end = buffer.indexOf('\n', start);
    str = buffer.toString('utf8', start, end);
    aux = str.split(':');
    if (aux.length >= 2) {
      packet[aux[0].trim().toLowerCase()] = aux[1].trim();
    }
  } while (end - start > 1);

  return packet;
};


module.exports = Cache;
