import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export class ScrollScene {
  constructor(scene, camera, renderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

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
    this._particles = null
    this._prisms = []
    this._grid = null

    this._sectionObserver = null
    this._totalScrollable = 1
    this.revealThreshold = 0.5
    this.init()
    
    // Perfect Prep: Pre-compile shaders
    this.prewarm()
  }

  prewarm() {
    this.scene.traverse(obj => {
      if (obj.isMesh) {
        // Force basic matrix update for pre-render state
        obj.updateMatrixWorld()
      }
    })
  }

  init() {
    this.scrollY = window.scrollY

    // 1. Scene structure: Scene > cameraGroup > Camera
    this.scene.add(this.cameraGroup)
    this.cameraGroup.add(this.camera)

    // Set initial camera position relative to group
    this.camera.position.set(0, 0, 5)

    // Build Realistic Studio Environment (PMREM)
    if (this.renderer) {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
      pmremGenerator.compileEquirectangularShader()
      // Generate a simple high-contrast internal environment for glass reflections
      const envScene = new THREE.Scene()
      envScene.background = new THREE.Color(0x0a0a0a)
      const envLight1 = new THREE.DirectionalLight(0xffffff, 3.0)
      envLight1.position.set(5, 5, 2)
      envScene.add(envLight1)
      const envLight2 = new THREE.DirectionalLight(0x4f46e4, 5.0)
      envLight2.position.set(-5, -5, 2)
      envScene.add(envLight2)
      this.scene.environment = pmremGenerator.fromScene(envScene).texture
      pmremGenerator.dispose()
    }

    this.buildGeometries()
    this.bindCursor()

    this.initSectionObserver()
    this.updateTotalScrollable()
    window.addEventListener('resize', () => this.updateTotalScrollable())

    // Initial check for section 0 (Hero)
    this.checkSectionEntrance(0)
    
    // Add Reflection Floor & Masterpiece Grid
    this.addReflectionFloor()
    this.addNocturnalEmbers()
    this.addFloatingPrisms()
  }

  addNocturnalEmbers() {
    const count = 3000
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30
      speeds[i] = 0.05 + Math.random() * 0.4
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // Photorealistic emulsive particles
    const mat = new THREE.PointsMaterial({
      color: 0xc3c0ff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    })

    this._particles = new THREE.Points(geo, mat)
    this._particles.userData.speeds = speeds
    this.scene.add(this._particles)
  }

  addFloatingPrisms() {
    const count = 5
    for (let i = 0; i < count; i++) {
      const geo = new THREE.IcosahedronGeometry(Math.random() * 0.2 + 0.1, 0)
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xc3c0ff,
        transmission: 0.9,
        thickness: 0.5,
        transparent: true,
        opacity: 0.3
      })
      const prism = new THREE.Mesh(geo, mat)
      prism.userData.orbit = {
        radius: 3 + Math.random() * 4,
        speed: 0.2 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2
      }
      this._prisms.push(prism)
      this.scene.add(prism)
    }
  }

  addReflectionFloor() {
    const geo = new THREE.PlaneGeometry(100, 100)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.3
    })
    const floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -12
    this.scene.add(floor)

    // Bent grid overlay
    const gridGeo = new THREE.PlaneGeometry(100, 100, 50, 50)
    const gridMat = new THREE.LineBasicMaterial({ color: 0xc3c0ff, transparent: true, opacity: 0.05 })
    this._grid = new THREE.LineSegments(new THREE.WireframeGeometry(gridGeo), gridMat)
    this._grid.rotation.x = -Math.PI / 2
    this._grid.position.y = -11.9
    this.scene.add(this._grid)
  }

  buildGeometries() {
    const commonMat = {
      transmission: 1.0,           // Full transmission for solid glass
      thickness: 1.8,              // Deeper glass volume
      roughness: 0.1,              // Clearer glass
      metalness: 0.0,
      ior: 1.5,                    // Standard glass IOR
      dispersion: 2.5,             // Photorealistic chromatic aberration (Requires Three >= r169)
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 2.0,        // Catch internal environment reflections
      transparent: true,
      opacity: 0,
      attenuationColor: new THREE.Color(0xc3c0ff),
      attenuationDistance: 1.0
    }

    // Object 1: Structural Crystalline Ring (Hero)
    const geo1 = new THREE.TorusKnotGeometry(0.9, 0.35, 300, 64)
    const mat1 = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      ...commonMat,
      opacity: 0
    })
    const mesh1 = new THREE.Mesh(geo1, mat1)
    mesh1.position.set(2.2, 0, 0)
    mesh1.rotation.set(0.5, 0.3, 0)
    mesh1.scale.set(0, 0, 0)

    // Object 2: About (Fractal Icosahedron)
    const geo2 = new THREE.IcosahedronGeometry(1.3, 4) // Higher detail
    const mat2 = new THREE.MeshPhysicalMaterial({
      color: 0xc3c0ff,
      ...commonMat,
      transmission: 0.9,
      thickness: 2.5,
      roughness: 0.15,
      opacity: 0
    })
    const mesh2 = new THREE.Mesh(geo2, mat2)
    mesh2.position.set(2.0, -this.sectionHeight, 0)
    mesh2.rotation.set(0.2, 0.4, 0.1)
    mesh2.scale.set(0, 0, 0)

    // Object 3: Services (Opaline Geodesic Dome)
    const geo3 = new THREE.IcosahedronGeometry(1.2, 2) // Detail variant
    const mat3 = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      ...commonMat,
      thickness: 1.5,
      dispersion: 4.0, // High rainbow dispersion
      opacity: 0
    })
    const mesh3 = new THREE.Mesh(geo3, mat3)
    mesh3.position.set(2.2, -this.sectionHeight * 2, 0)
    mesh3.rotation.set(0.3, 0.2, 0.2)
    mesh3.scale.set(0, 0, 0)

    this.objects = [mesh1, mesh2, mesh3]
    this.objects.forEach(obj => this.scene.add(obj))

    // Extra: Floating orbiting ring at Hero
    const ringGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xC3C0FF,
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
      { id: 'about', objectIndex: 1 },
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

    // 1. SCROLL MOVEMENT (Cinematic Pathing)
    const normalizedScroll = this.scrollY / this._totalScrollable
    // Masterpiece Sync: We mapped 150vh hero to the first 0.2 of scroll
    const easedProgress = Math.pow(normalizedScroll, 1.1)
    
    // NOTE: Camera Y is now controlled identically to other objects in main.js GSAP!
    // We remove the conflicting continuous scroll set:
    // this.camera.position.y = -easedProgress * this.sectionHeight * 2.2
    
    // Parallax Depth (Slight movement for embers relative to camera)
    if (this._particles) {
      this._particles.position.y = this.camera.position.y * 0.5
    }
    // Z-axis movement (Storytelling Focus Zoom)
    const sectionFreq = 2.5 
    const subProgress = (normalizedScroll * sectionFreq) % 1.0
    const zoomIntensity = Math.sin(subProgress * Math.PI) * 0.7
    this.camera.position.z = 5.0 - (zoomIntensity / (1.0 + Math.abs(this.lenisVelocity * 0.05)))
    
    // Dynamic FOV Speed Shift
    this.camera.fov = 45 + Math.abs(this.lenisVelocity * 0.08)
    this.camera.updateProjectionMatrix()

    this.camera.position.x = Math.sin(normalizedScroll * Math.PI) * 0.5
    this.camera.lookAt(0, this.camera.position.y, 0)

    // 2. PARALLAX EFFECT
    const targetParallaxX = this._cursor.x * 0.8
    const targetParallaxY = this._cursor.y * 0.8
    this.cameraGroup.position.x += (targetParallaxX - this.cameraGroup.position.x) * 5 * delta
    this.cameraGroup.position.y += (targetParallaxY - this.cameraGroup.position.y) * 5 * delta

    // 3. ATMOSPHERIC SHIFT
    if (this._particles) {
      this._particles.rotation.y += delta * 0.1
      const positions = this._particles.geometry.attributes.position.array
      const speeds = this._particles.userData.speeds
      for (let i = 0; i < speeds.length; i++) {
        positions[i * 3 + 1] += Math.sin(elapsedTime * speeds[i]) * 0.01
      }
      this._particles.geometry.attributes.position.needsUpdate = true
    }

    this._prisms.forEach(prism => {
      const { radius, speed, offset } = prism.userData.orbit
      prism.position.x = Math.cos(elapsedTime * speed + offset) * radius
      prism.position.z = Math.sin(elapsedTime * speed + offset) * radius
      prism.position.y = this.camera.position.y + Math.sin(elapsedTime * speed) * 2
      prism.rotation.x += delta * speed
      prism.rotation.y += delta * speed
    })

    // 4. VELOCITY-LUMINANCE SYNC
    const glowIntensity = Math.abs(this.lenisVelocity * 0.12)
    this.objects.forEach((obj, i) => {
      if (obj.material.emissive) {
        obj.material.emissive.setHex(0x4f46e4)
        obj.material.emissiveIntensity = glowIntensity * (1.0 + i * 0.2)
      }
      
      const rSpeed = 0.5 + Math.abs(this.lenisVelocity * 0.01)
      obj.rotation.y += delta * 0.4 * rSpeed
      obj.rotation.x += delta * 0.2 * rSpeed
      
      const wobble = Math.sin(this.elapsedTime * 2 + i) * 0.02
      obj.scale.setScalar(obj.scale.x + wobble)
    })
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
