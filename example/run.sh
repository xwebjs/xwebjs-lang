#!/usr/bin/env bash

declare exampleName;
declare port;

exampleName=$1;
port=$2;

cd $(dirname $0)

if [ ! -d ./${exampleName} ]; then
    echo "Example '${exampleName}' does not exist"
    exit 1
fi

echo "Stop the demo container xwebjs-lang.${exampleName}-demo"
docker stop xwebjs-lang.${exampleName}-demo
echo "Remove the demo container xwebjs-lang.${exampleName}-demo"
docker rm xwebjs-lang.${exampleName}-demo

# run the container
docker run \
	-v "$(pwd)/${exampleName}":/usr/share/nginx/html \
	--name xwebjs-lang.${exampleName}-demo \
	-d -p ${port}:80  nginx

echo "Demo ${exampleName} is ready at http://localhost:${port}"
