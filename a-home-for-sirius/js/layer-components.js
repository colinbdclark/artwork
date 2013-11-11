(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    fluid.defaults("colin.siriusHome.layer", {
        gradeNames: ["aconite.compositableVideo"],
        members: {
            gl: "{glManager}.gl"
        },
        
        bindToTextureUnit: "TEXTURE0"
    });
    
    /*************
     * Top Layer *
     *************/
    
    fluid.defaults("colin.siriusHome.topLayer", {
        gradeNames: ["colin.siriusHome.layer", "autoInit"]
    });
    
    
    /***********************
     * Top Layer Sequencer *
     ***********************/
    
    fluid.defaults("colin.siriusHome.topSequencer", {
        gradeNames: ["colin.clipSequencer.fcpxml", "autoInit"],
    
        components: {
            parser: {
                options: {
                    xmlUrl: "videos/consolidated/a-home-for-sirius-basic-sequences.fcpxml",
        
                    assetUrlMap: {
                        base: "videos",
                        prefix: ""
                    }
                }
            },
            
            layer: {
                type: "colin.siriusHome.topLayer",
                options: {
                    components: {
                        source: {
                            options: {
                                url: "{topSequencer}.model.clipSequence.0.url"
                            }
                        }
                    }
                }
            }
        },
        
        listeners: {
            onReady: {
                funcName: "{layer}.source.setURL",
                args: ["{topSequencer}.model.clipSequence.0.url"]
            }
        }
    });

    
    /****************
     * Bottom Layer *
     ****************/
    
    fluid.defaults("colin.siriusHome.bottomLayer", {
        gradeNames: ["colin.siriusHome.layer", "autoInit"],
        bindToTextureUnit: "TEXTURE1"
    });
    
    
    /**************************
     * Bottom Layer Sequencer *
     **************************/
    
    fluid.defaults("colin.siriusHome.bottomSequencer", {
        gradeNames: ["colin.clipSequencer.static", "autoInit"],
    
        components: {
            layer: {
                type: "colin.siriusHome.bottomLayer",
                options: {
                    components: {
                        source: {
                            options: {
                                url: "{bottomSequencer}.options.clipSequence.0.url"
                            }
                        }
                    }
                }
            }
        },
    
        loop: true,
    
        model: {
            clipSequence: [
                {
                    url: "videos/light/steady/bedroom-light-720p.m4v",
                    duration: 53
                },
                {
                    url: "videos/light/window-plant-720p.m4v",
                    duration: 46
                },
                {
                    url: "videos/light/blanket-720p.mov",
                    duration: 20
                },
                {
                    url: "videos/light/window-dust-plant-pan-720p.m4v",
                    duration: 38
                },
                {
                    url: "videos/light/pan-across-plants.m4v",
                    inTime: 10,
                    duration: 25
                },
                {
                    url: "videos/light/vitamix-720p.mov",
                    duration: 240
                }
            ]
        }
    });

}());
