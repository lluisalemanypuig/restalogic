/*
Restalògic -- extensió web per a l'aplicació web Paraulògic
Copyright (C) 2023 - 2024 Lluís Alemany Puig

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

	Lluís Alemany Puig
	lluis.alemany.puig@gmail.com
*/

/* ------------------------------------------------------------------ */

class user_words {
	static instance;
	
	// Do not initialize variables using "new user_words()".
	// Use "get_instance()"
	constructor() {
		// Was the extension run for the first time?
		this.first_access = true;

		// Contents of the grid of clues
		this.cluesgrid = null;
		// Sizes of the grid
		this.num_rows = -1;
		this.num_cols = -1;
		// Minimum length of the words
		this.min_word_length = -1;

		// Mapping of letters to rows and columns of the grid
		this.map_letters = null;
		this.all_letters = [];

		// Mapping of prefixes and suffixes to their counts
		this.map_prefixes_2 = null;
		this.map_prefixes_3 = null;
		this.map_suffixes_3 = null;

		// Mapping of subsets (of letters) to their counts
		this.map_subsets = [];

		// Words found by the user
		this.all_words = [];
	}
	
	static get_instance() {
		if (!user_words.instance) {
			user_words.instance = new user_words();
		}
		return user_words.instance;
	}
}

var __data = user_words.get_instance();

/* ------------------------------------------------------------------ */

function comp_with_broken_c(a, b) {
	if (a == b) { return 0; }
	if (a == 'ç') { return (b <= 'c' ? 1 : -1); }
	if (b == 'ç') { return (a <= 'c' ? -1 : 1); }
	// the case 'a == b' was dealt with at the beginning of the function
	return (a < b ? -1 : 1);
}

function str_to_int(str) {
	return parseInt(str, 10);
}

function word_length(str) {
	var length = str.length;
	for (var i = 0; i < str.length; ++i) {
		if (str[i] == "-" || str[i] == "·") {
			--length;
		}
	}
	return length;
}

function from_accent_to_nonaccent(c) {
	// 'remove' the accent from the character
	switch (c) {
		case "à":
		case "á":
			return "a";
		
		case "è":
		case "é":
			return "e";
		
		case "ì":
		case "í":
		case "ï":
			return "i";
		
		case "ò":
		case "ó":
			return "o";
		
		case "ù":
		case "ü":
		case "ú":
			return "u";
		
		case "-":
		case "·":
			return "";
		
		// keep the character as it is
		default:
			return c;
	}
}

var normalization_table = {
	"a collibè" : "collibe",
	"a la babalà" : "babala",
	"a la par" : "par",
	"a la xirinxina" : "xirinxina",
	"a l'empel" : "empel",
	"a mansalva" : "mansalva",
	"a palpes" : "palpes",
	"a remà" : "rema",
	"al capdavant" : "capdavant",
	"al dedins de" : "dedins",
	"de filis" : "filis",
	"de gom a gom" : "gom",
	"de mantinent" : "mantinent",
	"de reüll" : "reull",
	"en pac de" : "pac",
	"en vist" : "vist",
	"en off" : "off",
	"per mor de" : "mor",
};

/* ------------------------------------------------------------------ */

function normalize_word(word) {
	{
	// normalize a word using a normalization table
	const norm_word = normalization_table[word];
	if (norm_word) { return norm_word; }
	}
	
	{
	// remove suffix "-se"
	const i = word.indexOf("-se");
	if (i !== -1) {
		word = word.substring(0, i);
	}
	}
	
	// normalize all accents and remove special characters
	var new_word = "";
	for (var i = 0; i < word.length; ++i) {
		new_word += from_accent_to_nonaccent(word[i]);
	}
	return new_word;
}

/**
 * Retrieve the list of letters in today's paraulogic
 */
