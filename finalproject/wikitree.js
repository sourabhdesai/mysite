var fs     = require('fs');
var colors = require('colors');

var data = null;

exports.wait = null;

function print(x) {
	console.log(x);
}

exports.getData = function(req,res) {
	if (data) {
		res.json(data);
	} else {
		fs.readFile("wikitree.json",function(err, jsonFile) {
			if (err) {
				res.json(err);
			} else {
				data = JSON.parse(jsonFile);
				res.json(data);
			}
		});
	}
};

exports.generateData = function(req, res) {
	var wait  = exports.wait;

	var wikipedia = require('wikipedia-js');
	var async     = require('async');
	var natural   = require('natural');

	var classifier = require('./texts_classifier.js');

	//print("About to Read zen_full.txt");

	var raw       = fs.readFileSync("./finalproject/texts/relevant/zen_full.txt").toString();
	var tokenizer = new natural.WordTokenizer();
	var tokens    = tokenizer.tokenize(raw);

	//print("Read and Tokenized");

	// Remove stopwords
	for (var i = 0; i < natural.stopwords.length; i++) {
		for (var a = 0; a < tokens.length; a++) {
			if ( tokens[a] == natural.stopwords[i] ) {
				tokens.splice(a,1);
				a--;
			}
		};
	};

	//print("Removed Stopwords");

	function extractLinkedWikis(article) {
		var innerWikis = article.match(/<a href="http:\/\/en.wikipedia.org\/wiki\/\S*">(\w| )*<\/a>/g);
		if (!innerWikis) {
			//print("Weird ... Couldn't find any Inner Links".red);
			return [];
		}
		var innerWikisJSON = new Array(innerWikis.length);

		for (var i = 0; i < innerWikis.length; i++) {
			var linkHTML      = innerWikis[i];
			var linkIndex     = linkHTML.indexOf('<a href="http://en.wikipedia.org/wiki/') + 38;
			var linkTextIndex = linkHTML.indexOf('">') + 2;
			// Extract actual link info
			var title    = linkHTML.substring(linkIndex, linkTextIndex - 2).replace(/_/g, " ");
			var linkText = linkHTML.substring(linkTextIndex, linkHTML.indexOf("</a>") );

			innerWikisJSON[i] = {
				title : title,
				linkText : linkText
			};

		};

		return innerWikisJSON;

	};



	var zenQuery = {
		query : "Zen and the Art of Motorcycle Maintenance",
		format : "html",
		summaryOnly : false
	};

	var LinkTrie = new natural.Trie();

	//print("About to Search for Zen Article");

	var result = wait.for(wikipedia.searchArticle, zenQuery);

	//print("Got Zen Article");
	var zenLinks = extractLinkedWikis(result);
	var before = zenLinks.length;
	//print("Extracted " + zenLinks.length + " Links from Zen Article");
	for (var i = 0; i < zenLinks.length; i++) {
		if( LinkTrie.contains( zenLinks[i].title ) || LinkTrie.contains( zenLinks[i].linkText ) )  {
			zenLinks.splice(i,1);
			i--;
		} else if( zenLinks[i].title.indexOf("Category:") != -1 || zenLinks[i].title.indexOf("wikt:") != -1 || zenLinks[i].title.indexOf("wiktionary:") != -1 ) {
			//print("Found 'Category:'/'wikt:'/'wiktionary:' at " + i + " in " + zenLinks[i].title);
		} else if( !classifier.isRelevant( zenLinks[i].title) && !classifier.isRelevant( zenLinks[i].linkText) ) {
			//print("Found: ( " + zenLinks[i].title + " , " + zenLinks[i].linkText  + " ) To be Irrelevant");
			zenLinks.splice(i,1);
			i--;
		} else {
			LinkTrie.addStrings( [ zenLinks[i].title, zenLinks[i].linkText ] );
		}
	};
	var after = zenLinks.length;
	//print("After removing Irrelevant Links, only have " + zenLinks.length + " Links Left\nHere are the Remaining Links");
	//print("Thats a compression of " + ( ( 100 * ( after / before ) ) + "%" ).cyan );
	print(zenLinks);
	/**
	Now the Hard (Expensive) Part!
	SYNCHRONOUSLY create the Wikitree
	*/

	var initCompreshThresh = 10; // Compression Threshold ... articles with a compreshThresh or greater percentage of relevant links will be added. 
	var decayFactor        = 3; // For optimum, try 1.75
	var maxCompreshThresh  = 90;
	var maxLevel           = 3;


	var WikiTree = function(node,level) {
		this.name    = node.name;
		this.context = node.context;
		this.text    = node.article;
		this.level = level;
		if (this.level > maxLevel)
			return;

		if (node.children) {
			this.children = node.children;
		}

		function createArticleSummary(article, links) {
			// TODO: Must Implement
			return article;
		}

		function isRelevant(article, title, linkText) {
			// Tweak Here
			return classifier.isRelevant(title) || classifier.isRelevant(linkText);
		}

		WikiTree.prototype.searchChild = function(child) {
			//print("Searching for Link Title \"" + child.title + "\" And Link Text \"" + child.linkText + "\"");

			var childQuery = {
				query : child.title,
				format : "html",
				summaryOnly : false
			};

			var childArticle = wait.for(wikipedia.searchArticle, childQuery);

			//print("Got Wikipedia Response for " + child.title);
			if (childArticle == null) {
				//print("Didn't get Article for " + child.title);
				return new WikiTree({
					name : child.title,
					context : child.linkText,
					article : null
				}, this.level + 1);
			};
			
			var childWikiLinks = extractLinkedWikis(childArticle);
			
			var before = childWikiLinks.length;
			
			//print("Found " + childWikiLinks.length + " Links for " + child.title);
			
			var numRepeated = 0;

			for (var i = 0; i < childWikiLinks.length; i++) {
				if (childWikiLinks[i].title == null || childWikiLinks[i].linkText == null ) {
					console.log("Houston we have a problem" + JSON.stringify(childWikiLinks[i]) );
					childWikiLinks.splice(i,1);
					i--;
				} else if ( LinkTrie.contains(childWikiLinks[i].title) || LinkTrie.contains(childWikiLinks[i].linkText) ) {
					numRepeated++;
					childWikiLinks.splice(i,1);
					i--;
				} else if ( !isRelevant( childWikiLinks[i], childWikiLinks[i].title, childWikiLinks[i].linkText ) ) {
					// Remove if it is irrelevant
					childWikiLinks.splice(i,1);
					i--;
				} else {
						LinkTrie.addString(childWikiLinks[i].title);
						LinkTrie.addString(childWikiLinks[i].linkText);
				}
			};

			var after = childWikiLinks.length;

			var compression = 100 * ( after / ( before - numRepeated ) );

			//print("After pruning, " + ( childWikiLinks.length + "" ).yellow + " Links left for " + child.title);
			//print("Thats a compression of " + ( compression + "%" ).cyan );

			var levelCompreshThresh = initCompreshThresh + Math.pow(decayFactor, this.level);
			levelCompreshThresh = Math.min(levelCompreshThresh,maxCompreshThresh);
			if (compression < levelCompreshThresh) {
				print("Child '" + child.title.inverse + "' didn't meet compreshThresh requirement of " + ( levelCompreshThresh + "%" ).inverse.cyan );
				return null;
			} else {
				print("Child '" + child.title.inverse.yellow + "' met compreshThresh requirement of " + ( levelCompreshThresh + "%" ).inverse.cyan);
				return new WikiTree({
					name : child.title,
					context : child.linkText,
					article : createArticleSummary(childArticle, childWikiLinks),
					children : childWikiLinks
				}, this.level + 1 );
			}
		
		};

		WikiTree.prototype.descend = function() {
			// Descend to the next level ... Meaning find the children of the current children (If there are any)
			if (!this.children) {
				//print( ("Leaf at " + this.name ).underline.yellow );
				return;
			}

			for (var i = 0; i < this.children.length; i++) {
				//print("Doing Descend for \""+this.name + "\" at child \"" + ( this.children[i].title || "( no title )" ) +'"' );
				if ( this.children[i].title.indexOf(":") != -1 ) {
					//print("Found ':' at " + i + " in " + this.children[i].title);
					this.children.splice(i,1);
					i--;
				} else {
					this.children[i] = this.searchChild(this.children[i]);
					if (this.children[i] == null) {
						this.children.splice(i,1);
						i--;
					};
				}
			};
			
			//print( ( "Done With Descend For " + this.name).underline.magenta );
		
		};

		this.descend();
		delete this.level;
	};

	var zenTree = new WikiTree({
		name : 'Zen & The Art of Motorcycle Maintenance',
		article : result,
		children : zenLinks
	}, 0);

	data = zenTree;

	fs.writeFile("wikitree.json", JSON.stringify(data,null,'\t'), function (err) {
	    if(err) {
	        print(err);
	    } else {
	        print("wikitree.json was saved!".green);
	    }
	    res.json(data);
	});
};

