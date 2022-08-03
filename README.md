# Project Description and Goals

Low impact DMN development, testing and deployment using *more* accessible tooling.

Project Goals:
 - Utilise [docker] containers to reduce the pain of relying on underlying java dependencies
 - Create a friendly development environment for non java programmers
 - Create a testing toolkit non java based (mocha - nodejs) and provides a test format that non programmers can wield (csv in Excel)
 - Allow for creation of lightweight native excutable images that can be used in production environments.

**This project leverages the following technologies**

 - DMN/Feel execution: Kogito and Quarkus
 - DMN Editing: VSCode and Kogito bundle extension
 - Development Environment: VSCode, Docker Desktop and Remote Containers Extension (no need to install jdk)
 - Quarkus DMN API endpoint testing: Nodejs, Mocha with dynamic tests stored in CSV files for rapid test writing

 If you're reading this you're probably looking at a project based on: `https://github.com/verbman/dmngine`

---

## Development Environment Setup

To develop and execute the rules and tests you initially need the following prerequisites installed:
 - VSCode,
 - the VSCode extension pack `ms-vscode-remote.vscode-remote-extensionpack` and
 - Docker Desktop.


### To start the rules development server

In VSCode `Ctrl+Shift+P` to open the Command Palette and choose `Remote-Containers: Open folder in container...`

Select the `rules-container` folder.
At this point VSCode will by utilising the `/docker-compose.yml` file spin up two docker images, `rules` for authoring and publishing dmn files and `testing` for testing the API endpoints that the first container exposes for executing the dmn files.
VSCode at this point also installs a number of VSCode extensions to each image.

Once VSCode has reopened within the Dev Container, access the terminal in vscode to run any of the following commands.

**Create Rules Project**

If you have not yet created a project then run the following changing `xxx` to a short organisation acronym and `projectname` to what you'd like your project called.
```
$ make create org=xxx project=projectname
```
By default the project will utilise the port `8080` for the development server. If you're creating a second project or have a port clash, you can state a custom port for the project as follows:
```
$ make create org=xxx project=projectname port=9090
```

**Access Rules Project**

Then can access your project folder with the following:
```
$ cd projectname
```
This navigates you into the root of your rules project.

**Run Rules Project Dev Server**

From there run the following to start up the development server:

```
$ make dev
```
The first time this runs it takes a while as it downloads required dependencies into the mounted /.m2 folder. This is mounted to ensure permanence between image rebuilds.
(To exit the development server you can just type `q`)

To see other options check the `/projectname/Makefile`.

You can access the development server at the following urls:
 - http://localhost:8080/q/swagger-ui/
 - http://localhost:8080/
 - http://localhost:8080/example (location of example.dmn REST api endpoint)

Note if you've specified a custom port - you will need to adjust the links above as expected. If you need to do that after you've created the project - you can modify the config file as follows.


### Configure Rules Project Dev Server

You can control aspects of the development server (known as quarkus) via the following file:
```
/[projectname]/src/main/resources/application.properties
```
We've provided an example file with which you can modify the `quarkus.http.cors.origins` value to that of your local web application to allow it access.



### To start the testing environment

*A limitation with VSCode is that you can only access one remote container at a time per VSCode window. So our final development environment will have us with two VSCode windows, one for rules and one for testing. This makes good sense once you get used to working this way. Remember that both containers are now already running because of how this project is configured.*

`Ctrl+Shift+N` for the new VSCode window.
Then as before `Ctrl+Shift+P` to open the Command Palette and choose `Remote-Containers: Open folder in container...`

This time select the `rules-testing-container` folder. VSCode will now open the testing project and attach it to the already running container. It will also install the VSCode extensions just for this image.

**Access Testing Project**

Using the VSCode command prompt navigate to the root of the testing project

```
$ cd rules-testing-container
```

**Setup Testing Project**

Then on the first time run the following to install the depencancies. The node_modules folder in the root is mounted into the image meaning this step isn't required every time the image is recreated.
```
$ make install
```

---


## Writing DMN files and Tests

The dmn files need to be located:
```
/[projectname]/src/main/resources/*.dmn
```

The test files need to be located:
```
/[projectname]-tests/*.csv
```

The test files are csv files based on the given inputs and expected outputs.
We've provided an example.dmn file and its corresponding example.csv file to illustrate the approach.
You can also spread tests over multiple files by using an asterix, i.e. `example*2.csv`

Each file pair is matched by the filename.

The CSV file structure has the following:
 - Description (the description of the test - doesn't affect the test itself)
 - Status Code (the expected status code returned from the API request, optional)
 - A series of headings in the format Given.[fieldname] - these match the inputs of the DMN file
 - A series of headings in the format Expect.[fieldname] - these match outputs from the DMN file.

There is some support for structures `Expect.Cat.Name` but we've found structures generally making testing more difficult across a variety of tools.
 
The example pair of files provided also show how to approach:
 - nulls
 - array inputs
 - array outputs

 For testing structure outputs from a dmn file you need to represent it (as json) in your csv file as follows:
 ```
 ...,"[{""Min"":1, ""Max"":3, ""Label"":""something""}]",
 ```

 You can delete these files at any time.

### Running Tests

Running tests are a critical part of DMN development. First ensure the Rules Development server is running (see "Run Rules Project Dev Server")

Then in the VSCode window for the `rules-testing-container` run the following:

```
$ make test file=example
```
Inspect the `/rules-testing-container/Makefile` to see the different options.
Most notably you can test all the test files as follows:
```
$ make test
```
and you can enable logging of the API response object with:
```
$ make test file=example log=true
```
Some work is still required to be done in understanding how we might tackle sub folders of dmn files and tests etc. But currently the project only supports a flat folder structure in the folders described.

When you have multiple projects setup you will need to specify which project you're wanting to test. You can do this as follows:
```
$ make test project=project-name file=example
```


---



## Publishing Executables for Production use


Once you have a suite of DMN files completed and you want to publish it you can do so.  But first, if you want to modify the release number of your project, it can be found in the `/[projectname]/pom.xml` file. The initial default is `1.0.0-SNAPSHOT`.

Running `make native` in the project root directory (i.e.) `cd project-name` will provide further instructions on the process and then kick start the initial step - that being the compilation of the native image.

The final steps as described in the `[projectname]/Makefile` need to be run on the host machine command prompt (rather than one of the containers).