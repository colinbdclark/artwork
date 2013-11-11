(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    /*
    TODO:
     - Add support for fast-forwarding, which requires:
        - setting the playback rate of both layers
        - increasing the frequency of the threshold synth
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
                            funcName: "{siriusHome}.thresholdSynth.namedNodes.thresholdSine.set",
                            args: ["{arguments}.0.values"]
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
