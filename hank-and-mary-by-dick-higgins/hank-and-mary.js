(function () {
    "use strict";
    
    fluid.registerNamespace("higgins");
    
    fluid.defaults("higgins.words", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        model: {
            ipt: ["     ", " HANK", " SHOT", " MARY", " DEAD"],
            title: "\n                       HANK AND MARY, A LOVE STORY, A CHORALE\n\n",
            credit: "                                             BY DICK HIGGINS\n\n\n\n",
            line: []
        },
        
        listeners: {
            onCreate: [
                {
                    "this": "{that}.container",
                    method: "append",
                    args: ["{that}.model.title"]
                },
                {
                    "this": "{that}.container",
                    method: "append",
                    args: ["{that}.model.credit"]
                },
                {
                    funcName: "higgins.words.printPoem",
                    args: ["{that}.container", "{that}.model"]
                }
            ]
        }
    });
    
    higgins.words.printPoem = function (poemRegion, model) {
        var line = model.line,
            ipt = model.ipt;
        
        var j = 0;
        for (var n1 = 0; n1 < 5; n1++) {
            line[0] = ipt[n1];
            for (var n2 = 0; n2 < 5; n2++) {
                line[1] = ipt[n2];
                for (var n3 = 0; n3 < 5; n3++) {
                    line[2] = ipt[n3];
                    for (var n4 = 0; n4 < 5; n4++) {
                        line[3] = ipt[n4]
                        j++;
                        higgins.words.printLine(poemRegion, line, j);
                    }
                }
            }
        }
    };
    
    higgins.words.printLine = function (poemRegion, line, lineNumber) {
        var numberStr = "" + ((lineNumber % 10) - 1 ? "": lineNumber),
            lineStr = higgins.words.paddedString(numberStr, 6);
        
        lineStr += "    ";
        fluid.each(line, function (word) {
            lineStr += word;
        });
        lineStr += "\n";
        poemRegion.append(lineStr);
    };
    
    higgins.words.paddedString = function (str, length) {
        str = String(str);
        
        var numPads = length - str.length,
            togo = "";
        
        for (var i = 0; i < numPads; i++) {
            togo += " ";
        }
        
        return togo + str;
    };
    
}());
