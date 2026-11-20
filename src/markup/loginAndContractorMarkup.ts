export const BOOT_AND_GLOBAL_OVERLAYS_MARKUP = `
  <!-- ==================== FIRESTORE BOOT / SEED OVERLAY ==================== -->
  <div id="dbBootOverlay" role="status" aria-live="polite" class="hidden fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 text-white bg-[#020b1e]/95 backdrop-blur-xl">
    <div class="boot-card relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-[#00c2ff]/25 p-7 sm:p-9 text-center shadow-2xl bg-gradient-to-b from-[#081838]/90 via-[#040e24]/95 to-[#020917]/98">
      <div class="boot-orbit" aria-hidden="true"><span></span><span></span><span></span></div>

      <!-- Top Stylized Electric Logo (A + Lightning) -->
      <div class="relative z-10 mx-auto mb-2 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="w-20 h-20 filter drop-shadow-[0_0_22px_rgba(0,194,255,0.7)]" fill="none">
          <defs>
            <linearGradient id="aLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0055ff"/>
              <stop offset="55%" stop-color="#00c2ff"/>
              <stop offset="100%" stop-color="#38ef7d"/>
            </linearGradient>
            <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#00e5ff"/>
            </linearGradient>
          </defs>
          <path d="M50 8 L86 84 L68 84 L57 58 L43 58 L32 84 L14 84 Z" fill="url(#aLogoGrad)"/>
          <path d="M50 25 L61 50 L39 50 Z" fill="#040e24"/>
          <path d="M53 36 L43 54 L52 54 L46 72 L61 50 L52 50 Z" fill="url(#boltGrad)"/>
        </svg>
      </div>

      <!-- Brand Title -->
      <div class="relative z-10 flex items-center justify-center gap-0.5 text-2xl sm:text-3xl font-black tracking-tight" dir="ltr">
        <span class="text-white">Asset</span><span class="text-[#00c2ff]">Flow</span>
      </div>

      <!-- Badge Capsule -->
      <div class="relative z-10 mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-slate-300 font-semibold shadow-inner">
        <i data-lucide="building-2" class="w-3.5 h-3.5 text-[#00c2ff]"></i>
        <span>منظومة إدارة الأصول والاستلام</span>
      </div>

      <!-- Main Headline with Highlights -->
      <h2 class="relative z-10 mt-5 text-xl sm:text-2xl font-black text-white leading-snug">
        إدارة <span class="text-[#00c2ff]">ذكية</span> للأصول..
        <br/>
        <span class="text-[#00c2ff]">ودقة</span> في كل عملية استلام
      </h2>

      <!-- Subtitle -->
      <p class="relative z-10 mt-2.5 text-xs sm:text-sm text-slate-300/85 leading-relaxed font-medium">
        من استلام الأصول إلى توثيق الفواتير...
        <br/>
        كل التفاصيل في منصة واحدة
      </p>

      <!-- Electric Progress Bar & Percentage -->
      <div class="relative z-10 mt-6 space-y-2">
        <div class="boot-progress relative" dir="rtl" aria-hidden="true"><span></span></div>
        <div class="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span id="dbBootStatusText">جاري تجهيز بيئة العمل...</span>
          <span id="dbBootPercentText" class="font-mono text-[#00c2ff]">0%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== PRINT-ONLY REPORT CONTAINER ==================== -->
  <div id="printArea" class="hidden bg-white p-6 text-right" dir="rtl"></div>

  <!-- ==================== WELCOME SPLASH SCREEN (3 SECONDS) ==================== -->
  <div id="welcomeSplash" class="hidden fixed inset-0 z-[120] bg-se-dark-gradient flex items-center justify-center p-6 text-white">
    <div class="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 text-center shadow-2xl animate-fade-up">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-se-mid-blue flex items-center justify-center shadow-lg shadow-se-mid-blue/30 mb-5">
        <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
      </div>
      <p class="text-xs font-bold text-se-light-blue mb-1">منصة متابعة فواتير الصيانة والطوارئ — قسم استلام الأصول</p>
      <h2 id="welcomeSplashName" class="text-2xl sm:text-3xl font-black text-white mt-2">مرحباً</h2>
      <p id="welcomeSplashSub" class="text-xs text-slate-300 mt-2">جاري تجهيز لوحة العمل الخاصة بك...</p>
      <div class="w-full h-2 bg-white/15 rounded-full overflow-hidden mt-6">
        <div id="welcomeProgressBar" class="h-full bg-se-mid-blue rounded-full"></div>
      </div>
    </div>
  </div>

  <!-- ==================== TOAST NOTIFICATIONS ==================== -->
  <div id="toastContainer" class="fixed bottom-5 left-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"></div>
`;

