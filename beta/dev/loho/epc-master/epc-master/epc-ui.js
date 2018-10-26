/*global $, document, window, localStorage, URL, URLSearchParams*/
/*global generateOddsTable, drawPowerGraph, makeGraphPopupTracker*/
/*global makeEternalCardLibrary, makeEternalDeck*/
/*global makeEternalDeckFromString, makeEternalDeckFromCode*/
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


/*
    Hook up all user interface behavior.  The parameter is used 
    to determine the visual appearance of the graph.
*/
function buildEpcUI(
    graphStyle
) {
    var cardlist,
        cardLibrary,
        currentDeck,
        modifyCardCount,
        oddsWorker,
        graphPopupTracker,
        deckFromURL;

    cardlist = $("#card-list").html();
    cardLibrary = makeEternalCardLibrary(cardlist);

    /*
        Get the CSS class name for a card in the deck edit list,
        based on the influence colors it provides.
    */
    function getCardNameClass(
        card
    ) {
        var influence;

        if (card.flags.power) {
            return "card-name";
        }

        influence = card.influenceGenerated;
        if (!influence || influence.isEmpty()) {
            return "card-name";
        }

        if (influence.fire > 0 &&
                influence.time === 0 && influence.justice === 0 &&
                influence.primal === 0 && influence.shadow === 0 &&
                influence.wild === 0) {
            return "card-name fire";
        }

        if (influence.time > 0 &&
                influence.fire === 0 && influence.justice === 0 &&
                influence.primal === 0 && influence.shadow === 0 &&
                influence.wild === 0) {
            return "card-name time";
        }

        if (influence.justice > 0 &&
                influence.time === 0 && influence.fire === 0 &&
                influence.primal === 0 && influence.shadow === 0 &&
                influence.wild === 0) {
            return "card-name justice";
        }

        if (influence.primal > 0 &&
                influence.time === 0 && influence.justice === 0 &&
                influence.fire === 0 && influence.shadow === 0 &&
                influence.wild === 0) {
            return "card-name primal";
        }

        if (influence.shadow > 0 &&
                influence.time === 0 && influence.justice === 0 &&
                influence.primal === 0 && influence.fire === 0 &&
                influence.wild === 0) {
            return "card-name shadow";
        }

        return "card-name multi";
    }

    /*
        Build a row corresponding to an individual card in the decklist
        editing panel.
    */
    function buildDeckRow(
        row,
        deck,
        card,
        cardcount
    ) {
        var name,
            nameClass,
            count,
            countstr,
            cardid,
            addButton,
            subButton;

        name = cardcount.name;
        count = cardcount.count;
        countstr = String(count);
        cardid = cardcount.id;

        nameClass = getCardNameClass(card);

        $("<div>").addClass(nameClass).text(name).appendTo(row);
        $("<div>").addClass("card-count").text(countstr).appendTo(row);
        subButton = $("<button>").addClass("ui compact button")
            .text("-").appendTo(row);
        addButton = $("<button>").addClass("ui compact button")
            .text("+").appendTo(row);

        addButton.bind("click", function () {
            modifyCardCount(deck, cardid, count + 1);
        });
        subButton.bind("click", function () {
            modifyCardCount(deck, cardid, count - 1);
        });
    }

    /*
        Add the rows to the editable deck, one for each card,
        with -/+ buttons for modifying the card count.
    */
    function buildDeckRows(
        deck
    ) {
        var powerRows, nonpowerRows, row;

        powerRows = $("#deck-edit-power-rows");
        powerRows.empty();

        nonpowerRows = $("#deck-edit-nonpower-rows");
        nonpowerRows.empty();

        $.each(deck.cardlist, function (index, cardcount) {
            var card, cardid;

            cardid = cardcount.id;
            card = cardLibrary.cards[cardid];

            row = $("<div>").addClass("card-count-edit");
            if (card && card.flags.power) {
                row.appendTo(powerRows);
            } else {
                row.appendTo(nonpowerRows);
            }

            buildDeckRow(row, deck, card, cardcount);
        });

        if (powerRows.children().length) {
            $("#deck-edit-power-title").css("display", "block");
        } else {
            $("#deck-edit-power-title").css("display", "none");
        }

        if (nonpowerRows.children().length) {
            $("#deck-edit-nonpower-title").css("display", "block");
        } else {
            $("#deck-edit-nonpower-title").css("display", "none");
        }
    }

    /*
        Set the influence count for a type in the influence panel
        Add the 'zero' class if the value is zeroed.
    */
    function setInfluenceCount(
        numberDiv,
        count
    ) {
        numberDiv.text(count);
        if (count) {
            numberDiv.removeClass("zero");
        } else {
            numberDiv.addClass("zero");
        }
    }

    /*
        Count the sources of power and influence in the deck and
        update the counts in the influence panel.
    */
    function generateInfluencePanel(
        deck
    ) {
        var count, power, fire, time, justice, primal, shadow, wild;

        count = deck.cards.length;
        power = 0;
        fire = 0;
        time = 0;
        justice = 0;
        primal = 0;
        shadow = 0;
        wild = 0;

        $.each(deck.cards, function (index, card) {
            var influence;

            influence = card.influenceGenerated;

            power += influence.power;
            fire += influence.fire;
            time += influence.time;
            justice += influence.justice;
            primal += influence.primal;
            shadow += influence.shadow;
            wild += influence.wild;
        });

        if (fire) {
            fire += wild;
        }
        if (time) {
            time += wild;
        }
        if (justice) {
            justice += wild;
        }
        if (primal) {
            primal += wild;
        }
        if (shadow) {
            shadow += wild;
        }

        $("#card-count-number").text(String(count));
        $("#power-sources-number").text(String(power));

        setInfluenceCount($("#fire-sources-number"), fire);
        setInfluenceCount($("#time-sources-number"), time);
        setInfluenceCount($("#justice-sources-number"), justice);
        setInfluenceCount($("#primal-sources-number"), primal);
        setInfluenceCount($("#shadow-sources-number"), shadow);
    }

    /*
        Fill in card type counts for each element of class
        "power-type-count" in the document.
    */
    function generatePowerTypeCounts(
        deck
    ) {
        $(".power-type-count").each(function (index, div) {
            var flag, count;

            count = 0;
            flag = $(div).attr("tag");
            $.each(deck.cards, function (cardIndex, card) {
                if (card.flags[flag]) {
                    count += 1;
                }
            });

            $(div).text(String(count));
        });
    }

    /*
        When the deck changes, store the new deck in local storage
        and regenerate the user interface components which depend
        on the contents of the deck.
    */
    function onDeckChange(
        deck
    ) {
        var decklist, dots;
        currentDeck = deck;

        decklist = currentDeck.generateDecklist(false);
        try {
            /*
                If the deck has been loaded from a URL, we'll
                assume changes are temporary and shouldn't be
                saved as the most recent deck.
            */
            if (!deckFromURL) {
                localStorage.setItem("decklist", decklist);
            }
        } catch (ignore) {
        }

        if (oddsWorker) {
            oddsWorker.cancel();
        }
        oddsWorker = generateOddsTable(
            $("#power-table-cost-div"),
            $("#power-table-odds-div"),
            cardLibrary,
            deck
        );

        dots = drawPowerGraph($("#power-graph-div"), graphStyle, deck);
        graphPopupTracker.setGraphDots(dots);

        generateInfluencePanel(deck);
        generatePowerTypeCounts(deck);
        buildDeckRows(deck);
    }

    /*
        Given a list of cardcount objects, change the count associated
        with a particular card id.  Return the full list, including
        the modified cardcount.
    */
    modifyCardCount = function (
        deck,
        cardid,
        count
    ) {
        var modifiedList, modifiedDeck;

        modifiedList = [];

        $.each(deck.cardlist, function (index, cardcount) {
            if (cardcount.id === cardid) {
                if (count >= 0) {
                    modifiedList.push({
                        id: cardcount.id,
                        name: cardcount.name,
                        count: count
                    });
                }
            } else {
                modifiedList.push(cardcount);
            }
        });

        modifiedDeck = makeEternalDeck(cardLibrary, modifiedList);
        onDeckChange(modifiedDeck);
    };

    /*
        When the import textarea changes, check whether the decklist
        is valid, and enable or disable the import button.  Report
        any syntax error in the user interface.
    */
    function validateImportDeck() {
        var deck;

        deck = makeEternalDeckFromString(
            cardLibrary,
            $("#import-modal-deck").val()
        );

        if (deck.makeError) {
            $("#import-validation-result").text(deck.makeError);
            $("#import-modal-import-button").addClass("disabled");
        } else {
            $("#import-validation-result").text("");
            $("#import-modal-import-button").removeClass("disabled");
        }
    }

    /*  When deck import is confirmed, switch to the new deck  */
    function onDeckImport() {
        var deck;

        deck = makeEternalDeckFromString(
            cardLibrary,
            $("#import-modal-deck").val()
        );
        onDeckChange(deck);
    }

    /*  Copy text to the system clipboard  */
    function copyToClipboard(content) {
        var input, scrollLeft, scrollTop;

        scrollLeft = document.body.scrollLeft;
        scrollTop = document.body.scrollTop;

        input = $("<textarea>").appendTo($("body")).val(content).select();
        document.execCommand("copy");
        input.remove();

        document.body.scrollLeft = scrollLeft;
        document.body.scrollTop = scrollTop;
    }

    /*  Copy the current decklist to the clipboard  */
    function onDeckExport() {
        var decklist;

        decklist = currentDeck.generateDecklist(true);
        copyToClipboard(decklist);
    }

    /*  Generate a link to the current deck  */
    function onGenerateLink() {
        var code, link, index;

        code = currentDeck.generateDeckCode();

        link = String(document.location);

        index = link.indexOf('?');
        if (index >= 0) {
            link = link.substring(0, index);
        }

        link = link + "?d=" + code;
        copyToClipboard(link);
    }

    /*  Reset the deck to an empty deck  */
    function onDeckClear() {
        var deck;

        deck = makeEternalDeckFromString(cardLibrary, "");
        onDeckChange(deck);
    }

    /*
        Add a new card to the current deck upon confirmation from the
        add card dialog.
    */
    function onAddCard(
        dropdownOption
    ) {
        var cards, deck, cardid;

        cardid = dropdownOption.val();
        if (!cardid.length) {
            return;
        }

        cards = currentDeck.cardlist.slice();
        cards.push({
            id: cardid,
            name: dropdownOption.text(),
            count: 1
        });

        deck = makeEternalDeck(cardLibrary, cards);
        onDeckChange(deck);
    }

    /*  Report an error with a modal dialog  */
    function showError(
        title,
        content
    ) {
        $("#error-title").text(title);
        $("#error-text").text(content);
        $("#error-modal").modal("show");
    }

    /*  Perform final UI steps after the entire page loads  */
    function onLoad() {
        var importButton, importPopupActive;

        /*
            When page loading finishes, report any syntax error in the
            card library by showing an error dialog.
        */
        if (cardLibrary.makeError) {
            showError("Card list error", cardLibrary.makeError);
            return;
        }

        /*
            If there is no deck loaded, show a pop-up indicating
            that importing a deck is a good first step
        */
        if (!currentDeck.cards.length) {
            importPopupActive = true;
            importButton = $("#import-button");
            importButton.popup("show");

            $(window).bind("click", function () {
                if (importPopupActive) {
                    importButton.popup("hide");
                    importPopupActive = false;
                }
            });
        }

        /*
            Fonts may have been loaded, which means we should redraw
            the graph.
        */
        onDeckChange(currentDeck);
    }

    /*  Bind all buttons to their behavior handlers  */
    function bindButtons() {
        $(window).bind("load", onLoad);
        $(".menu-help-icon").popup({
            position: "top right",
            offset: 6
        });

        $("#import-button").popup({ on: "" });
        $("#import-button").bind("click", function () {
            $("#import-modal-deck").val("").select();
            $("#import-modal").modal("show");
        });

        $("#import-modal-deck").bind("input", function () {
            validateImportDeck();
        });

        $("#export-button").popup({ on: "click" });
        $("#export-button").bind("click", function () {
            onDeckExport();
        });

        $("#link-button").popup({ on: "click" });
        $("#link-button").bind("click", function () {
            onGenerateLink();
        });

        $("#about-heading").bind("click", function () {
            $("#about-modal").modal("show");
        });

        $("#add-card-button").bind("click", function () {
            $("#add-card-dropdown").dropdown("clear");
            $("#add-card-modal").modal("show");
        });

        $("#clear-button").popup({ on: "click" });
        $("#clear-button").bind("click", function () {
            onDeckClear();
            $("#clear-button").popup("reposition");
        });

        $("#import-modal-import-button").bind("click", function () {
            onDeckImport();
        });

        $("#add-card-modal-add-button").bind("click", function () {
            onAddCard($("#add-card-dropdown option:selected"));
        });

        $("#power-table-container").css("display", "none");

        $("#graph-menu-item").bind("click", function () {
            $("#power-graph-container").css("display", "inline");
            $("#power-table-container").css("display", "none");

            $("#graph-menu-item").addClass("active");
            $("#table-menu-item").removeClass("active");
        });

        $("#table-menu-item").bind("click", function () {
            $("#power-graph-container").css("display", "none");
            $("#power-table-container").css("display", "inline");

            $("#graph-menu-item").removeClass("active");
            $("#table-menu-item").addClass("active");
        });
    }

    /*
        Add all the cards from the card library to the dropdown
        selector in the add card dialog.
    */
    function gatherCards() {
        var dropdown, cardnames, cardids;

        $(".ui.dropdown").dropdown();

        dropdown = $("#add-card-dropdown");

        cardnames = [];
        cardids = {};
        $.each(Object.values(cardLibrary.cards), function (index, card) {
            cardnames.push(card.name);
            cardids[card.name] = card.id;
        });

        cardnames.sort();

        $.each(cardnames, function (index, name) {
            var cardid;

            cardid = cardids[name];
            $("<option>").val(cardid).text(name).appendTo(dropdown);
        });
    }

    /*
        Load a deck from the code in the URL.
        Returns true if a valid deck code is present, false otherwise.
    */
    function getDeckFromURL() {
        var params;

        params = new URLSearchParams(document.location.search);

        if (!params.has("d")) {
            return false;
        }

        currentDeck = makeEternalDeckFromCode(cardLibrary, params.get("d"));
        if (currentDeck.makeError) {
            showError("Deck code error", currentDeck.makeError);

            currentDeck = null;
            return false;
        }

        return true;
    }

    /*
        Check browser local storage for a decklist saved from a 
        previous visit to the page.  If one is found, load that
        decklist as the active deck.
    */
    function getDeckFromStorage() {
        var decklist;

        decklist = "";
        /*
            Some browsers (Safari, Edge) throw exceptions when accessing
            local storage on a page with a file:... URL.  Behave as if
            there is no stored decklist in this case.
        */
        try {
            if (localStorage) {
                decklist = localStorage.getItem("decklist");
            }
        } catch (ignore) {
        }

        if (!decklist) {
            decklist = "";
        }

        currentDeck = makeEternalDeckFromString(cardLibrary, decklist);
        if (currentDeck.makeError) {
            currentDeck = makeEternalDeckFromString(cardLibrary, "");
        }
    }

    graphPopupTracker = makeGraphPopupTracker();

    deckFromURL = getDeckFromURL();
    if (!deckFromURL) {
        getDeckFromStorage();
    }

    onDeckChange(currentDeck);
    bindButtons();
    gatherCards();
}
