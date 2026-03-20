import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export class ScrollScene {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    
    this.cameraGroup = new THREE.Group()
    this.objects = []
    this.sectionHeight = 6.0
    
    this.scrollY = 0
    this.lenisVelocity = 0
    this.currentSection = -1
    this.revealedSections = new Set()
    this.elapsedTime = 0
    this._ring = null
    
    this._cursor = { x: 0, y: 0 }
    
    this._sectionObserver = null
    this._totalScrollable = 1
    
    this.init()
  }

  init() {
    this.scrollY = window.scrollY
    
    // 1. Scene structure: Scene > cameraGroup > Camera
    this.scene.add(this.cameraGroup)
    this.cameraGroup.add(this.camera)
    
    // Set initial camera position relative to group
    this.camera.position.set(0, 0, 5)
    
    this.buildGeometries()
    this.bindCursor()
    
    this.initSectionObserver()
    this.updateTotalScrollable()
    window.addEventListener('resize', () => this.updateTotalScrollable())
    
    // Initial check for section 0 (Hero)
    this.checkSectionEntrance(0)
  }

  buildGeometries() {
    const commonMat = {
      wireframe: true,
      transparent: true,
      opacity: 0
    }

    // Object 1: Hero (Ink TorusKnot)
    const geo1 = new THREE.TorusKnotGeometry(0.9, 0.3, 100, 16)
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x0A0906, ...commonMat })
    const mesh1 = new THREE.Mesh(geo1, mat1)
    mesh1.position.set(2.2, 0, 0)
    mesh1.rotation.set(0.5, 0.3, 0)
    mesh1.scale.set(0, 0, 0)
    
    // Object 2: About (Ember Icosahedron)
    const geo2 = new THREE.IcosahedronGeometry(1.3, 1)
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xC8401A, ...commonMat })
    const mesh2 = new THREE.Mesh(geo2, mat2)
    mesh2.position.set(2.0, -this.sectionHeight, 0)
    mesh2.rotation.set(0.2, 0.4, 0.1)
    mesh2.scale.set(0, 0, 0)

    // Object 3: Services (Ink Octahedron)
    const geo3 = new THREE.OctahedronGeometry(1.2, 0)
    const mat3 = new THREE.MeshBasicMaterial({ color: 0x0A0906, ...commonMat })
    const mesh3 = new THREE.Mesh(geo3, mat3)
    mesh3.position.set(2.2, -this.sectionHeight * 2, 0)
    mesh3.rotation.set(0.3, 0.2, 0.2)
    mesh3.scale.set(0, 0, 0)

    this.objects = [mesh1, mesh2, mesh3]
    this.objects.forEach(obj => this.scene.add(obj))

    // Extra: Floating orbiting ring at Hero
    const ringGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 24)
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0xC8401A, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.5 
    })
    this._ring = new THREE.Mesh(ringGeo, ringMat)
    this._ring.position.set(2.2, 0, 0)
    this.scene.add(this._ring)
  }

  setScroll(scrollY, velocity) {
    this.scrollY = scrollY
    this.lenisVelocity = velocity
  }

  updateTotalScrollable() {
    this._totalScrollable = Math.max(
      document.body.scrollHeight - window.innerHeight,
      1
    )
  }

  initSectionObserver() {
    const targets = [
      { id: 'about',    objectIndex: 1 },
      { id: 'services', objectIndex: 2 },
    ]

    this._sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.objectIndex)
          if (!this.revealedSections.has(idx)) {
            this.revealedSections.add(idx)
            this._triggerEntrance(idx)
          }
        }
      })
    }, { threshold: 0.2 })

    targets.forEach(({ id, objectIndex }) => {
      const el = document.getElementById(id)
      if (el) {
        el.dataset.objectIndex = objectIndex
        this._sectionObserver.observe(el)
      }
    })
  }

  _triggerEntrance(index) {
    const obj = this.objects[index]
    if (!obj) return

    // Entrance Burst Animation
    gsap.to(obj.scale, {
      x: 1.0, y: 1.0, z: 1.0,
      duration: 1.0,
      ease: 'back.out(1.7)'
    })
    gsap.to(obj.material, {
      opacity: 0.72,
      duration: 0.8,
      ease: 'power2.out'
    })
    
    // Breathing Yoyo post-entrance
    gsap.to(obj.scale, {
      x: 1.04, y: 1.04, z: 1.04,
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 1.0
    })
  }

  checkSectionEntrance(section) {
    if (section === 0 && !this.revealedSections.has(0)) {
      this.revealedSections.add(0)
      this._triggerEntrance(0)
    }
  }

  bindCursor() {
    window.addEventListener('mousemove', (e) => {
      this._cursor.x = (e.clientX / window.innerWidth) - 0.5
      this._cursor.y = -((e.clientY / window.innerHeight) - 0.5)
    })
  }

  update(delta, elapsedTime = 0) {
    if (!delta || delta > 0.1) return
    this.elapsedTime = elapsedTime

    // 1. SCROLL MOVEMENT (Normalized Y axis)
    const normalizedScroll = this.scrollY / this._totalScrollable
    this.camera.position.y = -normalizedScroll * this.sectionHeight * 2

    // 2. PARALLAX EFFECT (Move cameraGroup gently)
    const targetParallaxX = this._cursor.x * 0.8
    const targetParallaxY = this._cursor.y * 0.8
    this.cameraGroup.position.x += (targetParallaxX - this.cameraGroup.position.x) * 5 * delta
    this.cameraGroup.position.y += (targetParallaxY - this.cameraGroup.position.y) * 5 * delta

    // 3. SCROLL VELOCITY Calculation
    const velocityTilt = this.lenisVelocity * 0.003

    // 4. AMBIENT MOTION & TILT
    this.objects.forEach((obj, i) => {
      // Only rotate X for obj0 — Y is driven by GSAP ScrollTrigger in main.js
      if (i === 0) {
        obj.rotation.x += delta * 0.08
      } else {
        obj.rotation.y += delta * (0.25 + i * 0.05)
        obj.rotation.x += delta * 0.12
      }
      obj.rotation.z += velocityTilt * delta
    })

    // 5. FLOATING RING PHYSICS (Orbit)
    if (this._ring) {
      this._ring.position.x = 2.2 + Math.cos(this.elapsedTime * 0.7) * 1.2
      this._ring.position.y = Math.sin(this.elapsedTime * 0.5) * 0.6
      this._ring.position.z = Math.sin(this.elapsedTime * 0.7) * 0.4
      this._ring.rotation.z += delta * 0.4
      this._ring.rotation.x += delta * 0.2
    }
  }

  dispose() {
    this._sectionObserver?.disconnect()
    if (this._ring) {
      this._ring.geometry.dispose()
      this._ring.material.dispose()
      this.scene.remove(this._ring)
    }
    this.objects.forEach(obj => {
      obj.geometry.dispose()
      obj.material.dispose()
      this.scene.remove(obj)
    })
    this.cameraGroup.remove(this.camera)
    this.scene.remove(this.cameraGroup)
    this.objects = []
  }
}
