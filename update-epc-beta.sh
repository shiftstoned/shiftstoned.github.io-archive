#!/bin/sh

(cd _epc; git checkout beta && npm ci && npm run build)
cp _epc/dist/* beta/epc/
