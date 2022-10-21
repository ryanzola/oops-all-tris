import './style.css'
import Experience from './Experience/Experience.js'

import studio from '@theatre/studio'

studio.initialize()

const experience = new Experience({
    targetElement: document.querySelector('.experience')
})

