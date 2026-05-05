<template>
  <div class="landing-page" :class="{ leaving: isLeaving }">
    <!-- Top Sign In -->
    <div class="top-bar">
      <button class="signin-btn" @click="goTo('/login')">
        Sign In
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- Hero -->
    <main class="hero">
      <div class="card" :class="{ visible: cardVisible }">
        <div class="logo-wrap">
          <div class="logo-ring">
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.10)" stroke="rgba(255,220,100,0.68)" stroke-width="1.5"/>
              <line x1="32" y1="52" x2="32" y2="16" stroke="rgba(255,225,140,0.92)" stroke-width="2" stroke-linecap="round"/>
              <path d="M32 40 Q20 34 18 23 Q27 26 32 36" fill="rgba(80,195,90,0.78)"/>
              <path d="M32 31 Q18 26 18 14 Q27 18 32 29" fill="rgba(100,210,100,0.66)"/>
              <path d="M32 40 Q44 34 46 23 Q37 26 32 36" fill="rgba(60,178,70,0.78)"/>
              <path d="M32 31 Q46 26 46 14 Q37 18 32 29" fill="rgba(80,198,80,0.66)"/>
              <ellipse cx="32" cy="15" rx="3.2" ry="5.5" fill="rgba(252,196,50,0.90)"/>
              <ellipse cx="26.5" cy="17.5" rx="2.8" ry="4.8" fill="rgba(252,196,50,0.78)" transform="rotate(-14 26.5 17.5)"/>
              <ellipse cx="37.5" cy="17.5" rx="2.8" ry="4.8" fill="rgba(252,196,50,0.78)" transform="rotate(14 37.5 17.5)"/>
            </svg>
          </div>
        </div>

        <div class="brand">
          <span class="brand-name">CALLFA</span>
          <span class="dot">·</span>
          <span class="brand-sub">Sustainable Farming Tech</span>
        </div>

        <div class="divider"></div>

        <h1 class="headline">Empowering Farmers,<br><em>Harvesting Tomorrow</em></h1>
        <p class="desc">A modern cooperative management platform built for agricultural communities — streamlining loans, machinery, income records, and member services with transparency and care.</p>

        <div class="cta-row">
          <button class="btn-primary" @click="goTo('/login')">
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
          <button class="btn-ghost" @click="goTo('/login')">Sign In</button>
        </div>

        <div class="pills">
          <span class="pill">🌾 Loans</span>
          <span class="pill">🚜 Machinery</span>
          <span class="pill">📊 Income</span>
          <span class="pill">🤝 Services</span>
        </div>
      </div>
    </main>

    <div class="particles" aria-hidden="true">
      <span v-for="n in 14" :key="n" class="particle" :style="particleStyle(n)"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const cardVisible = ref(false)
const isLeaving = ref(false)

onMounted(() => {
  requestAnimationFrame(() => setTimeout(() => { cardVisible.value = true }, 80))
  console.log('🌾 Landing page loaded')
})

function particleStyle(n) {
  const size = 4 + (n % 5) * 3
  const left = (n * 41 + 9) % 97
  const top = (n * 57 + 13) % 90
  const delay = (n * 0.35) % 3.8
  const dur = 4.5 + (n % 4)
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    top: `${top}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${dur}s`,
  }
}

async function goTo(path) {
  isLeaving.value = true
  await new Promise(r => setTimeout(r, 360))
  router.push(path)
}
</script>

<style scoped>
.landing-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif;
  background-image:
    linear-gradient(168deg,
      rgba(180, 58, 10, 0.55) 0%,
      rgba(235, 126, 26, 0.48) 20%,
      rgba(252, 190, 48, 0.36) 42%,
      rgba(138, 198, 68, 0.28) 65%,
      rgba(26, 118, 58, 0.52) 86%,
      rgba(6, 62, 26, 0.66) 100%),
    url('https://i.pinimg.com/1200x/ba/dd/d7/baddd71f5a06b02eed18497ddbcfb2d5.jpg');
  background-size: cover;
  background-position: center 35%;
  transition: opacity 0.36s ease, transform 0.36s ease;
}

.landing-page.leaving {
  opacity: 0;
  transform: scale(1.024);
  pointer-events: none;
}

