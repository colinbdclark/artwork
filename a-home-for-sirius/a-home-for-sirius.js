(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    fluid.defaults("colin.siriusHome", {
        gradeNames: ["fluid.viewComponent", "autoInit"],

        model: {
            currentClips: {
                sirius: 0,
                light: 0
            }
        },
        
        components: {
            glManager: {
                type: "colin.siriusHome.glManager",
                container: "{that}.dom.stage"
            },
            
            clock: {
                type: "flock.scheduler.async"
            },
            
            sirius: {
                type: "colin.siriusHome.siriusLayer"
            },
            
            light: {
                type: "colin.siriusHome.lightLayer",
            },
            
            thresholdSynth: {
                type: "flock.synth",
                options: {
                    synthDef: {
                        id: "thresholdSine",
                        ugen: "flock.ugen.sin",
                        phase: 0.7,
                        freq: 1/360,
                        mul: 0.0028,
                        add: 0.0028,
                        rate: "frame"
                    },
                    audioSettings: {
                        rate: "frame"
                    }
                }
            }
        },
        
        events: {
            onVideosReady: {
                events: {
                    siriusFirstReady: "{that}.sirius.source.events.onReady",
                    lightFirstReady: "{that}.light.source.events.onReady"
                },
                args: ["{arguments}.siriusFirstReady.0", "{arguments}.lightFirstReady.0"]
            },
            onStart: null
        },
        
        listeners: {
            onVideosReady: {
                funcName: "colin.siriusHome.scheduleAnimation",
                args: [
                    "{glManager}",
                    "{siriusHome}.sirius",
                    "{siriusHome}.light",
                    "{siriusHome}.thresholdSynth",
                    "{siriusHome}.events.onStart"
                ]
            },
            
            onStart: {
                funcName: "{clock}.schedule",
                args: ["{siriusHome}.options.score"]
            }
        },
        
        selectors: {
            stage: ".stage"
        },
        
        videoSequences: {
            sirius: [
                {
                    url: "videos/sirius/dying-plants-sirius-720p.mov",
                    values: {
                        mul: 0.003,
                        add: 0.003,
                        phase: 1.0
                    }
                },
                {
                    url: "videos/sirius/sirius-fur-basement-720p.m4v",
                    values: {
                        mul: 0.0025,
                        add: 0.0025
                    }
                },
                {
                    url: "videos/sirius/sirius-fur-basement-720p.m4v#t=23",
                    values: {
                        mul: 0.0025,
                        add: 0.0025
                    }
                },
                {
                    url: "videos/sirius/sirius-chair.m4v",
                    values: {
                        mul: 0.002,
                        add: 0.002,
                        phase: 0.5
                    }
                }
            ],
            light: [
                {
                    url: "videos/light/window-plant-720p.m4v"
                },
                {
                    url: "videos/light/blanket-720p.mov"
                }
            ]
        },
        
        score: [
            {
                interval: "once",
                time: 58,
                change: {
                    expander: {
                        funcName: "colin.siriusHome.makeVideoUpdater",
                        args: [
                            "{that}.sirius.source",
                            "{that}.options.videoSequences.sirius.1",
                            "{that}.thresholdSynth"
                        ]
                    }
                }
            },
            {
                interval: "once",
                time: 74,
                change: {
                    expander: {
                        funcName: "colin.siriusHome.makeVideoUpdater",
                        args: [
                            "{that}.sirius.source",
                            "{that}.options.videoSequences.sirius.2",
                            "{that}.thresholdSynth"
                        ]
                    }
                }
            },
            {
                interval: "once",
                time: 90,
                change: {
                    expander: {
                        funcName: "colin.siriusHome.makeVideoUpdater",
                        args: [
                            "{that}.sirius.source",
                            "{that}.options.videoSequences.sirius.3",
                            "{that}.thresholdSynth"
                        ]
                    }
                }
            }
        ]
    });
    
    fluid.defaults("colin.siriusHome.glManager", {
        gradeNames: ["aconite.glComponent", "autoInit"],
        
        shaders: {
            fragment: "shaders/fragmentShader.frag",
            vertex: "shaders/vertexShader.vert"
        },

        shaderVariables: {
            aVertexPosition: {
                storage: "attribute",
                type: "vertexAttribArray"
            },

            siriusSampler: {
                storage: "uniform"
            },

            lightSampler: {
                storage: "uniform"
            },

            threshold: {
                storage: "uniform"
            }
        },
        
        listeners: {
            afterShaderProgramCompiled: [
                {
                    funcName: "colin.siriusHome.makeStageVertex",
                    args: ["{glManager}.gl"]
                }
            ]
        }
    });
    
    fluid.defaults("colin.siriusHome.siriusLayer", {
        gradeNames: ["aconite.compositableVideo", "autoInit"],
        members: {
            gl: "{glManager}.gl"
        },
        
        components: {
            source: {
                options: {
                    url: "{siriusHome}.options.videoSequences.sirius.0.url"
                }
            }
        },
        
        bindToTextureUnit: "TEXTURE0"
    });
    
    fluid.defaults("colin.siriusHome.lightLayer", {
        gradeNames: ["aconite.compositableVideo", "autoInit"],
        
        members: {
            gl: "{glManager}.gl"
        },
        
        components: {
            source: {
                options: {
                    url: "{siriusHome}.options.videoSequences.light.0.url",
                    listeners: {
                        onVideoEnded: {
                            funcName: "colin.siriusHome.nextVideo",
                            args: [
                                "{siriusHome}.model.currentClips", 
                                "light", 
                                "{siriusHome}.options.videoSequences.light", 
                                "{lightLayer}.source",
                                "{siriusHome}.thresholdSynth"
                            ]
                        }
                    }
                }
            }
        },
        
        bindToTextureUnit: "TEXTURE1"
    });
    
    colin.siriusHome.updateState = function (source, clipSpec, synth) {
        if (clipSpec.values) {
            synth.namedNodes.thresholdSine.set(clipSpec.values);
        }
        
        source.setURL(clipSpec.url);
    };
    
    colin.siriusHome.makeVideoUpdater = function (source, clipSpec, synth) {
        return function () {
            colin.siriusHome.updateState(source, clipSpec, synth);
        };
    };
    
    colin.siriusHome.nextVideo = function (model, path, sequence, source, synth) {
        model[path]++;
        if (model[path] >= sequence.length) {
            model[path] = 0;
        }
        
        var clipSpec = sequence[model[path]];
        colin.siriusHome.updateState(source, clipSpec, synth);
    };
    
    colin.siriusHome.makeStageVertex = function (gl) {
        // Initialize to black
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        aconite.makeSquareVertexBuffer(gl);  
    };
    
    colin.siriusHome.drawFrame = function (glManager, sirius, light, synth) {
        var gl = glManager.gl,
            thresholdSineUGen = synth.namedNodes.thresholdSine;
        
        thresholdSineUGen.gen(1);
        var threshold = thresholdSineUGen.output[0];
        
        // Set the threshold.
        gl.uniform1f(glManager.shaderProgram.threshold, threshold);
        
        sirius.refresh();
        light.refresh();
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    
    // TODO: Componentize.
    colin.siriusHome.scheduleAnimation = function (glManager, sirius, light, synth, onStart) {
        // TODO: Refactor
        var gl = glManager.gl,
            shaderProgram = glManager.shaderProgram;

        // TODO: Modelize all these variables.
        
        // Setup the texture samplers for each video.
        gl.uniform1i(shaderProgram.siriusSampler, 0);
        gl.uniform1i(shaderProgram.lightSampler, 1);
        
        // Set the threshold.
        gl.uniform1f(shaderProgram.threshold, 0.01);
        
        // TODO: Move this into aconite's square vertex function.
        gl.vertexAttribPointer(shaderProgram.aVertexPosition, 2, gl.FLOAT, false, 0, 0); 
        
        // TODO: Hold onto a reference to the animator.
        var animator = aconite.animator(function () {
            colin.siriusHome.drawFrame(glManager, sirius, light, synth);
        });
        
        onStart.fire();
    };
    
}());