export const LOGIN_VIEW_MARKUP = `
    <!-- ==================== 1. DUAL-MODE LOGIN SCREEN ==================== -->
    <section id="loginView" class="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-se-dark-gradient relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 26px 26px;"></div>
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-se-mid-blue/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-se-light-blue/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- ==================== SAUDI ENERGY CORPORATE IDENTITY FLUID 3D WAVE ==================== -->
      <div class="sec-corporate-ribbon-container absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <!-- Ambient Fluid Glow matching reference image -->
        <div class="absolute top-[8%] left-[6%] w-[600px] h-[600px] bg-[#0055ff]/22 rounded-full blur-[150px] pointer-events-none animate-pulse" style="animation-duration: 7s;"></div>
        <div class="absolute top-[14%] right-[4%] w-[580px] h-[580px] bg-[#00e676]/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style="animation-duration: 9s;"></div>
        <div class="absolute bottom-[4%] left-[30%] w-[520px] h-[400px] bg-[#00d2ff]/16 rounded-full blur-[130px] pointer-events-none"></div>

        <!-- Fluid Aerodynamic 3D Undulating Ribbon Wave SVG -->
        <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 w-full h-full object-cover pointer-events-none sec-ribbon-shimmer" fill="none">
          <defs>
            <!-- Fluid Blue Left Wave Gradient -->
            <linearGradient id="fluidBlueGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stop-color="#02143d" stop-opacity="0.95"/>
              <stop offset="25%" stop-color="#003cd1" stop-opacity="0.92"/>
              <stop offset="65%" stop-color="#0072ff" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#00c8ff" stop-opacity="0.98"/>
            </linearGradient>

            <!-- Fluid Central Twist Gradient -->
            <linearGradient id="fluidTwistGrad" x1="20%" y1="30%" x2="80%" y2="90%">
              <stop offset="0%" stop-color="#0072ff" stop-opacity="0.95"/>
              <stop offset="40%" stop-color="#00d2ff" stop-opacity="0.92"/>
              <stop offset="70%" stop-color="#25f589" stop-opacity="0.88"/>
              <stop offset="100%" stop-color="#00b348" stop-opacity="0.92"/>
            </linearGradient>

            <!-- Fluid Green Right Wave Gradient -->
            <linearGradient id="fluidGreenGrad" x1="45%" y1="85%" x2="100%" y2="15%">
              <stop offset="0%" stop-color="#00b4d8" stop-opacity="0.9"/>
              <stop offset="30%" stop-color="#00dca0" stop-opacity="0.92"/>
              <stop offset="70%" stop-color="#00e676" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#009e44" stop-opacity="0.98"/>
            </linearGradient>

            <!-- Soft Translucent Ribbon Depth Gradient -->
            <linearGradient id="fluidDepthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0040cc" stop-opacity="0.35"/>
              <stop offset="50%" stop-color="#00d2ff" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#00e676" stop-opacity="0.3"/>
            </linearGradient>

            <!-- Luminous Razor Edge Rim Gradient -->
            <linearGradient id="secLaserRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0055ff" stop-opacity="0.2"/>
              <stop offset="15%" stop-color="#40c4ff" stop-opacity="0.95"/>
              <stop offset="32%" stop-color="#ffffff" stop-opacity="1"/>
              <stop offset="50%" stop-color="#80e8ff" stop-opacity="0.98"/>
              <stop offset="68%" stop-color="#ffffff" stop-opacity="1"/>
              <stop offset="85%" stop-color="#38ef7d" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#00c853" stop-opacity="0.3"/>
            </linearGradient>

            <!-- Glow Filters -->
            <filter id="neonLaserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur1"/>
              <feGaussianBlur stdDeviation="9" result="blur2"/>
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Layer 1: Background Fluid Translucent Ribbon Echo (Depth Layer) -->
          <path d="M -60 580 C 80 340, 200 160, 340 160 C 480 160, 600 360, 720 560 C 860 400, 1080 200, 1340 210 C 1460 215, 1560 280, 1660 350 L 1660 520 C 1520 440, 1420 370, 1300 360 C 1080 340, 900 450, 720 560 C 600 460, 460 310, 340 310 C 220 310, 100 460, -60 680 Z"
            fill="url(#fluidDepthGrad)"/>

          <!-- Layer 2: Main Left Aerodynamic Fluid Ribbon (Blue Arc) -->
          <path d="M -60 520 C 60 280, 180 130, 320 130 C 460 130, 580 320, 720 540 C 580 440, 440 290, 320 290 C 200 290, 80 440, -60 660 Z"
            fill="url(#fluidBlueGrad)"/>

          <!-- Layer 3: Main Right Aerodynamic Fluid Ribbon (Green to Cyan Arc) -->
          <path d="M 720 540 C 860 380, 1080 180, 1320 190 C 1440 195, 1540 260, 1660 320 L 1660 520 C 1520 440, 1420 370, 1300 360 C 1080 340, 900 450, 720 540 Z"
            fill="url(#fluidGreenGrad)"/>

          <!-- Layer 4: Central Silky Ribbon Twist (Connecting Möbius Fold) -->
          <path d="M 520 290 C 620 410, 680 500, 720 540 C 760 500, 840 400, 940 330 C 840 440, 760 530, 720 560 C 660 520, 580 410, 520 290 Z"
            fill="url(#fluidTwistGrad)"/>

          <!-- Layer 5: Continuous Luminous Laser Crest Line -->
          <path d="M -60 520 C 60 280, 180 130, 320 130 C 460 130, 580 320, 720 540 C 860 380, 1080 180, 1320 190 C 1440 195, 1540 260, 1660 320"
            stroke="url(#secLaserRimGrad)" stroke-width="4.5" fill="none" filter="url(#neonLaserGlow)"/>

          <!-- Fluid Inner Energy Stream -->
          <path d="M -40 560 C 70 340, 180 200, 320 200 C 450 200, 570 370, 720 540 C 870 390, 1070 240, 1310 250 C 1430 255, 1530 310, 1640 370"
            stroke="#00ffff" stroke-width="1.8" fill="none" opacity="0.65" stroke-dasharray="10 5"/>

          <!-- Floating Energy Sparkles along Crest -->
          <circle cx="320" cy="130" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 10px #00c2ff)"/>
          <circle cx="230" cy="180" r="3" fill="#80e8ff" filter="drop-shadow(0 0 6px #0080ff)"/>
          <circle cx="430" cy="190" r="3.5" fill="#ffffff" filter="drop-shadow(0 0 8px #00e5ff)"/>
          <circle cx="720" cy="540" r="4" fill="#00ffcc" filter="drop-shadow(0 0 10px #00ff86)"/>
          <circle cx="1090" cy="240" r="3" fill="#80ffb0" filter="drop-shadow(0 0 6px #00e676)"/>
          <circle cx="1320" cy="190" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 10px #00ff86)"/>
          <circle cx="1470" cy="240" r="3" fill="#69f0ae" filter="drop-shadow(0 0 6px #00e676)"/>
        </svg>
      </div>

      <div class="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-fade-up">

        <!-- Right Visual Identity Panel -->
        <div class="login-brand-panel lg:col-span-5 power-grid-bg text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-l border-white/10">
          <!-- Background Grid Dot Pattern -->
          <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(#00c2ff 1.2px, transparent 1.2px); background-size: 22px 22px;"></div>

          <!-- Electrical Power Transmission Towers & Flowing Electric Network Lines -->
          <svg viewBox="0 0 500 240" preserveAspectRatio="xMidYMax slice" class="absolute bottom-0 left-0 w-full h-64 pointer-events-none z-0 overflow-hidden" fill="none">
            <defs>
              <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00c2ff" stop-opacity="0.75"/>
                <stop offset="100%" stop-color="#0044aa" stop-opacity="0.15"/>
              </linearGradient>
              <linearGradient id="streamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0033aa" stop-opacity="0"/>
                <stop offset="40%" stop-color="#00aaff" stop-opacity="0.85"/>
                <stop offset="70%" stop-color="#00ffcc" stop-opacity="1"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="streamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0055ff" stop-opacity="0"/>
                <stop offset="50%" stop-color="#00d2ff" stop-opacity="0.95"/>
                <stop offset="100%" stop-color="#00ff86" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Distant City Skyline Silhouette -->
            <path d="M120 200 L120 185 L135 185 L135 175 L145 175 L145 190 L160 190 L160 165 L170 160 L180 165 L180 195 L210 195 L210 170 L225 170 L225 185 L245 185 L245 155 L255 150 L265 155 L265 195 L320 195 L320 180 L335 180 L335 190 L360 190 L360 175 L375 175 L375 200 Z" fill="#03112c" opacity="0.85"/>

            <!-- High-Voltage Electric Transmission Tower 1 (Main Tower) -->
            <g stroke="url(#towerGrad)" stroke-width="1.3" opacity="0.75">
              <line x1="25" y1="230" x2="42" y2="125"/>
              <line x1="65" y1="230" x2="48" y2="125"/>
              <line x1="42" y1="125" x2="45" y2="70"/>
              <line x1="48" y1="125" x2="45" y2="70"/>
              <line x1="28" y1="85" x2="62" y2="85"/>
              <line x1="20" y1="105" x2="70" y2="105"/>
              <line x1="24" y1="125" x2="66" y2="125"/>
              <line x1="29" y1="210" x2="61" y2="190"/>
              <line x1="61" y1="210" x2="29" y2="190"/>
              <line x1="33" y1="190" x2="57" y2="170"/>
              <line x1="57" y1="190" x2="33" y2="170"/>
              <line x1="37" y1="170" x2="53" y2="150"/>
              <line x1="53" y1="170" x2="37" y2="150"/>
              <line x1="40" y1="150" x2="50" y2="135"/>
              <line x1="50" y1="150" x2="40" y2="135"/>
              <!-- Insulators -->
              <line x1="28" y1="85" x2="28" y2="92" stroke-width="1.8" stroke="#00ffff"/>
              <line x1="62" y1="85" x2="62" y2="92" stroke-width="1.8" stroke="#00ffff"/>
              <line x1="20" y1="105" x2="20" y2="112" stroke-width="1.8" stroke="#00ffff"/>
              <line x1="70" y1="105" x2="70" y2="112" stroke-width="1.8" stroke="#00ffff"/>
            </g>

            <!-- Second Background Tower -->
            <g stroke="url(#towerGrad)" stroke-width="1.0" opacity="0.45" transform="translate(70, 52) scale(0.65)">
              <line x1="25" y1="230" x2="42" y2="125"/>
              <line x1="65" y1="230" x2="48" y2="125"/>
              <line x1="42" y1="125" x2="45" y2="70"/>
              <line x1="48" y1="125" x2="45" y2="70"/>
              <line x1="28" y1="85" x2="62" y2="85"/>
              <line x1="20" y1="105" x2="70" y2="105"/>
              <line x1="24" y1="125" x2="66" y2="125"/>
              <line x1="29" y1="210" x2="61" y2="190"/>
              <line x1="61" y1="210" x2="29" y2="190"/>
              <line x1="33" y1="190" x2="57" y2="170"/>
              <line x1="57" y1="190" x2="33" y2="170"/>
            </g>

            <!-- Overhead Catenary Power Transmission Lines -->
            <path d="M28 92 Q75 125 125 132" stroke="#00c2ff" stroke-width="1" opacity="0.5" fill="none"/>
            <path d="M62 92 Q105 130 150 137" stroke="#00c2ff" stroke-width="1" opacity="0.5" fill="none"/>
            <path d="M20 112 Q85 150 145 155" stroke="#00c2ff" stroke-width="1" opacity="0.4" fill="none"/>

            <!-- Moving Neon Electric Power Grid Highway Curves -->
            <path class="electric-flow-line-1" d="M0 220 Q90 215 170 185 T340 160 T500 170" stroke="url(#streamGrad1)" stroke-width="3" fill="none" filter="drop-shadow(0 0 10px #00d2ff)"/>
            <path class="electric-flow-line-2" d="M0 230 Q110 225 210 195 T390 175 T500 185" stroke="url(#streamGrad2)" stroke-width="2.2" fill="none" filter="drop-shadow(0 0 12px #00ff86)"/>
            <path class="electric-flow-line-3" d="M0 210 Q80 205 160 178 T330 152 T500 160" stroke="#00c2ff" stroke-width="1.2" fill="none" opacity="0.8"/>

            <!-- Glowing Grid Nodes along line -->
            <circle cx="170" cy="185" r="3" fill="#ffffff" filter="drop-shadow(0 0 8px #00ffcc)"/>
            <circle cx="270" cy="170" r="3.5" fill="#ffffff" filter="drop-shadow(0 0 10px #00d2ff)"/>
            <circle cx="370" cy="165" r="3" fill="#00ffcc" filter="drop-shadow(0 0 8px #00ff86)"/>
            <circle cx="430" cy="178" r="2.5" fill="#ffffff" filter="drop-shadow(0 0 6px #00c2ff)"/>
          </svg>

          <div class="relative z-10 space-y-6">
            <!-- Platform Logo & Brand Lockup (Harmonized, Clean, Tight) -->
            <div class="flex items-center gap-2">
              <svg viewBox="0 0 100 100" class="w-11 h-11 filter drop-shadow-[0_0_16px_rgba(0,194,255,0.85)] shrink-0" fill="none">
                <defs>
                  <linearGradient id="panelLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#0055ff"/>
                    <stop offset="55%" stop-color="#00c2ff"/>
                    <stop offset="100%" stop-color="#38ef7d"/>
                  </linearGradient>
                  <linearGradient id="panelBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="100%" stop-color="#00e5ff"/>
                  </linearGradient>
                </defs>
                <path d="M50 8 L86 84 L68 84 L57 58 L43 58 L32 84 L14 84 Z" fill="url(#panelLogoGrad)"/>
                <path d="M50 25 L61 50 L39 50 Z" fill="#040e24"/>
                <path d="M53 36 L43 54 L52 54 L46 72 L61 50 L52 50 Z" fill="url(#panelBoltGrad)"/>
              </svg>
              <div class="leading-tight">
                <div class="flex items-center gap-0.5 text-2xl font-black tracking-tight" dir="ltr">
                  <span class="text-white">Asset</span><span class="text-[#00c2ff]">Flow</span>
                </div>
                <div class="text-[11px] text-slate-300 font-semibold mt-0.5">منظومة إدارة الأصول والفواتير</div>
              </div>
            </div>

            <!-- Main Headline -->
            <h2 class="text-2xl sm:text-3xl font-black text-white leading-tight">
              من استلام الأصل إلى
              <br/>
              <span class="text-[#00c2ff]">اعتماد الفاتورة..</span>
              <br/>
              رحلة عمل موثوقة
              <br/>
              في منصة واحدة
            </h2>

            <!-- 3 Feature Cards matching reference image -->
            <div class="space-y-3">
              <div class="flex items-center gap-4 bg-[#0a1b38]/75 border border-[#00c2ff]/30 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-black/20 hover:border-[#00c2ff]/50 transition">
                <div class="w-12 h-12 rounded-2xl bg-[#00c2ff]/10 border border-[#00c2ff]/35 text-[#00c2ff] flex items-center justify-center shrink-0 shadow-inner">
                  <i data-lucide="bell" class="w-5 h-5"></i>
                </div>
                <div class="text-right">
                  <h4 class="text-sm font-extrabold text-white">متابعة وتنبيهات استباقية</h4>
                  <p class="text-[11px] text-slate-300/80 mt-1 leading-relaxed">مساحة مستقلة لكل مقاول مع تنبيهات استباقية لمواعيد الاستحقاق والمهام</p>
                </div>
              </div>

              <div class="flex items-center gap-4 bg-[#0a1b38]/75 border border-[#00c2ff]/30 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-black/20 hover:border-[#00c2ff]/50 transition">
                <div class="w-12 h-12 rounded-2xl bg-[#00c2ff]/10 border border-[#00c2ff]/35 text-[#00c2ff] flex items-center justify-center shrink-0 shadow-inner">
                  <i data-lucide="file-text" class="w-5 h-5"></i>
                </div>
                <div class="text-right">
                  <h4 class="text-sm font-extrabold text-white">توثيق رقمي متكامل</h4>
                  <p class="text-[11px] text-slate-300/80 mt-1 leading-relaxed">رفع وتوثيق الفواتير والصور والمستندات بأعلى معايير الأمان والجودة</p>
                </div>
              </div>

              <div class="flex items-center gap-4 bg-[#0a1b38]/75 border border-[#00c2ff]/30 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-black/20 hover:border-[#00c2ff]/50 transition">
                <div class="w-12 h-12 rounded-2xl bg-[#00c2ff]/10 border border-[#00c2ff]/35 text-[#00c2ff] flex items-center justify-center shrink-0 shadow-inner">
                  <i data-lucide="trending-up" class="w-5 h-5"></i>
                </div>
                <div class="text-right">
                  <h4 class="text-sm font-extrabold text-[#00c2ff]">تقارير ومؤشرات ذكية</h4>
                  <p class="text-[11px] text-slate-300/80 mt-1 leading-relaxed">تقارير تفصيلية ومؤشرات أداء فورية لمساعدة اتخاذ القرار بشكل أسرع</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Copyright Bar matching image -->
          <div class="relative z-10 pt-5 mt-6 border-t border-white/10 flex items-center justify-end text-xs text-slate-300/85 font-bold tracking-wider" dir="ltr">
            <span>Saudi Energy · 100889</span>
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#00c2ff] ml-1.5 inline"></i>
          </div>
        </div>

        <!-- Left Login Form Panel -->
        <div class="login-form-panel lg:col-span-7 p-7 sm:p-11 flex flex-col justify-between bg-white relative">
          <div>
            <!-- Top Header: Official Saudi Energy Logo & System Status -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <img src="/saudi-energy-logo.png" alt="السعودية للطاقة - Saudi Energy" class="h-12 w-auto object-contain filter drop-shadow-xs" />
                <div class="h-8 w-px bg-slate-200 hidden sm:block"></div>
                <div class="leading-tight text-right hidden sm:block">
                  <span class="block text-xs font-black text-se-dark-blue">قسم استلام الأصول</span>
                  <span class="block text-[10px] font-semibold text-slate-400">إدارة الفواتير والعمليات</span>
                </div>
              </div>

              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>النظام يعمل بكفاءة</span>
              </div>
            </div>

            <!-- Form Title -->
            <div class="mb-6 text-center">
              <h3 class="text-2xl sm:text-3xl font-extrabold text-se-dark-blue">
                مرحباً بك في <span class="font-black text-se-dark-blue">Asset</span><span class="font-black text-[#00c2ff]">Flow</span>
              </h3>
              <p class="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">يرجى تسجيل الدخول للوصول إلى منظومة إدارة الأصول والفواتير</p>
            </div>

            <!-- Dual-Mode Tabs -->
            <div class="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
              <button type="button" id="tabStaffBtn" onclick="switchLoginTab('staff')"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all bg-[#0c1e3d] text-white shadow-sm">
                <i data-lucide="briefcase" class="w-4 h-4"></i>
                <span>دخول موظف الشركة</span>
              </button>
              <button type="button" id="tabContractorBtn" onclick="switchLoginTab('contractor')"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all text-slate-600 hover:text-se-dark-blue">
                <i data-lucide="hard-hat" class="w-4 h-4"></i>
                <span>دخول المقاولين</span>
              </button>
            </div>

            <!-- Error Banner -->
            <div id="loginErrorBox" class="hidden mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
              <span id="loginErrorText"></span>
            </div>

            <!-- TAB 1: Company Staff Login (Default Visible) -->
            <form id="staffLoginForm" onsubmit="handleStaffLogin(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-se-dark-blue mb-1.5 text-right">الرقم الوظيفي (اسم المستخدم)</label>
                <div class="relative">
                  <input type="text" id="staffUsernameInput" required placeholder="أدخل رقمك الوظيفي"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-dark-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-4 text-sm font-semibold outline-none transition text-left" dir="ltr" />
                  <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-se-dark-blue">كلمة المرور</label>
                </div>
                <div class="relative">
                  <input type="password" id="staffPasswordInput" required placeholder="أدخل كلمة المرور"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-dark-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-10 text-sm font-semibold outline-none transition text-left" dir="ltr" />
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <button type="button" onclick="togglePasswordVisibility('staffPasswordInput', this)" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5" title="إظهار / إخفاء كلمة المرور">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <!-- Remember me & Forgot Password -->
              <div class="flex items-center justify-between text-xs pt-1">
                <label class="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold select-none">
                  <input type="checkbox" id="rememberMeCheckbox" class="rounded border-slate-300 text-se-mid-blue focus:ring-se-mid-blue/30 w-4 h-4" />
                  <span>تذكرني في هذا الجهاز</span>
                </label>
                <button type="button" onclick="openResetPasswordModal()" class="text-se-mid-blue hover:text-se-dark-blue font-bold transition">
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button type="submit" class="w-full py-3.5 px-6 rounded-xl bg-[#0c1e3d] hover:bg-[#142f5d] text-white font-extrabold text-sm shadow-lg shadow-se-dark-blue/20 transition flex items-center justify-center gap-2 mt-2">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
                <span>تسجيل الدخول</span>
              </button>
            </form>

            <!-- TAB 2: Contractor Login -->
            <form id="contractorLoginForm" onsubmit="handleContractorLogin(event)" class="hidden space-y-4">
              <div class="relative">
                <label class="block text-xs font-bold text-se-dark-blue mb-1.5 text-right">اختر اسم المقاول (قائمة قابلة للبحث)</label>
                <div class="relative">
                  <input type="text" id="contractorSearchInput" autocomplete="off"
                    placeholder="ابحث عن اسم المقاول أو اختر من القائمة..."
                    onfocus="openContractorDropdown()"
                    oninput="filterContractorDropdown(this.value)"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-10 text-sm font-semibold text-se-dark-blue outline-none transition" />
                  <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <button type="button" onclick="toggleContractorDropdown()" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-se-dark-blue p-1">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                  </button>
                </div>
                <input type="hidden" id="selectedContractorValue" />
                <div id="contractorDropdownList" class="hidden absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100"></div>
              </div>

              <div>
                <label class="block text-xs font-bold text-se-dark-blue mb-1.5 text-right">الرقم السري للمقاول (PIN)</label>
                <div class="relative">
                  <input type="password" id="contractorPinInput" required minlength="1" maxlength="12" inputmode="numeric" pattern="[0-9]{1,12}" placeholder="أدخل PIN الخاص بالمقاول"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-10 text-sm font-semibold outline-none transition" />
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <button type="button" onclick="togglePasswordVisibility('contractorPinInput', this)" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5" title="إظهار / إخفاء الرقم السري">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="w-full py-3.5 px-6 rounded-xl bg-se-mid-blue hover:bg-se-blue text-white font-extrabold text-sm shadow-lg shadow-se-mid-blue/25 transition flex items-center justify-center gap-2 mt-2">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>دخول إلى بوابة المقاول</span>
              </button>
            </form>
          </div>

          <!-- Bottom Security Badge Only (No Microsoft, No Support/Help text) -->
          <div class="pt-6 mt-6 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400 font-semibold gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-500"></i>
            <span>اتصال آمن ومشفر · جميع البيانات محمية وفق أعلى معايير الأمان</span>
          </div>
        </div>
      </div>
    </section>
`;

