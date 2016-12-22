var Cache = new require('./cache');

var path = '/dev/shm/nginxfastcgi/';

var c = new Cache(path);
c.start();