function get_letters() {
	var hex_grid = document.getElementById("hex-grid");
	//~ console.log(hex_grid);
	
	for (var i = 0; i < 7; ++i) {
		var letter = hex_grid.childNodes[i].childNodes[0].childNodes[0].textContent;
		if (letter != " ") {
			__data.all_letters.push(letter);
		}
	}
	
	__data.all_letters.sort(comp_with_broken_c);
	
	var _map_letters = new Map();
	for (var i = 0; i < __data.all_letters.length; ++i) {
		_map_letters.set(__data.all_letters[i], i + 1);
	}
	
	__data.map_letters = new Map([..._map_letters.entries()].sort(comp_with_broken_c));
}

/**
 * Retrieves all prefixes of length 2.
 */
function get_prefixes_2() {
	var prefix2 = document.getElementById("prefix2");
	//~ console.log(prefix2);
	
	var contents = prefix2.textContent.split('\n')[2].split(' ');
	
	var i = 0;
	while (i < contents.length && contents[i] == '') { ++i; }
	
	_map_prefixes_2 = new Map();
	while (i < contents.length && contents[i] != '') {
		var prefix_count = contents[i].split('-');
		_map_prefixes_2.set(prefix_count[0], str_to_int(prefix_count[1]));
		++i;
	}
	
	__data.map_prefixes_2 = new Map([..._map_prefixes_2.entries()].sort(comp_with_broken_c));
}

/**
 * Retrieves all prefixes of length 3.
 */
function get_prefixes_3() {
	var prefix3 = document.getElementById("prefix3");
	//~ console.log(prefix3);
	
	var contents = prefix3.textContent.split('\n')[2].split(' ');
	
	var i = 0;
	while (i < contents.length && contents[i] == '') { ++i; }
	
	var _map_prefixes_3 = new Map();
	while (i < contents.length && contents[i] != '') {
		var prefix_count = contents[i].split('-');
		_map_prefixes_3.set(prefix_count[0], str_to_int(prefix_count[1]));
		++i;
	}
	
	__data.map_prefixes_3 = new Map([..._map_prefixes_3.entries()].sort(comp_with_broken_c));
}

/**
 * Retrieves all suffixes of length 3.
 */
function get_suffixes_3() {
	var suffix3 = document.getElementById("sufix3");
	//~ console.log(suffix3);
	
	var contents = suffix3.textContent.split('\n')[2].split(' ');
	
	var i = 0;
	while (i < contents.length && contents[i] == '') { ++i; }
	
	var _map_suffixes_3 = new Map();
	while (i < contents.length && contents[i] != '') {
		var suffix_count = contents[i].split('-');
		_map_suffixes_3.set(suffix_count[0], str_to_int(suffix_count[1]));
		++i;
	}
	
	__data.map_suffixes_3 = new Map([..._map_suffixes_3.entries()].sort(comp_with_broken_c));
}

/**
 * Retrieves all the prefixes in the clues. Also retrieves the countings
 * of each prefix and suffix.
 */
function get_prefixes_suffixes() {
	get_prefixes_2();
	get_prefixes_3();
	get_suffixes_3();
}

function get_subsets() {
	var subsets = document.getElementById("subconjunts");
	//~ console.log(subsets);
	
	var contents = subsets.textContent.split('\n')[2].split(' ');
	
	var i = 0;
	while (i < contents.length && contents[i] == '') { ++i; }
	
	var _map_subsets = new Map();
	while (i < contents.length && contents[i] != '') {
		var subset_count = contents[i].split('-');
		_map_subsets.set(subset_count[0], str_to_int(subset_count[1]));
		++i;
	}
	
	__data.map_subsets = new Map([..._map_subsets.entries()].sort(comp_with_broken_c));
}

/**
 * Retrieve all information in the clues grid.
 * 
 * @pre Needs the value of:
 * - num_rows
 * 
 * @post Sets value to:
 * - cluesgrid
 * - min_word_length
 */
