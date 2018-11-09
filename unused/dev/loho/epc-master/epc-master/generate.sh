#!/bin/sh

uglifyjs --preamble \
    "/*  Eternal Power Calculator - https://github.com/matt-kimball/epc  */" \
    epc-deck.js epc-graph.js epc-polyfill.js epc-table.js epc-ui.js \
    epc-code.js url-search-params.js \
    -m -o epc.min.js
