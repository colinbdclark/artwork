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
            
            playButton: {
                type: "colin.siriusHome.playButton",
                container: "{that}.dom.playButton"
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
            },
            
            onCreate: [
                {
                    funcName: "{siriusClips}.start"
                },
                {
                    funcName: "{lightClips}.start"
                }
            ]
        },
        
        selectors: {
            stage: ".stage",
            playButton: ".play-overlay"
        }
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
    
    fluid.defaults("colin.siriusHome.siriusLayer", {
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
    
    fluid.defaults("colin.siriusHome.lightLayer", {
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
    
    
    fluid.defaults("colin.clipScheduler", {
        gradeNames: ["fluid.modelComponent", "fluid.eventedComponent", "autoInit"],
        
        model: {
            clipIdx: 0
        },
        
        invokers: {
            start: {
                funcName: "colin.clipScheduler.start",
                args: [
                    "{that}.model",
                    "{that}.options.clipSequence",
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
                type: "aconite.video",
                options: {
                    autoPlay: false
                }
            }
        },
        
        events: {
            onNextClip: null
        },
        
        loop: false,
        
        clipSequence: []
    });
    
    colin.clipScheduler.swapClips = function (source, preRoller, inTime) {
        var displayEl = source.element,
            preRollEl = preRoller.element;
        
        preRollEl.currentTime = inTime === undefined ? 0 : inTime;
        preRollEl.play();
        displayEl.pause();
        
        source.element = preRollEl;
        preRoller.element = displayEl;
    };
    
    colin.clipScheduler.displayClip = function (layer, clip, preRoller, onNextClip) {
        onNextClip.fire(clip);
        colin.clipScheduler.swapClips(layer.source, preRoller, clip.inTime);
    };
    
    colin.clipScheduler.preRollClip = function (preRoller, clip) {
        var url = clip.url;/*,
            inTime = clip.inTime;
        if (clip.inTime) {
            url = url + "#t=" + inTime;
        }*/
                
        preRoller.setURL(url);
    };
    
    colin.clipScheduler.nextClip = function (model, sequence, loop) {
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
    colin.clipScheduler.start = function (model, sequence, clock, layer, preRoller, onNextClip, loop) {
        var idx = model.clipIdx = 0;
        layer.source.element.play();
        colin.clipScheduler.scheduleNextClip(model, sequence, clock, layer, preRoller, onNextClip, loop);
    };
    
    colin.clipScheduler.scheduleNextClip = function (model, sequence, clock, layer, preRoller, onNextClip, loop) {
        var idx = model.clipIdx >= sequence.length ? 0 : model.clipIdx,
            nextClip = colin.clipScheduler.nextClip(model, sequence, loop),
            currentClip = sequence[idx];
        
        if (!nextClip) {
            return;
        }
        
        colin.clipScheduler.preRollClip(preRoller, nextClip);        
        clock.once(currentClip.duration, function () {
            colin.clipScheduler.displayClip(layer, nextClip, preRoller, onNextClip);
            model.clipIdx++;
            colin.clipScheduler.scheduleNextClip(model, sequence, clock, layer, preRoller, onNextClip, loop);
        });
    };

    
    fluid.defaults("colin.siriusHome.clips.sirius", {
        gradeNames: ["colin.clipScheduler", "autoInit"],
        
        components: {
            layer: {
                type: "colin.siriusHome.siriusLayer",
                options: {
                    autoPlay: false
                }
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
                    mul: 0.005,
                    add: 0.005  
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
                duration: 25,
                values: {
                    mul: 0.0,
                    add: 0.0
                }
            },
            {
                url: "videos/sirius/other-sirius-closeup-breathing-720p.m4v",
                duration: 34,
                values: {
                    mul: 0.05,
                    add: 0.05,
                    phase: 0.0
                }
            },
            {
                url: "videos/sirius/dying-grass-sirius-720p.mov",
                inTime: 25,
                duration: 120,
                values: {
                    mul: 0.2,
                    add: 0.2,
                    phase: 0.4
                }
            }
        ]
    });

    fluid.defaults("colin.siriusHome.clips.light", {
        gradeNames: ["colin.clipScheduler", "autoInit"],
        
        components: {
            layer: {
                type: "colin.siriusHome.lightLayer",
                options: {
                    autoPlay: false
                }
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
