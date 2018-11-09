/*global $, performance*/
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
    Construct a worker which can compute the draw odds while
    the browser is idle.
*/
function makeOddsWorker(
    deck,
    minDraws,
    maxDraws,
    onOddsComplete
) {
    var worker,
        influences,
        influenceIndex,
        drawIndex,
        oddsResult,
        maxWorkTime;

    influences = deck.listInfluenceRequirements();
    influenceIndex = -1;
    drawIndex = maxDraws + 1;
    oddsResult = [];
    maxWorkTime = 5;

    worker = {
        deck: deck,
        minDraws: minDraws,
        maxDraws: maxDraws,
    };

    /*
        Compute the next draw odds value.  Returns true if all the
        odds have been computed, and false if there is more work to do.
    */
    function computeStep() {
        var influence,
            influenceCard,
            odds,
            oddsRow,
            components,
            componentOdds;

        if (drawIndex <= maxDraws) {
            influenceCard = influences[influenceIndex];
            influence = influenceCard[0];
            oddsRow = oddsResult[oddsResult.length - 1].odds;

            componentOdds = [];

            components = influence.listComponents();
            if (components.length > 1) {
                $.each(components, function (index, component) {
                    odds = deck.drawOdds(drawIndex, component);
                    componentOdds.push({
                        component: component,
                        odds: odds
                    });
                });
            }

            odds = deck.drawOdds(drawIndex, influence);
            oddsRow.push({
                cumulative: odds,
                components: componentOdds
            });

            drawIndex += 1;
            return false;
        }

        if (influenceIndex + 1 < influences.length) {
            influenceIndex += 1;

            influenceCard = influences[influenceIndex];
            influence = influenceCard[0];
            oddsResult.push({
                power: influence.power,
                odds: []
            });
            drawIndex = minDraws;

            return false;
        }

        return true;
    }

    /*
        Called when the browser is idle.  Perform work for a fixed
        amount of time.  If the odds have been completed, call the
        completion callback.
    */
    function workCallback() {
        var startTime, now, done;

        worker.timeoutId = undefined;
        startTime = performance.now();
        now = startTime;
        done = false;

        while (!done && now - startTime < maxWorkTime) {
            done = computeStep();
            now = performance.now();
        }

        if (computeStep()) {
            onOddsComplete(oddsResult);
        } else {
            worker.timeoutId = setTimeout(workCallback);
        }
    }

    /*  Cancel this worker  */
    worker.cancel = function () {
        if (worker.timeoutId) {
            clearTimeout(worker.timeoutId);
            worker.timeoutId = undefined;
        }
    };

    worker.timeoutId = setTimeout(workCallback);

    return worker;
}


/*
    Add the text and icons representing an influence requirement
    to a table cell
*/
function addInfluenceDisplay(
    cell,
    influence,
    iconSize
) {
    var i;

    /*  Append an influence icon to the influence cell of the table  */
    function appendInfluenceImage(
        cell,
        imageFile
    ) {
        $("<img>").addClass("power-table-influence-icon")
            .attr("src", imageFile)
            .attr("width", iconSize)
            .attr("height", iconSize)
            .appendTo(cell);
    }

    if (influence.power > 0) {
        cell.text(String(influence.power));
    }

    for (i = 0; i < influence.fire; i += 1) {
        appendInfluenceImage(cell, "icon-fire.png");
    }

    for (i = 0; i < influence.time; i += 1) {
        appendInfluenceImage(cell, "icon-time.png");
    }

    for (i = 0; i < influence.justice; i += 1) {
        appendInfluenceImage(cell, "icon-justice.png");
    }

    for (i = 0; i < influence.primal; i += 1) {
        appendInfluenceImage(cell, "icon-primal.png");
    }

    for (i = 0; i < influence.shadow; i += 1) {
        appendInfluenceImage(cell, "icon-shadow.png");
    }
}

