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

float random(vec2 p) {
  vec2 k1 = vec2(
      23.14069263277926, // e^pi (Gelfond's constant)
      2.665144142690225 // 2^sqrt(2) (Gelfond-Schneider constant)
  );
  return fract(
      cos(dot(p, k1)) * 12345.6789
  );
}

float Glitter(vec2 p, float a) {
  // a == phase of the sparkle
  p *= 10.0;
  vec2 id = floor(p);
  p = fract(p) - 0.5;

  float n = random(id); // get pseudo-random value between 0 and 1

  float d = length(p);
  float m = smoothstep(0.5 * n, 0.0, d);
  m *= pow(sin(a + fract(n * 10.0)*TAU) * 0.5 + 0.5, 100.);

  return m;
}

vec3 RayPlane(vec3 ro, vec3 rd, vec3 p, vec3 n) {
  float t = max(0.0, dot(p - ro, n) / dot(rd, n));

  return ro + rd * t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec2 m = 900.0 * (iMouse/iResolution.xy);
    float cds = length(uv); // center distance squared

    vec3 ro = vec3(3, 0, -3) * 0.8;
    ro.yz *= Rotate(-m.y*3.14+1.);
    ro.y = max(-0.9, ro.y);
    ro.xz *= Rotate(-m.x*6.2831 + iTime * 0.15);
    
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

        if(cd > 1.035) { // hit the floor
          // col *= vec3(1.0, 0.0, 0.0);
          float s = BallGyroid(-lightDir);
          float w = cd * 0.01;
          float shadow = smoothstep(-w, w, s);
          col *= shadow * 0.9 + 0.1;

          // sparkles
          p.z += iTime * 0.2;
          col += Glitter(p.xz * 6.0, dot(ro, vec3(2.0)) - iTime) * 4.0 * shadow;
          col /= cd*cd;
        } else {  // hit the ball
          float sss = smoothstep(0.15, 0.0, cds);

          float s = BallGyroid(p + sin(p * 10.0 + iTime ) * 0.02);
          sss*= smoothstep(-0.03, 0.0, s);
          // sss = min(sss*sss, 2.0);
          col += sss * vec3(1.0, 0.1, 0.2);
        }
    }

    
    
    // center light
    float light = 0.01 / cds;
    vec3 lightCol = vec3(1.0, 0.8, 0.7);
    col += light * smoothstep(1.0, 1.5, d - 2.0) * lightCol;

    float s = BallGyroid(normalize(ro));
    
    // center light glare
    col += light * smoothstep(0.0, 0.02, s) * lightCol;

    // volumetrics
    vec3 pp = RayPlane(ro, rd, vec3(0), normalize(ro)); // plane intersection point
    float sb = BallGyroid(normalize(pp));
    sb *= smoothstep(0.2, 0.4, cds); // mask center
    col += max(0.0, sb);

    col = pow(col, vec3(.4545));	// gamma correction
    col *= 1.0 - cds;
    fragColor = vec4(col,1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}