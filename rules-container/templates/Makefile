dev:
	quarkus dev

native:
	@echo "Building native compilation, see output in /target"
	@echo "Once complete, on host machine (in project root) run the following two commands:"
	@echo "docker build -f src/main/docker/Dockerfile.native-micro -t quarkus/project-name . "
	@echo "docker run -i -t -p 8000:8080 quarkus/project-name"
	@echo "You can access the running container at: http://localhost:8000/ - image size will be approx 100mb"
	@echo "" 
	@echo "" 
	quarkus build --native
