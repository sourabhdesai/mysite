exports.render = function (req, res) {
	res.setHeader("Content-Type", "text/html");
	res.render('pure-layout-gallery/index.html');
};