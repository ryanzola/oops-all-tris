import * as THREE from 'three'

import Experience from './Experience';

import fragment from './shaders/canvas/fragment.glsl'

export default class Canvas {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.renderer = this.experience.renderer
    this.time = this.experience.time
    this.config = this.experience.config
    this.width = this.config.width
    this.height = this.config.height
    this.mouse = new THREE.Vector2()

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.mouseEvents()
  }

  mouseEvents() {
    const onMouseMove = ( event ) => {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
    
      this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    window.addEventListener( 'mousemove', onMouseMove);
  }

  setGeometry() {
    this.geometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      uniforms: {
        iMouse: { value: new THREE.Vector2() },
        iResolution: { value: new THREE.Vector3() },
        iTime: { value: 0.0 }
      }
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  update() {
    this.material.uniforms.iTime.value = this.time.elapsed * 0.001
    this.material.uniforms.iResolution.value.set(this.width * 2, this.height * 2, 1)
    this.material.uniforms.iMouse.value.set(this.mouse.x, this.mouse.y)
  }

  destroy() {

  }
}