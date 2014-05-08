var classifier = require('./texts_classifier.js');

var wikitree = require('../wikitree_small.json');


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

var initCompreshThresh = 10; // Compression Threshold ... articles with a compreshThresh or greater percentage of relevant links will be added. 
var decayFactor        = 3; // For optimum, try 1.75
var maxCompreshThresh  = 90;
var maxLevel           = 2;

var WikiTree = function(node,level) {
	this.name    = node.name;
	this.context = node.context;
	this.level = level;

	console.log(this.level);

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
			//print("Child '" + child.title.inverse + "' didn't meet compreshThresh requirement of " + ( levelCompreshThresh + "%" ).inverse.cyan );
			return null;
		} else {
			//print("Child '" + child.title.inverse.yellow + "' met compreshThresh requirement of " + ( levelCompreshThresh + "%" ).inverse.cyan);
			return new WikiTree({
				name : child.title,
				context : child.linkText,
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

	WikiTree.prototype.getToLeaf = function() {
		if (!this.children) {
			
		}
	};

	this.descend();
	delete this.level;
};

function expand() {
	// Expands Wikitree at the leaves
}

expand();