precision highp float;

uniform sampler2D siriusSampler;
uniform sampler2D lightSampler;
uniform float threshold;
uniform vec2 textureSize;

void main(void) {
    
    vec2 coords = vec2(gl_FragCoord.x / textureSize.x, gl_FragCoord.y / textureSize.y);
    vec4 siriusFrag = texture2D(siriusSampler, coords);
    vec4 lightFrag = texture2D(lightSampler, coords);
    
    // Y = 0.2126 R + 0.7152 G + 0.0722 B, assuming colours are linear here.
    float luminance = (siriusFrag.r * 0.2126 + siriusFrag.g * 0.7152 + siriusFrag.b * 0.0722);
    if (luminance <= threshold) {
        luminance = smoothstep(0.002, threshold, luminance);
    } else {
        luminance = 1.0;
    }
    
    float recipLuminance = 1.0 - luminance;
    vec4 fu = vec4(luminance, luminance, luminance, 1);
    vec4 fv = vec4(recipLuminance, recipLuminance, recipLuminance, 1);

    gl_FragColor = (siriusFrag * fu) + (lightFrag * fv);
}
