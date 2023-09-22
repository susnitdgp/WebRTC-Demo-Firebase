MSG="Committed At $(shell date)"

git:
	git status
	echo "++++++++++++++"
	git add .
	echo "++++++++++++++"
	git commit -m $(MSG)
	echo "++++++++++++++"
	git push -u origin master