export const CONTRACTOR_VIEW_MARKUP = `
    <!-- ==================== 2. CONTRACTOR PORTAL VIEW ==================== -->
    <section id="contractorView" class="hidden min-h-screen flex flex-col bg-slatebg">
      <!-- Top Bar -->
      <header class="bg-se-dark-blue text-white shadow-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-se-mid-blue flex items-center justify-center shadow">
              <i data-lucide="hard-hat" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-300">بوابة المقاول الخاصة (بيانات معزولة)</p>
              <h1 id="contractorHeaderName" class="text-base sm:text-lg font-extrabold leading-tight">اسم المقاول</h1>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <button onclick="logout()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-100 hover:text-white text-xs font-bold border border-rose-400/30 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        <!-- Contractor Personal KPIs -->
        <div id="contractorKpiGrid" class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"></div>

        <!-- Contractor Navigation Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <div class="flex gap-2">
            <button id="cTabListBtn" onclick="switchContractorTab('list')" class="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-se-dark-blue text-white transition">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              <span>سجل فواتيري</span>
            </button>
            <button id="cTabFormBtn" onclick="switchContractorTab('form')" class="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:bg-slate-100 transition">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span id="cTabFormLabel">رفع فاتورة جديدة</span>
            </button>
          </div>
        </div>

        <!-- Contractor Sub-View 1: My Invoices Table -->
        <div id="contractorListPanel" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div class="relative flex-1 min-w-[220px]">
              <input type="text" id="contractorTableSearch" oninput="renderContractorTable()" placeholder="ابحث برقم أمر العمل، الموقع الوظيفي، وصف العمل..."
                class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 pr-10 pl-4 text-sm outline-none" />
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2"></i>
            </div>
            <select id="contractorStatusFilter" onchange="renderContractorTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm font-semibold outline-none">
              <option value="">كل الحالات</option>
              <option value="معتمد">معتمد (تم)</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="ملاحظات معلقة">ملاحظات معلقة</option>
              <option value="مرفوض">مرفوض (غير معتمد)</option>
            </select>
          </div>

          <div id="contractorTableScrollWrap" class="overflow-auto max-h-[65vh]">
            <table class="copyable-table w-full min-w-max text-sm text-right">
              <thead class="bg-slate-100 text-slate-700 text-xs font-extrabold border-b border-slate-200 whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th class="py-3.5 px-3 bg-slate-100">رقم أمر العمل</th>
                  <th class="py-3.5 px-3 bg-slate-100">الاستشاري</th>
                  <th class="py-3.5 px-3 bg-slate-100">تاريخ الفاتورة</th>
                  <th class="py-3.5 px-3 bg-slate-100">نوع العمل</th>
                  <th class="py-3.5 px-3 bg-slate-100">وصف العمل</th>
                  <th class="py-3.5 px-3 bg-slate-100">نوع المعدة</th>
                  <th class="py-3.5 px-3 bg-slate-100">الموقع الوظيفي</th>
                  <th class="py-3.5 px-3 bg-slate-100">المكتب</th>
                  <th class="py-3.5 px-3 bg-slate-100">تاريخ التسليم للأصول</th>
                  <th class="py-3.5 px-3 bg-slate-100">المرفقات</th>
                  <th class="py-3.5 px-3 bg-slate-100">الحالة والملاحظة</th>
                  <th class="py-3.5 px-3 text-center bg-slate-100">إجراء</th>
                </tr>
              </thead>
              <tbody id="contractorTableBody" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>

        <!-- Contractor Sub-View 2: New / Edit Invoice Submission Form -->
        <div id="contractorFormPanel" class="hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200">
            <div>
              <h2 id="cFormHeading" class="text-xl font-extrabold text-se-dark-blue">تقديم فاتورة صيانة / طوارئ جديدة</h2>
              <p class="text-xs text-slate-500 mt-1">عبّئ كافة حقول الجدول المعتمد وأرفق صور مراحل التنفيذ ليتم حفظها وتصنيفها تلقائياً</p>
            </div>
            <button type="button" onclick="resetContractorForm(); switchContractorTab('list');" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
              العودة للسجل
            </button>
          </div>

          <form id="contractorInvoiceForm" onsubmit="submitContractorInvoice(event)" class="space-y-6">
            <input type="hidden" id="cEditId" value="" />

            <!-- Duplicate WO Alert -->
            <div id="duplicateWoAlert" class="hidden p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-2">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600 shrink-0"></i>
              <span id="duplicateWoText"></span>
            </div>

            <!-- Grid Fields matching Excel Columns -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">رقم أمر العمل *</label>
                <input type="text" id="cf_wo" required oninput="checkDuplicateWo(this.value)" placeholder="مثال: 422073943"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-mono font-bold outline-none" dir="ltr" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">المقاول (مثبّت تلقائياً)</label>
                <input type="text" id="cf_contractor" readonly
                  class="w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-2.5 px-3.5 text-sm font-bold cursor-not-allowed" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">الاستشاري *</label>
                <select id="cf_consultant" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">تاريخ الفاتورة *</label>
                <input type="date" id="cf_invoiceDate" required
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">نوع العمل *</label>
                <select id="cf_workType" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">وصف العمل *</label>
                <input type="text" id="cf_workDesc" list="workDescList" required placeholder="اختر أو اكتب وصف العمل..."
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none" />
                <datalist id="workDescList"></datalist>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">نوع المعدة *</label>
                <select id="cf_equipType" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">الموقع الوظيفي (Functional Location) *</label>
                <input type="text" id="cf_funcLoc" required placeholder="مثال: 4400-JHS-090101"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-mono font-semibold outline-none" dir="ltr" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">المكتب *</label>
                <select id="cf_office" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">تاريخ تسليم الفاتورة للأصول (تلقائي بتاريخ اليوم)</label>
                <input type="date" id="cf_deliveryDate" readonly required
                  class="w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-2.5 px-3.5 text-sm font-bold cursor-not-allowed outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">ملاحظات إضافية من المقاول (اختياري)</label>
                <input type="text" id="cf_contractorNote" placeholder="أي تفاصيل ميدانية أو رقم طلب SAP..."
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm outline-none" />
              </div>
            </div>

            <!-- Smart Pre-Submission Quality Checklist -->
            <div class="bg-se-navy-50/70 border border-se-navy-100 rounded-2xl p-4 sm:p-5">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2">
                  <i data-lucide="clipboard-check" class="w-5 h-5 text-se-mid-blue"></i>
                  <h3 class="text-sm font-extrabold text-se-dark-blue">قائمة التحقق الذكية قبل الرفع (لتفادي تأخر واعتماد الفاتورة)</h3>
                </div>
                <span id="checklistScoreBadge" class="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800">جاهزية: 0%</span>
              </div>
              <div class="w-full h-2 bg-white rounded-full overflow-hidden mb-4 border border-se-navy-100">
                <div id="checklistProgressBar" class="h-full bg-se-mid-blue transition-all duration-300" style="width: 0%"></div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-bold text-se-dark-blue">
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="gis" onchange="updateChecklistProgress()" />
                  <span>تم توقيع الفاتورة من قسم GIS</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="sap" onchange="updateChecklistProgress()" />
                  <span>تم إنشاء المعدة على نظام SAP</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="pretest" onchange="updateChecklistProgress()" />
                  <span>إرفاق نموذج اختبار ما قبل التشغيل</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="photosMatch" onchange="updateChecklistProgress()" />
                  <span>الصور مطابقة لمراحل العمل المنفذ</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="warningTape" onchange="updateChecklistProgress()" />
                  <span>الالتزام بالشريط التحذيري للحفر/الجوينت</span>
                </label>
              </div>
            </div>

            <!-- Multi-Photo Upload & Dropbox Zone -->
            <div class="border-2 border-dashed border-slate-300 hover:border-se-mid-blue rounded-2xl p-5 bg-slate-50/70 transition">
              <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-se-light-blue/20 text-se-mid-blue flex items-center justify-center">
                    <i data-lucide="camera" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-se-dark-blue">إرفاق صور الأعمال والفاتورة (الأرشفة على Dropbox)</h3>
                    <p class="text-xs text-slate-500">يتم ضغط الصور تلقائياً وأرشفتها داخل مجلد المقاول وأمر العمل على Dropbox</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs font-bold text-slate-600">تصنيف الصورة:</label>
                  <select id="photoStageSelect" class="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-bold outline-none">
                    <option value="قبل التنفيذ">قبل التنفيذ</option>
                    <option value="أثناء العمل">أثناء العمل</option>
                    <option value="بعد التنفيذ">بعد التنفيذ</option>
                    <option value="صورة الفاتورة">صورة الفاتورة</option>
                  </select>
                </div>
              </div>

              <label for="cf_photoInput" class="flex flex-col items-center justify-center py-6 px-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-se-light-blue/10 transition text-center">
                <i data-lucide="cloud-upload" class="w-8 h-8 text-se-mid-blue mb-2"></i>
                <span class="text-sm font-bold text-se-dark-blue">اضغط لاختيار الملفات (صور، PDF، بوربوينت) أو اسحبها هنا</span>
                <span class="text-xs text-slate-400 mt-1">يدعم رفع الصور (JPG, PNG)، ملفات PDF، وعروض PowerPoint (PPT, PPTX)</span>
                <input type="file" id="cf_photoInput" accept="image/*,.pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" multiple class="hidden" onchange="handlePhotoSelection(event)" />
              </label>

              <div id="pendingPhotosGrid" class="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3"></div>
            </div>

            <!-- Submit Button -->
            <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button type="button" onclick="resetContractorForm()" class="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition">
                مسح الحقول
              </button>
              <button type="submit" id="cfSubmitBtn" class="px-7 py-3 rounded-xl bg-se-mid-blue hover:bg-se-blue text-white text-sm font-extrabold shadow-lg shadow-se-mid-blue/25 transition flex items-center gap-2">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>اعتماد ورفع الفاتورة للقسم</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </section>
`;
