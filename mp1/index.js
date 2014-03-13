var data = require('./data.json');

exports.getData = function() {
	// TODO: Get the data and return it
	return data;
};

exports.render = function(req, res) {
	res.setHeader("Content-Type", "text/html");
	res.render('mp1.html'); // TODO: Render the html file on the res variable
};