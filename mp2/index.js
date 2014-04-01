exports.generateData = function() {

	var natural = require('natural');
	var wp = require('wordpos');
	var hashes = require('hashes');
	var wait = require('wait.for');
	var fs = require("fs");

	var data = fs.readFileSync("text/ofk.txt").toString();

	var tokenizer = new natural.WordTokenizer();
	var tokens    = tokenizer.tokenize(data);

	var hashtable = new hashes.HashTable();
	var WordPOS   = new wp();

	tokens.forEach(function (token) {
		token = token.toLowerCase();
		var notSW = natural.stopwords.indexOf(token) == -1;
		// token = natural.PorterStemmer.stem(token);
		if (notSW) {
			var pair = hashtable.get(token);
			if (pair) {
				hashtable.add(token,pair.value+1,true);
			} else {
				hashtable.add(token,1,true);
			}
		}
	});
	var pairs = hashtable.getKeyValuePairs();

	pairs.sort(function(pair1,pair2) {
		return pair2.value - pair1.value;
	});

	console.log(100 * pairs.length/tokens.length + "%"); // Percentage of non stopword nouns in corpus

	var wn = new natural.WordNet();
	var trie = new natural.Trie();
	trie.addStrings(tokens);
	console.log(wn.lookup('node',function(r){return r;}));
	var used = [];

	var WordNetter = function(seed,level) {
		this.name = seed;
		if(level == 0)
			return;
		this.children = [];
		var netter = this;
		wn.lookup(this.name,function (results) {
			if(results.length == 0) {
				return;
			}
			// var result = findMostSynResult(results);c
			results.forEach(function(result) {
				if(result.synonyms.length == 0) {
					return;
				}
				result.synonyms.forEach(function (synonym) {
					if (used.indexOf(synonym) == -1 && trie.contains(synonym) ) {
						used.push(synonym);
						netter.children.push( new WordNetter(synonym, level - 1) );
						console.log("!");
					}
				});
			});
		});

		function findMostSynResult(results) {
			var most = results[0];
			for (var i = results.length - 1; i >= 0; i--) {
				if(results[i].synonyms.length > most.synonyms.length)
					most = results[i];
			};
			return most;
		};
	};

	var data =
	{
		name : "root",
		children : new Array(10)
	};
	for(var i = 0; i < 10; i++) {
		data.children[i] = new WordNetter(pairs[i].key,3);
	}

	// Really hacky way of waiting for asychronous calls to end...HORRIBLE practice, I know
	setTimeout(function(){

		function removeEmpties(data) {
			if(data.children) {
				if(data.children.length == 0) {
					data.children = undefined;
				} else {
					for (var i = data.children.length - 1; i >= 0; i--) {
						removeEmpties(data.children[i]);
						console.log("&");
					};
				}
			}
		}

		removeEmpties(data);

		fs.writeFile("flare.json", JSON.stringify(data,null,'\t'), function (err) {
		    if(err) {
		        console.log(err);
		    } else {
		        console.log("flare.json was saved!");
		    }
		});
	},10000);
};

var data = require('./data.json');
exports.getData = function() {
	return data;
}

exports.render = function(req,res) {
	res.setHeader("Content-Type", "text/html");
	res.render('mp2.html');
};

