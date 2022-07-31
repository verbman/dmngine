# Commands to utilise with this repository
org = acme # defaults
project = test-rules

CFLAGS = -c -g -D $(org) -D $(project)

create:
	quarkus create app org.$(org):$(project) --extension=dmn,resteasy-jackson,quarkus-smallrye-openapi --no-code
	cp rules-container/templates/Makefile $(project)/
	sed -i 's/project-name/$(project)/' $(project)/Makefile
	cp rules-container/templates/example.dmn $(project)/src/main/resources/
	echo "quarkus.swagger-ui.always-include=true" >> $(project)/src/main/resources/application.properties
	echo "quarkus.swagger-ui.enable=true" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.host=0.0.0.0" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.port=8080" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.cors=true" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.cors.methods=GET,PUT,POST,OPTIONS" >> $(project)/src/main/resources/application.properties
	echo "quarkus.http.cors.origins=http://localhost:3004" >> $(project)/src/main/resources/application.properties
	mkdir $(project)-tests
	cp rules-container/templates/example.csv $(project)-tests/

