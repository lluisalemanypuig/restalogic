/*
Restalogic -- extensió web per a l'aplicació web Paraulògic
Copyright (C) 2023 Lluís Alemany Puig

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

/// Was the extension run for the first time?
var first_access = true;

/// Contents of the grid of clues
var cluesgrid = null;
/// Sizes of the grid
var num_rows = -1;
var num_cols = -1;
/// Minimum length of the words
var min_word_length = -1;

/// Mapping of letters to rows and columns of the grid
var map_letters = null;
var all_letters = [];

/// Mapping of prefixes and suffixes to their counts
var map_prefixes_2 = null;
var map_prefixes_3 = null;
var map_suffixes_3 = null;

/// Mapping of subsets (of letters) to their counts
var map_subsets = [];

/// Words found by the user
var all_words = [];

/* ------------------------------------------------------------------ */

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

function get_num_words_from_page() {
	var n = document.getElementById("letters-found");
	return str_to_int(n.textContent);
}

function from_accent_to_nonaccent(c) {
	// 'remove' the accent from the character
	switch (c) {
		case 'à':
		case 'á':
			return 'a';
		
		case 'è':
		case 'é':
			return 'e';
		
		case 'ì':
		case 'í':
		case 'ï':
			return 'i';
		
		case 'ò':
		case 'ó':
			return 'o';
		
		case 'ù':
		case 'ü':
		case 'ú':
			return 'u';
		
		case '·':
			return '';
		
		// keep the character as it is
		default:
			return c;
	}
}

var normalization_table = {
	"a la babalà" : "babala",
	"a la par" : "par",
	"a la xirinxina" : "xirinxina",
	"a palpes" : "palpes",
	"de filis" : "filis",
	"de gom a gom" : "gom",
	"de reüll" : "reull",
	"en pac de" : "pac",
	"en vist" : "vist",
};


function normalize_word(word) {
	{
	const norm_word = normalization_table[word];
	if (norm_word) { return norm_word; }
	}
	
	{
	const i = word.indexOf("-se");
	if (i !== -1) {
		word = word.substring(0, i);
	}
	}
	
	var new_word = "";
	for (var i = 0; i < word.length; ++i) {
		new_word += from_accent_to_nonaccent(word[i]);
	}
	return new_word;
}

function update_cell_cluesgrid(word) {
	const initial = word[0];
	var index_initial = map_letters.get(initial);
	var index_length = (word_length(word) - min_word_length) + 1;
	
	var i = index_initial - 1;
	var j = index_length - 1;
	//~ console.log("Update cell", i, j);
	
	// update cell corresponding to the word
	--cluesgrid[i][j];
	// update cell corresponding to the total amount
	// of words starting with the initial
	--cluesgrid[i][num_cols - 1];
	// update cell corresponding to the total amount
	// of words of this length
	--cluesgrid[num_rows - 1][j];
	// update cell corresponding to the total amount of words
	--cluesgrid[num_rows - 1][num_cols - 1];
}

function update_cell_prefixes_2(word) {
	var prefix = word[0] + word[1];
	map_prefixes_2.set(prefix, map_prefixes_2.get(prefix) - 1);
}

function update_cell_prefixes_3(word) {
	var prefix = word[0] + word[1] + word[2];
	if (map_prefixes_3.has(prefix)) {
		map_prefixes_3.set(prefix, map_prefixes_3.get(prefix) - 1);
	}
}

function update_cell_suffixes_3(word) {
	var length = word.length;
	var suffix = word[length - 3] + word[length - 2] + word[length - 1];
	if (map_suffixes_3.has(suffix)) {
		map_suffixes_3.set(suffix, map_suffixes_3.get(suffix) - 1);
	}
}

function update_cell_prefixes_suffixes(word) {
	update_cell_prefixes_2(word);
	update_cell_prefixes_3(word);
	update_cell_suffixes_3(word);
}

function update_cell_subsets(word) {
	var subset = Array.from( new Set(word.split('')) ).sort().join('');
	map_subsets.set(subset, map_subsets.get(subset) - 1);
}

