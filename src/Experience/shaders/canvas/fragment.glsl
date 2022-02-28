#include <common>

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001

uniform vec2 iMouse;
uniform vec3 iResolution;
uniform float iTime;

#pragma glslify: GetNormal = require('../partials/getNormal.glsl')
#pragma glslify: GetRayDir = require('../partials/getRayDir.glsl')
#pragma glslify: RayMarch = require('../partials/rayMarch.glsl')
#pragma glslify: Rotate = require('../partials/rotate.glsl')
#pragma glslify: BallGyroid = require('../partials/ballGyroid.glsl')



void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec2 m = 900.0 * (iMouse/iResolution.xy);

    vec3 ro = vec3(3, 0, -3) * 0.8;
    ro.yz *= Rotate(-m.y*3.14+1.);
    ro.y = max(-0.9, ro.y);
    ro.xz *= Rotate(-m.x*6.2831);
    
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.0);
    vec3 col = vec3(0);
   
    float d = RayMarch(ro, rd);

    if(d<MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);
        vec3 lightDir = -normalize(p);
        float dif = dot(n, lightDir)*.5+.5;
        float cd = length(p); // distance from origin
        col = vec3(dif);

        if(cd > 1.03) {
          // col *= vec3(1.0, 0.0, 0.0);
          float s = BallGyroid(-lightDir);
          float w = cd * 0.02;
          float shadow = smoothstep(-w, w, s);
          col *= shadow;

          col /= cd*cd;
        }
    }
    
    col = pow(col, vec3(.4545));	// gamma correction
    
    fragColor = vec4(col,1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}