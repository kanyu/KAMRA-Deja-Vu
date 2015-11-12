/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import DeformableFaceGeometry from './deformable-face-geometry'
import DeformedUVTexture from './deformed-uv-texture'
import WebcamPlane from './webcam-plane'

import './main.sass'


class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    // window.addEventListener('resize', this.onResize.bind(this))
    // this.onResize()
  }


  initObjects() {
    let loader = new createjs.LoadQueue()
    loader.loadManifest([
      {id: 'lut', src: 'lut4b.png'},
    ])
    loader.on('complete', () => {
      let geometry = new DeformableFaceGeometry()
      let uvTexture = new DeformedUVTexture(this.renderer, geometry)
      geometry.addAttribute('uv2', uvTexture.uvAttribute)

      let mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({map: uvTexture}))
      mesh.position.set(-340, -150, 10)
      this.scene.add(mesh)

      this.webcam = new WebcamPlane(this.camera)
      let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
      this.webcam.scale.set(scale, scale, scale)
      this.scene.add(this.webcam)
      this.webcam.start()
      // this.webcam.visible = false

      let material = new THREE.ShaderMaterial({
        uniforms: {
          map: {type: 't', value: this.webcam.texture},
          lut: {type: 't', value: new THREE.CanvasTexture(loader.getResult('lut'))},
          hoge: {type: 't', value: uvTexture},
        },
        vertexShader: `
          attribute vec2 uv2;

          varying vec2 vUv;
          varying vec2 vUv2;

          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vUv = uv;
            vUv2 = uv2;
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform sampler2D lut;
          uniform sampler2D hoge;

          varying vec2 vUv;
          varying vec2 vUv2;

          void main() {
            vec4 original = texture2D(map, vUv);
            vec4 uv2 = texture2D(lut, vUv2);
            vec4 uv3 = texture2D(hoge, uv2.xy);
            vec4 parts = texture2D(map, uv3.xy);
            gl_FragColor = vec4(mix(original.rgb, parts.rgb, uv2.a), 1.0);
          }
        `,
        transparent: true,
      })
      this.face = new THREE.Mesh(geometry, material)
      this.face.matrixAutoUpdate = false
      this.face.scale.set(300, 300, 300)
      // this.face.updateMatrixWorld()
      this.scene.add(this.face)

      this._updateObjects = () => {
        if (this.webcam.normalizedFeaturePoints) {
          // this.face.geometry.deform(this.webcam.normalizedFeaturePoints)
          this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 1700)
          this.face.matrix.copy(this.webcam.matrixFeaturePoints)
          uvTexture.update()
        }
      }
    })
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this._updateObjects) {
      this._updateObjects(currentFrame, time)
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}


new App()