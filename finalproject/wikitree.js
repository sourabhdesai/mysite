var fs = require('fs');

var data = null;

exports.getData = function() {
	if (data) {
		return data;
	} else {
		return {
			message : "Still Loading...Please Try Again Later"
		};
	}
};

exports.generateData = function() {
	var wikipedia = require('wikipedia-js');
	var async     = require('async');
	var natural   = require('natural');

	var TfIdf = natural.TfIdf;

	var zenTfidf = new TfIdf();

	console.log("About to Read zen_full.txt");

	var raw       = fs.readFileSync("./finalproject/zen_full.txt").toString();
	var tokenizer = new natural.WordTokenizer();
	var tokens    = tokenizer.tokenize(raw);

	console.log("Read and Tokenized");

	// Remove stopwords
	for (var i = 0; i < natural.stopwords.length; i++) {
		for (var a = 0; a < tokens.length; a++) {
			if ( tokens[a] == natural.stopwords[i] )
				tokens.splice(a,1);
		};
	};

	console.log("Removed Stopwords");

	zenTfidf.addDocument(tokens);

	console.log("Created TfIdf Object for Processed Zen Text");

	function extractLinkedWikis(article) {
		var innerWikis     = article.match(/<a href="http:\/\/en.wikipedia.org\/wiki\/\S*">(\w| )*<\/a>/g);
		if (!innerWikis) {
			console.log("Weird ... Couldn't any Inner Links");
			return [];
		}
		var innerWikisJSON = new Array(innerWikis.length);

		for (var i = innerWikis.length - 1; i >= 0; i--) {
			var linkHTML   = innerWikis[i];
			var linkIndex  = linkHTML.indexOf('<a href="http://en.wikipedia.org/wiki/') + 38;
			var linkTextIndex  = linkHTML.indexOf('">') + 2;
			// Extract actual link info
			var title = linkHTML.substring(linkIndex, linkTextIndex - 2).replace(/_/g, " ");
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

	console.log("About to Search for Zen Article");

	wikipedia.searchArticle(zenQuery, function(err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log("Got Zen Article");
			console.log("Here it is:\n" + result);
			var zenLinks = extractLinkedWikis(result);
			console.log("Extracted " + zenLinks.length + " Links from Zen Article");
			for (var i = 0; i < zenLinks.length; i++) {
				if ( zenLinks[i].title.indexOf("Category:" == 0) ) {
					zenLinks.splice(i,1);
				} else if( LinkTrie.contains( zenLinks[i].title ) || LinkTrie.contains( zenLinks[i].linkText ) )  {
					zenLinks.splice(i,1);
				} else if( zenTfidf.tfidf( zenLinks[i].title, 0 ) <= 0 && zenTfidf.tfidf( zenLinks[i].linkText, 0 ) <= 0 ) {
					zenLinks.splice(i,1);
				} else {
					LinkTrie.addStrings( [ zenLinks[i].title, zenLinks[i].linkText ] );
				}
			};
			console.log("After removing Irrelevant Links, only have " + zenLinks.length + " Links Left\nHere are the Remaining Links");
			console.log(zenLinks);

			/**
			Now the Hard (Expensive) Part!
			SYNCHRONOUSLY create the Wikitree
			*/
			var WikiTree = function(node, cb) {
				this.name    = node.name;
				this.context = node.context;
				this.text    = node.article;

				if (node.children) {
					this.children = node.children;
				}

				function createArticleSummary(article) {
					// TODO: Must Implement
					return article;
				}

				function isIrrelevant(article, title, linkText) {
					// Tweak Here
					var articleTfIdf = new TfIdf();
					articleTfIdf.addDocument(article);

					var titleRelevanceToArticle = articleTfIdf.tfidf(title,0);
					var textRelevanceToArticle = articleTfIdf.tfidf(linkText,0);

					var titleRelevanceToZen = zenTfidf.tfidf(title,0);
					var textRelevanceToZen = zenTfidf.tfidf(linkText,0);

					return ( titleRelevanceToZen / titleRelevanceToArticle >= 1 ) || ( textRelevanceToZen / textRelevanceToArticle >= 1 );

				}

				var childSearcher = function(child) {
					this.child = child;
					// Returns a WikiTree for the child
					childSearcher.prototype.exec = function(cb) {
						console.log("Searching for Link Title \"" + this.child.title + "\" And Link Text \"" + this.child.linkText + "\"");

						var childQuery = {
							query : this.child.title,
							format : "html",
							summaryOnly : false
						};

						wikipedia.searchArticle(childQuery, function(error, childArticle) {
							console.log("Got Wikipedia Response for " + this.child.title);
							if (error) {
								console.log("Error at " + this.name + "\n" + error);
								cb(null, new Wikitree({
									name : this.child.title,
									context : this.child.linkText,
									article : createArticleSummary(childArticle)
								},null) );
							} else {
								var childWikiLinks = extractLinkedWikis(childArticle);
								console.log("Found " + childWikiLinks.length + " Links for " + this.child.title);
								for (var i = childWikiLinks.length - 1; i >= 0; i--) {
									if ( childWikiLinks[i].title.indexOf("Category:") == 0 ) {
										childWikiLinks.splice(i,1);
									} else if ( LinkTrie.contains(childWikiLinks[i].title) || LinkTrie.contains(childWikiLinks[i].linkText) ) {
										childWikiLinks.splice(i,1);
									} else if ( isIrrelevant( childWikiLinks[i] ) ) {
										childWikiLinks.splice(i,1);
									} else {
										LinkTrie.addStrings([ childWikiLinks[i].title, childWikiLinks[i].text ]);
									}
								};

								console.log("After pruning, " + childWikiLinks.length + " Links left for " + this.child.title);

								cb(null, new WikiTree({
									name : this.child.title,
									context : child.linkText,
									article : childArticle,
									children : createArticleSummary(childWikiLinks)
								},null));
							}
						});	
					};
				};

				WikiTree.prototype.descend = function() {
					// Descend to the next level ... Meaning find the children of the current children (If there are any)
					if (!this.children) {
						console.log("Leaf at " + this.name);
						return;
					}

					var searchers = new Array(this.children.length);
					for (var i = this.children.length - 1; i >= 0; i--) {
						searchers = new childSearcher(this.children[i]);
					};

					var searchFuncs = new Array(searchers.length);
					for (var i = searchers.length - 1; i >= 0; i--) {
						searchFuncs[i] = searchers[i].exec;
					};
					console.log("Doing Descend for " + this.name);
					async.series(searchFuncs, function(err, wikichildren) {
						if (err) {
							console.log(err);
						} else {
							console.log("Finished descend for " + name);
							children = wikichildren;
							if (cb)
								cb(this);
						}
					});
				};

				this.descend();
			};

			var zenTree = new WikiTree({
				name : 'Zen & The Art of Motorcycle Maintenance',
				article : result,
				children : zenLinks
			}, function(wt) {
				console.log("Done Processing! :)\n Gonna save as wikitree.json");
				data = wt;
				fs.writeFile("wikitree.json", JSON.stringify(wt,null,'\t'), function (err) {
				    if(err) {
				        console.log(err);
				    } else {
				        console.log("wikitree.json was saved!");
				    }
				});
			});

		}
	});
};

fs.readFile("wikitree.js",function(err, jsonFile) {
	if (err) {
		exports.generateData();
	} else {
		data = JSON.parse(jsonFile);
	}
});