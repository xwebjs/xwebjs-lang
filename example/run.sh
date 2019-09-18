#!/usr/bin/env bash

declare exampleName;

exampleName=$1;

if [ ! -d ./${exampleName} ]; then
    echo "Example '${exampleName}' does not exist"
    exit 1
fi

echo "stop and remove the demo container"
docker stop xwebjs-lang.${exampleName}-demo
docker rm xwebjs-lang.${exampleName}-demo

# copy key files
if [ -d ./simple/js ]; then
   rm -r ./simple/js/lang
fi
cp -R ../src/main/js ./${exampleName}/js/lang

# copy libs
if [ -d ./simple/libs ]; then
   rm -r ./simple/libs
fi
cp -R ../libs ./${exampleName}/libs

# run the container
docker run \
	-v "$(pwd)/${exampleName}":/usr/share/nginx/html \
	--name xwebjs-lang.simple-demo \
	-d -p 8001:80  nginx

echo "Demo ${exampleName} is ready at http://localhost:8001"
