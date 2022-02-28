float BallGyroid(vec3 p) {
    p *= 10.0;
    return abs(0.7 * dot(sin(p), cos(p.yzx)) / 10.0) - 0.03;
}

#pragma glslify: export(BallGyroid)