varying vec2 vUv;

void main() {
  vec2 color = vUv * 0.5 + 0.5;
  gl_FragColor = vec4(color, 1.0, 1.0);
}