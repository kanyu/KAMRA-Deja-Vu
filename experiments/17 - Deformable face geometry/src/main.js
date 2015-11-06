/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
// import dat from 'dat-gui'

import Config from './config'
import DeformableFaceGeometry from './deformablefacegeometry'

import './main.sass'
document.body.innerHTML = require('./main.jade')()






class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 2435.782592)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x333333)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    let loader = new createjs.LoadQueue()
    loader.loadFile({id: 'keyframes', src: 'keyframes.json'})
    let items = [
      'shutterstock_38800999',
      'shutterstock_56254417',
      'shutterstock_61763248',
      // 'shutterstock_62329042',
      'shutterstock_62329057',
      'shutterstock_102487424',
      'shutterstock_102519095',
      'shutterstock_154705646'
    ]
    items.forEach((name, i) => {
      loader.loadFile({id: `data${i}`, src: `media/${name}.json`})
      loader.loadFile({id: `image${i}`, src: `media/${name}.png`})
    })
    loader.on('progress', (e) => {
      console.log(e.loaded, e.total)
    })
    loader.on('complete', () => {
      this.keyframes = loader.getResult('keyframes')
      console.log(this.keyframes)

      this.faces = items.map((name, i) => {
        let featurePoints = loader.getResult(`data${i}`)
        let image = loader.getResult(`image${i}`)
        let geometry = new DeformableFaceGeometry(featurePoints, image, 400, this.camera.position.z)
        let material = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(image)})
        return new THREE.Mesh(geometry, material)
      })


      for (let y = -2; y <= 2; y++) {
        for (let x = -4; x <= 4; x++) {
          // let face = new THREE.Mesh(geometry, material)
          // this.face.matrixAutoUpdate = false
          // this.face.matrix.copy(geometry.matrixFeaturePoints)
          // face.scale.set(150, 150, 150)
          // face.position.set(x * 150, y * 200, 0)
          // this.scene.add(face)
          let face = this.faces[(x + y * 5 + 100) % this.faces.length].clone()
          face.scale.set(150, 150, 150)
          face.position.set(x * 150, y * 200, 0)
          this.scene.add(face)
        }
      }

      // this.geometry = this.faces[0].geometry
      // this.geometry.applyMorph(this.keyframes.user.property.face_vertices[700])

      this.start()
    })
  }


  start() {
    this.startTime = performance.now()
    this.previousFrame = -1
    this.animate()
  }


  animate() {
    requestAnimationFrame(this.animate)

    let currentFrame = Math.floor((performance.now() - this.startTime) / 1000 * 24) % 1661
    if (currentFrame != this.previousFrame) {
      // this.geometry.applyMorph(this.keyframes.user.property.face_vertices[currentFrame])
      this.faces.forEach((face) => {
        face.geometry.applyMorph(this.keyframes.user.property.face_vertices[currentFrame])
      })
      this.previousFrame = currentFrame
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s]
    })
  }

}

new App()