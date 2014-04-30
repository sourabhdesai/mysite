var wikitree = require('./wikitree.js');

exports.getData = function(req,res) {
	wikitree.getData(res.json);
};

exports.render = function(req, res) {
	res.json({
		message : "Need to Implement!"
	});
};

exports.generateData = function(req,res) {
	wikitree.wait = exports.wait;
	wikitree.generateData(req,res);
};

exports.wait = null;