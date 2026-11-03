import React, { useEffect, useRef } from 'react';

/**
 * صحنه سه‌بعدی زنده ورود (Shader سفارشی WebGL، بدون دارایی خارجی؛ ≈ ۳KB کد):
 * خطوط/پرتوهای نوری با پرسپکتیو عمیق از پایین به بالا که در نقطه گریز به هرم نوری متمرکز می‌شوند،
 * ذرات معلق بسیار ریز، و حالت Warp (حرکت دوربین رو به جلو) پس از ورود موفق.
 * - رنگ‌ها = توکن‌های Solar Ember (Plum/Coral/Gold). پس‌زمینه شفاف است (روی Warm Ivory یا تم تیره).
 * - fallback: بدون WebGL / reduced-motion → هیچ canvas رندر نمی‌شود و نسخه CSS قبلی (se-light-highway) فعال می‌ماند.
 * - عملکرد: DPR حداکثر ۱٫۵، مقیاس کمتر روی دستگاه کم‌حافظه، توقف رندر با پنهان‌شدن تب.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uTime, uAwake, uWarp, uDark;
uniform vec2 uPointer; // پارالاکس سه‌بعدی تعاملی
float hash(vec2 s){ return fract(sin(dot(s, vec2(127.1,311.7))) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;                 // 0..1، پایین-چپ
  float asp = uRes.x / uRes.y;
  vec2 vp = vec2(0.5 + uPointer.x * 0.08, 0.68 + uPointer.y * 0.05); // نقطه گریز با پرسپکتیو پویا
  vec2 d = vec2((uv.x - vp.x) * clamp(asp, 0.75, 1.35), vp.y - uv.y);
  float t = uTime * (1.0 + uWarp * 7.5);
  vec3 plum = vec3(.46,.18,.30), coral = vec3(.85,.42,.32), gold = vec3(.96,.72,.36);
  vec3 col = vec3(0.); float a = 0.;
  if (d.y > -0.05) {
    float r = length(d);
    float ang = atan(d.x, max(d.y, 0.001));          // زاویه از محور عمودی
    float spread = mix(1.1, 2.2, uWarp);             // پهنای هرم نوری برای پوشش تمام‌عرض
    float env = (1.0 - smoothstep(spread * .55, spread, abs(ang)));
    // خطوط شعاعی پرتوهای نوری (3D Light Streams)
    float N = 32.0; float sa = ang * N / spread;
    float id = floor(sa); float f = fract(sa);
    float line = smoothstep(.0, .11, 1.0 - abs(f - .5) * 2.0 - .88);
    float rnd = hash(vec2(id, 3.0));
    float flow = fract(r * (1.8 + rnd) - t * (.22 + rnd * .28) + rnd * 7.0);
    float pulse = smoothstep(.0, .14, flow) * (1.0 - smoothstep(.14, .65, flow));
    float vis = smoothstep(uAwake * 1.3 - .3, uAwake * 1.3, 1.0 - uv.y * 0.9);
    float depthFade = smoothstep(.0, .08, r) * (1.0 - smoothstep(.35, 1.45, r));
    float k = line * (.24 + pulse * 1.1) * env * vis * depthFade;
    col += mix(mix(plum, coral, rnd), gold, pulse) * k * 1.6; a += k * 1.25;
    // لبه‌های اریب هرم نوری سه‌بعدی
    float edge = (1.0 - smoothstep(.0, .02, abs(abs(ang) - spread * .68))) * vis * depthFade;
    col += gold * edge * 1.2; a += edge * 0.95;
    // خطوط عمق افقی (پرسپکتیو سه‌بعدی مسیر)
    float z = 1.0 / max(d.y, .015);
    float h = (1.0 - smoothstep(.0, .05, abs(fract(z * .45 - t * .4) - .5) - .44)) * env * vis * smoothstep(.0, .3, d.y);
    col += coral * h * .38; a += h * .32;
  }
  // هاله مرکزی و پرتوهای کانون نقطه گریز
  float glow = exp(-length((uv - vp) * vec2(asp, 1.)) * 4.2) * (.65 + .35 * sin(uTime * 1.4)) * uAwake;
  col += gold * glow * .75 + coral * glow * .35; a += glow * .65;
  // ذرات معلق طلایی در فضا (Floating Cosmic Dust)
  for (int i = 0; i < 3; i++) {
    float sc = 18. + float(i) * 14.;
    vec2 g = uv * vec2(sc * asp, sc) + vec2(uPointer.x * 0.2, t * (.06 + float(i) * .04) * sc * .2);
    vec2 cell = floor(g); vec2 fp = fract(g) - .5;
    float h1 = hash(cell + float(i) * 11.);
    vec2 off = (vec2(hash(cell + 1.7), hash(cell + 5.1)) - .5) * .65 + .08 * vec2(sin(uTime * .4 + h1 * 6.), cos(uTime * .3 + h1 * 9.));
    float dot_ = (1.0 - smoothstep(.0, .085, length(fp - off))) * step(.78, h1);
    col += gold * dot_ * .9; a += dot_ * .6 * uAwake;
  }
  // فلش و شتاب پایانی Warp
  float flash = smoothstep(.78, 1.0, uWarp);
  col = mix(col, vec3(1., .98, .92), flash * .65); a = clamp(a + flash * .85, 0., 1.);
  float outA = clamp(a * mix(1.05, 1.35, uDark), 0., 1.);
  gl_FragColor = vec4(col * outA, outA);              // premultiplied alpha
}`;

interface Props { phase: number; warp: boolean; className?: string }

export function LightHighwayCanvas({ phase, warp, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ phase, warp }); live.current = { phase, warp };
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointer = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current = { x: nx, y: -ny };
    };
    window.addEventListener('mousemove', handlePointer, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlePointer);
    };
  }, []);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const isLowPerf = document.documentElement.dataset.performanceMode === 'low';
    const weakDevice = isLowPerf && ((nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2) || nav.connection?.saveData === true);
    // Graceful degradation: keep the existing CSS light-highway visible on constrained devices.
    if (weakDevice) return;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' }) as WebGLRenderingContext | null;
    } catch {
      return;
    }
    if (!gl) return;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes'), uTime = U('uTime'), uAwake = U('uAwake'), uWarp = U('uWarp'), uDark = U('uDark'), uPointer = U('uPointer');
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const lowMem = ((navigator as any).deviceMemory ?? 8) <= 2;
    const scale = Math.min(window.devicePixelRatio || 1, 1.0) * (lowMem ? .6 : 1);
    const resize = () => { const w = Math.max(2, Math.floor(canvas.clientWidth * scale)), h = Math.max(2, Math.floor(canvas.clientHeight * scale)); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } gl.viewport(0, 0, canvas.width, canvas.height); };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    let raf = 0, last = performance.now(), time = 0, awake = 0, warpV = 0, running = true;
    let smoothPx = 0, smoothPy = 0;
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      const { phase: ph, warp: w } = live.current;
      const aTarget = ph >= 0 ? 1 : 0;
      awake += (aTarget - awake) * Math.min(1, dt * 1.8);
      warpV += ((w ? 1 : 0) - warpV) * Math.min(1, dt * (w ? 1.6 : 4));
      smoothPx += (pointerRef.current.x - smoothPx) * Math.min(1, dt * 3);
      smoothPy += (pointerRef.current.y - smoothPy) * Math.min(1, dt * 3);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uAwake, awake);
      gl.uniform1f(uWarp, warpV);
      gl.uniform2f(uPointer, smoothPx, smoothPy);
      gl.uniform1f(uDark, document.documentElement.getAttribute('data-theme') === 'dark' ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
    const onLost = (e: Event) => { e.preventDefault(); running = false; cancelAnimationFrame(raf); };
    document.addEventListener('visibilitychange', onVis); canvas.addEventListener('webglcontextlost', onLost);
    canvas.dataset.live = 'true';
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost); delete canvas.dataset.live; };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