/* ----------------------------------------------- */

function update_cells(word) {
	update_cell_cluesgrid(word);
	update_cell_prefixes_suffixes(word);
	update_cell_subsets(word);
}

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
			
			all_words.push(normal_word);
			
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
			//~ console.log("all_words[j]=", all_words[j]);
			
			if (normal_word == all_words[j]) {
				++j;
				//~ console.log("    continue");
			}
			else {
				
				//~ console.log(" ***", i, word, "->", normal_word, ":", word_length(normal_word));
				
				if (j == all_words.length) {
					// push new word at the end of the array
					all_words.push(normal_word);
					update_cells(normal_word);
					++j;
				}
				else {
					// <0 if "all_words[j] >  words"
					// =0 if "all_words[j] == words"
					// >0 if "all_words[j] <  words"
					const comp = all_words[j].localeCompare(normal_word);
					if (comp > 0) {
						all_words.splice(j, 0, normal_word);
						update_cells(normal_word);
						++j;
						//~ console.log("    all_words=", all_words);
					}
				}
				
				if (all_words.length == goal_num_words) {
					//~ console.log("    break");
					break;
				}
			}
		}
	}
}

/**
 * Retrieve the list of letters in today's paraulogic
 */
function get_letters() {
	var hex_grid = document.getElementById("hex-grid");
	//~ console.log(hex_grid);
	
	for (var i = 0; i < 7; ++i) {
		var lletra = hex_grid.childNodes[i].childNodes[0].childNodes[0].textContent;
		if (lletra != " ") {
			all_letters.push(lletra);
		}
	}
	
	all_letters.sort();
	
	map_letters = new Map();
	for (var i = 0; i < all_letters.length; ++i) {
		map_letters.set(all_letters[i], i + 1);
	}
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
	
	map_prefixes_2 = new Map();
	while (i < contents.length && contents[i] != '') {
		var prefix_count = contents[i].split('-');
		map_prefixes_2.set(prefix_count[0], str_to_int(prefix_count[1]));
		++i;
	}
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
	
	map_prefixes_3 = new Map();
	while (i < contents.length && contents[i] != '') {
		var prefix_count = contents[i].split('-');
		map_prefixes_3.set(prefix_count[0], str_to_int(prefix_count[1]));
		++i;
	}
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
	
	map_suffixes_3 = new Map();
	while (i < contents.length && contents[i] != '') {
		var suffix_count = contents[i].split('-');
		map_suffixes_3.set(suffix_count[0], str_to_int(suffix_count[1]));
		++i;
	}
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
	
	map_subsets = new Map();
	while (i < contents.length && contents[i] != '') {
		var subset_count = contents[i].split('-');
		map_subsets.set(subset_count[0], str_to_int(subset_count[1]));
		++i;
	}
}

/**
 * Retrieve all information concerning the clues grid.
 * 
 * @pre Needs the value of:
 * - num_rows
 * 
 * @post Sets value to:
 * - cluesgrid
 * - min_word_length
 */
function make_clustergrid() {
	// 'cluesgrid' object
	var cluesgrid_body = 
		document.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (cluesgrid_body.length == 0) {
		//~ console.log("cluesgrid is not loaded")
		return;
	}
	
	//~ console.log("cluesgrid_body:", cluesgrid_body);
	
	cluesgrid = new Array(num_rows);
	//~ console.log("cluesgrid.length=", cluesgrid.length);
	
	cluesgrid_body = cluesgrid_body[0];
	var header = cluesgrid_body.children[0];
	//~ console.log("header:", header);
	
	min_word_length = str_to_int(header.children[1].textContent);
	//~ console.log("min_word_length=", min_word_length);
	
	//~ console.log("cluesgrid_body.rows.length=", cluesgrid_body.rows.length);
	for (var i = 1; i < cluesgrid_body.rows.length; ++i) {
		cluesgrid[i - 1] = [];
		
		var row = cluesgrid_body.children[i];
		//~ console.log("i=", i, row);
		
		for (var j = 1; j < row.childElementCount; ++j) {
			var cell = row.children[j];
			
			if (cell.childNodes[0] != null) {
				var data = parseInt(cell.childNodes[0].textContent, 10);
				//~ console.log( i - 1, data );
				
				cluesgrid[i - 1].push( data );
			}
		}
	}
	
	//~ console.log(cluesgrid);
}

