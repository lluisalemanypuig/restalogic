
EXIST_MULTITOKEN_WORDS=1
NOTHING_TO_DO=0

with open("index.html", 'r') as f:
	
	entire_file = ""
	for line in f: entire_file += line[:-1]
	
	ini = entire_file.find("var t={")
	fin = entire_file.find("};", ini)
	
	solution = eval(entire_file[ini+6:fin+1])
	
	multitoken_words = False
	for key, value in solution["p"].items():
		
		if value.find(" o ") != -1:
			value = value.split(" o ")
		
		if type(value) == str:
			value = [value]
		
		if any(map(lambda s: s.find(" ") != -1, value)):
			multitoken_words = True
			print(f"{key}: {value}")
	
	if multitoken_words:
		exit(EXIST_MULTITOKEN_WORDS)
	
	exit(NOTHING_TO_DO)
