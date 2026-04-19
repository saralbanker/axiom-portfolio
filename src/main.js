import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

class CreativeEngine {
  constructor() {
    this.initElements()
    this.initLenis()
    this.initTransitions()
    this.initParticles()
    this.initGlobalInteractions()
    this.initParallax()
    this.initNavAnimations()
    this.initHorizontalScroll()
    this.render()
  }

  initElements() {
    this.hero = document.getElementById('hero')
    this.canvas = document.getElementById('particle-canvas')
    this.ctx = this.canvas?.getContext('2d')
    this.crystalGroup = document.querySelector('.layer-crystal-group')
    this.typographyLayers = document.querySelectorAll('.layer-typography, .layer-typography-top')
    this.curtain = document.querySelector('.transition-curtain')
    this.preloaderCounter = document.querySelector('.preloader-counter')
    this.customCursor = document.querySelector('.custom-cursor')
    this.customCursorDot = document.querySelector('.custom-cursor-dot')
    this.ambientOrb = document.querySelector('.ambient-orb')
    this.progressBar = document.querySelector('.scroll-progress-bar')
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    this.isHeroVisible = true
    if (this.hero) {
      const heroObserver = new IntersectionObserver((entries) => {
        this.isHeroVisible = entries[0].isIntersecting
      }, { threshold: 0 })
      heroObserver.observe(this.hero)
    }
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    })

    const raf = (time) => {
      this.lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }

  initTransitions() {
    // Entry Animation with numeric preloader
    if (this.curtain) {
      let loader = { progress: 0 };
      gsap.to(loader, {
        progress: 100,
        duration: 2.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (this.preloaderCounter) {
            this.preloaderCounter.innerText = Math.floor(loader.progress) + '%';
          }
        },
        onComplete: () => {
          // Fade out counter before curtain lifts
          gsap.to(this.preloaderCounter, { opacity: 0, duration: 0.4 });
          
          gsap.to(this.curtain, {
            yPercent: -100,
            duration: 1.2,
            delay: 0.2,
            ease: 'expo.inOut',
            onComplete: () => {
              document.body.classList.remove('is-loading')
            }
          })
        }
      });
    }

    this.bindLinks();
  }

  bindLinks() {
    // Vanilla AJAX Router for Zero-Latency Transitions
    document.querySelectorAll('a').forEach(link => {
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      const href = newLink.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.includes('://')) return;
      
      newLink.addEventListener('mouseenter', () => {
         if (!window.prefetchCache) window.prefetchCache = new Map();
         if (!window.prefetchCache.has(href)) {
            window.prefetchCache.set(href, fetch(href).then(res => res.text()));
         }
      });

      newLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = href;
        const fetchPromise = window.prefetchCache?.get(target) || fetch(target).then(res => res.text());

        gsap.to(this.curtain, {
          yPercent: 0,
          duration: 0.6,
          ease: 'expo.inOut',
          onComplete: async () => {
             try {
                 const html = await fetchPromise;
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(html, 'text/html');
                 const newMain = doc.querySelector('main.ui-layer');
                 
                 if (newMain) {
                     document.querySelector('main.ui-layer').innerHTML = newMain.innerHTML;
                     document.title = doc.title;
                     history.pushState(null, '', target);
                     
                     // Engine Reset
                     ScrollTrigger.getAll().forEach(t => t.kill());
                     this.initElements();
                     this.initParticles();
                     this.initGlobalInteractions();
                     this.initParallax();
                     this.initNavAnimations();
                     this.initHorizontalScroll();
                     this.bindLinks();
                     
                     window.scrollTo(0, 0);
                 } else {
                     window.location.href = target;
                 }
             } catch(err) {
                 window.location.href = target;
             }

             gsap.to(this.curtain, {
               yPercent: -100,
               duration: 0.8,
               ease: 'expo.inOut'
             });
          }
        });
      });
    });

    window.onpopstate = () => window.location.reload();
  }

  initParticles() {
    if (!this.canvas) return
    this.resizeCanvas()
    this.particles = []
    
    // Dynamic Density
    const count = Math.min(600, Math.floor(window.innerWidth / 5)) 
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.8 + 0.3,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.7 + 0.1,
        flickerSpeed: Math.random() * 0.02 + 0.005,
        flickerOffset: Math.random() * Math.PI * 2,
      })
    }
    
    window.addEventListener('resize', () => {
      this.resizeCanvas()
      this.initParticles() // Corrected: re-run init on resize
    })
  }

  resizeCanvas() {
    if (!this.canvas) return
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  initParallax() {
    // Cinematic background parallax across all sections
    document.querySelectorAll('.scroll-section').forEach(section => {
      const bg = section.querySelector('.layer-bg img')
      if (bg) {
        // Multiplied Depth Parallax: -35% to 35% with visual scaling
        gsap.set(bg, { scale: 1.15 });
        gsap.fromTo(bg, { yPercent: -35 }, {
          yPercent: 35,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        })
      }
      
      // Universal sticky overlapping scroll reveal for Hero sections
      if (section.id === 'hero') {
         ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'max',
            pin: true,
            pinSpacing: false
         });
      }
      
      // Section fade-in replacement with cinematic clip-path wipe
      if (section.id !== 'hero') {
         gsap.fromTo(section, 
           { opacity: 0, y: 40, clipPath: 'inset(10% 0% 10% 0%)' }, 
           {
            opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'power2.out',
            scrollTrigger: {
               trigger: section,
               start: 'top 80%',
               end: 'top 40%',
               scrub: 1
            }
         })
      }
    })

    if (this.hero) {
      // Hero specific scroll-driven animations
      const heroBg = this.hero.querySelector('.layer-bg img');
      if (heroBg) {
        gsap.to(heroBg, {
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: this.hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      if (this.crystalGroup) {
        gsap.to(this.crystalGroup, {
          y: () => -window.innerHeight * 0.12,
          scale: 0.95,
          ease: 'none',
          scrollTrigger: {
            trigger: this.hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      if (this.typographyLayers.length > 0) {
        // Exploding Text Effect on Scroll
        const textBack = this.hero.querySelector('.layer-typography .hero-text');
        const textFront = this.hero.querySelector('.layer-typography-top .hero-text');
        
        if (textBack) {
          const splitBack = new SplitType(textBack, { types: 'chars' });
          let splitFront = null;
          if (textFront) splitFront = new SplitType(textFront, { types: 'chars' });
          
          splitBack.chars.forEach((char, i) => {
             // Calculate a true 360-degree radial blast using the letter's index
             const angle = (i / splitBack.chars.length) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
             const distance = Math.random() * window.innerWidth * 0.4 + 150;
             
             // Guarantee they move outward in a perfect circle/ellipse
             const rx = Math.cos(angle) * distance;
             const ry = Math.sin(angle) * (distance * 0.8);
             const rRot = (Math.random() - 0.5) * 180;
             const rScale = Math.random() * 2 + 0.5;
             
             const targets = [char];
             if (splitFront && splitFront.chars[i]) targets.push(splitFront.chars[i]);

             gsap.to(targets, {
               x: rx,
               y: ry,
               rotationZ: rRot,
               opacity: 0,
               scale: rScale, 
               ease: 'power2.out',
               scrollTrigger: {
                 trigger: '#about', // Triggers when "Visionary Edge" slides in
                 start: 'top 95%',
                 end: 'top 15%',
                 scrub: true
               }
             });
          });
        }
      }

      // Mouse-follow logic for Home page crystal with dampening (lerp)
      const crystalMain = document.querySelector('.crystal-main');
      const crystalGlow = document.querySelector('.crystal-glow');
      
      if (crystalMain) {
        const xTo = gsap.quickTo([crystalMain, crystalGlow], "x", {duration: 1.2, ease: "power3.out"})
        const yTo = gsap.quickTo([crystalMain, crystalGlow], "y", {duration: 1.2, ease: "power3.out"})

        this.hero.addEventListener('mousemove', (e) => {
          const mx = (e.clientX / window.innerWidth - 0.5)
          const my = (e.clientY / window.innerHeight - 0.5)
          xTo(mx * 25)
          yTo(my * 15)
        })
      }
    }
  }

  initGlobalInteractions() {
    // Custom Cursor & Ambient Orb tracking
    if (this.customCursor && this.customCursorDot) {
      document.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        
        gsap.to(this.customCursor, { x: this.mouse.x, y: this.mouse.y, duration: 0.2, ease: 'power2.out' });
        gsap.to(this.customCursorDot, { x: this.mouse.x, y: this.mouse.y, duration: 0.05, ease: 'power2.out' });
        
        if (this.ambientOrb) {
          gsap.to(this.ambientOrb, { x: this.mouse.x, y: this.mouse.y, duration: 1.5, ease: 'power3.out' });
        }
      });

      // Hover states
      const interactables = document.querySelectorAll('a, button, .project-card, .btn-primary');
      interactables.forEach(el => {
        el.addEventListener('mouseenter', () => this.customCursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => this.customCursor.classList.remove('hovering'));
      });
    }

    // Scroll Progress Bar
    if (this.progressBar) {
      gsap.to(this.progressBar, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3
        }
      });
    }

    // Number counters interpolation
    const numberCards = document.querySelectorAll('.card-num');
    numberCards.forEach(card => {
      const targetInt = parseInt(card.innerText, 10);
      if (!isNaN(targetInt)) {
        let proxy = { val: 0 };
        card.innerText = '00';
        gsap.to(proxy, {
          val: targetInt,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%' },
          onUpdate: () => {
            card.innerText = Math.floor(proxy.val).toString().padStart(2, '0');
          }
        });
      }
    });

    // Advanced Proximal Magnetic Buttons
    const magnets = document.querySelectorAll('.btn-primary, .pill-nav a');
    magnets.forEach(btn => {
      // Create a invisible proximal zone if needed, or use distance calc
      document.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        const triggerDistance = 120; // Expanded orbital radius
        
        if (distance < triggerDistance) {
          const power = (triggerDistance - distance) / triggerDistance;
          const x = distanceX * 0.35 * power;
          const y = distanceY * 0.35 * power;
          gsap.to(btn, { x, y, scale: 1.05, duration: 0.4, ease: 'power2.out' });
          if (this.customCursor) this.customCursor.classList.add('hovering');
        } else {
          gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
        }
      });
    });
  }

  initNavAnimations() {
    const navLinks = document.querySelectorAll('.pill-nav a')
    navLinks.forEach(link => {
      link.addEventListener('mousemove', (e) => {
        const rect = link.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        gsap.to(link, { x, y, scale: 1.08, backgroundColor: 'rgba(255, 255, 255, 0.08)', duration: 0.4, ease: 'power2.out' });
      });
      link.addEventListener('mouseleave', () => {
        const isActive = link.classList.contains('active')
        const bg = isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0)'
        gsap.to(link, { x: 0, y: 0, scale: 1, backgroundColor: bg, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
      })
    })
  }

  initHorizontalScroll() {
    const horizontalTrigger = document.querySelector('.horizontal-trigger')
    const horizontalContainer = document.querySelector('.horizontal-scroll-container')
    
    if (horizontalTrigger && horizontalContainer) {
      gsap.to(horizontalContainer, {
        x: () => -(horizontalContainer.scrollWidth - window.innerWidth + 100),
        ease: 'none',
        scrollTrigger: {
          trigger: horizontalTrigger,
          start: 'top top',
          end: () => `+=${horizontalContainer.scrollWidth}`,
          scrub: true,
          pin: true,
          anticipatePin: 1
        }
      })
    }
  }

  drawParticles(time) {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (const p of this.particles) {
      p.x += p.speedX
      p.y += p.speedY
      if (p.x < 0) p.x = this.canvas.width
      if (p.x > this.canvas.width) p.x = 0
      if (p.y < 0) p.y = this.canvas.height
      if (p.y > this.canvas.height) p.y = 0

      const flicker = Math.sin(time * p.flickerSpeed + p.flickerOffset) * 0.4 + 0.6
      const alpha = p.opacity * flicker
      
      // Core Bright Particle
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.fill()
      
      // Performant GPU Glow (rendered as a larger faded circle)
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(180, 200, 255, ${alpha * 0.25})`
      this.ctx.fill()
    }
  }

  render = (time = 0) => {
    if (this.isHeroVisible) {
      this.drawParticles(time)
    }
    requestAnimationFrame(this.render)
  }
}

new CreativeEngine()
