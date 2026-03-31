import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import SplitType from 'split-type'
import { ScrollScene } from './js/ScrollScene.js'

gsap.registerPlugin(ScrollTrigger)

const PROJECTS = [
  {
    id: 'p1',
    title: 'NeuroDashboard',
    cat: 'dev',
    desc: 'AI productivity, voice, SSE streaming',
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80',
    tags: ['React', 'AI', 'Supabase', 'SSE'],
    feat: true
  },
  {
    id: 'p2',
    title: 'FORMA Luxury Web',
    cat: 'web',
    desc: 'Award editorial site, WebGL parallax',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80',
    tags: ['Three.js', 'GSAP', 'WebGL'],
    feat: true
  },
  {
    id: 'p3',
    title: 'Project Infinitum',
    cat: 'dev',
    desc: 'AI narrative game, local LLM',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    tags: ['Python', 'Pygame', 'Ollama'],
    feat: false
  },
  {
    id: 'p4',
    title: 'Mobile Banking UI',
    cat: 'ui',
    desc: 'Full design system, 120+ screens',
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&q=80',
    tags: ['Figma', 'Design System', 'Mobile'],
    feat: false
  },
  {
    id: 'p5',
    title: 'AG-Kit Winter-Box',
    cat: 'dev',
    desc: 'Global skills for Antigravity',
    img: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=900&q=80',
    tags: ['Node.js', 'AI', 'CLI'],
    feat: false
  },
  {
    id: 'p6',
    title: 'AXIOM Portfolio',
    cat: 'web',
    desc: '3D portfolio, Three.js, GLSL',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
    tags: ['Three.js', 'GLSL', 'Lenis'],
    feat: false
  }
]

class CreativeEngine {
  constructor() {
    // Store references
    this.canvas = document.getElementById('cv')
    this.clock = new THREE.Clock()
    this.lenis = null
    this.mesh = null
    this.scrollScene = null
    this.elapsedTime = 0
    this.stats = null

    // Cursor lerp values (Initialized to screen center for immediate visibility)
    this.cursorX = window.innerWidth / 2; this.cursorY = window.innerHeight / 2
    this.cursorTargetX = this.cursorX; this.cursorTargetY = this.cursorY
    this.canvasHovered = 0
    this.scrollVelocity = 0
    this.lastScrollY = 0

    // SKIP WEBGL ON MOBILE
    this.isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (this.isMobile) {
      document.getElementById('cv').style.display = 'none'
      document.body.style.overflow = ''
      document.fonts.ready.then(() => {
        this.initSplitType()
        this.initProjectGrid()
        this.initContactForm()
        this.initMobileMenu()
      })
      return
    }

    this.init()
  }

