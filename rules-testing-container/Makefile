log = false # defaults
file = all 
project = default

CFLAGS = -c -g -D $(file) -D $(log) -D $(project)


install:
	npm install


test:
	@echo "# Can be called as per examples: make test, make test file=mrz, make test file=mrz log=true" 
	@echo "# If workspace has multiple projects you'll need to specify the project - make test project=project-name" 
	@echo "" 
	@echo "" 
	npm test --test=$(file) --log=$(log) --project=$(project)