function initialize_cluesgrid() {
	// 'cluesgrid' object
	var cluesgrid_body = 
		document
		.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (cluesgrid_body.length == 0) {
		//~ console.log("cluesgrid is not loaded")
		return;
	}
	
	//~ console.log("cluesgrid_body:", cluesgrid_body);
	
	__data.cluesgrid = new Array(__data.num_rows);
	//~ console.log("__data.cluesgrid.length=", __data.cluesgrid.length);
	
	cluesgrid_body = cluesgrid_body[0];
	var header = cluesgrid_body.children[0];
	//~ console.log("header:", header);
	
	__data.min_word_length = str_to_int(header.children[1].textContent);
	//~ console.log("min_word_length=", __data.min_word_length);
	
	//~ console.log("cluesgrid_body.rows.length=", cluesgrid_body.rows.length);
	for (var i = 1; i < cluesgrid_body.rows.length; ++i) {
		__data.cluesgrid[i - 1] = [];
		
		var row = cluesgrid_body.children[i];
		//~ console.log("i=", i, row);
		
		for (var j = 1; j < row.childElementCount; ++j) {
			var cell = row.children[j];
			
			if (cell.childNodes[0] != null) {
				var num_words = parseInt(cell.childNodes[0].textContent, 10);
				//~ console.log( i - 1, num_words );
				
				__data.cluesgrid[i - 1].push( num_words );
			}
		}
	}
	
	//~ console.log(__data.cluesgrid);
}

/* ------------------------------------------------------------------ */

/**
 * @brief Updates the clues grid.
 * @pre Word 'word' is normalized.
 */
function update_cell_cluesgrid(word) {
	const initial = word[0];
	//~ console.log("word= '" + word + "'");
	//~ console.log("initial=", initial);
	var index_initial = __data.map_letters.get(initial);
	var index_length = (word.length - __data.min_word_length) + 1;
	
	var i = index_initial - 1;
	var j = index_length - 1;
	//~ console.log("index_initial=", i);
	//~ console.log("index_length=", j);
	//~ console.log("Update cell:", i, j);
	
	// update cell corresponding to the word
	--__data.cluesgrid[i][j];
	// update cell corresponding to the total amount
	// of words starting with the initial
	--__data.cluesgrid[i][__data.num_cols - 1];
	// update cell corresponding to the total amount
	// of words of this length
	--__data.cluesgrid[__data.num_rows - 1][j];
	// update cell corresponding to the total amount of words
	--__data.cluesgrid[__data.num_rows - 1][__data.num_cols - 1];
}

function update_cell_prefixes_2(word) {
	var prefix = word.substring(0, 2);
	if (__data.map_prefixes_2.has(prefix)) {
		var new_count = __data.map_prefixes_2.get(prefix) - 1;
		__data.map_prefixes_2.set(prefix, new_count);
	}
}

function update_cell_prefixes_3(word) {
	var prefix = word.substring(0, 3);
	if (__data.map_prefixes_3.has(prefix)) {
		var new_count = __data.map_prefixes_3.get(prefix) - 1;
		__data.map_prefixes_3.set(prefix, new_count);
	}
}

function update_cell_suffixes_3(word) {
	var suffix = word.substring(word.length - 3, word.length);
	if (__data.map_suffixes_3.has(suffix)) {
		var new_count = __data.map_suffixes_3.get(suffix) - 1;
		__data.map_suffixes_3.set(suffix, new_count);
	}
}

function update_cell_prefixes_suffixes(word) {
	update_cell_prefixes_2(word);
	update_cell_prefixes_3(word);
	update_cell_suffixes_3(word);
}

function update_cell_subsets(word) {
	var subset =
		Array
			.from( new Set(word.split('')) )
			.sort(comp_with_broken_c)
			.join('');
			
	var new_count = __data.map_subsets.get(subset) - 1;
	__data.map_subsets.set(subset, new_count);
}

function update_cells(word) {
	update_cell_cluesgrid(word);
	update_cell_prefixes_suffixes(word);
	update_cell_subsets(word);
}

/* ------------------------------------------------------------------ */

/**
 * Retrieve all words found by the user.
 * 
 * @pre This assumes:
 * - array 'all_words' is empty
 * - all values are set in
 * 		- 'cluesgrid'
 * 		- 'map_letters'
 * 		- 'map_prefixes_2'
 * 		- 'map_prefixes_3'
 * 		- 'map_suffixes_3'
 * 		- 'map_subsets'
 * @post All of the following are updated:
 * 		- 'cluesgrid'
 * 		- 'map_letters'
 * 		- 'map_prefixes_2'
 * 		- 'map_prefixes_3'
 * 		- 'map_suffixes_3'
 * 		- 'map_subsets'
 */
