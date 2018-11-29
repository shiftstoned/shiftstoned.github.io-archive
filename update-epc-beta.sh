#!/bin/sh

git submodule update
(cd _epc; git checkout beta && git pull && npm ci && npm run build)
cp _epc/dist/* beta/epc/