.landing-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 82% 62% at 4% 3%, rgba(255, 138, 46, 0.60), transparent 54%),
    radial-gradient(ellipse 58% 52% at 96% 5%, rgba(255, 208, 76, 0.48), transparent 52%),
    radial-gradient(ellipse 68% 44% at 50% 0%, rgba(255, 183, 52, 0.28), transparent 60%),
    radial-gradient(ellipse 92% 36% at 50% 100%, rgba(46, 152, 68, 0.42), transparent 56%);
  z-index: 0;
  pointer-events: none;
}

.top-bar {
  position: absolute;
  top: 0.90rem;
  right: 0.90rem;
  z-index: 200;
  animation: slideDown 0.52s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-14px); }
  to { opacity: 1; transform: translateY(0); }
}

.signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.42rem 1.12rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 218, 144, 0.50);
  background: rgba(18, 6, 0, 0.34);
  color: rgba(255, 244, 208, 0.92);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(18px) saturate(150%);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.20);
  transition: all 0.24s;
}

.signin-btn:hover {
  background: linear-gradient(135deg, rgba(196, 58, 10, 0.86), rgba(243, 158, 26, 0.82));
  color: #fff;
  transform: translateY(-2px) scale(1.042);
  box-shadow: 0 12px 30px rgba(100, 28, 0, 0.34), 0 0 22px rgba(230, 98, 18, 0.42);
}

.hero {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.card {
  position: relative;
  width: min(100%, 560px);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 2rem 2.30rem 1.80rem;
  border-radius: 32px;
  background: linear-gradient(152deg,
    rgba(255, 255, 255, 0.44) 0%,
    rgba(255, 244, 218, 0.24) 50%,
    rgba(214, 255, 224, 0.19) 100%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 36px 72px rgba(78, 24, 0, 0.30),
    0 10px 28px rgba(178, 68, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.70),
    inset 0 -1px 0 rgba(255, 198, 98, 0.18);
  backdrop-filter: blur(24px) saturate(170%);
  opacity: 0;
  transform: translateY(34px) scale(0.96);
  transition: opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1), transform 0.62s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(128deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 234, 188, 0.14) 32%, transparent 58%);
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.card::after {
  content: '';
  position: absolute;
  inset: 9px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  pointer-events: none;
  z-index: 0;
}

.logo-wrap, .brand, .divider, .headline, .desc, .cta-row, .pills {
  position: relative;
  z-index: 2;
}

.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 0.90rem;
  animation: fadeUp 0.55s 0.22s ease-out both;
}

.logo-ring {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(148deg, rgba(255, 255, 255, 0.36), rgba(255, 238, 175, 0.22));
  border: 1.5px solid rgba(255, 218, 114, 0.62);
  box-shadow: 0 8px 28px rgba(100, 38, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(8px);
}

.logo-ring svg {
  width: 54px;
  height: 54px;
  filter: drop-shadow(0 2px 8px rgba(100, 58, 0, 0.32));
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.48rem;
  margin-bottom: 0.62rem;
  animation: fadeUp 0.55s 0.30s ease-out both;
}

.brand-name {
  font-size: 1.32rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(78, 18, 0, 0.32);
}

.dot {
  font-size: 1.20rem;
  color: rgba(252, 208, 74, 0.92);
  font-weight: 300;
}

.brand-sub {
  font-size: 0.73rem;
  font-weight: 500;
  letter-spacing: 0.060em;
  color: rgba(255, 244, 198, 0.88);
  text-transform: uppercase;
}

.divider {
  height: 1px;
  margin: 0.68rem auto 1.05rem;
  background: linear-gradient(to right, transparent, rgba(255, 213, 106, 0.74), rgba(255, 255, 255, 0.90), rgba(255, 213, 106, 0.74), transparent);
  animation: fadeUp 0.50s 0.36s ease-out both;
}

.headline {
  margin: 0 0 0.75rem;
  font-size: clamp(1.52rem, 4vw, 2.08rem);
  font-weight: 700;
  line-height: 1.28;
  color: #ffffff;
  text-align: center;
  text-shadow: 0 3px 18px rgba(58, 14, 0, 0.38), 0 1px 4px rgba(0, 0, 0, 0.22);
  animation: fadeUp 0.60s 0.40s ease-out both;
}

.headline em {
  font-style: normal;
  background: linear-gradient(100deg, #fde68a 0%, #fbbf24 42%, #fb923c 82%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 8px rgba(198, 98, 0, 0.38));
}

.desc {
  margin: 0 0 1.40rem;
  font-size: 0.88rem;
  line-height: 1.68;
  color: rgba(255, 247, 222, 0.90);
  text-align: center;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.20);
  animation: fadeUp 0.60s 0.50s ease-out both;
}

.cta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.88rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
  animation: fadeUp 0.60s 0.58s ease-out both;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.50rem;
  padding: 0.74rem 1.65rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 218, 98, 0.52);
  background: linear-gradient(128deg, rgba(192, 52, 8, 0.90) 0%, rgba(228, 106, 14, 0.87) 28%, rgba(244, 166, 14, 0.85) 58%, rgba(90, 156, 14, 0.88) 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 0.93rem;
  font-weight: 700;
  letter-spacing: 0.030em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(98, 26, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.38);
  transition: all 0.24s;
}