function retrieve_all_words_first_time() {
	//~ console.log("=====================");
	//~ console.log("Retrieve all words first time");
	
	var discovered_text = document.getElementById("discovered-text");
	var children = discovered_text.childNodes;
	
	var i = 0;
	
	while (i < children.length) {
		
		// This loop ensures that we skip double words separated by 'o',
		// such as: "dina , lila o lilà , mida".
		// After having processed "lila" we want to go to "mida".
		while (
			i < children.length &&
			children[i].nodeValue != ", " &&
			children[i].nodeValue != ": " &&
			children[i].nodeValue != "."
		)
		{
			++i;
		}
		
		++i;
		
		if (i < children.length) {
			const word = children[i].textContent;
			const normal_word = normalize_word(word);
			
			//~ console.log(i, word, "->", normal_word, ":", word_length(normal_word));
			
			__data.all_words.push(normal_word);
			
			update_cells(normal_word);
		}
	}
}

/**
 * Completes the array 'all_words' by inserting the new words
 * 
 * @pre This assumes that the array 'all_words' already contains words.
 * Also, all values are set in
 * 		- 'cluesgrid'
 * 		- 'map_letters'
 * 		- 'map_prefixes_2'
 * 		- 'map_prefixes_3'
 * 		- 'map_suffixes_3'
 * 		- 'map_subsets'
 * @post All of the following are updated:
 * 		- 'cluesgrid'
 * 		- 'map_letters'
 * 		- 'map_prefixes_2'
 * 		- 'map_prefixes_3'
 * 		- 'map_suffixes_3'
 * 		- 'map_subsets'
 */
function retrieve_all_words_nth_time(goal_num_words) {
	//~ console.log("=====================");
	//~ console.log("Retrieve all words nth time");
	
	var discovered_text = document.getElementById("discovered-text");
	
	// index over all_words
	var j = 0;
	
	// index over 'children'
	var i = 0;
	var children = discovered_text.childNodes;
	while (i < children.length) {
		
		while (
			i < children.length &&
			children[i].nodeValue != ", " &&
			children[i].nodeValue != ": " &&
			children[i].nodeValue != "."
		)
		{
			++i;
		}
		
		++i;
		
		if (i < children.length) {
			
			const word = children[i].textContent;
			const normal_word = normalize_word(word);
			
			//~ console.log(i, word, "->", normal_word, ":", word_length(normal_word));
			
			//~ console.log("----------------");
			//~ console.log("word=", word);
			//~ console.log("normal_word=", normal_word);
			//~ console.log("j=", j);
			//~ console.log("__data.all_words[j]=", __data.all_words[j]);
			
			if (normal_word == __data.all_words[j]) {
				++j;
				//~ console.log("    continue");
			}
			else {
				
				//~ console.log(" ***", i, word, "->", normal_word, ":", word_length(normal_word));
				
				if (j == __data.all_words.length) {
					// push new word at the end of the array
					__data.all_words.push(normal_word);
					update_cells(normal_word);
					++j;
				}
				else {
					// <0 if "all_words[j] >  words"
					// =0 if "all_words[j] == words"
					// >0 if "all_words[j] <  words"
					const comp = __data.all_words[j].localeCompare(normal_word);
					if (comp > 0) {
						__data.all_words.splice(j, 0, normal_word);
						update_cells(normal_word);
						++j;
						//~ console.log("    __data.all_words=", __data.all_words);
					}
				}
				
				if (__data.all_words.length == goal_num_words) {
					//~ console.log("    break");
					break;
				}
			}
		}
	}
}

/* ------------------------------------------------------------------ */

