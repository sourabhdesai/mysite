var mp1          = require('../mp1');
var mp2          = require('../mp2');
var mp3          = require('../mp3');
var notes        = require('../notes');
var finalproject = require('../finalproject');
var wait         = require('wait.for');

finalproject.wait = wait;


exports.renderMP = function (req,res) {
	var mpNum = req.param("num");
	if (mpNum == "1") {
		mp1.render(req,res);
		// TODO
	} else if (mpNum == "2") {
		mp2.render(req,res);
	} else if (mpNum == "3") {
		mp3.render(req,res);
	}else {
		res.json({
			message : "Error: MP " + mpNum + " not available!"
		});
	}
};

exports.getMPData = function(req,res) {
	var mpNum = req.param('num');
	if (mpNum == "1") {
		res.json( mp1.getData() );
	} else if (mpNum == "2") {
		res.json( mp2.getData() );
	} else if(mpNum == "3") {
		res.json( mp3.getData() );
	}else {
		res.json({
			message : "Error: MP " + mpNum + " not available!"
		});
	}
};

exports.getFinalProjectData = function(req,res) {
	finalproject.getData(req,res);
};

exports.generateFinalProjectData = function(req, res) {
	wait.launchFiber(finalproject.generateData, req, res);
};

exports.renderFinalProject = function(req,res) {
	finalproject.render(req,res);
};

exports.renderNotes = function(req, res) {
	notes.render(req, res);
};