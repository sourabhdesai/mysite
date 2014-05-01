/**
 * Module dependencies.
 */

var express = require('express');
var http    = require('http');
var path    = require('path');

var home     = require('./landing_page');
var mprouter = require('./mprouter');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static());


app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', home.render);
routeMPs();

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


function routeMPs() {
	app.get('/cs398vl/mp/:num', mprouter.renderMP);
	app.get('/cs398vl/mp/:num/data', mprouter.getMPData);
	app.get('/cs398vl/notes', mprouter.renderNotes);
	app.get('/cs398vl/finalproject/', mprouter.renderFinalProject);
	app.get('/cs398vl/finalproject/wikitree.json', mprouter.getFinalProjectData);
	//app.get('/cs398vl/finalproject/generate', mprouter.generateFinalProjectData); // Only use to generate data using wait.for
}
