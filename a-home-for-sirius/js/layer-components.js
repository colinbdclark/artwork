(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    /*************
     * Top Layer *
     *************/
    
    fluid.defaults("colin.siriusHome.layers.top", {
        gradeNames: ["aconite.compositableVideo", "autoInit"],
        members: {
            gl: "{glManager}.gl"
        },
        
        components: {
            source: {
                options: {
                    url: "{sirius}.options.clipSequence.0.url"
                }
            }
        },
        
        bindToTextureUnit: "TEXTURE0"
    });
    
    
    /***********************
     * Top Layer Sequencer *
     ***********************/
    
    fluid.defaults("colin.siriusHome.clips.sirius", {
        gradeNames: ["colin.clipSequencer", "autoInit"],
    
        components: {
            layer: {
                type: "colin.siriusHome.layers.top"
            }
        },
    
        clipSequence: [
            {
                url: "videos/light/steady/bedroom-light-720p.m4v",
                duration: 10
            },
            {
                url: "videos/sirius/sirius-chair.m4v",
                duration: 15,
                values: {
                    mul: 0,
                    add: 0
                }
            },
        
            {
                url: "videos/light/steady/kitchen-tiles-720p.m4v",
                duration: 14,
                values: {
                    mul: 0.0,
                    add: 0.0
                }
            },
        
            {
                url: "videos/sirius/dying-plants-sirius-720p.mov",
                duration: 44,
                values: {
                    mul: 0.003,
                    add: 0.003,
                    phase: 0.5
                }
            },
        
            {
                url: "videos/sirius/sirius-fur-basement-720p.m4v",
                duration: 16,
                values: {
                    mul: 0.006,
                    add: 0.006
                }
            },
            {
                url: "videos/light/steady/steady-cactus-720p.m4v",
                inTime: 4,
                duration: 10,
                values: {
                    mul: 0.0,
                    add: 0.0
                }
            },
            {
                url: "videos/sirius/sirius-closeup-breathing-shadows-720p.m4v",
                duration: 19,
                values: {
                    mul: 0.025,
                    add: 0.025
                }
            },
            {
                url: "videos/sirius/laying-in-the-sun-on-the-floor-720p.m4v",
                inTime: 10,
                duration: 35,
                values: {
                    mul: 0.009,
                    add: 0.009
                }
            },
            {
                url: "videos/light/steady/plant-steady-720p.m4v",
                duration: 33,
                values: {
                    mul: 0.0,
                    add: 0.0
                }
            },
            {
                url: "videos/sirius/other-sirius-closeup-breathing-720p.m4v",
                duration: 34,
                values: {
                    mul: 0.025,
                    add: 0.05,
                    phase: 0.75,
                    freq: 1/60
                }
            },
            {
                url: "videos/sirius/dying-grass-sirius-720p.mov",
                inTime: 25,
                duration: 120,
                values: {
                    mul: 0.05,
                    add: 0.05,
                    phase: 0.5
                }
            }
        ]
    });

    
    /****************
     * Bottom Layer *
     ****************/
    
    // TODO: Rename.
    fluid.defaults("colin.siriusHome.layers.bottom", {
        gradeNames: ["aconite.compositableVideo", "autoInit"],
        
        members: {
            gl: "{glManager}.gl"
        },
        
        components: {
            source: {
                options: {
                    url: "{light}.options.clipSequence.0.url"
                }
            }
        },
        
        bindToTextureUnit: "TEXTURE1"
    });
    
    
    /**************************
     * Bottom Layer Sequencer *
     **************************/
    
    fluid.defaults("colin.siriusHome.clips.light", {
        gradeNames: ["colin.clipSequencer", "autoInit"],
    
        components: {
            layer: {
                type: "colin.siriusHome.layers.bottom"
            }
        },
    
        loop: true,
    
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
    });

}());