/* ------------------------------------------------------------------ */

function update_html_grid() {
	// 'cluesgrid' object
	var cluesgrid_body = 
		document.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (cluesgrid_body.length == 0) {
		//~ console.log("cluesgrid is not loaded")
		return;
	}
	
	cluesgrid_body = cluesgrid_body[0];
	var header = cluesgrid_body.getElementsByTagName("tr")[0];
	var bottom = cluesgrid_body.getElementsByTagName("tr")[num_rows];
	
	//~ console.log("header:", header);
	//~ console.log("bottom:", bottom);
	
	for (var i = 0; i < num_rows; ++i) {
		for (var j = 0; j < num_cols; ++j) {
			
			var row = cluesgrid_body.getElementsByTagName("tr")[i + 1];
			var cell = row.getElementsByTagName("th")[j + 1];
			
			cell.childNodes[0].textContent = cluesgrid[i][j];
		}
	}
}

function update_prefixes_2_html() {
	var contents = "";
	for (const [key, value] of map_prefixes_2) {
		contents += key + "-" + value + " ";
	}
	document.getElementById("prefix2").children[0].nextSibling.textContent = contents;
}

function update_prefixes_3_html() {
	var contents = "";
	for (const [key, value] of map_prefixes_3) {
		contents += key + "-" + value + " ";
	}
	document.getElementById("prefix3").children[0].nextSibling.textContent = contents;
}

function update_suffixes_3_html() {
	var contents = "";
	for (const [key, value] of map_suffixes_3) {
		contents += key + "-" + value + " ";
	}
	document.getElementById("sufix3").children[0].nextSibling.textContent = contents;
}

function update_html_prefixes_suffixes() {
	update_prefixes_2_html();
	update_prefixes_3_html();
	update_suffixes_3_html();
}

function update_html_subsets() {
	var contents = "";
	for (const [key, value] of map_subsets) {
		contents += key + "-" + value + " ";
	}
	document.getElementById("subconjunts").children[0].nextSibling.textContent = contents;
}

function update_html() {
	update_html_grid();
	update_html_prefixes_suffixes();
	update_html_subsets();
}

/// Function called for every click to the 'Clues' "button"
function update_clues(event) {
	if (first_access) {
		//~ console.log("First access");
		
		// letters in today's paraulogic
		get_letters();
		//~ console.log("Lletres del dia:", all_letters);
		//~ console.log("Lletres del dia:", map_letters);
		
		// number of rows of cluesgrid
		num_rows = map_letters.size + 1;
		//~ console.log("num_rows=", num_rows);
		
		// initialize grid
		make_clustergrid();
		num_cols = cluesgrid[0].length;
		
		//~ console.log("cluesgrid:", cluesgrid);
		//~ console.log("num_cols=", num_cols);
		
		// retrieve all prefixes
		get_prefixes_suffixes();
		//~ console.log("map_prefixes_2=", map_prefixes_2);
		
		// retrieve all prefixes
		get_subsets();
		//~ console.log("map_subsets=", map_subsets);
		
		// retrieve the words found by the user
		retrieve_all_words_first_time();
		//~ console.log("all_words=", all_words);
		//~ console.log("cluesgrid:", cluesgrid);
		
		first_access = false;
	}
	
	{
	const num_words_from_page = get_num_words_from_page();
	if (num_words_from_page != all_words.length) {
		//~ console.log("all_words.length=", all_words.length);
		//~ console.log("get_num_words_from_page()=", num_words_from_page);
		//~ console.log("Time to update 'all_words'");
		
		retrieve_all_words_nth_time(num_words_from_page);
		
		//~ console.log("all_words=", all_words);
		//~ console.log("cluesgrid:", cluesgrid);
	}
	}
	
	update_html();
}

document.getElementById("pistes-link").addEventListener('click', update_clues);

