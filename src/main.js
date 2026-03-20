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

    // Cursor lerp values
    this.cursorX = 0; this.cursorY = 0
    this.cursorTargetX = 0; this.cursorTargetY = 0
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
    this.initRenderer()
    this.initScene()
    this.initLenis()
    this.addObjects()
    this.initScrollScene()
    this.initScrollStory()
    this.initScrollAnimations()
    this.initCursor()
    this.initMagnetic()
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
      }).catch(() => {})
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
    this.scene.fog = new THREE.FogExp2(0xF2EDE4, 0.04)
    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 100
    )
    this.camera.position.set(0, 0, 5)
  }

  initLenis() {
    this.lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    this.lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { this.lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)
    this.lenis.on('scroll', ({ scroll, velocity }) => {
      this.scrollVelocity = velocity
      this.scrollScene?.setScroll(scroll, velocity)

      // Update scroll progress indicator
      const totalScrollable = document.body.scrollHeight - window.innerHeight
      const pct = Math.round((scroll / Math.max(totalScrollable, 1)) * 100)
      const fill = document.getElementById('scroll-progress-fill')
      const pctEl = document.getElementById('scroll-pct')
      if (fill) fill.style.height = pct + '%'
      if (pctEl) pctEl.textContent = pct
    })
  }

  addObjects() {
    this.scene.fog = new THREE.FogExp2(0xF2EDE4, 0.05)
  }



  initScrollScene() {
    this.scrollScene = new ScrollScene(this.scene, this.camera)
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
        onUpdate: function() {
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

    document.addEventListener('mousemove', e => {
      this.cursorTargetX = e.clientX
      this.cursorTargetY = e.clientY
      cd.style.transform = `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`
    })

    this._cd = cd
    this._cr = cr

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => { cd.classList.add('on-link'); cr.classList.add('on-link') })
      el.addEventListener('mouseleave', () => { cd.classList.remove('on-link'); cr.classList.remove('on-link') })
    })
  }

  initMagnetic() {
    document.querySelectorAll('.mag').forEach(el => {
      const strength = 0.38
      const radius = 120

      el.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < radius) {
          gsap.to(this, {
            x: dx * strength,
            y: dy * strength,
            duration: 0.4,
            ease: 'power2.out',
          })
        }
      })

      el.addEventListener('mouseleave', function() {
        gsap.to(this, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.4)',
        })
      })
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

    const render = (filter = 'all') => {
      const filtered = filter === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === filter)
      grid.innerHTML = filtered.map((p, i) => `
        <div class="proj-row" data-cat="${p.cat}">
          <div class="proj-num mono-xs">0${i + 1}</div>
          <div class="proj-title Cormorant">${p.title}</div>
          <div class="proj-meta">
            <span class="proj-cat mono-xs">${p.cat.toUpperCase()}</span>
            <span class="proj-year mono-xs">2025</span>
          </div>
          <div class="proj-img-reveal">
            <img src="${p.img}" alt="${p.title}" loading="lazy">
          </div>
        </div>
      `).join('')

      const rows = grid.querySelectorAll('.proj-row')
      rows.forEach((row, index) => {
        row.addEventListener('mouseenter', () => {
          this.scrollScene?.highlightPlane(index)
        })
        row.addEventListener('mouseleave', () => {
          this.scrollScene?.resetHighlight()
        })
      })

      gsap.from(rows, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%'
        }
      })
    }

    render()

    // Filter tabs
    document.querySelectorAll('.ftab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        const filter = tab.getAttribute('data-filter')
        render(filter)
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
    this.stats?.begin()
    const delta = this.clock.getDelta()

    if (this._cr) {
      this.cursorX += (this.cursorTargetX - this.cursorX) * (1 - Math.pow(0.06, delta))
      this.cursorY += (this.cursorTargetY - this.cursorY) * (1 - Math.pow(0.06, delta))
      this._cr.style.transform = `translate(${this.cursorX - 20}px, ${this.cursorY - 20}px)`
    }

    this.elapsedTime += delta
    
    const mouseXNorm = this.cursorTargetX / window.innerWidth
    const mouseYNorm = 1.0 - (this.cursorTargetY / window.innerHeight)
    
    this.scrollScene?.update(delta, this.elapsedTime)
    
    this.renderer.render(this.scene, this.camera)
    this.stats?.end()
    requestAnimationFrame(() => this.render())
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
