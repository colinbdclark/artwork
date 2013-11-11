(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    /**
     * Sequences the playback of a colection of clips described by the "clipSequence" option
     */
    fluid.defaults("colin.clipSequencer", {
        gradeNames: ["fluid.modelComponent", "fluid.eventedComponent", "autoInit"],
    
        model: {
            clipIdx: 0,
            clipSequence: []
        },
    
        invokers: {
            start: {
                funcName: "colin.clipSequencer.start",
                args: [
                    "{that}.model",
                    "{that}.clock",
                    "{that}.layer",
                    "{that}.preRoller",
                    "{that}.events.onNextClip",
                    "{that}.options.loop"
                ]
            }
        },
    
        components: {
            clock: {
                type: "flock.scheduler.async"
            },
        
            layer: {},
        
            preRoller: {
                type: "aconite.video"
            }
        },
    
        events: {
            onSequenceReady: null,
            onReady: null,
            onNextClip: null
        },
        
        listeners: {
            onSequenceReady: {
                funcName: "{that}.events.onReady.fire"
            }
        },
    
        loop: false
    });

    colin.clipSequencer.swapClips = function (source, preRoller, inTime) {
        var displayEl = source.element,
            preRollEl = preRoller.element;
    
        preRollEl.currentTime = inTime === undefined ? 0 : inTime;
        preRollEl.play();
        displayEl.pause();
    
        source.element = preRollEl;
        preRoller.element = displayEl;
    };

    colin.clipSequencer.displayClip = function (layer, clip, preRoller, onNextClip) {
        onNextClip.fire(clip);
        colin.clipSequencer.swapClips(layer.source, preRoller, clip.inTime);
    };

    colin.clipSequencer.preRollClip = function (preRoller, clip) {
        var url = clip.url,
            inTime = clip.inTime;
        
        if (clip.inTime) {
            url = url + "#t=" + inTime + "," + (inTime + clip.duration);
        }
    
        preRoller.setURL(url);
    };

    colin.clipSequencer.nextClip = function (model, sequence, loop) {
        var nextIdx = model.clipIdx + 1;
        
        if (nextIdx >= sequence.length) {
            if (loop) {
                nextIdx = 0;
            } else {
                return;
            }
        }
    
        return sequence[nextIdx];
    };

    // TODO: Ridiculous arg list means ridiculous dependency structure.
    colin.clipSequencer.start = function (model, clock, layer, preRoller, onNextClip, loop) {
        var idx = model.clipIdx = 0,
            sequence = model.clipSequence;
        
        layer.source.element.play();
        colin.clipSequencer.scheduleNextClip(model, sequence, clock, layer, preRoller, onNextClip, loop);
    };

    colin.clipSequencer.scheduleNextClip = function (model, sequence, clock, layer, preRoller, onNextClip, loop) {
        var idx = model.clipIdx >= sequence.length ? 0 : model.clipIdx,
            nextClip = colin.clipSequencer.nextClip(model, sequence, loop),
            currentClip = sequence[idx];
    
        if (!nextClip) {
            return;
        }
    
        colin.clipSequencer.preRollClip(preRoller, nextClip);
        clock.once(currentClip.duration, function () {
            colin.clipSequencer.displayClip(layer, nextClip, preRoller, onNextClip);
            model.clipIdx++;
            colin.clipSequencer.scheduleNextClip(model, sequence, clock, layer, preRoller, onNextClip, loop);
        });
    };
    
    colin.clipSequencer.mergeClipParams = function (clipSequence, defaultParams) {
        return fluid.transform(clipSequence, function (clip) {
            var defaults = defaultParams[clip.url];
            return $.extend(true, clip, defaults);
        });
    };
    
    fluid.defaults("colin.clipSequencer.static", {
        gradeNames: ["colin.clipSequencer", "autoInit"],
        
        listeners: {
            onCreate: {
                funcName: "{that}.events.onSequenceReady.fire"
            }
        }
    });
    
    fluid.defaults("colin.clipSequencer.fcpxml", {
        gradeNames: ["colin.clipSequencer", "autoInit"],
        
        /*
        
        prologue: [],
        
        epilogue: [],
        
        {
            funcName: "colin.clipSequencer.fcpxml.prepareSequence",
            args: [
                "{arguments}.0", 
                "{fcpxml}.options.prologue", 
                "{fcpxml}.options.epilogue", 
                "{fcpxml}.events.onSequenceReady.fire"
            ]
        }*/
        
        components: {
            parser: {
                type: "colin.fcpxmlParser",
                options: {
                    listeners: {
                        afterParsed: {
                            funcName: "{fcpxml}.events.onSequenceReady.fire",
                            args: ["{arguments}.0"]
                        },
                        
                    }
                }
            }
        }
    });
    
    fluid.defaults("colin.clipSequencer.clipMerger", {
        gradeNames: ["colin.clipSequencer"],
        
        listeners: {
            onSequenceReady: [
                {
                    funcName: "{that}.applier.requestChange",
                    args: ["clipSequence", {
                        expander: {
                            funcName: "colin.clipSequencer.mergeClipParams",
                            args: ["{arguments}.0", "{that}.options.clipParams"]
                        }
                    }]
                },
                {
                    funcName: "{that}.events.onReady.fire"
                }
            ]
        }
    });
    
    fluid.defaults("colin.clipSequencer.fcpXmlMerger", {
        gradeNames: ["colin.clipSequencer.fcpxml", "colin.clipSequencer.clipMerger"],
        clipParams: colin.siriusHome.clipParameters
    });
    
    fluid.defaults("colin.clipSequencer.filteredSequencer", {
        gradeNames: ["colin.clipSequencer"],
        
        listeners: {
            onSequenceReady: [
                {
                    funcName: "{that}.applier.requestChange",
                    args: ["clipSequence", {
                        expander: {
                            funcName: "fluid.remove_if",
                            args: ["{arguments}.0", {
                                expander: {
                                    funcName: "fluid.getGlobalValue",
                                    args: ["{that}.options.filterFnName"]
                                }
                            }]
                        }
                    }]
                },
                {
                    funcName: "{that}.events.onReady.fire"
                }
            ]
        }
    });
    
    fluid.defaults("colin.siriusHome.lightOnlySequencer", {
        gradeNames: ["colin.clipSequencer.fcpxml", "colin.clipSequencer.filteredSequencer", "autoInit"],
        
        filterFnName: "colin.siriusHome.onlyLightFilter"
    });
    
    colin.siriusHome.onlyLightFilter = function (clip) {
        return clip.url.indexOf("/light/") < 0;
    };
    
}());
