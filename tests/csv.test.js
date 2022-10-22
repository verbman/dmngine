'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const converter = require('json-2-csv');
const fs = require('fs');
const path = require('path');

chai.use(chaiHttp);
chai.use(assertArrays);
var expect = require('chai').expect;

//https://stackoverflow.com/questions/53200246/how-do-i-dynamically-generate-mocha-tests-in-a-describes-before-block
//See above for where the idea came from
// Step 1: Pull in Test class directly from mocha
const Test = require('mocha/lib/test');

let directories = [];
let projects = [];
let directory = "";
let project = "";
let port = "8080";
const pattern = /\.csv$/;
const url = 'http://host.docker.internal';



// Step 2: Simulates it() from mocha/lib/interfaces/bdd.js
//   I ignore the isPending() check from bdd.js. I don't know
//   if ignoring it is required, but I didn't see a need to add
//   it for my case to work
function addTest(suite, title, fn) {
  let test = new Test(title, fn);
  test.file = __filename;
  suite.addTest(test);
  return test;
}

function getPort(p) {
  try {
    const data = fs.readFileSync(__dirname + "/../" + p + "/src/main/resources/application.properties", 'utf8');
    var temp = data.split("quarkus.http.port");
    if (temp[1]) {
      port = temp[1].split("\n")[0].replace("=", "").trim();
    } else {
      console.log("Could not determine port, sticking with default");
    }
  } catch (err) {
    console.error(err);
  }
}

function setProjectAndDirectory() {
  var ignoreFolders = ["node_modules", "tests"]
  const getProjectDirectories = source => fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith(".") && !ignoreFolders.find((str) => str === dirent.name) )
    .map(dirent => dirent.name);
  projects = getProjectDirectories(__dirname + "/../");
  
  directories = [];
  const getTestDirectories = proj => fs.readdirSync(__dirname + "/../" + proj, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.endsWith("tests") )
    .map(dirent => proj + '/' + dirent.name);

  for(var j = 0;j < projects.length;j++){
    directories = directories.concat(getTestDirectories(projects[j]))
  }

  for(var j = 0;j < directories.length;j++){
    directories[j] = __dirname + "/../" + directories[j] + "/";
  }

  if (directories.length > 0) {
    if (!process.env.npm_config_project || (process.env.npm_config_project && process.env.npm_config_project == '')) {
      //Run all projects
      //directory = __dirname + "/../" + directories[0] + "/";
      //project = directories[0].split("/")[0];
    } else {
      //Run specified project
      if (projects.find((str) => str === process.env.npm_config_project)) {
        //directory = __dirname + "/../" + process.env.npm_config_project + "/tests/";
        directories = [__dirname + "/../" + process.env.npm_config_project + "/tests/"];
        //project = process.env.npm_config_project;
        projects = [process.env.npm_config_project]
      } else {
        console.log("Specified project directory " + process.env.npm_config_project + " not found");
      }
    }
  } else {
    console.log("No *-tests folder found");
  }
}

function getTestFiles(d) {
  var f = [];
  var files = fs.readdirSync(d);
  for (var i = 0; i < files.length; i++) {
    var filepath = path.join(d, files[i]);
    var stat = fs.lstatSync(filepath);
    if (pattern.test(filepath)) f.push(files[i]);
  }
  return f;
}

