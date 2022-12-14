import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { types } from '@theatre/core'

import Experience from './Experience'

export default class Camera
{
    constructor(_options)
    {
        // Options
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.targetElement = this.experience.targetElement
        this.scene = this.experience.scene
        this.project = this.experience.project
        this.sheet = this.experience.sheet

        // Set up
        this.mode = 'debug' // defaultCamera \ debugCamera

        this.setInstance()
        this.setModes()
    }

    setInstance()
    {
        // Set up
        this.instance = new THREE.PerspectiveCamera(75, this.config.width / this.config.height, 0.1, 1000)
        // this.instance.rotation.reorder('YXZ')

        this.scene.add(this.instance)
    }

    setModes()
    {
        this.modes = {}

        // Default
        this.modes.default = {}
        this.modes.default.instance = this.instance.clone()
        this.modes.default.instance.rotation.reorder('YXZ')

        // Debug
        this.modes.debug = {}
        this.modes.debug.instance = this.instance.clone()
        this.modes.debug.instance.rotation.reorder('YXZ')
        this.modes.debug.instance.position.set(2, 2, 2)
        
        this.modes.debug.orbitControls = new OrbitControls(this.modes.debug.instance, this.targetElement)
        this.modes.debug.orbitControls.enabled = this.modes.debug.active
        this.modes.debug.orbitControls.screenSpacePanning = true
        this.modes.debug.orbitControls.enableKeys = false
        this.modes.debug.orbitControls.zoomSpeed = 0.25
        this.modes.debug.orbitControls.enableDamping = true
        this.modes.debug.orbitControls.update()

        this.cameraSheet = this.sheet.object('Camera', {
            position: types.compound({
                x: types.number(this.modes.debug.instance.position.x, { range: [-10, 10] }),
                y: types.number(this.modes.debug.instance.position.y, { range: [-10, 10] }),
                z: types.number(this.modes.debug.instance.position.z, { range: [-10, 10] }),
              }),
              lookAt: types.compound({
                x: types.number(0, { range: [-1, 1] }),
                y: types.number(0.4, { range: [-1, 1] }),
                z: types.number(0, { range: [-1, 1] }),
              }),
        }).onValuesChange((values) => {
            const { x, y, z } = values.position
            const { x: x2, y: y2, z: z2 } = values.lookAt
          
            this.modes.debug.instance.position.set(x, y, z)
            this.modes.debug.instance.lookAt(x2, y2, z2)
          })
    }


    resize()
    {
        this.instance.aspect = this.config.width / this.config.height
        this.instance.updateProjectionMatrix()

        this.modes.default.instance.aspect = this.config.width / this.config.height
        this.modes.default.instance.updateProjectionMatrix()

        this.modes.debug.instance.aspect = this.config.width / this.config.height
        this.modes.debug.instance.updateProjectionMatrix()
    }

    update()
    {
        // Update debug orbit controls
        // this.modes.debug.orbitControls.update()

        // Apply coordinates
        this.instance.position.copy(this.modes[this.mode].instance.position)
        this.instance.quaternion.copy(this.modes[this.mode].instance.quaternion)
        this.instance.updateMatrixWorld() // To be used in projection
    }

    destroy()
    {
        // this.modes.debug.orbitControls.destroy()
    }
}
