#include <common>

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001
#define TAU 6.283185

uniform vec2 iMouse;
uniform vec3 iResolution;
uniform float iTime;

#pragma glslify: Rotate = require('../partials/rotate.glsl')
#pragma glslify: Smin = require('../partials/smoothMin.glsl')

float BallGyroid(vec3 p) {
    p.zy *=  Rotate(iTime * 0.2);
    p *= 10.0;
    return abs(0.7 * dot(sin(p), cos(p.yzx)) / 10.0) - 0.03;
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i);
    return d;
}

float GetDist(vec3 p) {
    float ball = length(p) -1.0;
    ball = abs(ball) - 0.03;

    float g = BallGyroid(p);

    ball = Smin(ball, g, -0.03);

    float ground = p.y + 1.0;
    p *= 5.0;
    p.z += iTime;
    p.y += sin(p.z) * 0.5;
    float y = abs(dot(sin(p), cos(p.yzx))) * 0.1;
    ground += y;

    float d = min(ball, ground * 0.9); 
    
    return d;
}

vec3 GetNormal(vec3 p) {
	float d = GetDist(p);
    vec2 e = vec2(.001, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

float RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;
    
    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }
    
    return dO;
}

float Hash21(vec2 p) {
  p = fract(p * vec2(123.45, 234.53));
  p += dot(p, p+23.4);
  return fract(p.x * p.y);
}

float Glitter(vec2 p, float a) {
  // a == phase of the sparkle
  p *= 10.0;
  vec2 id = floor(p);
  p = fract(p) - 0.5;

  float n = Hash21(id); // get pseudo-random value between 0 and 1

  float d = length(p);
  float m = smoothstep(0.5 * n, 0.0, d);
  m *= pow(sin(a + fract(n * 10.0)*TAU) * 0.5 + 0.5, 100.);

  return m;
}

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

        if(cd > 1.035) {
          // col *= vec3(1.0, 0.0, 0.0);
          float s = BallGyroid(-lightDir);
          float w = cd * 0.01;
          float shadow = smoothstep(-w, w, s);
          col *= shadow * 0.9 + 0.1;

          // sparkles
          p.z += iTime * 0.2;
          col += Glitter(p.xz * 6.0, dot(ro, vec3(2.0)) - iTime) * 4.0 * shadow;
          col /= cd*cd;
        }
    }

    float cd = length(uv); // center distance squared

    float light = 0.01 / cd;
    col += light * smoothstep(1.0, 1.5, d - 2.0);

    float s = BallGyroid(normalize(ro));
    
    col += light * smoothstep(0.0, 0.02, s);
    col = pow(col, vec3(.4545));	// gamma correction
    
    fragColor = vec4(col,1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}