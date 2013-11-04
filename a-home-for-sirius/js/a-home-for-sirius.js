(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    
    /****************************************
     * Main component for A Home For Sirius *
     ****************************************/
    
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
            
            siriusClips: {
                type: "colin.siriusHome.clips.sirius",
                options: {
                    listeners: {
                        onNextClip: {
                            funcName: "{siriusHome}.thresholdSynth.namedNodes.thresholdSine.set",
                            args: ["{arguments}.0.values"]
                        }
                    }
                }
            },
            
            lightClips: {
                type: "colin.siriusHome.clips.light"
            },
            
            playButton: {
                type: "colin.siriusHome.playButton",
                container: "{that}.dom.playButton",
                options: {
                    listeners: {
                        onPlay: [
                            {
                                funcName: "{siriusClips}.start"
                            },
                            {
                                funcName: "{lightClips}.start"
                            }
                        ]
                    }
                }
            },
            
            thresholdSynth: {
                type: "flock.synth.frameRate",
                options: {
                    synthDef: {
                        id: "thresholdSine",
                        ugen: "flock.ugen.sin",
                        phase: 0.7,
                        freq: 1/360,
                        mul: 0.0028,
                        add: 0.0028,
                    },
                    
                    fps: 60
                }
            }
        },
        
        events: {
            onVideosReady: {
                events: {
                    siriusFirstReady: "{siriusClips}.preRoller.events.onReady",
                    lightFirstReady: "{lightClips}.preRoller.events.onReady"
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
                    "{siriusHome}.siriusClips.layer",
                    "{siriusHome}.lightClips.layer",
                    "{siriusHome}.thresholdSynth",
                    "{siriusHome}.events.onStart"
                ]
            }
        },
        
        selectors: {
            stage: ".stage",
            playButton: ".play-overlay"
        }
    });
    
    
    /**************
     * GL Manager *
     **************/
    
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
            },
            
            textureSize: {
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
    
    
    /***************
     * Play Button *
     ***************/
    
    fluid.defaults("colin.siriusHome.playButton", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        invokers: {
            playFullScreen: {
                funcName: "colin.siriusHome.playButton.playFullScreen",
                args: ["{that}.container", "{that}.events.onPlay"]
            }
        },
        
        events: {
            onPlay: null
        },
        
        listeners: {
            onCreate: {
                "this": "{that}.container",
                method: "click",
                args: ["{that}.playFullScreen"]
            }
        }
    });
    
    colin.siriusHome.playButton.playFullScreen = function (playButton, onPlay) {
        var body = $("body")[0],
            rfs;
        
        if (body.webkitRequestFullScreen) {
            rfs = "webkitRequestFullScreen";
        } else if (body.mozRequestFullScreen){
            rfs = "mozRequestFullScreen";
        } else {
            rfs = "requestFullScreen";
        }
        
        playButton.hide();
        body[rfs]();
        onPlay.fire();
    };
    
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
            threshold = synth.value();
        
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
        
        // Set the texture size.
        gl.uniform2f(shaderProgram.textureSize, sirius.source.element.videoWidth, sirius.source.element.videoHeight);
        
        // TODO: Move this into aconite's square vertex function.
        gl.vertexAttribPointer(shaderProgram.aVertexPosition, 2, gl.FLOAT, false, 0, 0); 
        
        // TODO: Hold onto a reference to the animator.
        var animator = aconite.animator(function () {
            colin.siriusHome.drawFrame(glManager, sirius, light, synth);
        });
        
        onStart.fire();
    };

}());
