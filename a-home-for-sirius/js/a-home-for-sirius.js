(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    /*
    TODO:
        - prologue and epilogue for fcpxml-based sequencer
        - Threshold "breathing" should never fully reach zero
        - Need to fix bug where first clip is sparkly
        - sparkle settings for each clip
        - progressive sparkliness (the sparkle setting needs to be a multiplication factor)
        - expander for randomly "weaving" sequences together
        - tighten up clips and speed up the general pacing a bit, especially for light clips
    */
    
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
                container: "{siriusHome}.dom.stage"
            },
            
            animator: {
                createOnEvent: "onVideosReady",
                type: "colin.siriusHome.animator"
            },
            
            top: {
                type: "colin.siriusHome.topSequencer",
                options: {
                    listeners: {
                        onNextClip: {
                            funcName: "colin.siriusHome.updateSynthValues",
                            args: ["{siriusHome}.thresholdSynth", "{arguments}.0.values"]
                        }
                    }
                }
            },
            
            bottom: {
                type: "colin.siriusHome.bottomSequencer"
            },
            
            playButton: {
                type: "colin.siriusHome.playButton",
                container: "{that}.dom.playButton",
                options: {
                    listeners: {
                        onPlay: [
                            {
                                funcName: "{top}.start"
                            },
                            {
                                funcName: "{bottom}.start"
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
                        freq: 1/3,
                        mul: 0.01,
                        add: 0.01,
                    },
                    
                    fps: 60
                }
            }
        },
        
        events: {
            onVideosReady: {
                events: {
                    siriusFirstReady: "{top}.preRoller.events.onReady",
                    lightFirstReady: "{bottom}.preRoller.events.onReady"
                },
                args: ["{arguments}.siriusFirstReady.0", "{arguments}.lightFirstReady.0"]
            },
            onStart: null
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
                    args: ["{glManager}.gl", "{glManager}.shaderProgram.aVertexPosition"]
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
    
    colin.siriusHome.updateSynthValues = function (synth, values) {
        var values = values || {
            mul: synth.options.synthDef.mul,
            add: synth.options.synthDef.add
        };
        
        synth.namedNodes.thresholdSine.set(values);
    };
    
    colin.siriusHome.makeStageVertex = function (gl, vertexPosition) {
        // Initialize to black
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        aconite.makeSquareVertexBuffer(gl, vertexPosition);
    };
    
    colin.siriusHome.drawFrame = function (glManager, topLayer, bottomLayer, synth) {
        var gl = glManager.gl,
            threshold = synth.value();
        
        // Set the threshold.
        gl.uniform1f(glManager.shaderProgram.threshold, threshold);
        
        topLayer.refresh();
        bottomLayer.refresh();
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };


    // TODO: Generalize.
    fluid.defaults("colin.siriusHome.animator", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            glManager: "{siriusHome}.glManager"
        },
        
        uniforms: {
            siriusSampler: {
                type: "i",
                value: 0
            },
            lightSampler: {
                type: "i",
                value: 1
            },
            threshold: {
                type: "f",
                value: 0.01
            },
            textureSize: {
                type: "f",
                value: [
                    "{topSequencer}.layer.source.element.videoWidth",
                    "{topSequencer}.layer.source.element.videoHeight"
                ]
            }
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "colin.siriusHome.animator.setUniforms",
                    args: ["{glManager}.gl", "{glManager}.shaderProgram", "{that}.options.uniforms"]
                },
                {
                    funcName: "colin.siriusHome.animator.scheduleFrameDrawer",
                    args: [
                        "{that}",
                        "colin.siriusHome.drawFrame", 
                        "{glManager}", 
                        "{topSequencer}.layer", 
                        "{bottomSequencer}.layer",
                        "{synth}"
                    ]
                },
                {
                    funcName: "{siriusHome}.events.onStart.fire"
                }
            ]
        }
    });
    
    colin.siriusHome.animator.setUniforms = function (gl, shaderProgram, uniforms) {
        fluid.each(uniforms, function (valueSpec, key) {
            var values = fluid.makeArray(valueSpec.value),
                setter = "uniform" + values.length + valueSpec.type,
                uniform = shaderProgram[key],
                args = fluid.copy(values);
            
            args.unshift(uniform);
            gl[setter].apply(gl, args);
        });
    };
    
    colin.siriusHome.animator.scheduleFrameDrawer = function (that, frameDrawer, glManager, topLayer, bottomLayer, synth) {
        frameDrawer = typeof (frameDrawer) === "function" ? frameDrawer : fluid.getGlobalValue(frameDrawer);
                
        that.animator = aconite.animator(function () {
            frameDrawer(glManager, topLayer, bottomLayer, synth);
        });
    };
    
}());
