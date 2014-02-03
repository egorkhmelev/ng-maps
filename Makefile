run: install bower
	brunch watch --server

build: install bower
	brunch build

install:
	npm install

bower:
	node_modules/bower/bin/bower install