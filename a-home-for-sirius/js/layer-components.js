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
        gradeNames: ["colin.clipSequencer.fcpXmlMerger", "autoInit"],
    
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
        gradeNames: ["colin.siriusHome.lightOnlySequencer", "autoInit"],
    
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
    
        loop: true
    });

}());