function update_html_grid() {
	// 'cluesgrid' object
	var cluesgrid_body = 
		document
		.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (cluesgrid_body.length == 0) {
		//~ console.log("cluesgrid is not loaded")
		return;
	}
	
	cluesgrid_body = cluesgrid_body[0];
	var header = cluesgrid_body.getElementsByTagName("tr")[0];
	var bottom = cluesgrid_body.getElementsByTagName("tr")[__data.num_rows];
	
	//~ console.log("header:", header);
	//~ console.log("bottom:", bottom);
	
	for (var i = 0; i < __data.num_rows; ++i) {
		for (var j = 0; j < __data.num_cols; ++j) {
			
			var row = cluesgrid_body.getElementsByTagName("tr")[i + 1];
			var cell = row.getElementsByTagName("th")[j + 1];
			
			cell.childNodes[0].textContent = __data.cluesgrid[i][j];
		}
	}
}

function update_html_prefixes_2() {
	var contents = "";
	for (const [key, value] of __data.map_prefixes_2) {
		contents += key + "-" + value + " ";
	}
	document
		.getElementById("prefix2")
		.children[0]
		.nextSibling
		.textContent = contents;
}

function update_html_prefixes_3() {
	var contents = "";
	for (const [key, value] of __data.map_prefixes_3) {
		contents += key + "-" + value + " ";
	}
	document
		.getElementById("prefix3")
		.children[0]
		.nextSibling
		.textContent = contents;
}

function update_html_suffixes_3() {
	var contents = "";
	for (const [key, value] of __data.map_suffixes_3) {
		contents += key + "-" + value + " ";
	}
	document
		.getElementById("sufix3")
		.children[0]
		.nextSibling
		.textContent = contents;
}

function update_html_prefixes_suffixes() {
	update_html_prefixes_2();
	update_html_prefixes_3();
	update_html_suffixes_3();
}

function update_html_subsets() {
	var contents = "";
	for (const [key, value] of __data.map_subsets) {
		contents += key + "-" + value + " ";
	}
	document
		.getElementById("subconjunts")
		.children[0]
		.nextSibling
		.textContent = contents;
}

function update_html_clues() {
	update_html_grid();
	update_html_prefixes_suffixes();
	update_html_subsets();
}

/// Function called for every click to the 'Clues' "button"
function update_html(event) {
	if (__data.first_access) {
		//~ console.log("First access");
		
		// letters in today's paraulogic
		get_letters();
		//~ console.log("__data.all_letters:", __data.all_letters);
		//~ console.log("__data.map_letters:", __data.map_letters);
		
		// number of rows of cluesgrid
		__data.num_rows = __data.map_letters.size + 1;
		//~ console.log("__data.num_rows=", __data.num_rows);
		
		// initialize grid
		initialize_cluesgrid();
		__data.num_cols = __data.cluesgrid[0].length;
		
		//~ console.log("__data.cluesgrid:", __data.cluesgrid);
		//~ console.log("__data.num_cols: ", __data.num_cols);
		
		// retrieve all prefixes
		get_prefixes_suffixes();
		//~ console.log("__data.map_prefixes_2:", __data.map_prefixes_2);
		
		// retrieve all prefixes
		get_subsets();
		//~ console.log("__data.map_subsets:", __data.map_subsets);
		
		// retrieve the words found by the user
		retrieve_all_words_first_time();
		//~ console.log("__data.all_words:", __data.all_words);
		//~ console.log("__data.cluesgrid:", __data.cluesgrid);
		
		__data.first_access = false;
	}
	
	{
	// number of words found
	var n = document.getElementById("letters-found");
	const num_words_from_page = str_to_int(n.textContent);
	
	if (num_words_from_page != __data.all_words.length) {
		//~ console.log("__data.all_words.length:", __data.all_words.length);
		//~ console.log("num_words_from_page:", num_words_from_page);
		//~ console.log("Time to update 'all_words'");
		
		retrieve_all_words_nth_time(num_words_from_page);
		
		//~ console.log("__data.all_words:", __data.all_words);
		//~ console.log("__data.cluesgrid:", __data.cluesgrid);
	}
	}
	
	update_html_clues();
}

document
	.getElementById("pistes-link")
	.addEventListener('click', update_html);

