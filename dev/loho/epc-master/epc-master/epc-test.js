/*global window*/
/*global makeEternalCardLibrary, makeEternalDeckFromString*/
/*jslint unparam: true*/
/*

    Eternal Power Calculator
    Copyright (C) 2018  Matt Kimball

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

*/

'use strict';


/*  A test of basic functionality provided by this module  */
function testEPC() {
    var cardsstr, deckstr, library, deck, influence, odds, start, stop, i;

    cardsstr = "\
        Set0 #1;;2F;Creature;\n\
        Set0 #2;1F;;Sigil;\n\
        Set0 #3;1F;;Sigil;\n\
        Set0 #4;1F;;Sigil;\n\
        Set0 #5;1F;;Sigil;\n\
        Set0 #6;1F;;Sigil;\n\
        Set0 #7;1F;;Sigil;\n\
        Set0 #8;1F;;Sigil;\n\
        Set0 #9;1F;;Sigil;\n\
        Set0 #10;1F;;Sigil;\n\
        Set0 #11;1F;;Sigil;\n\
        Set0 #12;1F;;Sigil;\n\
        Set0 #13;1F;;Sigil;\n\
        ";

    /*  Check that we can do simple probabilities correctly  */
    deckstr = "\
        50 Creature (Set0 #1)\n\
        25 Power (Set0 #2)\n\
        ";

    library = makeEternalCardLibrary(cardsstr);
    deck = makeEternalDeckFromString(library, deckstr);

    influence = library.cards["Set0 #1"].influenceRequirements[0];
    console.assert(influence.power === 2);
    console.assert(influence.fire === 1);
    console.assert(influence.shadow === 0);

    odds = deck.drawOdds(7, influence);
    console.assert(odds > 0.749 && odds < 0.750);


    /*  Check that we can handle multiple equivalent influence sources  */
    deckstr = "\
        50 Creature (Set0 #1)\n\
        12 Power (Set0 #2)\n\
        13 Power (Set0 #3)\n\
    ";

    deck = makeEternalDeckFromString(library, deckstr);

    odds = deck.drawOdds(7, influence);
    console.assert(odds > 0.749 && odds < 0.750);


    /*  Check the performance when there are many equivalent sources  */
    deckstr = "\
        50 Creature (Set0 #1)\n\
        2 Power (Set0 #2)\n\
        2 Power (Set0 #3)\n\
        2 Power (Set0 #4)\n\
        2 Power (Set0 #5)\n\
        2 Power (Set0 #6)\n\
        2 Power (Set0 #7)\n\
        2 Power (Set0 #8)\n\
        2 Power (Set0 #9)\n\
        2 Power (Set0 #10)\n\
        2 Power (Set0 #11)\n\
        2 Power (Set0 #12)\n\
        3 Power (Set0 #13)\n\
    ";

    deck = makeEternalDeckFromString(library, deckstr);

    odds = deck.drawOdds(7, influence);
    console.assert(odds > 0.749 && odds < 0.750);

    for (i = 0; i < 5; i += 1) {
        start = window.performance.now();
        odds = deck.drawOdds(20, influence);
        stop = window.performance.now();
        console.log('odds time: ' + (stop - start));
    }


    /*  Test that multiple lines referencing the same card are additive  */
    deckstr = "\
        10 Creature (Set0 #1)\n\
        10 Creature (Set0 #1)\n\
        10 Creature (Set0 #1)\n\
        10 Creature (Set0 #1)\n\
    ";

    deck = makeEternalDeckFromString(library, deckstr);
    console.assert(deck.cards.length === 40);
    console.assert(deck.cardCount["Set0 #1"] === 40);

    /*
        Test that the probability is zero if there are
        no influence sources
    */
    deckstr = "\
        1 Creature (Set0 #1)\n\
    ";

    deck = makeEternalDeckFromString(library, deckstr);
    odds = deck.drawOdds(7, influence);
    console.assert(odds < 0.01);

    /*
        Test that the probability is 100% if the entire deck
        is drawn.
    */
    deckstr = "\
        1 Creature (Set0 #1)\n\
        4 Power (Set0 #2)\n\
    ";

    deck = makeEternalDeckFromString(library, deckstr);
    odds = deck.drawOdds(7, influence);
    console.assert(odds > 0.99);
}
