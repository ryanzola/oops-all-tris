import * as THREE from 'three'
import Experience from './Experience.js'
import { types } from '@theatre/core'

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
    this.project = this.experience.project
    this.sheet = this.experience.sheet

    this.setGeometry()
    this.setMaterial()
    this.setFloor()
    this.setMesh()
    this.setLights()
  }

  setFloor() {
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15, 100, 100),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    )

    this.floor.rotation.x = -Math.PI * 0.5;
    this.floor.position.y = -1
    this.floor.castShadow = false
    this.floor.receiveShadow = true

    this.scene.add(this.floor)
  }

  setGeometry() {
    // this.geometry = new THREE.IcosahedronGeometry(1, 16).toNonIndexed()
    this.dancer.material = this.material2
    this.dancer.castShadow = true
    
    this.geometry = this.dancer.geometry.toNonIndexed()
    this.dancer.geometry = this.geometry.toNonIndexed()
    console.log(this.geometry)

    let len = this.geometry.attributes.position.count;

    let randoms = new Float32Array(len)
    let centers = new Float32Array(len * 3)

    for(let i = 0; i < len; i+=3) {
      let r = Math.random()
      randoms[i + 0] = r
      randoms[i + 1] = r
      randoms[i + 2] = r

      let x = this.geometry.attributes.position.array[i * 3 + 0]
      let y = this.geometry.attributes.position.array[i * 3 + 1]
      let z = this.geometry.attributes.position.array[i * 3 + 2]

      let x1 = this.geometry.attributes.position.array[i * 3 + 3]
      let y1 = this.geometry.attributes.position.array[i * 3 + 4]
      let z1 = this.geometry.attributes.position.array[i * 3 + 5]

      let x2 = this.geometry.attributes.position.array[i * 3 + 6]
      let y2 = this.geometry.attributes.position.array[i * 3 + 7]
      let z2 = this.geometry.attributes.position.array[i * 3 + 8]

      let center = new THREE.Vector3(x, y, z)
        .add(new THREE.Vector3(x1, y1, z1))
        .add(new THREE.Vector3(x2, y2, z2))
        .divideScalar(3)

        centers.set([center.x, center.y, center.z], i * 3)
        centers.set([center.x, center.y, center.z], (i + 1) * 3)
        centers.set([center.x, center.y, center.z], (i + 2) * 3)
    }

    this.geometry.setAttribute('aRandom',new THREE.BufferAttribute(randoms, 1))
    this.geometry.setAttribute('aCenter',new THREE.BufferAttribute(centers, 3))
    
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
        attribute vec3 aCenter;

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
        float prog = (position.y + 1.0) / 2.0;
        float locprog = clamp((progress - 0.8 * prog) / 0.2, 0.0, 1.0);

        locprog = progress;
        
        transformed = transformed - aCenter;
        transformed += 3.0 * normal * aRandom * (locprog);
        transformed *= (1.0 - locprog);


        transformed += aCenter;
        transformed = rotate(transformed, vec3(0.0, -1.0, 0.0), aRandom * (locprog) * 3.14 * 2.0);
        transformed.y += 500.5 * aRandom * (locprog);
        `
      },
    
      uniforms: {
        diffuse: new THREE.Color(0xffffff),
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
    this.material2.side = THREE.DoubleSide

    this.materialObj = this.sheet.object('Material', {
      progress: types.number(this.material2.uniforms.progress.value, { range: [0, 1] }),
    }).onValuesChange((values) => {
      this.material2.uniforms.progress.value = values.progress
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material2)
    this.mesh.customDepthMaterial = THREE.extendMaterial( THREE.MeshDepthMaterial, {
      template: this.material2
    } );
    this.mesh.castShadow = this.mesh.receiveShadow = true
    this.mesh.scale.multiplyScalar(0.005)
    this.scene.add(this.mesh)
  }

  setLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(light1)

    const light3 = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 3, 0.5)
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