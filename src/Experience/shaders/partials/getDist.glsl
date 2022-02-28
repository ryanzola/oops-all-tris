#pragma glslify: BallGyroid = require('./ballGyroid.glsl')

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b-a)/k, 0.0, 1.0);

    return mix(b, a, h) - k * h * (1.0 - h);
}

float GetDist(vec3 p) {
    float ball = length(p) -1.0;
    ball = abs(ball) - 0.03;

    float g = BallGyroid(p);

    ball = smin(ball, g, -0.03);

    float ground = p.y + 1.0;
    
    p *= 5.0;
    p.y += sin(p.z) * 0.5;
    float y = abs(dot(sin(p), cos(p.yzx))) * 0.1;
    ground += y;

    float d = min(ball, ground); 
    
    return d;
}

#pragma glslify: export(GetDist)