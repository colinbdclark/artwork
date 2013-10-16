(function () {

    "use strict";

    var dgram = require("dgram"),
        fluid = require("infusion"),
        colin = fluid.registerNamespace("colin");

    fluid.defaults("colin.udpClient", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
    
        host: "",
        port: 65534,
        maxMessageLength: 4,
    
        members: {
            socket: {
                expander: {
                    "this": dgram,
                    method: "createSocket",
                    args: ["udp4"]
                }
            },
        
            msgBuffer: {
                expander: {
                    funcName: "colin.udpClient.createMessageBuffer",
                    args: ["{that}.options.maxMessageLength"]
                }
            }
        },
    
        invokers: {
            close: {
                funcName: "colin.udpClient.close",
                args: ["{that}.socket"]
            }
        },
    
        listeners: {
            onCreate: [
                {
                    funcName: "colin.udpClient.bindMethods",
                    args: ["{that}"]
                }
            ]
        },
    
        events: {
            onError: null,
            onResponse: null
        }
    });

    colin.udpClient.createMessageBuffer = function (len) {
        return new Buffer(len);
    };

    colin.udpClient.close = function (socket) {
        socket.close();
    };

    colin.udpClient.bindMethods = function (that) {
        that.send = function (message) {
            socket.send(message, 0, message.length, that.options.host, that.options.port, function (err, bytes) {
                if (err) {
                    that.events.onError.fire(err);
                    return;
                }
        
                that.events.onResponse.fire(bytes);
            });
        };
    
        that.sendFloat = function (value) {
            that.buffer.writeFloatLE(value, 0);
            that.send(that.buffer);
        };
    };

}());
