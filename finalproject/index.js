var wikitree = require('./wikitree.js');

exports.getData = function(req,res) {
	res.json( wikitree.getData() );
};

exports.render = function(req, res) {
	res.json({
		message : "Need to Implement!"
	});
};