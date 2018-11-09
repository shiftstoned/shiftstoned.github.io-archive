/*global $, window, document*/
/*global makeInfluence, addInfluenceDisplay*/
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
    Make an object to track the mouse position, and show a popup
    with the influence odds when it hovers near a dot on the graph.
*/
function makeGraphPopupTracker() {
    var tracker,
        graphPopupAnchor,
        graphPopup,
        popupDot,
        graphDots,
        maxDistance,
        mergeDistance;

    tracker = {};
    maxDistance = 25;
    mergeDistance = 12;

    /*
        If a popup is currently active, hide it
    */
    function hideGraphPopup(
        event
    ) {
        if (graphPopupAnchor) {
            graphPopupAnchor.popup("destroy");
            graphPopupAnchor.remove();
            graphPopup.remove();
            popupDot = undefined;
        }
    }

    /*
        Find the graph dots closest to the given position on the
        graph.  Return a list of dots sorted by distance, with
        closest first.
    */
    function findCloseDots(
        pos
    ) {
        var maxDist2, dots, bestDot, bestDist2;

        function calculateDistance2(
            dot,
            point
        ) {
            var dx, dy;

            dx = point.x - dot.pos.x;
            dy = point.y - dot.pos.y;

            return dx * dx + dy * dy;
        }

        /*  Find the closest dot  */
        maxDist2 = maxDistance * maxDistance;
        bestDist2 = maxDist2;
        $.each(graphDots, function (index, dot) {
            var dist2;

            dist2 = calculateDistance2(dot, pos);
            if (dist2 < bestDist2) {
                bestDist2 = dist2;
                bestDot = dot;
            }
        });

        if (!bestDot) {
            return [];
        }

        /*  Find all dots within a fixed distance of the closest dot  */
        dots = [];
        $.each(graphDots, function (index, dot) {
            var dist2;

            dist2 = calculateDistance2(dot, bestDot.pos);
            if (dist2 < mergeDistance * mergeDistance) {
                dots.push(dot);
            }
        });

        /*  Sort retuned dots by distance  */
        dots.sort(function (a, b) {
            if (a.pos.y !== b.pos.y) {
                return a.pos.y - b.pos.y;
            }

            return a.pos.x - b.pos.x;
        });

        return dots;
    }

    /*
        Fill out the content of a graph popup with information
        from a list of dots close to the mouse location
    */
    function generatePopupContent(
        popup,
        dots
    ) {
        var header, oddsStr;

        $.each(dots, function (index, dot) {
            var names;

            if (index > 0) {
                $("<div>").addClass("ui divider").appendTo(popup);
            }

            header = $("<div>")
                .addClass("power-graph-popup-odds").appendTo(popup);

            addInfluenceDisplay(
                $("<span>").appendTo(header),
                dot.influence,
                20
            );
            oddsStr = " - " + String(Math.floor(dot.odds * 100)) + "%";
            $("<span>").text(oddsStr).appendTo(header);

            names = [];
            $.each(dot.cards, function (index, card) {
                names.push(card.name);
            });

            names.sort();
            $.each(names, function (index, name) {
                $("<div>").addClass("power-graph-popup-cards")
                    .text(name).appendTo(popup);
            });
        });
    }

    /*
        Show a dot popup on the closest location on the graph
        to the given position.
    */
    function showGraphPopup(
        container,
        pos
    ) {
        var anchor, popup, dots, firstDot;

        dots = findCloseDots(pos);
        if (!dots.length) {
            hideGraphPopup();
            return;
        }

        /*
            If we are already showing the popup for the closest dot,
            don't regenerate it to avoid flickering.
        */
        firstDot = dots[0];
        if (firstDot === popupDot) {
            return;
        }

        container = $("#power-graph-div");
        anchor = $("<div>")
            .addClass("power-graph-popup-anchor")
            .appendTo(container);
        popup = $("<div>")
            .addClass("power-graph-popup ui custom popup hidden")
            .appendTo(container);

        generatePopupContent(popup, dots);

        anchor.css("position", "absolute")
            .css("left", String(firstDot.pos.x) + "px")
            .css("top", String(firstDot.pos.y) + "px");
        anchor.popup({
            on: "",
            position: "top center"
        });

        hideGraphPopup();
        anchor.popup("show");
        graphPopupAnchor = anchor;
        graphPopup = popup;
        popupDot = firstDot;
    }

    /*
        When the mouse moves, translate the mouse position
        to a position relative to the graph, and then show
        a popup if close enough to any of the dots on the graph.
    */
    function onMouseMove(
        event
    ) {
        var container, graphX, graphY, graphOffset;

        container = $("#power-graph-div");
        graphOffset = container.offset();
        graphX = event.clientX + window.pageXOffset - graphOffset.left;
        graphY = event.clientY + window.pageYOffset - graphOffset.top;

        if (!container.is(":visible")) {
            hideGraphPopup();
        } else if (graphX < 0 || graphX >= container.width() ||
                graphY < 0 || graphY >= container.height()) {
            hideGraphPopup();
        } else {
            showGraphPopup(container, { x: graphX, y: graphY });
        }
    }

    /*
        Store a new set of dots.  To be called when the graph
        is regenerated.
    */
    tracker.setGraphDots = function (
        dots
    ) {
        graphDots = dots;
    };

    $(document).bind("mousemove", onMouseMove);

    return tracker;
}

