var wikitree = require('../wikitree.json');
var natural  = require('natural');
var fs = require('fs');

var Trie = natural.Trie;

function killUseless(node) {
	if ( "text" in node)
		delete node.text;
	if ("level" in node)
		delete node.level;
}

function compressTree(wt) {
	
	killUseless(wt);
	
	if (wt.children)
		for (var i = 0; i < wt.children.length; i++) {
			compressTree(wt.children[i]);
		};

}

console.log("About to recursively compress");

compressTree(wikitree);

console.log("Done Compressing!\nNow onto saving to wikitree_small.json");

fs.writeFileSync('wikitree_small.json', JSON.stringify(wikitree, null, '\t') );

console.log("Done!");
