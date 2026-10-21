// ========================
// LOADER & PAGE INIT
// ========================

window.addEventListener('load', () => {
    const loader = document.querySelector('.loader');
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 1500);
});

// ========================
// CUSTOM CURSOR - NUR DESKTOP
// ========================

const isDesktop = window.matchMedia('(pointer:fine)').matches;

if (window.matchMedia("(min-width: 969px)").matches) {
    const cursor = document.querySelector('.cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    
    if (cursor && cursorDot) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = (e.clientX - 10) + 'px';
            cursor.style.top = (e.clientY - 10) + 'px';
            cursorDot.style.left = (e.clientX - 4) + 'px';
            cursorDot.style.top = (e.clientY - 4) + 'px';
        });
        // Scroll Progress Bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById("scrollProgress").style.width = scrolled + "%";
});

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .btn, .service-card, input, textarea');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
    }
}

// ========================
// PARTICLE CANVAS ANIMATION
// ========================

const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Performance-Optimierung: Weniger Partikel auf Mobile
const particleCount = window.innerWidth < 768 ? 40 : 80;
const particles = [];
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}


function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        for (let j = index + 1; j < particles.length; j++) {
            const dx = particles[j].x - particle.x;
            const dy = particles[j].y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 * (1 - distance / 150)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    });

    requestAnimationFrame(drawParticles);
}

drawParticles();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ========================
// TYPEWRITER EFFECT
// ========================

const typewriterElement = document.getElementById('typewriter');
const texts = [
    'Ich schaffe wunderschöne digitale Erlebnisse.',
    'Ich entwickle moderne Websites.',
    'Ich kreiere innovative Lösungen.'
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typewrite() {
    const currentText = texts[textIndex];
    
    if (isDeleting) {
        typewriterElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typewriterElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        setTimeout(typewrite, 2000);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        setTimeout(typewrite, 500);
    } else {
        setTimeout(typewrite, isDeleting ? 50 : 100);
    }
}

typewrite();

// ========================
// NAVBAR SCROLL EFFECT
// ========================

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Active nav link
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const navLinks = document.querySelectorAll('.nav-links a');

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.style.color = '';
                const href = link.getAttribute('href');
                if (href === '#' + section.id) {
                    link.style.color = '#6366f1';
                }
            });
        }
    });
});

// ========================
// SMOOTH SCROLL
// ========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================
// SCROLL REVEAL ANIMATION
// ========================

const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
});

// ========================
// SKILL BARS ANIMATION
// ========================

const skillObserverOptions = {
    threshold: 0.5
};

const skillObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progressBars = entry.target.querySelectorAll('.skill-progress');
            progressBars.forEach(bar => {
                const width = bar.getAttribute('data-width');
                bar.style.width = width + '%';
            });
            skillObserver.unobserve(entry.target);
        }
    });
}, skillObserverOptions);

const skillsSection = document.querySelector('.skills');
if (skillsSection) {
    skillObserver.observe(skillsSection);
}

// ========================
// COUNTER ANIMATION
// ========================

const counters = document.querySelectorAll('[data-count]');

const counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const finalValue = parseInt(target.getAttribute('data-count'));
            let currentValue = 0;
            const increment = finalValue / 60;

            const updateCounter = () => {
                currentValue += increment;
                if (currentValue < finalValue) {
                    target.textContent = Math.ceil(currentValue);
                    setTimeout(updateCounter, 50);
                } else {
                    target.textContent = finalValue;
                }
            };

            updateCounter();
            counterObserver.unobserve(target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => {
    counterObserver.observe(counter);
});

// ========================
// PARALLAX EFFECT
// ========================

const heroImage = document.querySelector('.hero-image');

if (heroImage) {
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        heroImage.style.transform = `translateY(${scrollPosition * 0.5}px)`;
    });
}

// ========================
// 3D TILT EFFECT (Service Cards)
// ========================

const serviceCards = document.querySelectorAll('.service-card');

serviceCards.forEach(card => {
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
});


// ========================
// THEME & LANGUAGE SYSTEM
// ========================

const translations = {
    de: {
        available: 'Verfügbar für Freelance-Arbeiten',
        greeting: 'Hi, ich bin',
        bio: 'Ich kreiere schöne, funktionale und nutzerzentrierte digitale Erlebnisse.',
        contactBtn: 'Kontakt',
        aboutBtn: 'Über mich',
        servicesBtn: 'Services',
        testimonialsBtn: 'Testimonials',
        skillsBtn: 'Fähigkeiten',
        contactSectionBtn: 'Kontakt'
    },
    en: {
        available: 'Available for freelance work',
        greeting: 'Hi, I am',
        bio: 'I create beautiful, functional, and user-centered digital experiences.',
        contactBtn: 'Contact',
        aboutBtn: 'About',
        servicesBtn: 'Services',
        testimonialsBtn: 'Testimonials',
        skillsBtn: 'Skills',
        contactSectionBtn: 'Contact'
    }
};

let currentLanguage = 'de';

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    // You can add language switching logic here
}

// ========================
// MOBILE MENU
// ========================

const mobileMenuBtn = document.getElementById('meno');
const navLinks = document.querySelector('.nav-links');
const navContainer = document.querySelector('.nav-container');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Close mobile menu wenn außerhalb geklickt wird
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
        navLinks.classList.remove('active');
    }
});

// ========================
// PAGE READY
// ========================

console.log('Portfolio website loaded successfully!');
// Back to Top Button
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
