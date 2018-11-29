#!/bin/sh

git submodule update
(cd _epc; git checkout master && npm ci && npm run build)
cp _epc/dist/* epc/