  init() {
    // Scroll progress bar
    const pbar = document.createElement('div')
    pbar.className = 'scroll-progress-bar'
    document.body.prepend(pbar)
    this._progressBar = pbar

    this.initRenderer()
    this.initScene()
    this.initLenis()
    this.addObjects()
    this.initScrollScene()
    this.initScrollStory()
    this.initTextAnimations()
    this.initScrollAnimations()
    this.initCursor()
    this.initMagnetic()
    this.initCharacterWave()
    this.initPreloader()
    this.initProjectGrid()
    this.initContactForm()
    this.initMobileMenu()

    this.canvas.addEventListener('mouseenter', () => {
      gsap.to(this, { canvasHovered: 1, duration: 0.4, ease: 'power2.out' })
    })
    this.canvas.addEventListener('mouseleave', () => {
      gsap.to(this, { canvasHovered: 0, duration: 0.6, ease: 'power2.inOut' })
    })

    // Performance Monitoring (Dev only)
    if (import.meta.env.DEV) {
      import('stats.js').then(({ default: Stats }) => {
        this.stats = new Stats()
        this.stats.showPanel(0)
        document.body.appendChild(this.stats.dom)
      }).catch(() => { })
    }

    document.fonts.ready.then(() => this.initSplitType())
    this.render()
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x131313, 0.04)
    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 100
    )
    this.camera.position.set(0, 0, 5)

    // Cinematic Lighting for Refraction
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xc3c0ff, 20)
    pointLight.position.set(5, 5, 5)
    this.scene.add(pointLight)

    const accentLight = new THREE.PointLight(0x4f46e4, 15)
    accentLight.position.set(-5, -5, 2)
    this.scene.add(accentLight)
  }

  initLenis() {
    this.lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    this.lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { this.lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)
    this.lenis.on('scroll', ({ scroll, velocity }) => {
      this.scrollVelocity = velocity
      this.scrollScene?.setScroll(scroll, velocity)

      // 1. Z-Hierarchy Layering (Storytelling Depth)
      const depthElements = document.querySelectorAll('[data-z-depth]')
      depthElements.forEach(el => {
        const depth = parseFloat(el.getAttribute('data-z-depth')) || 0
        // Parallax scaling: depth determines how much the Z moves per scroll
        const zValue = depth - (scroll * 0.05) 
        gsap.set(el, { z: zValue, translateZ: zValue })
      })

      // 2. Variable Font-Weight Sync (Editorial Breath)
      const headers = document.querySelectorAll('.sec-h2, .hero-h1')
      headers.forEach(h => {
        const rect = h.getBoundingClientRect()
        const centerDist = Math.abs((window.innerHeight / 2) - (rect.top + rect.height / 2))
        const focus = 1.0 - Math.min(centerDist / (window.innerHeight / 1.5), 1.0)
        // Weight shifts from 400 (unfocused) to 800 (perfect focus)
        const weight = 400 + (focus * 400)
        const stretch = 100 + (focus * 20)
        gsap.set(h, { 
          '--font-weight': weight, 
          '--font-stretch': `${stretch}%`,
          skewY: velocity * 0.012 
        })
      })

      // 3. Update scroll progress indicator
      const totalScrollable = document.body.scrollHeight - window.innerHeight
      const pct = Math.round((scroll / Math.max(totalScrollable, 1)) * 100)
      const fill = document.getElementById('scroll-progress-fill')
      const pctEl = document.getElementById('scroll-pct')
      if (fill) fill.style.height = pct + '%'
      if (pctEl) pctEl.textContent = pct

      // 4. Progress bar (horizontal & vertical)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progressPct = Math.min(100, (scroll / Math.max(maxScroll, 1)) * 100)
      
      if (this._progressBar) {
        this._progressBar.style.width = progressPct + '%'
      }

      const vFill = document.getElementById('v-progress-fill')
      if (vFill) {
        vFill.style.height = progressPct + '%'
      }
    })
  }

  addObjects() {
    // Objects are added by ScrollScene, no manual fog override needed here
  }



  initScrollScene() {
    this.scrollScene = new ScrollScene(this.scene, this.camera, this.renderer)
  }

  initScrollStory() {
    // Wait for objects to exist
    if (!this.scrollScene?.objects?.length) return

    const obj0 = this.scrollScene.objects[0]  // TorusKnot
    const obj1 = this.scrollScene.objects[1]  // Icosahedron
    const obj2 = this.scrollScene.objects[2]  // Octahedron

    // HERO: TorusKnot rotates Y by full 2π as user scrolls 300vh hero
    gsap.to(obj0.rotation, {
      y: Math.PI * 2,
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
      }
    })

    // CAMERA SYNCHRONIZATION: Tie camera Y to the exact HTML sections to eliminate overlaps.
    gsap.to(this.scrollScene.camera.position, {
      y: -this.scrollScene.sectionHeight,
      scrollTrigger: {
        trigger: '#about',
        start: 'top bottom',
        end: 'top top',
        scrub: true
      }
    })
    
    gsap.to(this.scrollScene.camera.position, {
      y: -this.scrollScene.sectionHeight * 2,
      scrollTrigger: {
        trigger: '#services',
        start: 'top bottom',
        end: 'top top',
        scrub: true
      }
    })

    // ABOUT: Icosahedron approaches camera (Z moves forward) + scales up
    gsap.fromTo(obj1.position,
      { z: 1.5 },
      {
        z: -0.8,
        scrollTrigger: {
          trigger: '#about',
          start: 'top 70%',
          end: 'bottom 30%',
          scrub: 2,
        }
      }
    )
    gsap.fromTo(obj1.scale,
      { x: 0.85, y: 0.85, z: 0.85 },
      {
        x: 1.05, y: 1.05, z: 1.05,
        scrollTrigger: {
          trigger: '#about',
          start: 'top 70%',
          end: 'bottom 30%',
          scrub: 2,
        }
      }
    )

    // SERVICES: Octahedron tips on Z (diamond tips sideways as you read)
    gsap.to(obj2.rotation, {
      z: Math.PI,
      scrollTrigger: {
        trigger: '#services',
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 3,
      }
    })
  }

  initTextAnimations() {
    // ── 1. GRADIENT SWEEP on section headings ──────────────────────────────
    const sweepObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('swept')
          sweepObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.25 })

    document.querySelectorAll('.sec-h2, .about-quote h2').forEach(el => {
      sweepObserver.observe(el)
    })

    // ── 2. WORD STAGGER REVEAL on body text (manual split — NOT SplitType) ─
    const wordTargets = document.querySelectorAll('.sbody, .svc-intro, .about-text p')

    wordTargets.forEach(el => {
      if (el.dataset.wordSplit) return
      el.dataset.wordSplit = '1'
      const text = el.textContent.trim()
      if (text.split(/\s+/).length < 3) return
      const words = text.split(/\s+/)
      el.innerHTML = words.map(w =>
        `<span class="word-wrap"><span class="word">${w}</span></span>`
      ).join(' ')
    })

    const wordObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const words = entry.target.querySelectorAll('.word')
        words.forEach((w, i) => {
          w.style.transitionDelay = Math.min(i * 0.038, 0.85) + 's'
          w.classList.add('word-in')
        })
        wordObserver.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' })

    wordTargets.forEach(el => wordObserver.observe(el))

    // ── 3. HERO CHAR SCATTER (anime.js) ────────────────────────────────────
    this._runHeroCharScatter = () => {
      if (typeof anime === 'undefined') {
        console.warn('anime.js not loaded — skipping char scatter')
        return
      }
      const heroH1 = document.querySelector('.hero-h1')
      if (!heroH1) return

      // Split text spans into .char elements (manual — NOT SplitType)
      heroH1.querySelectorAll('span:not(.char):not([style])').forEach(span => {
        if (span.querySelector('.char')) return
        const chars = span.textContent.split('')
        span.innerHTML = chars.map(c =>
          c.trim()
            ? `<span class="char">${c}</span>`
            : `<span style="display:inline-block;min-width:0.28em"> </span>`
        ).join('')
      })

      // Start invisible
      heroH1.querySelectorAll('.char').forEach(c => { c.style.opacity = '0' })

      // Scatter → origin
      anime({
        targets: '.hero-h1 .char',
        opacity: [0, 1],
        translateX: [() => anime.random(-380, 380), 0],
        translateY: [() => anime.random(-260, 260), 0],
        rotate: [() => anime.random(-55, 55), 0],
        scale: [0.25, 1],
        duration: 960,
        delay: anime.stagger(16, { start: 180 }),
        easing: 'easeOutExpo',
      })
    }
  }

  initScrollAnimations() {
    ScrollTrigger.create({
      start: 80,
      onUpdate: self => {
        document.getElementById('nav')?.classList.toggle('stuck', self.progress > 0)
      }
    })

    this.initStatCounters()

    // Service row stagger
    gsap.from('.svc-row', {
      x: -40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.svc-list',
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    })

    // Section label reveals
    document.querySelectorAll('.sec-label').forEach(el => {
      gsap.from(el, {
        opacity: 0,
        x: -20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      })
    })
  }

  initHeroEntrance() {
    const heroContent = document.querySelector('.hero-content')
    const h1 = document.querySelector('.hero-h1')
    if (!heroContent || !h1) return

    gsap.set('#nav', { y: -80, opacity: 0 })

    const heroSplit = new SplitType(h1, { types: 'lines' })
    heroSplit.lines.forEach(line => {
      const wrap = document.createElement('div')
      wrap.classList.add('line-wrap')
      line.parentNode.insertBefore(wrap, line)
      wrap.appendChild(line)
    })

    const tl = gsap.timeline()
    tl.from(heroSplit.lines, {
      yPercent: 105,
      duration: 1.1,
      stagger: 0.12,
      ease: 'power4.out',
      delay: 0.2
    })
    tl.from('.hero-services', {
      opacity: 0,
      y: 16,
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.6')
    tl.from('.hero-ctas', {
      opacity: 0,
      y: 16,
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.5')
    tl.from('.scroll-hint', {
      opacity: 0,
      duration: 0.6
    }, '-=0.3')

    tl.to('#nav', {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.4')

    // Hero char scatter animation (anime.js)
    setTimeout(() => this._runHeroCharScatter?.(), 280)
  }

  initStatCounters() {
    document.querySelectorAll('.stat-n').forEach(el => {
      const text = el.textContent
      const targetValue = parseInt(text)
      const suffix = text.replace(/[0-9]/g, '')
      el.textContent = '0' + suffix

      gsap.to({ val: 0 }, {
        val: targetValue,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el.closest('.stat-row'),
          start: 'top 80%',
          once: true
        },
        onUpdate: function () {
          el.textContent = Math.floor(this.targets()[0].val) + suffix
        }
      })
    })
  }

  initSplitType() {
    document.querySelectorAll('.split-heading:not(.hero-h1), .split-sub').forEach(el => {
      const split = new SplitType(el, { types: 'lines' })
      split.lines.forEach(line => {
        const wrap = document.createElement('div')
        wrap.classList.add('line-wrap')
        line.parentNode.insertBefore(wrap, line)
        wrap.appendChild(line)
      })
      gsap.from(split.lines, {
        yPercent: 105,
        duration: 0.9,
        stagger: 0.07,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      })
    })
  }

  initCursor() {
    const cd = document.getElementById('cd')
    const cr = document.getElementById('cr')
    if (!cd || !cr) return

    // QuickTo for high performance fluid tracking
    const xToDot = gsap.quickTo(cd, 'x', { duration: 0.02, ease: 'power3' })
    const yToDot = gsap.quickTo(cd, 'y', { duration: 0.02, ease: 'power3' })
    const xToRing = gsap.quickTo(cr, 'x', { duration: 0.15, ease: 'power3' })
    const yToRing = gsap.quickTo(cr, 'y', { duration: 0.15, ease: 'power3' })

    // Global listener ensures cursor follows across the entire window
    window.addEventListener('mousemove', e => {
      // Fix centring issues
      xToDot(e.clientX)
      yToDot(e.clientY)
      xToRing(e.clientX)
      yToRing(e.clientY)
    })

    // Init position centering globally
    gsap.set(cd, { xPercent: -50, yPercent: -50 })
    gsap.set(cr, { xPercent: -50, yPercent: -50 })

    this._cd = cd
    this._cr = cr

    document.querySelectorAll('a, button, .mag, .ftab, .proj-row-v2').forEach(el => {
      el.addEventListener('mouseenter', () => { 
        cd.classList.add('on-link')
        cr.classList.add('on-link')
        gsap.to(cr, { scale: 1.5, opacity: 0.1, duration: 0.3 }) 
      })
      el.addEventListener('mouseleave', () => { 
        cd.classList.remove('on-link')
        cr.classList.remove('on-link')
        gsap.to(cr, { scale: 1, opacity: 0.35, duration: 0.4 })
      })
    })
  }

  initMagnetic() {
    const magElements = document.querySelectorAll('.mag, .btn-primary, .btn-secondary, .nav-logo, .footer-logo')
    magElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        // Editorial Precision: 0.45x pull for subtle premium feel
        gsap.to(el, {
          x: x * 0.45,
          y: y * 0.45,
          duration: 0.6,
          ease: 'power2.out'
        })
      })
      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 1.0,
          ease: 'elastic.out(1, 0.3)'
        })
      })
    })
  }

  initCharacterWave() {
    const targets = document.querySelectorAll('.char-wave')
    targets.forEach(el => {
      const text = el.textContent.trim()
      el.innerHTML = text.split('').map((char, i) => 
        `<span style="--i: ${i}; display:inline-block">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('')
    })
  }

  initPreloader() {
    const pre = document.getElementById('preloader')
    const count = document.getElementById('pre-count')
    if (!pre || !count) return
    document.body.style.overflow = 'hidden'

    const start = performance.now()
    const duration = 1800

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      count.textContent = Math.floor(eased * 100)

      const barFill = document.getElementById('pre-bar-fill')
      if (barFill) barFill.style.width = (eased * 100) + '%'

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        count.textContent = '100'
        setTimeout(() => {
          gsap.to(pre, {
            clipPath: 'inset(0 0 100% 0)',
            duration: 1.0,
            ease: 'power3.inOut',
            onComplete: () => {
              if (pre) pre.style.display = 'none'
              document.body.style.overflow = 'visible'
              document.documentElement.style.overflow = 'visible'
              this.lenis?.resize()
              this.initHeroEntrance()
            }
          })
        }, 200)
      }
    }
    requestAnimationFrame(tick)
  }

  initProjectGrid() {
    const grid = document.getElementById('project-grid')
    if (!grid) return

    // ── CURSOR-FOLLOWING IMAGE SETUP ──────────────────────────────────────
    const cursorImg = document.getElementById('proj-cursor-img')
    const cursorImgEl = document.getElementById('proj-cursor-img-el')
    let imgX = window.innerWidth / 2
    let imgY = window.innerHeight / 2
    let targetX = imgX, targetY = imgY

    // Continuous lerp loop for smooth image follow
    const lerpStep = () => {
      imgX += (targetX - imgX) * 0.1
      imgY += (targetY - imgY) * 0.1
      if (cursorImg) {
        cursorImg.style.left = imgX + 'px'
        cursorImg.style.top = imgY + 'px'
      }
      requestAnimationFrame(lerpStep)
    }
    lerpStep()

    // Track cursor in the work section
    const workEl = document.getElementById('work')
    workEl?.addEventListener('mousemove', e => {
      targetX = e.clientX
      targetY = e.clientY
    })

    // ── RENDER ROWS ────────────────────────────────────────────────────────
    const render = (filter = 'all') => {
      const list = filter === 'all'
        ? PROJECTS
        : PROJECTS.filter(p => p.cat === filter)

      grid.innerHTML = list.map((p, i) => `
        <div class="proj-row-v2" data-cat="${p.cat}" data-img="${p.img}" data-idx="${i}">
          <span class="proj-bg-num" aria-hidden="true">0${i + 1}</span>
          <div class="proj-row-inner">
            <div class="proj-idx-col">
              <span class="proj-serial mono-xs">${String(i + 1).padStart(2, '0')}</span>
            </div>
            <div class="proj-title-col">
              <h3 class="proj-title">${p.title}</h3>
              <span class="proj-tags-reveal mono-xs">${(p.tags || []).slice(0, 3).join(' · ')}</span>
            </div>
            <div class="proj-meta-col">
              <span class="proj-cat-tag">${p.cat.toUpperCase()}</span>
              <span class="proj-year mono-xs">2025</span>
              <span class="proj-arrow">→</span>
            </div>
          </div>
        </div>
      `).join('')

      // ── HOVER EVENTS: show cursor-following image ───────────────────────
      grid.querySelectorAll('.proj-row-v2').forEach(row => {
        row.addEventListener('mouseenter', () => {
          const src = row.dataset.img
          if (cursorImgEl && src) {
            cursorImgEl.src = src
          }
          cursorImg?.classList.add('active')
        })
        row.addEventListener('mouseleave', () => {
          cursorImg?.classList.remove('active')
        })
      })

      // ── GSAP STAGGER ENTRANCE ───────────────────────────────────────────
      const rows = grid.querySelectorAll('.proj-row-v2')
      if (rows.length) {
        gsap.from(rows, {
          y: 48,
          opacity: 0,
          duration: 0.8,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: grid,
            start: 'top 88%',
          }
        })
      }
    }

    render()

    // ── FILTER TABS ────────────────────────────────────────────────────────
    document.querySelectorAll('.ftab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        render(tab.getAttribute('data-filter'))
      })
    })
  }

  initContactForm() {
    const form = document.getElementById('contact-form')
    const success = document.getElementById('form-success')
    if (!form || !success) return

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const btn = form.querySelector('button')
      const originalText = btn.textContent
      btn.textContent = 'SENDING...'
      btn.disabled = true

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })

      setTimeout(() => {
        gsap.to(form, {
          opacity: 0,
          y: -20,
          duration: 0.6,
          onComplete: () => {
            form.style.display = 'none'
            success.style.display = 'block'
            gsap.from(success, { opacity: 0, y: 20, duration: 0.8 })
          }
        })
      }, 1200)
    })
  }

  initMobileMenu() {
    const burger = document.getElementById('nav-hamburger')
    const mm = document.getElementById('mm')
    const close = document.getElementById('mm-close')
    if (!burger || !mm || !close) return

    const openMenu = () => {
      mm.classList.add('open')
      document.body.style.overflow = 'hidden'
    }

    const closeMenu = () => {
      mm.classList.remove('open')
      document.body.style.overflow = ''
    }

    burger.addEventListener('click', openMenu)
    close.addEventListener('click', closeMenu)

    mm.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu)
    })

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu()
    })

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu()
    })
  }

  render() {
    // 0. Render Culling (Battery Saver)
    if (document.hidden) {
      requestAnimationFrame(() => this.render())
      return
    }

    this.stats?.begin()
    const delta = this.clock.getDelta()

    if (this._cr) {
      // Robust lerp logic with FPS-independent delta
      const lerpFactor = 1 - Math.pow(0.02, delta)
      this.cursorX += (this.cursorTargetX - this.cursorX) * lerpFactor
      this.cursorY += (this.cursorTargetY - this.cursorY) * lerpFactor
      // Use GSAP for the final transform with percentage centering
      gsap.set(this._cr, { x: this.cursorX, y: this.cursorY, xPercent: -50, yPercent: -50 })
    }

    this.elapsedTime += delta

    const mouseXNorm = this.cursorTargetX / window.innerWidth
    const mouseYNorm = 1.0 - (this.cursorTargetY / window.innerHeight)

    this.scrollScene?.update(delta, this.elapsedTime)

    this.renderer.render(this.scene, this.camera)
    this.stats?.end()
    requestAnimationFrame(() => this.render())
  }

  initMagnetic() {
    const buttons = document.querySelectorAll('.btn')
    document.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect()
        const btnX = rect.left + rect.width / 2
        const btnY = rect.top + rect.height / 2
        
        const dist = Math.hypot(clientX - btnX, clientY - btnY)
        const limit = 80 // Magnetic reach
        
        if (dist < limit) {
          const strength = 18
          const x = (clientX - btnX) / limit * strength
          const y = (clientY - btnY) / limit * strength
          gsap.to(btn, { x, y, duration: 0.6, ease: 'power2.out' })
        } else {
          gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' })
        }
      })
    })
  }

  destroy() {
    this.lenis?.destroy()
    ScrollTrigger.killAll()
    this.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
    this.scrollScene?.dispose()
    this.renderer.dispose()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window._engine = new CreativeEngine()
})
