var wikitree = require('./wikitree.js');

exports.getData = function(req,res) {
	wikitree.getData(req,res);
};

exports.render = function(req, res) {
	res.setHeader("Content-Type", "text/html");
	res.render('finalproject.html');
};

exports.generateData = function(req,res) {
	wikitree.wait = exports.wait;
	wikitree.generateData(req,res);
};

exports.wait = null;