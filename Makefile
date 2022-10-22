# Commands to utilise with this repository
org = acme # defaults
port = 8080

CFLAGS = -c -g -D $(org) -D $(project) -D $(port) -D $(test) -D $(log)

create:
ifeq ($(patsubst %tests,,$(lastword $(project))),)
	@echo Please do not end your project name with the string tests in it
	exit 1
endif
	quarkus create app org.$(org):$(project) --extension=dmn,resteasy-jackson,quarkus-smallrye-openapi --no-code
	cp .templates/Makefile $(project)/
	sed -i 's/project-name/$(project)/' $(project)/Makefile
	cp .templates/example.dmn $(project)/src/main/resources/
	echo "quarkus.swagger-ui.always-include=true" >> $(project)/src/main/resources/application.properties
	echo "quarkus.swagger-ui.enable=true" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.host=0.0.0.0" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.port=$(port)" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.cors=true" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.cors.methods=GET,PUT,POST,OPTIONS" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.cors.origins=http://localhost:3004" >> $(project)/src/main/resources/application.properties
	mkdir $(project)/tests
	cp .templates/example.csv $(project)/tests


install:
	npm install

test:
	@echo "# Can be called as per examples: make test, make test file=mrz, make test file=mrz log=true" 
	@echo "" 
	@echo "" 
	npm test --project=$(project) --test=$(test) --log=$(log)
