#!/bin/sh

(cd _epc; git checkout beta && npm install && npm run build)
cp _epc/dist/* beta/epc/
