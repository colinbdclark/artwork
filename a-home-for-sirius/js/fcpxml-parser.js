(function () {
    "use strict";
    
    fluid.registerNamespace("colin");

    fluid.defaults("colin.fcpxmlParser", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        xmlUrl: null,
        
        assetUrlMap: {
            base: "",
            prefix: ""
        },
        
        events: {
            onXmlFetched: null,
            afterParsed: null
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "colin.fcpxmlParser.fetch",
                    args: ["{that}.options.xmlUrl", "{that}.events.onXmlFetched.fire"]
                }
            ],
            
            onXmlFetched: {
                funcName: "colin.fcpxmlParser.parse",
                args: ["{arguments}.0", "{that}.options.assetUrlMap", "{that}.events.afterParsed.fire"]
            }
        }
    });

    colin.fcpxmlParser.fetch = function (xmlUrl, onXmlFetched) {
        jQuery.ajax({
            url: xmlUrl,
            method: "GET",
            success: function (data, textStatus, jqXHR) {
                onXmlFetched(jQuery(data))
            },
            dataType: "xml"
        });
    };
    
    colin.fcpxmlParser.parse = function (fcpXML, assetUrlMap, afterParsed) {
        var clipSequence = [];
        
        var clips = fcpXML.find("clip");
        fluid.each(clips, function (clip) {
            clip = jQuery(clip);
            var assetId = clip.find("video").attr("ref"),
                asset = fcpXML.find("asset#" + assetId),
                absoluteClipUrl = asset.attr("src"),
                urlBaseIdx = absoluteClipUrl.indexOf(assetUrlMap.base),
                relativeClipUrl = assetUrlMap.prefix + absoluteClipUrl.substring(urlBaseIdx),
                startAttr = clip.attr("start"),
                clipSpec = {
                    url: relativeClipUrl,
                    duration: colin.fcpxmlParser.parse.dur(clip.attr("duration"))
                };
            
            if (startAttr) {
                clipSpec.inTime = colin.fcpxmlParser.parse.dur(startAttr);
            }
            
            clipSequence.push(clipSpec);
        });
        
        afterParsed(clipSequence);
        
        return clipSequence;
    };
    
    colin.fcpxmlParser.parse.dur = function (durString) {
        var durEquation = durString.substring(0, durString.length - 1),
            operands = durEquation.split("/");
        
        return operands.length > 1 ? operands[0] / operands[1] : operands[0]; 
    };
    
}());
