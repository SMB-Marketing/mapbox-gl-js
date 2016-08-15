'use strict';

module.exports = {
    shapeText: shapeText,
    shapeIcon: shapeIcon
};


// The position of a glyph relative to the text's anchor point.
function PositionedGlyph(codePoint, x, y, glyph) {
    this.codePoint = codePoint;
    this.x = x;
    this.y = y;
    this.glyph = glyph;
}

// A collection of positioned glyphs and some metadata
function Shaping(positionedGlyphs, text, top, bottom, left, right) {
    this.positionedGlyphs = positionedGlyphs;
    this.text = text;
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
}

function shapeText(text, glyphs, maxWidth, lineHeight, horizontalAlign, verticalAlign, justify, spacing, translate) {

    var positionedGlyphs = [];
    var shaping = new Shaping(positionedGlyphs, text, translate[1], translate[1], translate[0], translate[0]);

    // the y offset *should* be part of the font metadata
    var yOffset = -17;

    var x = 0;
    var y = yOffset;

    for (var i = 0; i < text.length; i++) {
        var codePoint = text.charCodeAt(i);
        var glyph = glyphs[codePoint];

        if (!glyph) continue;

        positionedGlyphs.push(new PositionedGlyph(codePoint, x, y, glyph));
        x += glyph.advance + spacing;
    }

    if (!positionedGlyphs.length) return false;

    linewrap(shaping, glyphs, lineHeight, maxWidth, horizontalAlign, verticalAlign, justify, translate);

    return shaping;
}

var invisible = {
    0x20:   true, // space
    0x200b: true  // zero-width space
};

// var breakableCJK = [
//     0x0028, // dollar sign
//     0x24, // left parenthesis
//     0xA3, // english pound sign
//     0xA5, // rmb sign
//     0xB7, // dot
//     0x2018, // left single quotation
//     0x22, // quotation mark
//     0x3008, // left angle bracket
//     0x300A, // left angle double bracket
//     0x300C, // left corner bracket
//     0x300E,
//     0x3010,
//     0x3014,
//     0x3016,
//     0x301D,
//     0xFE59,
//     0xFE5B,
//     0xFF04,
//     0xFF08,
//     0xFF0E,
//     0xFF3B,
//     0xFF5B,
//     0xFFE1,
//     0xFFE5,
//     0x200b // zero-width space
// ];

var breakableCJK = {
    0x20:   true, // space
    0x0028: true, // dollar sign
    0x24: true,
    0xA3: true, // english pound sign
    0xA5: true, // rmb sign
    0xB7: true, // dot
    0x2018: true, // left single quotation
    0x22: true, // quotation mark
    0x3002: true,
    65374: true,
    0x3008: true, // left angle bracket
    0x300A: true, // left angle double bracket
    0x300C: true, // left corner bracket
    0x300E: true,
    0x3010: true,
    0x3014: true,
    0x3016:true,
    0x301D: true,
    0xFE59: true,
    0xFE5B: true,
    0xFF04:true,
    0xFF08: true,
    0xFF0E: true,
    0xFF3B: true,
    0xFF5B: true,
    0xFFE1: true,
    0xFFE5: true,
    0x200b: true,
    0x897F: true
     // zero-width space
};

