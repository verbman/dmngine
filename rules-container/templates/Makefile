dev:
	@echo "Running quarkus dev: http://localhost:8080/"
	@echo "See REST Endpoints at http://localhost:8080/q/swagger-ui/"
	quarkus dev

native:
	@echo "Building native compilation, see output in /target"
	@echo "Once complete, on host machine (in project root) run the following two commands:"
	@echo "docker build -f src/main/docker/Dockerfile.native-micro -t quarkus/project-name . "
	@echo "docker run -i -t -p 8081:8080 quarkus/project-name"
	@echo "You can access the running container at: http://localhost:8081/ - image size will be around 100mb"
	quarkus build --native
