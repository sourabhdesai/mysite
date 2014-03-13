var mp1 = require('../mp1');
var mp2 = require('../mp2');

exports.renderMP = function (req,res) {
	var mpNum = req.param("num");
	if (mpNum == "1") {
		mp1.render(req,res);
		// TODO
	} else if (mpNum == "2") {
		mp2.render(req,res);
	} else {
		res.json({
			message : "Error: MP " + mpNum + " not available!"
		});
	}
};

exports.getMPData = function(req,res) {
	var mpNum = req.param('num');
	if (mpNum == "1") {
		res.json(mp1.getData());
	} else if (mpNum == "2") {
		res.json(mp2.getData());
		// console.log(mp2.data);
	} else {
		res.json({
			message : "Error: MP " + mpNum + " not available!"
		});
	}
};