/*  Draw a graph of influence component odds on a canvas element  */
function drawPowerGraph(
    container,
    graphStyle,
    deck
) {
    var ctx,
        canvas,
        canvasWidth,
        canvasHeight,
        drawnDots,
        graphCoord,
        influenceTurns,
        allInfluenceTurns,
        minValue,
        minDraws,
        maxDraws,
        horizontalMidlineStep,
        verticalMidlineStep,
        labels;

    /*
        Examine all cards in the decklist and list all unique influence
        amounts paired with the turns corresponding to the power value
        of their cards
    */
    function listAllInfluenceTurns() {
        var componentPairs, ret;

        componentPairs = {};
        ret = [];

        $.each(deck.cards, function (index, card) {
            var components, turn;

            if (card.influenceRequirements.length < 1) {
                return;
            }

            turn = card.influenceRequirements[0].power;
            if (turn < 1) {
                turn = 1;
            }

            components = card.influenceRequirements[0].listComponents();

            $.each(components, function (index, component) {
                var componentStr, componentPair, influenceTurn;

                if (component.power > 0) {
                    return;
                }

                componentStr = component.toString();
                componentPair = componentStr + "," + String(turn);
                if (!componentPairs.hasOwnProperty(componentPair)) {
                    influenceTurn = {
                        influence: component,
                        turn: turn,
                        cards: [card]
                    };

                    componentPairs[componentPair] = influenceTurn;
                    ret.push(influenceTurn);
                } else {
                    influenceTurn = componentPairs[componentPair];

                    if (influenceTurn.cards.indexOf(card) < 0) {
                        componentPairs[componentPair].cards.push(card);
                    }
                }
            });
        });

        return ret;
    }

    /*
        Filter the list of influence-turns such that only the lowest
        turn for each influence is returned
    */
    function listInfluenceTurns() {
        var componentTurns, ret;

        componentTurns = {};

        $.each(listAllInfluenceTurns(), function (index, influenceTurn) {
            var influenceStr, turn;

            influenceStr = influenceTurn.influence.toString();
            turn = influenceTurn.turn;

            /*
                If the influence has already been encountered, only
                update the turn value if it is earlier.
            */
            if (componentTurns.hasOwnProperty(influenceStr)) {
                if (turn < componentTurns[influenceStr]) {
                    componentTurns[influenceStr] = turn;
                }
            } else {
                componentTurns[influenceStr] = turn;
            }
        });

        ret = [];
        $.each(Object.keys(componentTurns), function (index, componentStr) {
            var influenceTurn = {
                influence: makeInfluence(componentStr),
                turn: componentTurns[componentStr]
            };

            ret.push(influenceTurn);
        });

        return ret;
    }

    /*  Draw a label along the left side of the graph  */
    function drawLeftLabel(
        label,
        y
    ) {
        var drawX, drawY, textSize;

        textSize = ctx.measureText(label);
        drawX = graphCoord.left - textSize.width - 12;
        drawY = y + graphStyle.fontSize / 2;
        ctx.fillText(label, drawX, drawY);
    }

    /*  Draw a label along the bottom of the graph  */
    function drawBottomLabel(
        label,
        x,
        yOffset
    ) {
        var drawX, drawY, textSize;

        textSize = ctx.measureText(label);
        drawX = x - textSize.width / 2;
        drawY = canvasHeight + yOffset;
        ctx.fillText(label, drawX, drawY);
    }

    /*  Draw the graph outline  */
    function drawOutline() {
        var midline, frac, midpos;

        ctx.save();
        ctx.fillStyle = graphStyle.backgroundColor;
        ctx.beginPath();
        ctx.moveTo(graphCoord.left, graphCoord.top);
        ctx.lineTo(graphCoord.left, graphCoord.bottom);
        ctx.lineTo(graphCoord.right, graphCoord.bottom);
        ctx.lineTo(graphCoord.right, graphCoord.top);
        ctx.lineTo(graphCoord.left, graphCoord.top);
        ctx.fill();

        ctx.strokeStyle = graphStyle.interiorLineColor;
        ctx.lineWidth = 0.75;

        /*  Draw the horizontal intermediate lines  */
        midline = 1.0 - horizontalMidlineStep;
        while (midline > minValue) {
            frac = (midline - minValue) / (1.0 - minValue);
            midpos = graphCoord.bottom +
                frac * (graphCoord.top - graphCoord.bottom);

            ctx.beginPath();
            ctx.moveTo(graphCoord.left, midpos);
            ctx.lineTo(graphCoord.right, midpos);
            ctx.stroke();

            midline = midline - horizontalMidlineStep;
        }

        /*  Draw the vertical intermediate lines  */
        midline = minDraws;
        while (midline <= maxDraws) {
            frac = (midline - minDraws) / (maxDraws - minDraws);
            midpos = graphCoord.left +
                frac * (graphCoord.right - graphCoord.left);

            ctx.beginPath();
            ctx.moveTo(midpos, graphCoord.top);
            ctx.lineTo(midpos, canvasHeight - graphStyle.fontSize - 6);
            ctx.stroke();

            midline += verticalMidlineStep;
        }

        ctx.strokeStyle = graphStyle.borderColor;
        ctx.beginPath();
        ctx.moveTo(graphCoord.left, graphCoord.top);
        ctx.lineTo(graphCoord.left, graphCoord.bottom);
        ctx.lineTo(graphCoord.right, graphCoord.bottom);
        ctx.lineTo(graphCoord.right, graphCoord.top);
        ctx.lineTo(graphCoord.left, graphCoord.top);
        ctx.stroke();

        ctx.restore();
    }

    /*  Add the labels for the extents of the graph  */
    function addGraphLabels() {
        var midline, percent, x, y;

        midline = 1.0;
        while (midline > minValue) {
            y = graphCoord.bottom +
                (midline - minValue) / (1.0 - minValue) *
                (graphCoord.top - graphCoord.bottom);
            percent = Math.round(100 * midline);
            drawLeftLabel(String(percent) + "%", y);

            midline = midline - horizontalMidlineStep * 2;
        }

        midline = minDraws;
        while (midline <= maxDraws) {
            x = graphCoord.left +
                (midline - minDraws) / (maxDraws - minDraws) *
                (graphCoord.right - graphCoord.left);
            drawBottomLabel(String(midline - 6), x, 0);

            midline += verticalMidlineStep;
        }

    }

    /*  Draw the icons representing the influence requirements  */
    function drawInfluenceIcons(
        influence,
        x,
        y
    ) {
        var text, i, img;

        if (influence.power > 0) {
            text = String(influence.power);
            ctx.fillText(text, x, y);
            x += ctx.measureText(text).width;
        }

        img = $("#icon-fire").get(0);
        for (i = 0; i < influence.fire; i += 1) {
            ctx.drawImage(img, x, y - graphStyle.iconSize, graphStyle.iconSize, graphStyle.iconSize);
            x += graphStyle.iconSize;
        }

        img = $("#icon-time").get(0);
        for (i = 0; i < influence.time; i += 1) {
            ctx.drawImage(img, x, y - graphStyle.iconSize, graphStyle.iconSize, graphStyle.iconSize);
            x += graphStyle.iconSize;
        }

        img = $("#icon-justice").get(0);
        for (i = 0; i < influence.justice; i += 1) {
            ctx.drawImage(img, x, y - graphStyle.iconSize, graphStyle.iconSize, graphStyle.iconSize);
            x += graphStyle.iconSize;
        }

        img = $("#icon-primal").get(0);
        for (i = 0; i < influence.primal; i += 1) {
            ctx.drawImage(img, x, y - graphStyle.iconSize, graphStyle.iconSize, graphStyle.iconSize);
            x += graphStyle.iconSize;
        }

        img = $("#icon-shadow").get(0);
        for (i = 0; i < influence.shadow; i += 1) {
            ctx.drawImage(img, x, y - graphStyle.iconSize, graphStyle.iconSize, graphStyle.iconSize);
            x += graphStyle.iconSize;
        }
    }

    function getInfluenceColor(
        influence
    ) {
        var solidColor, translucentColor;

        solidColor = "rgb(0, 0, 0)";
        translucentColor = "rgba(0, 0, 0, 0.3)";

        /*  Color the curve according to influence type  */
        if (influence.fire > 0) {
            solidColor = graphStyle.fireColorSolid;
            translucentColor = graphStyle.fireColorTranslucent;
        } else if (influence.time > 0) {
            solidColor = graphStyle.timeColorSolid;
            translucentColor = graphStyle.timeColorTranslucent;
        } else if (influence.justice > 0) {
            solidColor = graphStyle.justiceColorSolid;
            translucentColor = graphStyle.justiceColorTranslucent;
        } else if (influence.primal > 0) {
            solidColor = graphStyle.primalColorSolid;
            translucentColor = graphStyle.primalColorTranslucent;
        } else if (influence.shadow > 0) {
            solidColor = graphStyle.shadowColorSolid;
            translucentColor = graphStyle.shadowColorTranslucent;
        }

        return {
            solid: solidColor,
            translucent: translucentColor
        };
    }

    /*
        Draw a small dot along one of the graph curves to represent
        a card at with a particular influence and power cost, where
        the card isn't the lowest power cost with that influence.
    */
    function drawInfluenceDot(
        influence,
        pos
    ) {
        var influenceColor;

        influenceColor = getInfluenceColor(influence);

        ctx.save();
        ctx.fillStyle = influenceColor.solid;
        ctx.strokeStyle = "rgb(51, 51, 51)";

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, graphStyle.dotSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /*
        Given an influence and turn number, return an influenceTurn
        structure describing the cards with that influence and power
        cost, if any.
    */
    function findInfluenceTurn(
        influence,
        turn
    ) {
        var ret = null;

        $.each(allInfluenceTurns, function (index, influenceTurn) {
            if (!influenceTurn.influence.equals(influence)) {
                return;
            }

            if (influenceTurn.turn !== turn) {
                return;
            }

            ret = influenceTurn;
        });

        return ret;
    }

    /*  Graph the graph curve for the odds of one influence component  */
    function drawInfluenceCurve(
        influence,
        startDraw
    ) {
        var odds,
            oddsY,
            draws,
            dots,
            x,
            y,
            startX,
            startY,
            fx,
            influenceTurn,
            colors;

        ctx.save();

        colors = getInfluenceColor(influence);

        ctx.strokeStyle = colors.solid;
        ctx.fillStyle = colors.translucent;

        /*  Draw the curve  */
        ctx.beginPath();
        ctx.lineWidth = 1.5;

        dots = [];
        for (draws = startDraw; draws <= maxDraws; draws += 1) {
            odds = deck.drawOdds(draws, influence);
            oddsY = (odds - minValue) / (1.0 - minValue);

            fx = (draws - minDraws) / (maxDraws - minDraws);
            x = graphCoord.left +
                fx * (graphCoord.right - graphCoord.left);
            y = graphCoord.bottom +
                oddsY * (graphCoord.top - graphCoord.bottom);

            if (draws === startDraw) {
                startX = x;
                startY = y;
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            influenceTurn = findInfluenceTurn(influence, draws - 6);
            if (influenceTurn) {
                dots.push({
                    influence: influence,
                    pos: { x: x, y: y },
                    draws: draws - 7,
                    odds: odds,
                    cards: influenceTurn.cards
                });
            }
        }
        ctx.stroke();

        ctx.lineTo(x, graphCoord.bottom);
        ctx.lineTo(startX, graphCoord.bottom);
        ctx.lineTo(startX, startY);
        ctx.fill();
        ctx.restore();

        return dots;
    }

    /*  Draw the icons or text next to the influence curve it represents  */
    function drawInfluenceLabel(
        influence,
        pos
    ) {
        var x, y, iconSize;

        /*  Adjust for the text size  */
        iconSize = graphStyle.iconSize * influence.toString().length;
        x = pos.x - iconSize / 2;
        y = pos.y + graphStyle.iconSize / 2;
        drawInfluenceIcons(influence, x, y);
    }

    /*  Draw all previously collected influence label icons  */
    function drawInfluenceLabels() {
        var prevX, prevY, minDist;

        minDist = 12;

        /*
            Sort the labels by screen position to provide a consistent
            appearance to overlapping labels.
        */
        labels.sort(function (a, b) {
            var aPos, bPos, dx, dy;

            aPos = a.pos;
            bPos = b.pos;

            dx = aPos.x - bPos.x;
            dy = aPos.y - bPos.y;

            if (dx) {
                return dx;
            }

            if (dy) {
                return dy;
            }
        });

        prevX = 0;
        prevY = 0;

        $.each(labels, function (index, label) {
            var x, y;

            x = label.pos.x;
            y = label.pos.y;

            /*
                If a label is very close to the previously drawn label,
                adjust its position to be a minimum distance away.
            */
            if (x === prevX && y - prevY < minDist) {
                y = prevY + minDist;
            }

            drawInfluenceLabel(label.influence, {
                x: x,
                y: y
            });

            prevX = x;
            prevY = y;
        });
    }

    /*  Queue an influence label to be drawn later  */
    function addInfluenceLabel(
        influence,
        turn
    ) {
        var pos, mid, odds, oddsY, fx, x, y;

        /*  Compute the coordinates for the label  */
        pos = (turn - 1) / (maxDraws - minDraws);
        mid = Math.floor(minDraws + pos * (maxDraws - minDraws));
        odds = deck.drawOdds(mid, influence);
        oddsY = (odds - minValue) / (1.0 - minValue);
        fx = (mid - minDraws) / (maxDraws - minDraws);
        x = graphCoord.left + fx * (graphCoord.right - graphCoord.left);
        y = graphCoord.bottom + oddsY * (graphCoord.top - graphCoord.bottom);

        labels.push({
            influence: influence,
            pos: {
                x: x,
                y: y
            },
        });
    }

    /*  Draw all of the influence component curves  */
    function drawComponentCurves() {
        var dots;

        dots = [];
        $.each(influenceTurns, function (index, influenceTurn) {
            var newDots;

            newDots = drawInfluenceCurve(
                influenceTurn.influence,
                minDraws + influenceTurn.turn - 1
            );

            dots = dots.concat(newDots);
        });

        $.each(dots, function (index, dot) {
            drawInfluenceDot(dot.influence, dot.pos);
        });
        drawnDots = dots;

        $.each(influenceTurns, function (index, influenceTurn) {
            addInfluenceLabel(
                influenceTurn.influence,
                influenceTurn.turn
            );
        });
    }


    /*
        Find the minimum probability of any of the component influences,
        and use that for the bottom value of the vertical axis
    */
    function findGraphExtents() {
        var odds, maxHorizMidLines, maxVertMidLines;

        minValue = 0;
        minDraws = 7;
        maxDraws = 15;
        maxHorizMidLines = 10;
        maxVertMidLines = 16;

        $.each(influenceTurns, function (index, influenceTurn) {
            var draws = influenceTurn.turn + minDraws - 1;

            odds = deck.drawOdds(draws, influenceTurn.influence);

            if (draws + 4 > maxDraws) {
                maxDraws = draws + 4;
            }
        });

        verticalMidlineStep = Math.ceil(
            (maxDraws - minDraws) / maxVertMidLines
        );
        horizontalMidlineStep = 0.1 * Math.ceil(
            (1.0 - minValue) * 10 / maxHorizMidLines
        );
    }

    /*  Generate the entire graph  */
    function drawOnCanvas() {
        /*  Set the back buffer size to be the same as the CSS size  */
        canvasWidth = canvas.width();
        canvasHeight = canvas.height();
        canvas.attr("width", canvasWidth);
        canvas.attr("height", canvasHeight);

        labels = [];

        ctx = canvas.get(0).getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        /*
            We'll need space around the edge for label text, so
            the actual graph will be drawn within these coordinates.
        */
        graphCoord = {
            left: graphStyle.marginLeft,
            top: graphStyle.fontSize / 2,
            right: canvasWidth - graphStyle.marginRight,
            bottom: canvasHeight - graphStyle.marginBottom
        };

        ctx.fillStyle = graphStyle.textColor;
        ctx.strokeStyle = graphStyle.textColor;
        ctx.font = String(graphStyle.fontSize) + "px " + graphStyle.font;
        ctx.lineWidth = 1;

        allInfluenceTurns = listAllInfluenceTurns();
        influenceTurns = listInfluenceTurns();
        findGraphExtents();
        drawOutline();
        addGraphLabels();

        drawComponentCurves();
        drawInfluenceLabels();
    }

    /*
        Add the canvas element, and generate the graph.
        Add hooks to redraw the graph if a new icon image is
        loaded.
    */
    function makeCanvas() {
        container.empty();
        canvas = $("<canvas>").addClass("power-graph-canvas")
            .appendTo(container);

        /*
            If any of the influence icons are still loading, we will need
            to regenerate the graph image when they finish
        */
        $("#icon-fire").bind("load", drawOnCanvas);
        $("#icon-time").bind("load", drawOnCanvas);
        $("#icon-justice").bind("load", drawOnCanvas);
        $("#icon-primal").bind("load", drawOnCanvas);
        $("#icon-shadow").bind("load", drawOnCanvas);
        drawOnCanvas();
    }

    makeCanvas();

    return drawnDots;
}
