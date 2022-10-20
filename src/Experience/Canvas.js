import * as THREE from 'three'
import Experience from './Experience.js'

import vertex from './shaders/canvas/vertex.glsl'
import fragment from './shaders/canvas/fragment.glsl'


export default class Canvas {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.config = this.experience.config
    this.time = this.experience.time;
    this.resources = this.experience.resources
    this.dancer = this.resources.items.dancer.scene.children[0]
    this.monster = this.resources.items.monster.scene.children[0]
    this.debug = this.experience.debug

    this.settings = {
      progress: 0
    }

    if(this.debug) {
      this.debugFolder = this.debug.addFolder('Canvas')
    }

    this.setGeometry()
    this.setMaterial()
    this.setFloor()
    this.setMesh()
    this.setLights()
  }

  setFloor() {
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15, 100, 100),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    )

    this.floor.rotation.x = -Math.PI * 0.5;
    this.floor.position.y = -1
    this.floor.castShadow = false
    this.floor.receiveShadow = true

    this.scene.add(this.floor)
  }

  setGeometry() {
    this.geometry = new THREE.SphereGeometry(1, 32, 32).toNonIndexed()

    let len = this.geometry.attributes.position.count;
    let randoms = new Float32Array(len * 3)
    for(let i = 0; i < len; i+=3) {
      let r = Math.random()
      randoms[i + 0] = r
      randoms[i + 1] = r
      randoms[i + 2] = r
    }

    this.geometry.setAttribute('aRandom',new THREE.BufferAttribute(randoms, 1))
    
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      // wireframe: true,
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0.0 }
      }
    })

    this.material2 = new THREE.MeshStandardMaterial({
      color: 0xff0000
    })

    this.material2 = THREE.extendMaterial( THREE.MeshStandardMaterial, {

      class: THREE.CustomMaterial,  // In this case ShaderMaterial would be fine too, just for some features such as envMap this is required
      
      vertexHeader: `
        attribute float aRandom;
        uniform float time;
        uniform float progress;

        mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          
          return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                      0.0,                                0.0,                                0.0,                                1.0);
        }
        
        vec3 rotate(vec3 v, vec3 axis, float angle) {
          mat4 m = rotationMatrix(axis, angle);
          return (m * vec4(v, 1.0)).xyz;
        }
      `,
      vertex: {
        transformEnd: `
          transformed += aRandom * (0.5 * sin(time) + 0.5) * normal * progress;
        `
      },
    
      uniforms: {
        roughness: 0.75,
        time: {
          mixed: true,    // Uniform will be passed to a derivative material (MeshDepthMaterial below)
          linked: true,   // Similar as shared, but only for derivative materials, so wavingMaterial will have it's own, but share with it's shadow material
          value: 0
        },
        progress: {
          mixed: true,    // Uniform will be passed to a derivative material (MeshDepthMaterial below)
          linked: true,   // Similar as shared, but only for derivative materials, so wavingMaterial will have it's own, but share with it's shadow material
          value: 0
        },
      }
    
    } );

    if(this.debug) {
      this.debugFolder.add(this.settings, 'progress', 0, 1, 0.01)
        .onChange(value => {
          this.material2.uniforms.progress.value = value
        })
    }
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material2)
    this.mesh.customDepthMaterial = THREE.extendMaterial( THREE.MeshDepthMaterial, {
      template: this.material2
    } );
    this.mesh.castShadow = this.mesh.receiveShadow = true
    this.scene.add(this.mesh)
  }

  setLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(light1)

    const light3 = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 3, 0.3)
    light3.position.set(0, 2, 2)
    light3.target.position.set(0, 0, 0)

    light3.castShadow = true
    light3.shadow.camera.near = 0.1
    light3.shadow.camera.far = 8
    light3.shadow.bias = 0.0001

    light3.shadow.mapSize.width = 2048
    light3.shadow.mapSize.height = 2048

    this.scene.add(light3)
  }

  update() {
    this.material2.uniforms.time.value = this.time.elapsed * 0.001
  }
}