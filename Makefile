MSG="Committed At $(shell TZ=Asia/Calcutta date)"

git:
	git status
	echo "++++++++++++++"
	git add .
	echo "++++++++++++++"
	git commit -m $(MSG)
	echo "++++++++++++++"
	git push -u origin main