function parseJsonOutput(expect, output, path, tests) {
  let cpath = ""
  for (var name in expect) {
    cpath = path + "." + name;
    if (Array.isArray(output)) {
      // Collates a collection to match test. For example, csv wants to test `Expect.Pages.Slice`
      // Expect.Pages is actually an array of objects, but to keep the csv file simple we map all object.Slice values.
      var temp = {};
      temp[name] = output.map(x => {
        return x[name];
      })
      output = temp;
    }
    if (Array.isArray(expect[name])) {
      if (expect[name].length > 0) {
        if (typeof expect[name][0] == "object") {
          // TODO, need to collate values from sub objects
        } else {
          tests.push({ item: cpath, expected: expect[name], output: output[name] });
        }
      } else {
        tests.push({ item: cpath, expected: [], output: output[name] });
      }
    } else {
      if (expect[name] === null) {
        tests.push({ item: cpath, expected: null, output: output[name] });
      } else if (typeof expect[name] === "object" && (Object.keys(expect[name]).length > 1 || Object.keys(expect[name])[0] != '0')) {
        console.log(name + " is an object and this may not work");
        tests = tests.concat(parseJsonOutput(expect[name], output[name], cpath, tests));
      } else {
        //Reached the tree part we're testing
        tests.push({ item: cpath, expected: expect[name], output: output[name] });
      }
    }
  }
  return tests;
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

setProjectAndDirectory();
for(var h = 0; h < projects.length; h++){
  if(directories.length > h){
    directory = directories[h];
    project = projects[h];

    getPort(project);
    let filenames = getTestFiles(directory);
    
    console.log("Testing: " + filenames.join(", ") + " on port: " + port);

    for (var i = 0; i < filenames.length; i++) {
      let testName = filenames[i].replace(".csv", "");
      if (!process.env.npm_config_test || process.env.npm_config_test == 'all' || process.env.npm_config_test == testName) {
        var data = require("fs").readFileSync(directory + filenames[i], "utf8");

        //Fix issues created by Excel, booleans converted to lowercase and carriage returns removed.
        data = data.replace(/(?:TRUE)/g, 'true').replace(/(?:FALSE)/g, 'false').replace(/(?:\r\n|\r|\n)/g, '\n');

        converter.csv2json(data, (err, json) => {

          if (err) {
            console.log("Error parsing csv file, is it empty?")
          } else {
            // Step 3: Save the suite object so that we can add tests to it.
            let suite = describe("Suite: " + testName + ' - ' + json.length + ' tests (+ "Test Dummy")', function () {
              before(function () {

                for (var i = 0; i < json.length; i++) {
                  // Step 4: Dynamically add tests 
                  //   suite is defined at this point since before() is always
                  //   run after describe() returns.
                  let jsonSingular = json[i];
                  addTest(suite, testName + ': #' + (i + 1) + ' ' + jsonSingular.Description, function () {
                    this.timeout(50000);
                    var temp = testName.split("*");
                    var dmnTest = (temp.length > 1) ? temp[0] : testName;

                    return chai.request(url + ":" + port + "/")
                      .post(encodeURIComponent(dmnTest))
                      .send(jsonSingular.Given)
                      .then(function (res) {
                        if (process.env.npm_config_log) {
                          console.log("----- " + res.request.method + ' : ' + res.request.url + " -----")
                          console.log(res.request._data)
                          if (res.res.text.trim().length > 0) {
                            try {
                              console.log(JSON.parse(res.res.text));
                            } catch(e) {
                              console.log(res.res.text);
                            }
                          }
                        }
                        if (res.res.text.trim().length === 0) {
                          throw new Error("Nothing was returned, check the DMN Model Name, file name and swagger ui to see if (" + url + ":" + port + "/" + testName + ") exists.")
                        }
                        if (jsonSingular.Status) expect(res).to.have.status(jsonSingular.Status);
                        if (jsonSingular.Expect && res.res.text.trim().length > 0) {
                          var output = JSON.parse(res.res.text);
                          if (output.modelName && output.messages && output.messages.length > 0) {
                            var error = '';
                            for (var i = 0; i < output.messages.length; i++) {
                              error += output.messages[i].message + '\n';
                            }
                            throw new Error(error);
                          } else {
                            var tests = parseJsonOutput(jsonSingular.Expect, output, "Expect", []);

                            for (var i = 0; i < tests.length; i++) {
                              if (Array.isArray(tests[i].expected) && tests[i].output != null) {
                                expect(tests[i].expected).to.equalTo(tests[i].output);
                              } else if ((typeof tests[i].expected === 'string' || tests[i].expected instanceof String) &&
                                isJsonString(tests[i].expected)
                              ) {
                                expect(JSON.parse(tests[i].expected)).to.deep.equal(tests[i].output);
                              } else {
                                expect(tests[i].expected).to.equal(tests[i].output);
                              }
                            }
                            if (process.env.npm_config_log) {
                              console.log("-----tests-----");
                              console.log(tests);
                            }
                          }
                        }
                      })
                      .catch(function (err) {
                        if (err.code === "ECONNREFUSED") {
                          console.log("Rules Container server likely not running, connection refused at: " + url + ":" + port + "/");
                        } else {
                          if (process.env.npm_config_log) console.log(err);
                        }
                        throw err;
                      });
                  });
                }
              });

              // Step 5: Add dummy test in describe() block so that it will be run.
              //   Can be it() for a pass result or it.skip() for pending.
              it(testName + ': #0 --- Test Dummy ---', function () {
                //this.skip();
                chai.expect(true).to.equal(true);
              });
            });
          }
        }, { trimHeaderFields: true, trimFieldValues: true });
      }
    }
  }else{
    console.log(projects[h] + " missing tests folder");
  }
}
