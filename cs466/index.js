var fs   = require('fs');
var runtimeData = require('./barchart_runtime.json');
var varianceData = require('./barchart_variance.json');
var accuracyData = require('./barchart_accuracy.json');

exports.render = function (req, res) {
	res.setHeader("Content-Type", "text/html");
	var num = req.param("num");
	if (num == "0") {
		res.render('miniproject0.html');
	} else if (num == "1") {
		res.render('miniproject1.html');
	} else if (num == "2") {
		res.render("miniproject2.html");
	} else if (num == "3") {
		res.render("miniproject3.html");
	} else if (num == "4") {
		res.render("miniproject4.html");
	} else {
		res.json({
			message : "Number " + num + " Has no Page"
		});
	}
};

exports.getVizData = function (req, res) {
	var num = req.param("num");
	if (num == "0") {
		res.json(runtimeData);
	} else if (num == "1") {
		res.json(runtimeData);
	} else if (num == "2") {
		res.json(varianceData);
	} else if (num == "3") {
		res.json(varianceData);
	} else if (num == "4") {
		res.json(accuracyData);
	} else {
		res.json({
			message : "Number " + num + " Has no Data"
		});
	}
};