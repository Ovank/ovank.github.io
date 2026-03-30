import {WebHeader } from "../main.js";

// Call the function to initialize the header generation 
WebHeader("home");

// Distinct twinkling starfield background
function initStarfield(canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;
    let tick = 0;

    const starsNear = [];
    const starsFar = [];
    const glowStars = [];
    const streaks = [];

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initStars();
    }

    function initStars() {
        starsNear.length = 0;
        starsFar.length = 0;
        glowStars.length = 0;

        const nearCount = Math.floor((W * H) / 3000);
        const farCount = Math.floor((W * H) / 6000);
        const glowCount = Math.floor((W * H) / 18000);

        for (let i = 0; i < farCount; i++) {
            starsFar.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 0.4 + Math.random() * 0.9,
                baseAlpha: 0.1 + Math.random() * 0.25,
                speed: 0.4 + Math.random() * 1.1,
                drift: 0.02 + Math.random() * 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < nearCount; i++) {
            starsNear.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 0.8 + Math.random() * 1.7,
                baseAlpha: 0.25 + Math.random() * 0.55,
                speed: 0.7 + Math.random() * 1.8,
                drift: 0.05 + Math.random() * 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < glowCount; i++) {
            glowStars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 1.2 + Math.random() * 2.4,
                baseAlpha: 0.12 + Math.random() * 0.2,
                speed: 0.35 + Math.random() * 0.85,
                hue: Math.random() < 0.55 ? 190 : 60,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function resetStarPosition(star) {
        star.x = W + Math.random() * 40;
        star.y = Math.random() * H;
    }

    function drawLayer(stars, color) {
        for (const s of stars) {
            const alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(tick * s.speed + s.phase));
            s.x -= s.drift;
            if (s.x < -10) resetStarPosition(s);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawGlowStars() {
        for (const s of glowStars) {
            const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(tick * s.speed + s.phase));
            const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
            grad.addColorStop(0, `hsla(${s.hue}, 100%, 88%, ${alpha})`);
            grad.addColorStop(1, `hsla(${s.hue}, 100%, 88%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = Math.min(1, alpha * 2.3);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function spawnStreak() {
        streaks.push({
            x: Math.random() * W * 0.8 + W * 0.2,
            y: Math.random() * H * 0.7,
            len: 70 + Math.random() * 160,
            speed: 9 + Math.random() * 7,
            life: 1,
            angle: Math.PI + (0.15 + Math.random() * 0.25)
        });
    }

    function updateAndDrawStreaks() {
        if (Math.random() < 0.01 && streaks.length < 3) {
            spawnStreak();
        }

        for (let i = streaks.length - 1; i >= 0; i--) {
            const st = streaks[i];
            st.x += Math.cos(st.angle) * st.speed;
            st.y += Math.sin(st.angle) * st.speed;
            st.life -= 0.02;

            const tx = st.x - Math.cos(st.angle) * st.len;
            const ty = st.y - Math.sin(st.angle) * st.len;
            const grad = ctx.createLinearGradient(st.x, st.y, tx, ty);
            grad.addColorStop(0, `rgba(255,255,255,${st.life * 0.85})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(st.x, st.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            if (st.life <= 0 || st.x < -st.len || st.y > H + st.len) {
                streaks.splice(i, 1);
            }
        }
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);

        tick += 0.016;
        drawLayer(starsFar, '#d8e6ff');
        drawGlowStars();
        drawLayer(starsNear, '#ffffff');
        updateAndDrawStreaks();

        requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    loop();
}

// ── Build the page ──
function homePageContain() {

    var homePage_html = `
    <canvas id="planeCanvas"></canvas>
    <div class="Home">
        <div class="hero">
            <span><img class="profile_img" src="../assets/profile2.png"></span>
            <div class="Intro">Hello 👋, I am Om Vats.</div>
            <div class="JobProfile">I am a Software Development Engineer.</div>
        </div>
    </div>
    `;

    function HomePageContent() {
        document.getElementById('homepage').innerHTML += homePage_html;

        // start background starfield
        const canvas = document.getElementById('planeCanvas');
        if (canvas) initStarfield(canvas);
    }

    window.addEventListener('load', HomePageContent);
}

homePageContain();

