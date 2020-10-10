#!/bin/sh

DISTFILES="\
    epc.css \
    epc.min.js \
    jquery-1.12.4.min.js \
    semantic.min.css \
    semantic.min.js \
    merriweather-regular.woff \
    merriweather-regular.woff2 \
    open-sans-condensed-bold.woff \
    open-sans-condensed-bold.woff2 \
    open-sans-extra-bold.woff \
    open-sans-extra-bold.woff2 \
    open-sans-regular.woff \
    open-sans-regular.woff2 \
    icon-fire.png \
    icon-justice.png \
    icon-primal.png \
    icon-shadow.png \
    icon-time.png \
    menu-help-icon.png \
    navigation-menu.png \
    shiftstoned.png \
    power-calculator.png \
    influence-graph-menu.png \
    power-odds-table-menu.png \
    EternalThroneBackground.jpeg \
    conditional.svg \
    crest.svg \
    depleted.svg \
    link.svg \
    monument.svg \
    standard.svg \
    undepleted.svg \
    waystone.svg"

./generate.sh

mkdir -p dist
cp $DISTFILES dist

cat index.html | \
    perl -0777 -pe 's/<!-- DIST:REMOVE .* \/DIST:REMOVE -->//gs' | \
    perl -pe 's/<!-- DIST:INCLUDE//' | \
    perl -pe 's/\/DIST:INCLUDE -->//' \
    >dist/index.html