.btn-primary:hover {
  background: linear-gradient(128deg, rgba(218, 66, 12, 0.96) 0%, rgba(248, 128, 18, 0.94) 28%, rgba(252, 194, 22, 0.92) 58%, rgba(114, 184, 18, 0.95) 100%);
  transform: translateY(-3px) scale(1.034);
  box-shadow: 0 20px 46px rgba(98, 26, 0, 0.40), 0 0 38px rgba(228, 98, 18, 0.54), inset 0 1px 0 rgba(255, 255, 255, 0.46);
}

.btn-primary:active {
  transform: translateY(-1px) scale(1.012);
  transition-duration: 0.10s;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 0.72rem 1.44rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 228, 158, 0.55);
  background: rgba(18, 6, 0, 0.28);
  color: rgba(255, 244, 208, 0.92);
  font-family: inherit;
  font-size: 0.93rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all 0.24s;
}

.btn-ghost:hover {
  background: rgba(255, 218, 128, 0.18);
  border-color: rgba(255, 218, 128, 0.70);
  color: #ffffff;
  transform: translateY(-2px) scale(1.024);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.btn-ghost:active {
  transform: translateY(-1px) scale(1.009);
  transition-duration: 0.10s;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.46rem;
  animation: fadeUp 0.60s 0.68s ease-out both;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
  padding: 0.28rem 0.74rem;
  border-radius: 999px;
  font-size: 0.71rem;
  font-weight: 500;
  color: rgba(255, 247, 218, 0.90);
  background: rgba(255, 198, 76, 0.12);
  border: 1px solid rgba(255, 212, 108, 0.28);
  backdrop-filter: blur(8px);
  letter-spacing: 0.012em;
  transition: all 0.22s;
}

.pill:hover {
  background: rgba(255, 198, 76, 0.22);
  border-color: rgba(255, 212, 108, 0.50);
  transform: translateY(-2px);
}

.particles {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 218, 96, 0.52);
  box-shadow: 0 0 6px rgba(255, 188, 56, 0.52);
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  0% { opacity: 0; transform: translateY(0) scale(0.7); }
  15% { opacity: 0.72; }
  85% { opacity: 0.48; }
  100% { opacity: 0; transform: translateY(-88px) scale(1.12); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-primary:focus-visible,
.btn-ghost:focus-visible,
.signin-btn:focus-visible {
  outline: 3px solid rgba(252, 198, 38, 0.95);
  outline-offset: 3px;
}

@media (min-width: 600px) {
  .card {
    padding: 2.25rem 2.80rem 2.05rem;
  }
  .headline {
    font-size: clamp(1.68rem, 3.4vw, 2.24rem);
  }
  .desc {
    font-size: 0.93rem;
  }
}

@media (max-width: 420px) {
  .hero {
    padding: 0.55rem;
  }
  .card {
    padding: 1.45rem 1.20rem 1.25rem;
    border-radius: 24px;
  }
  .logo-ring {
    width: 66px;
    height: 66px;
  }
  .logo-ring svg {
    width: 46px;
    height: 46px;
  }
  .brand-name {
    font-size: 1.12rem;
  }
  .brand-sub {
    font-size: 0.66rem;
  }
  .headline {
    font-size: 1.40rem;
  }
  .desc {
    font-size: 0.83rem;
  }
  .btn-primary,
  .btn-ghost {
    padding: 0.66rem 1.22rem;
    font-size: 0.87rem;
  }
  .cta-row {
    gap: 0.62rem;
  }
  .top-bar {
    top: 0.55rem;
    right: 0.55rem;
  }
  .signin-btn {
    font-size: 0.76rem;
    padding: 0.36rem 0.88rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>