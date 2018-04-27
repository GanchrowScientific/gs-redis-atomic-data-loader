#!/bin/bash

PROJECT_PATH="$(dirname $0)/../"

cd $PROJECT_PATH
echo Running tests in `pwd`
echo

mkdir -p target
mkdir -p target/test-reports

JASMINE="node_modules/jasmine-xml-reporter/bin/jasmine.js"
JAOPTS="--junitreport --output=target/test-reports/"
TESTDIR="target/dist/test"
INTTESTDIR="target/dist/integration-test"
ALL_RESULTS=0
ERROR_MESSAGE=""
FAILURES=0
TEST='test'

runTests() {
  for f in $(find $1 -type f -name '*.test.js');
  do

    echo "TEST: $f"
    $JASMINE $JAOPTS $f
    RESULT=$?

    if [[ "$RESULT" -ne 0 ]]; then
      (( ALL_RESULTS += RESULT ))
      ERROR_MESSAGE+="+ $f\n"
      ((FAILURES++))
    fi

    echo "-----";
    echo;
  done
}

runTests $TESTDIR
runTests $INTTESTDIR

if [[ "$FAILURES" -gt 1 ]]; then
  TEST+='s'
fi

if [[ "$FAILURES" -ne 0 ]]; then
  echo -e "\033[31m\033[1m$FAILURES $TEST failed\033[0m"
  echo -e $ERROR_MESSAGE
else
  echo -e "\033[32m\033[1mAll tests passed\033[0m"
fi

exit $ALL_RESULTS
