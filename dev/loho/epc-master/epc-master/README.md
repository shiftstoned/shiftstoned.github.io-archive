# Overview

Eternal Power Calculator is a tool to assist the deckbuilding process
for Dire Wolf Digital's Eternal CCG.

See https://www.direwolfdigital.com/eternal/ for more about Eternal.

Given a decklist, the power calculator will compute the probability of
drawing the power and influence necessary to play cards from the deck
in a particular number of cards drawn.  It will generate an HTML table
of the odds of drawing those cards for each of set of influence
required by cards in the deck.

Eternal Power Calculator uses jQuery and Semantic-UI as a foundation.
See the following for more information:

* jQuery -- https://jquery.com/
* Semantic-UI -- https://semantic-ui.com/

# Contents

Eternal Power Calculator contains the following Javascript code:

* `epc-deck.js` - Data structures relating to eternal cards and decks
* `epc-graph.js` - Graph drawing routines
* `epc-polyfill.js` - Polyfill from external sources, for older web browsers
* `epc-table.js` - Table generation routines
* `epc-test.js` - Tests for odds calculation
* `epc-ui.js` - Top level user interface logic

Additional content:

* `index.html` - HTML shell for the power calculator
* `epc.css` - CSS style sheet for `index.html`
* `jquery-1.12.4.min.js` - Standard jQuery
* `semantic.min.css` - Generated Semantic-UI CSS
* `semantic.min.js` - Generated Semantic-UI Javascript

Build support:

* `lint.sh` - Shell script for linting Javascript source
* `generate.sh` - Shell script to generate `epc.min.js` (minified Javascript)
* `build-semantic.sh` - Build a `semantic.min.css` and `semantic.min.js`
* `semantic.json` - Configuration for Semantic-UI 
* `semantic-site.variables` - Build variables for Semantic-UI

# Usage

To use Eternal Power Calculator, see https://www.shiftstoned.com/epc/

# License

Eternal Power Calculator is licensed under the GNU General Public License 2.0.
