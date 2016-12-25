var Cache = new require('./lib/cache');
var Dashboard = new require('./lib/dashboard');

var path = '/dev/shm/nginxfastcgi/';

var c = new Cache(path);
c.start();

var d = new Dashboard(8888, c);
d.start();
