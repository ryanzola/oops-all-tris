attribute float aRandom;

uniform float time;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  pos += aRandom * (0.5 * sin(time) + 0.5) * normal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

}