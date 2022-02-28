#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001

#pragma glslify: GetDist = require('./getDist.glsl')

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

#pragma glslify: export(RayMarch)