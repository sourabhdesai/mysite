var fs        = require('fs');
var natural   = require('natural');
var HashTable = require('hashtable');
var colors    = require('colors');

var TfIdf     = natural.TfIdf;
var stem      = natural.PorterStemmer.stem;
var tokenizer = new natural.WordTokenizer();

var threshold = 1.5;

var irrelevants = [
	fs.readFileSync("./finalproject/texts/irrelevant/cricket_wiki_article.txt").toString(),
	fs.readFileSync("./finalproject/texts/irrelevant/othello.txt").toString(),
	fs.readFileSync("./finalproject/texts/irrelevant/table_manners.txt").toString(),
	fs.readFileSync("./finalproject/texts/irrelevant/leo_x_wiki.txt").toString(),
	fs.readFileSync("./finalproject/texts/irrelevant/valves_wiki.txt").toString()
];

var relevants = [
	fs.readFileSync("./finalproject/texts/relevant/zen_full.txt").toString(),
	fs.readFileSync("./finalproject/texts/relevant/zen_wiki_article.txt").toString(),
	fs.readFileSync("./finalproject/texts/relevant/education_wiki.txt").toString(),
	fs.readFileSync("./finalproject/texts/relevant/nature_wiki.txt").toString(),
	fs.readFileSync("./finalproject/texts/relevant/quality_wiki.txt").toString()
];

var tfidf = new TfIdf();
/*
tfidf.addDocument(relevants[0]); // 0
tfidf.addDocument(relevants[1]); // 1
*/
for (var i = 0; i < relevants.length; i++) {
	tfidf.addDocument(relevants[i]);
}
/*
tfidf.addDocument(irrelevants[0]); // 2
tfidf.addDocument(irrelevants[1]); // 3
tfidf.addDocument(irrelevants[2]); // 4
*/
for (var i = 0; i < irrelevants.length; i++) {
	tfidf.addDocument(irrelevants[i]);
}

// Now Build Frequency Tables
var irrelFreqTable = new HashTable();
var relFreqTable   = new HashTable();

var irrelNumWords = 0;
var relNumWords   = 0;

console.log("Creating stopword Trie");

var stopwordTrie = new natural.Trie();
natural.stopwords.forEach( function (stopword) {
	stopwordTrie.addString(stopword);
});

function removeStopWords(tokens) {
	for (var i = tokens.length - 1; i >= 0; i--) {
		if ( stopwordTrie.contains(tokens[i]) ) {
			tokens[i] = "";
		}
	};
	return tokens;
}

var count = 0;

console.log("Creating Freq Table for relevants");

relevants.forEach(function(doc) {

	var tokens = removeStopWords(tokenizer.tokenize(doc));

	relNumWords += tokens.length;

	tokens.forEach(function(token) {
		token = stem(token);
		var freq = relFreqTable.get(token);
		if(freq)
			relFreqTable.put(token, freq + 1);
		else
			relFreqTable.put(token, 1);
	});

});

relNumWords -= relFreqTable.get("");

console.log("Creating Freq Table for irrelevants");

irrelevants.forEach(function(doc) {

	var tokens = removeStopWords(tokenizer.tokenize(doc));

	irrelNumWords += tokens.length;

	tokens.forEach(function(token) {
		token = stem(token);
		
		var freq = irrelFreqTable.get(token);

		if(freq)
			irrelFreqTable.put(token, freq + 1);
		else
			irrelFreqTable.put(token, 1);
	});

});

irrelNumWords -= irrelFreqTable.get(""); 

console.log("relNumWords : " + relNumWords);
console.log("irrelNumWords : " + irrelNumWords);

exports.isRelevant = function(term) {
	var zenAvg = 0, otherAvg = 0;
	for (var i = 0; i < relevants.length; i++) {
		zenAvg += tfidf.tfidf(term,i);
	}

	for (var i = relevants.length; i < irrelevants.length + relevants.length; i++) {
		otherAvg += tfidf.tfidf(term,i);
	}

	zenAvg   = zenAvg / relevants.length;
	otherAvg = otherAvg / irrelevants.length;

	if ( isNaN(zenAvg) || isNaN(otherAvg) || ( zenAvg == 0 && otherAvg == 0 ) ) {

		var tokens = tokenizer.tokenize(term);

		var relScore   = 0;
		var irrelScore = 0;

		tokens.forEach(function(token) {
			token = stem(token);

			var relFreq   = relFreqTable.get(token);
			var irrelFreq = irrelFreqTable.get(token);

			if ( relFreq )
				relScore   += relFreq;
			if ( irrelFreq )
				irrelScore += irrelFreq;
		});

		relScore   = relScore / relNumWords;
		irrelScore = irrelScore / irrelNumWords;

		return relScore / irrelScore >= threshold;
	};

	return ( zenAvg / otherAvg ) >= threshold;
};