/*
    Construct an object which can generate HTML tables with odds of
    drawing cards from a deck.

    We need a text list of all possible cards to get started.
*/
function generateOddsTable(
    tableCostDiv,
    tableOddsDiv,
    cardLibrary,
    deck
) {
    var minDraws, maxDraws, iconSize;

    minDraws = 7;
    maxDraws = 27;
    iconSize = 20;

    /*
        Generate the cost label table describing the rows of
        the power odds table.
    */
    function generateCostRows(
        table,
        deck
    ) {
        var influenceCards, row;

        row = $("<tr>").addClass("power-table-row-head").appendTo(table);
        $("<th>").addClass("power-table-head-draws").
            text("Turns").appendTo(row);

        influenceCards = deck.listInfluenceRequirements();
        $.each(influenceCards, function (index, influenceCard) {
            var influence, th, popup, content, cards, lastName;

            influence = influenceCard[0];
            cards = influenceCard[1].slice();

            row = $("<tr>").addClass("power-table-row-body").appendTo(table);
            th = $("<th>").addClass("power-table-influence").appendTo(row);
            content = $("<div>").appendTo(th);
            addInfluenceDisplay(content, influence, iconSize);

            popup = $("<div>")
                .addClass("ui popup center")
                .appendTo(th);
            content.popup({
                position: "top center"
            });

            cards.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            $.each(cards, function (index, card) {
                if (card.name === lastName) {
                    return;
                }

                $("<div>").addClass("table-cost-popup-content")
                    .text(card.name).appendTo(popup);
                lastName = card.name;
            });
        });
    }

    /*
        Generate the content for a popup describing the odds of
        each component of the influence requirement associated
        with a cell of the table.
    */
    function generateComponentsPopup(
        popup,
        components
    ) {
        var div;
        $.each(components, function (index, componentOdds) {
            var text, oddsText, component;

            component = componentOdds.component;
            oddsText = String(Math.floor(componentOdds.odds * 100));

            if (component.power > 0) {
                text = " Power";
            } else {
                text = "";
            }
            text += " - " + oddsText + "%";

            div = $("<div>").appendTo(popup);
            addInfluenceDisplay(
                $("<span>").appendTo(div),
                component,
                iconSize
            );
            $("<span>").text(text).appendTo(div);
        });
    }

    /*
        After the odds worker has completed computing the odds, finish
        the table by filling in the computed values.
    */
    function generateTableRowsBody(
        table,
        oddsValues
    ) {
        /*  Add the body cells  */
        $.each(oddsValues, function (index, influenceRow) {
            var oddsRow, power;

            power = 0;
            oddsRow = $("<tr>")
                .addClass("power-table-row-body")
                .appendTo(table);
            power = influenceRow.power;

            $.each(influenceRow.odds, function (index, odds) {
                var oddsText, td, text, popup, popupContent;

                oddsText = Math.floor(odds.cumulative * 100) + "%";
                td = $("<td>").addClass("power-table-odds").appendTo(oddsRow);
                text = $("<div>").text(oddsText).appendTo(td);

                if (odds.components.length) {
                    td.bind("mouseenter", function () {
                        popup = $("<div>")
                            .text("Influence Odds")
                            .addClass("ui popup center odds-popup")
                            .appendTo(td);
                        $("<div>").addClass("ui divider").appendTo(popup);
                        popupContent = $("<div>")
                            .addClass("odds-popup-content")
                            .appendTo(popup);

                        generateComponentsPopup(popupContent, odds.components);

                        text.popup({
                            position: "top center"
                        });
                    });
                    td.bind("mouseleave", function () {
                        text.popup("hide");
                        text.popup("destroy");

                        text.remove("popup");
                    });
                }

                /*
                    Darken the cells where we typically won't have enough
                    draws for the power requirements.
                */
                if (index + 1 < power) {
                    td.addClass("power-table-odds-shaded");
                }
            });
        });

        tableCostDiv.css("display", "inline");
        tableOddsDiv.css("display", "inline");
        $("#power-table-loader").removeClass("active");
    }

    /*
        Compute the odds for each draw count in the range, 
        for each influence requirement from the deck, and 
        fill out the table with those values.
    */
    function generateTableRows(
        table,
        deck
    ) {
        var text, row, drawCount;

        row = $("<tr>").addClass("power-table-row-head").appendTo(table);

        /*  Add the heading cells  */
        for (drawCount = minDraws;
                drawCount <= maxDraws;
                drawCount += 1) {

            text = String(drawCount - minDraws + 1);

            $("<th>").addClass("power-table-head-draw-count").
                text(text).appendTo(row);
        }

        function onOdds(oddsValues) {
            generateTableRowsBody(table, oddsValues);
        }

        $("#power-table-loader").addClass("active");
        return makeOddsWorker(deck, minDraws, maxDraws, onOdds);
    }

    /*
        Generate the odds table from a new decklist.
    */
    function generateTable() {
        var costTable, oddsTable, worker;

        if (cardLibrary.makeError) {
            return;
        }

        if (deck.makeError) {
            return;
        }

        costTable = $("<table>").addClass("power-table");
        generateCostRows(costTable, deck);

        oddsTable = $("<table>").addClass("power-table");
        worker = generateTableRows(oddsTable, deck);

        tableCostDiv.empty().append(costTable);
        tableOddsDiv.empty().append(oddsTable);

        tableCostDiv.css("display", "none");
        tableOddsDiv.css("display", "none");

        return worker;
    }

    return generateTable();
}
