#!/bin/sh

npm install semantic-ui@2.3.1 --save
cp semantic-site.variables semantic/src/site/globals/site.variables
(cd semantic; gulp build)
cp semantic/semantic.min.css semantic/semantic.min.js .
