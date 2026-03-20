import * as THREE from 'three'
import { gsap } from 'gsap'
import vertexShader from '../shaders/vertex.glsl'
import fragmentShader from '../shaders/fragment.glsl'

export class ImagePlane {
  constructor(scene, options = {}) {
    this.scene = scene
    this.options = {
      width: options.width || 3,
      height: options.height || 2,
      segments: options.segments || 32,
      imageUrl: options.imageUrl || null,
    }
    this.uniforms = {
      uTexture: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseEnter: { value: 0 },
      uVelocity: { value: 0 },
      uTime: { value: 0 },
      uAccent: { value: new THREE.Vector3(0.91, 0.659, 0.486) },
    }
    this.mesh = null
    this.isHovered = false
    this.init()
  }

  init() {
    // Load texture
    const loader = new THREE.TextureLoader()
    const imageUrl = this.options.imageUrl ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'

    loader.load(imageUrl, (texture) => {
      this.uniforms.uTexture.value = texture
    })

    // Geometry: high segment count for smooth vertex wave
    const geo = new THREE.PlaneGeometry(
      this.options.width,
      this.options.height,
      this.options.segments,
      this.options.segments
    )

    // ShaderMaterial with both vertex and fragment
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: false,
    })

    this.mesh = new THREE.Mesh(geo, mat)
    this.scene.add(this.mesh)

    // Mouse enter/leave — GSAP animates uMouseEnter uniform
    const domCanvas = document.getElementById('cv')
    domCanvas?.addEventListener('mouseenter', () => {
      this.isHovered = true
      gsap.to(this.uniforms.uMouseEnter, { value: 1, duration: 0.4, ease: 'power2.out' })
    })
    domCanvas?.addEventListener('mouseleave', () => {
      this.isHovered = false
      gsap.to(this.uniforms.uMouseEnter, { value: 0, duration: 0.6, ease: 'power2.inOut' })
    })

    // Track mouse position in normalized UV space (0-1)
    document.addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth
      const y = 1.0 - (e.clientY / window.innerHeight) // flip Y for WebGL
      // Smooth mouse tracking with GSAP
      gsap.to(this.uniforms.uMouse.value, {
        x,
        y,
        duration: 0.15,
        ease: 'none',
      })
    })
  }

  // Called every frame from main.js render loop
  update(delta, scrollVelocity, time) {
    if (!this.uniforms) return
    this.uniforms.uTime.value = time
    // Lerp velocity to smooth out spikes
    this.uniforms.uVelocity.value +=
      (scrollVelocity - this.uniforms.uVelocity.value) * (1 - Math.pow(0.08, delta))
  }

  dispose() {
    this.mesh?.geometry.dispose()
    this.mesh?.material.dispose()
    // Access the texture from the material's uniforms
    if (this.mesh?.material instanceof THREE.ShaderMaterial) {
      this.mesh.material.uniforms.uTexture.value?.dispose()
    }
    this.scene.remove(this.mesh)
  }
}
