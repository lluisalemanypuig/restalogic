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

function llista_paraules_trobades() {
	discovered_text = document.getElementById("discovered-text");
	children = discovered_text.childNodes;
	
	var all_words = [];
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
			
			//console.log(i, children[i].textContent, children[i].textContent.length);
			
			all_words.push( children[i].textContent );
		}
	}
	
	return all_words;
}

function troba_lletres() {
	var lletres = [];
	
	var hex_grid = document.getElementById("hex-grid");
	//console.log(hex_grid);
	
	for (var i = 0; i < 7; ++i) {
		var lletra = hex_grid.childNodes[i].childNodes[0].childNodes[0].textContent;
		if (lletra != " ") {
			lletres.push(lletra);
		}
	}
	
	lletres.sort();
	
	var map = new Map();
	for (var i = 0; i < lletres.length; ++i) {
		map.set(lletres[i], i + 1);
	}
	
	return map;
}

// actualitza cel·la: resta en 1 el valor actual de la cel·la
function actualitza_cella(copy_contents_graella, i, j, cell) {
	//console.log("    i=", i, "j=", j);
	
	//console.log("    count=", copy_contents_graella[i][j]);
	--copy_contents_graella[i][j];
	//console.log("    count=", copy_contents_graella[i][j]);
	
	cell.childNodes[0].textContent = copy_contents_graella[i][j];
}

var first_access = true;
var contents_graella = null;
var num_rows;
var num_cols;
var map_letters;

function get_contents_graella() {
	// 'graella' object
	var graella_body = 
		document.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (graella_body.length == 0) {
		//console.log("graella is not loaded")
		return;
	}
	
	contents_graella = new Array(num_rows);
	//console.log("contents_graella.length=", contents_graella.length);
	
	graella_body = graella_body[0];
	var header = graella_body.getElementsByTagName("tr")[0];
	
	//console.log("graella_body.rows.length=", graella_body.rows.length);
	for (var i = 1; i < graella_body.rows.length; ++i) {
		contents_graella[i - 1] = [];
		
		var row = graella_body.getElementsByTagName("tr")[i];
		//console.log("i=", i, row);
		
		for (var j = 1; j < row.childElementCount; ++j) {
			var cell = row.getElementsByTagName("th")[j];
			
			if (cell.childNodes[0] != null) {
				var data = parseInt(cell.childNodes[0].textContent, 10);
				//console.log( i - 1, data );
				
				contents_graella[i - 1].push( data );
			}
		}
	}
	
	//console.log(contents_graella);
}

function actualitza_graella(event) {
	if (first_access) {
		// lletres del paraulogic del dia
		map_letters = troba_lletres();
		//console.log("Lletres del dia:", map_letters);
		
		num_rows = map_letters.size + 1;
		//console.log("num_rows=", num_rows);
		
		//console.log("First access");
		contents_graella = [];
		for (var i = 0; i < 7; ++i) {
			contents_graella[i] = Array(7);
			for (var j = 0; j < 7; ++j) {
				contents_graella[i][j] = 0;
			}
		}
		get_contents_graella();
		
		num_rows = contents_graella.length;
		num_cols = contents_graella[0].length;
		
		//console.log("num_cols=", num_cols);
		
		first_access = false;
	}
	
	// deep copy 'contents_graella'
	var copy = Array(7);
	for (var i = 0; i < 7; ++i) {
		copy[i] = [...contents_graella[i]];
	}
	
	// llistat de paraules
	var llista_paraules = llista_paraules_trobades();
	//console.log("Paraules trobades:", llista_paraules);
	
	// 'graella' object
	var graella_body = 
		document.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (graella_body.length == 0) {
		//console.log("graella is not loaded")
		return;
	}
	
	graella_body = graella_body[0];
	var header = graella_body.getElementsByTagName("tr")[0];
	var bottom = graella_body.getElementsByTagName("tr")[num_rows];
	
	//console.log("header:", header);
	//console.log("bottom:", bottom);
	
	for (var i = 0; i < llista_paraules.length; ++i) {
		var paraula = llista_paraules[i];
		//console.log("actualitzant per la paraula:", paraula);
		
		var inicial = paraula[0];
		
		var index_inicial = map_letters.get(inicial);
		var index_longitud = (paraula.length - 3) + 1;
		
		var row = graella_body.getElementsByTagName("tr")[ index_inicial ];
		//console.log("    ", row);
		
		var cell = row.getElementsByTagName("th")[ index_longitud ];
		
		var ii = index_inicial - 1;
		var jj = index_longitud - 1;
		
		//console.log("    Update individual cell");
		//console.log("    i=", ii, " j=", jj);
		actualitza_cella(copy, ii, jj, cell);
		
		//console.log("    count=", copy[ii][jj]);
		
		//console.log("Update total letter count in row", ii);
		actualitza_cella(copy, ii, num_cols - 1, row.lastChild);
		
		//console.log("Update total length count in column", jj);
		actualitza_cella(copy, num_rows - 1, jj, bottom.getElementsByTagName("th")[ index_longitud ]);
		
		//console.log("Update total count in column", jj);
		actualitza_cella(copy, num_rows - 1, num_cols - 1, bottom.children[num_cols]);
	}
	
	//console.log("copy_contents_graella:", copy);
}

document.getElementById("pistes-link").addEventListener('click', actualitza_graella);

