def clean_string(s):
	if s[0] == '\t': s = s[1:]
	if s[-1] == '\n': s = s[:-1]
	return s

def retrieve_known_multitoken_words():
	known_multitoken_words = None
	with open('src/restalogic.js', 'r') as f:
		known_multitoken_words = ''.join(list(map(lambda s: clean_string(s), f.readlines()[126:139])))
		known_multitoken_words = "{" + known_multitoken_words + "}"
		known_multitoken_words = list(eval(known_multitoken_words).keys())
	return known_multitoken_words

known_multitoken_words = retrieve_known_multitoken_words()

NOTHING_TO_DO=0
EXIST_MULTITOKEN_WORDS=1
UNKNOWN_MULTITOKEN_WORDS=2

with open("index.html", 'r') as f:
	
	entire_file = ""
	for line in f: entire_file += line[:-1]
	
	ini = entire_file.find("var t={")
	fin = entire_file.find("};", ini)
	
	solution = eval(entire_file[ini+6:fin+1])
	
	multitoken_words = False
	unknown_multitoken_words = False
	for key, value in solution["p"].items():
		
		if value.find(" o ") != -1:
			value = value.split(" o ")
		
		if type(value) == str:
			value = [value]
		
		for w in filter(lambda s: s.find(" ") != -1, value):
			print(f"Inspecting '{w}'")
			
			multitoken_words = True
			
			is_known = any(map(lambda known: known == w, known_multitoken_words))
			print(f"{key}: {value} -- {is_known}")
			
			if not is_known:
				unknown_multitoken_words = True
	
	if unknown_multitoken_words:
		exit(UNKNOWN_MULTITOKEN_WORDS)
	
	if multitoken_words:
		exit(EXIST_MULTITOKEN_WORDS)
	
	exit(NOTHING_TO_DO)
