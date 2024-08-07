NO_MULTITOKEN_WORDS=0
EXIST_MULTITOKEN_WORDS=1
UNKNOWN_MULTITOKEN_WORDS=2
SOLUTION_MAP_NOT_FOUND=3
INDEX_FILE_COULD_NOT_BE_OPENED=4

def exit_with_code(code):
	print(f"Exit with code: {code}")
	if code == NO_MULTITOKEN_WORDS:
		print("Python did not find multitoken words")
	elif code == EXIST_MULTITOKEN_WORDS:
		print("Python found multitoken words but these are already in the addon.")
	elif code == UNKNOWN_MULTITOKEN_WORDS:
		print("Python found multitoken words that are not in the addon yet.")
	elif code == SOLUTION_MAP_NOT_FOUND:
		print("Error: Python could not find the map that contains today's solution.")
	elif code == INDEX_FILE_COULD_NOT_BE_OPENED:
		print("Error: Python could not open the index.html file.")
	
	exit(code)

def trim_string(s):
	if s[0] == '\t': s = s[1:]
	if s[-1] == '\n': s = s[:-1]
	return s

def retrieve_known_multitoken_words():
	"""
	This function is assumed to always succeed. The script 'src/restalogic.js' is
	assumed to be always readable.
	"""
	known_multitoken_words = None
	with open('src/restalogic.js', 'r') as f:
		known_multitoken_words = ''.join(list(map(lambda s: trim_string(s), f.readlines()[126:143])))
		known_multitoken_words = "{" + known_multitoken_words + "}"
		known_multitoken_words = list(eval(known_multitoken_words).keys())
	
	# a little assert to ensure that the code above succeeded
	assert(known_multitoken_words is not None)
	return known_multitoken_words

known_multitoken_words = retrieve_known_multitoken_words()

entire_file = ""
with open("index.html", 'r') as f:
	for line in f: entire_file += line[:-1]

if entire_file == "":
	exit_with_code(INDEX_FILE_COULD_NOT_BE_OPENED)

ini = entire_file.find("var t={")
if ini == -1:
	exit_with_code(SOLUTION_MAP_NOT_FOUND)

fin = entire_file.find("};", ini)

solution = eval(entire_file[ini+6:fin+1])

multitoken_words = False
exist_unknown_multitoken_words = False

for stem, solutions in solution["p"].items():
	
	if solutions.find(" o ") != -1:
		solutions = solutions.split(" o ")
	
	if type(solutions) == str:
		solutions = [solutions]
	
	multitoken_words_in_stem = any(map(lambda s: s.find(" ") != -1, solutions))
	if multitoken_words_in_stem:
		print(f"Inspecting stem: '{stem}'")
		print(f"    Solutions per stem: '{solutions}'")
		print(f"    Found multitoken words in the solutions? True")
		multitoken_words = True
		
		for w in filter(lambda s: s.find(" ") != -1, solutions):
			print(f"    Inspecting multitoken word '{w}'")
			
			is_known = any(map(lambda known: known == w, known_multitoken_words))
			print(f"    Is multitoken word '{w}' known? {is_known}")
			
			if not is_known:
				exist_unknown_multitoken_words = True

if exist_unknown_multitoken_words:
	exit_with_code(UNKNOWN_MULTITOKEN_WORDS)

if multitoken_words:
	exit_with_code(EXIST_MULTITOKEN_WORDS)

exit_with_code(NO_MULTITOKEN_WORDS)