function linewrap(shaping, glyphs, lineHeight, maxWidth, horizontalAlign, verticalAlign, justify, translate) {
    var lastSafeBreak = null;

    var lengthBeforeCurrentLine = 0;
    var lineStartIndex = 0;
    var line = 0;

    var maxLineLength = 0;

    var positionedGlyphs = shaping.positionedGlyphs;

    if (maxWidth) {

        var wordLength = positionedGlyphs.length;

        // lastSafeBreak = Math.round(wordLength/2);

        for (var i = 0; i < positionedGlyphs.length; i++) {
            var positionedGlyph = positionedGlyphs[i];

            positionedGlyph.x -= lengthBeforeCurrentLine;
            positionedGlyph.y += lineHeight * line;

            if (positionedGlyph.x > maxWidth && lastSafeBreak !== null) {

                var lineLength = positionedGlyphs[lastSafeBreak + 1].x;
                maxLineLength = Math.max(lineLength, maxLineLength);

                for (var k = lastSafeBreak + 1; k <= i; k++) {
                    positionedGlyphs[k].y += lineHeight;
                    positionedGlyphs[k].x -= lineLength;
                }

                if (justify) {
                    // Collapse invisible characters.
                    var lineEnd = lastSafeBreak;
                    if (invisible[positionedGlyphs[lastSafeBreak].codePoint]) {
                        lineEnd--;
                    }

                    justifyLine(positionedGlyphs, glyphs, lineStartIndex, lineEnd, justify);
                }

                lineStartIndex = lastSafeBreak + 1;
                lastSafeBreak = null;
                lengthBeforeCurrentLine += lineLength;
                line++;
            }

            // if (breakableCJK[positionedGlyph.codePoint]) {
            //     lastSafeBreak = i - 1;
            // }
            // lastSafeBreak = Math.round(wordLength / 3);

            // if (!breakableCJK[positionedGlyph.codePoint]) {
            //     lastSafeBreak = Math.round(wordLength / 3);
            // } else if (breakableCJK[positionedGlyph.codePoint]) {
            //     lastSafeBreak = i - 1;
            // } else {
            //     lastSafeBreak = Math.round(wordLength / 4);
            // }

            if (breakableCJK[positionedGlyph.codePoint]) {
                lastSafeBreak = i - 1;
            }
            if (!(breakableCJK[positionedGlyph.codePoint]) && positionedGlyph.codePoint > 19968) {
                    lastSafeBreak = Math.round(wordLength / 3);
            }
            // 16.95/31.24019/121.48622
            // else {
            //     lastSafeBreak = (Math.round(wordLength / 3));
            // }

            // if (positionedGlyph.codePoint > 19968) {
                // console.log(positionedGlyph.codePoint)
                // lastSafeBreak = (Math.round(wordLength / 3));
            // }

            // console.log(typeof breakableCJK)
            // if (breakableCJK.indexOf(positionedGlyph.codePoint) === 0) {
            //     lastSafeBreak = i - 1;
            // }
            //
            // if (breakableCJK.indexOf(positionedGlyph.codePoint) !=== 0) {
            //     lastSafeBreak = Math.round(wordLength / 2);
            // }

        }

    }

    var lastPositionedGlyph = positionedGlyphs[positionedGlyphs.length - 1];
    var lastLineLength = lastPositionedGlyph.x + glyphs[lastPositionedGlyph.codePoint].advance;
    maxLineLength = Math.max(maxLineLength, lastLineLength);

    var height = (line + 1) * lineHeight;

    justifyLine(positionedGlyphs, glyphs, lineStartIndex, positionedGlyphs.length - 1, justify);
    align(positionedGlyphs, justify, horizontalAlign, verticalAlign, maxLineLength, lineHeight, line, translate);

    // Calculate the bounding box
    shaping.top += -verticalAlign * height;
    shaping.bottom = shaping.top + height;
    shaping.left += -horizontalAlign * maxLineLength;
    shaping.right = shaping.left + maxLineLength;
}

function justifyLine(positionedGlyphs, glyphs, start, end, justify) {
    var lastAdvance = glyphs[positionedGlyphs[end].codePoint].advance;
    var lineIndent = (positionedGlyphs[end].x + lastAdvance) * justify;

    for (var j = start; j <= end; j++) {
        positionedGlyphs[j].x -= lineIndent;
    }

}

function align(positionedGlyphs, justify, horizontalAlign, verticalAlign, maxLineLength, lineHeight, line, translate) {
    var shiftX = (justify - horizontalAlign) * maxLineLength + translate[0];
    var shiftY = (-verticalAlign * (line + 1) + 0.5) * lineHeight + translate[1];

    for (var j = 0; j < positionedGlyphs.length; j++) {
        positionedGlyphs[j].x += shiftX;
        positionedGlyphs[j].y += shiftY;
    }
}


function shapeIcon(image, layout) {
    if (!image || !image.rect) return null;

    var dx = layout['icon-offset'][0];
    var dy = layout['icon-offset'][1];
    var x1 = dx - image.width / 2;
    var x2 = x1 + image.width;
    var y1 = dy - image.height / 2;
    var y2 = y1 + image.height;

    return new PositionedIcon(image, y1, y2, x1, x2);
}

function PositionedIcon(image, top, bottom, left, right) {
    this.image = image;
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
}
