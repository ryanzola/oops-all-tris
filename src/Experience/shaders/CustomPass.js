import vertex from './abberation/vertex.glsl'
import fragment from './abberation/fragment.glsl'

export const CustomPass = {
  uniforms: {
    tDiffuse: { value: null },
    distort: { value: 0.5 },
    time: { value: 0 }
  },
  vertexShader: vertex,
  fragmentShader: fragment,
}