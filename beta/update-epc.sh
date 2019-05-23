#!/bin/sh

git submodule update
(cd _epc; git checkout master && git pull && npm ci && npm run build)
cp _epc/dist/* epc/
