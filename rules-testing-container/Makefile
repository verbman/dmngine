log = false # defaults
file = all 

CFLAGS = -c -g -D $(log) -D $(file)


install:
	npm install


test:
	@echo "# Can be called as per examples: make test, make test file=mrz, make test file=mrz log=true" 
	npm test --test=$(file) --log=$(log)
