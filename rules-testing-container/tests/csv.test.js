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

let directory = "";
const pattern = /\.csv$/;
const url = 'http://host.docker.internal:8080/';



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

function getTestFiles() {
  var f = [];
  const getDirectories = source => fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.endsWith("-tests"))
    .map(dirent => dirent.name);
  var testDirectories = getDirectories(__dirname+"/../../");
  if( testDirectories.length > 0 ){
    directory = __dirname+"/../../"+testDirectories[0]+"/";
    var files = fs.readdirSync(directory);
    for (var i = 0; i < files.length; i++) {
      var filepath = path.join(directory, files[i]);
      var stat = fs.lstatSync(filepath);
      if (pattern.test(filepath)) f.push(files[i]);
    };
  }else{
    console.log("No *-tests folder found");
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

let filenames = getTestFiles();
for (var i = 0; i < filenames.length; i++) {
  let testName = filenames[i].replace(".csv", "");
  if (!process.env.npm_config_test || process.env.npm_config_test == 'all' || process.env.npm_config_test == testName) {
    var data = require("fs").readFileSync(directory + filenames[i], "utf8");
    converter.csv2json(data, (err, json) => {
      
      if(err){
        console.log("Error parsing csv file, is it empty?")
      }else{
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
                return chai.request(url)
                  .post(encodeURIComponent(testName))
                  .send(jsonSingular.Given)
                  .then(function (res) {
                    if (process.env.npm_config_log) {
                      console.log("----- " + res.request.method + ' : ' + res.request.url + " -----")
                      console.log(res.request._data)
                      console.log(JSON.parse(res.res.text))
                    }
                    if (jsonSingular.Status) expect(res).to.have.status(jsonSingular.Status);
                    if (jsonSingular.Expect) {
                      var output = JSON.parse(res.res.text);
                      var tests = parseJsonOutput(jsonSingular.Expect, output, "Expect", []);

                      for (var i = 0; i < tests.length; i++) {
                        if (Array.isArray(tests[i].expected) && tests[i].output != null) {
                          expect(tests[i].expected).to.equalTo(tests[i].output);
                        } else {
                          expect(tests[i].expected).to.equal(tests[i].output);
                        }
                      }
                      if (process.env.npm_config_log) {
                        console.log("-----tests-----");
                        console.log(tests);
                      }
                    }

                  })
                  .catch(function (err) {
                    if (process.env.npm_config_log) console.log(err);
                    //expect(err).to.be.null;
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