/*
console.log("Testing");

console.log("Test for 'Quality'");
console.log( ("Test Result: " + exports.isRelevant("Quality") ).green );


console.log("Test for 'motorcycle'");
console.log( ( "Test Result: " + exports.isRelevant("motorcycle") ).green );


console.log("Test for 'knife'");
console.log( ( "Test Result: " + exports.isRelevant("knife") ).red );

console.log("Test for 'rude'");
console.log( ( "Test Result: " + exports.isRelevant("rude") ).red );

console.log("Test for 'sourabh'");
console.log( ( "Test Result: " + exports.isRelevant("sourabh") ).red );


console.log("Test for 'cricket'");
console.log( ( "Test Result: " + exports.isRelevant("cricket") ).red );


console.log("Test for 'mountain'");
console.log( ( "Test Result: " + exports.isRelevant("mountain") ).green );


console.log("Test for 'technology'");
console.log( ( "Test Result: " + exports.isRelevant("technology") ).green );


console.log("Test for 'computer'");
console.log( ( "Test Result: " + exports.isRelevant("computer") ).green );


console.log("Test for 'and'");
console.log( ( "Test Result: " + exports.isRelevant("and") ).red );


console.log("Test for 'the'");
console.log( ( "Test Result: " + exports.isRelevant("the") ).red );


console.log("Test for 'for'");
console.log( ( "Test Result: " + exports.isRelevant("for") ).red );


console.log("Test for 'motorcycle maintenance'");
console.log( ( "Test Result: " + exports.isRelevant("motorcycle maintenance") ).green );


console.log("Test for 'hit the ball'");
console.log( ( "Test Result: " + exports.isRelevant("hit the ball") ).red );


console.log("Test for 'And my Axe!'");
console.log( ( "Test Result: " + exports.isRelevant("And my Axe!") ).red );


console.log("Test for 'Pirsigs metaphysics of Quality'");
console.log( ( "Test Result: " + exports.isRelevant("Pirsigs metaphysics of Quality") ).green );


console.log("Test for 'Don't drop the soap");
console.log( ( "Test Result: " + exports.isRelevant("Don't drop the soap") ).red );


console.log("Test for 'Recursion is powerful");
console.log( ("Test Result: " + exports.isRelevant("Recursion is powerful") ).red );


console.log("Test for 'Javascript is a quirky programming language");
console.log( ( "Test Result: " + exports.isRelevant("Javascript is a quirky programming language") ).red );

// Test False Negatives
var relTokens = new Array(0);
for (var i = 0; i < relevants.length; i++) {
	relTokens = relTokens.concat( removeStopWords( tokenizer.tokenize(relevants[i]) ) );
};

var numberFalse = 0;

for (var i = 0; i < relTokens.length; i++) {
	if (! (relTokens[i] == "") )
		numberFalse += exports.isRelevant(relTokens[i]) ? 0 : 1 ;
}

var numRelWords = relTokens.length;

for (var i = 0; i < relTokens.length; i++) {
	if (relTokens[i] == "")
		numRelWords--;
};

console.log("numberFalse : " + numberFalse);
console.log("numRelWords : " + numRelWords);

console.log("False Negative Percentage: " + ( 100 * ( numberFalse / numRelWords ) + "%").green );

// Test False Positives
var irrelTokens = new Array(0);
for (var i = 0; i < irrelevants.length; i++) {
	irrelTokens = irrelTokens.concat( removeStopWords( tokenizer.tokenize(irrelevants[i]) ) );
};

var numberTrue = 0;
for (var i = 0; i < irrelTokens.length; i++) {
	if (! (irrelTokens[i] == "") )
		numberTrue += exports.isRelevant(irrelTokens[i]) ? 1 : 0 ;
}

var numIrrelWords = irrelTokens.length;

for (var i = 0; i < irrelTokens.length; i++) {
	if (irrelTokens[i] == "")
		numIrrelWords--;
};

console.log("numberTrue : " + numberTrue);
console.log("numIrrelWords : " + numIrrelWords);

console.log("False Positive Percentage: " + ( 100 * ( numberTrue / numIrrelWords ) + "%").green );
*/
