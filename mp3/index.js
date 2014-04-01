var data = require('./data.json');

exports.render = function(req,res) {
	res.setHeader("Content-Type", "text/html");
	res.render('mp3.html');
};

exports.getData = function () {
	return data;
};