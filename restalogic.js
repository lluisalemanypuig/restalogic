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
			
			console.log(i, children[i].textContent, children[i].textContent.length);
			all_words.push( children[i].textContent );
		}
	}
	
	return all_words;
}

/*
// posar la graella a tot zeros (codi de practica)
function graella_a_zeros() {
	// 'graella' object
	graella_body = 
		document.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (graella_body.length == 0) {
		console.log("graella is not loaded")
		return;
	}
	else {
		graella_body = graella_body[0];
		header = graella_body.getElementsByTagName("tr")[0];
		
		for (var i = 1; i < graella_body.rows.length; ++i) {
			row = graella_body.getElementsByTagName("tr")[i];
			console.log(row, row.childElementCount);
			
			for (var j = 1; j < row.childElementCount; ++j) {
				cell = row.getElementsByTagName("th")[j];
				console.log(i, j, cell.childNodes[0]);
				
				if (cell.childNodes[0] != null) {
					cell.childNodes[0].textContent = "0";
				}
			}
		}
	}
}
*/

function troba_lletres() {
	var lletres = [];
	
	var hex_grid = document.getElementById("hex-grid");
	console.log(hex_grid);
	
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
function actualitza_cella(cell) {
	var count = parseInt(cell.childNodes[0].textContent, 10);
	console.log("count:", count);
	--count;
	cell.childNodes[0].textContent = count;
}

function actualitza_graella(event) {
	// llistat de paraules
	var llista_paraules = llista_paraules_trobades();
	console.log("Paraules trobades:", llista_paraules);
	
	// lletres del paraulogic del dia
	var map = troba_lletres();
	console.log("Lletres del dia:", map);
	
	// 'graella' object
	graella_body = 
		document.getElementById("table_graella")
		.getElementsByTagName("tbody");
	
	if (graella_body.length == 0) {
		console.log("graella is not loaded")
		return;
	}
	else {
		graella_body = graella_body[0];
		header = graella_body.getElementsByTagName("tr")[0];
		
		for (var i = 0; i < llista_paraules.length; ++i) {
			var paraula = llista_paraules[i];
			console.log("actualitzant per la paraula:", paraula);
			
			var inicial = paraula[0];
			
			var index_inicial = map.get(inicial);
			var index_longitud = (paraula.length - 3) + 1;
			
			row = graella_body.getElementsByTagName("tr")[ index_inicial ];
			cell = row.getElementsByTagName("th")[ index_longitud ];
			
			actualitza_cella(cell);
		}
	}
}

document.getElementById("pistes-link").addEventListener('click', actualitza_graella);

