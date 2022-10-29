#!/bin/bash

docker run --rm -it -v $(pwd):/work -w /work node:18-alpine yarn install
