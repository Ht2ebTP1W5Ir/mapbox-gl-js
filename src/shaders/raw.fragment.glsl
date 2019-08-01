#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_image;
uniform float u_time;
varying vec2 v_pos;

vec3 makeLine(float val, float width) {
    // float inverse = abs(val - 1.0);
    return vec3(1. - smoothstep(.0, width, val));
}
void main() {
    vec4 pixel = vec4(texture2D(u_image, v_pos).rgb, 1.);
    float r = pixel.r;
    float g = pixel.g;
    float b = pixel.b;

    // the extra * 255. is necessary because the gpu reads the values as [0. - 1.]
    // we want them in the 8-bit color space as originally encoded
    float v = ((r * 256. * 256. + g * 256.0 + b) / 10.0) * 255. - 10000.;
    // divide by maximum height of everest in meters (8900) to get the whole range down to 0. - 1.
    // (cheat a bit to lighten the lowlands more)
    v /= 6000.;

    // heightmap
    gl_FragColor.rgb = vec3(v);
    gl_FragColor.a = 1.;

    float val;
    vec3 line;
    vec3 lineColor = vec3(0., 1., 1.); // cyan

    // two small fast lines
    // stagger times so they don't synchronize
    val = fract(1. * v + fract(u_time * 0.1313));
    line = makeLine(val, .01);
    gl_FragColor.rgb += line * lineColor * .2;

    val = fract(1.5 * v + fract(u_time * 0.3838));
    line = makeLine(val, .02);
    gl_FragColor.rgb += line * lineColor * .2;

    // one big slow line
    float slowTime = .2323;
    val = fract(2. * v + fract(u_time * slowTime));
    line = makeLine(val, .1);

    // fade the big line in and out
    float fadein = smoothstep(.2, .7, fract(u_time * slowTime));
    float fadeout = smoothstep(1., .9, fract(u_time * slowTime));
    gl_FragColor.rgb += line * lineColor * .75 * fadein * fadeout;

    gl_FragColor.rgb *= vec3(clamp(v*1000., 0., 1.)); // mask ocean

}
