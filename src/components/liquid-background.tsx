import { useEffect, useRef } from "react";

/**
 * Liquid Metal WebGL background — animated flowing chrome/blue liquid.
 * Fullscreen fragment shader. Pauses when tab hidden or reduced motion.
 */
export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const vert = `
      attribute vec2 p;
      void main(){ gl_Position = vec4(p, 0.0, 1.0); }
    `;

    // Liquid metal: simplex-style noise (no axis-aligned grid) + cursor warp
    const frag = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec2 u_mouse;   // in uv space (aspect-corrected)
      uniform float u_mouseA; // 0..1 presence

      // Simplex 2D noise (Ashima) — isotropic, no square-cell artifacts
      vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // rotated fbm — fewer octaves for GPU cost, rotation kills alignment
      float fbm(vec2 p){
        float v = 0.0; float a = 0.5;
        mat2 R = mat2(0.8, -0.6, 0.6, 0.8);
        for(int i=0;i<3;i++){
          v += a * snoise(p);
          p = R * p * 2.03;
          a *= 0.5;
        }
        return v;
      }

      float field(vec2 p){
        float t = u_time * 0.015;
        // cursor-driven radial warp — pulls the flow toward the pointer
        vec2 md = p - u_mouse;
        float mr2 = dot(md, md);
        float infl = u_mouseA * exp(-mr2*3.0);
        p += normalize(md + 1e-4) * infl * 0.35;

        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
        vec2 r = vec2(fbm(p + 2.2*q + vec2(1.7,9.2) + t*0.20),
                      fbm(p + 2.2*q + vec2(8.3,2.8) - t*0.18));
        return fbm(p + 2.0*r + infl * 1.2);
      }

      void main(){
        vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
        vec2 p = uv * 0.35; // strongly zoomed in

        float e = 0.006;
        float c  = field(p);
        float cx = field(p + vec2(e,0.0));
        float cy = field(p + vec2(0.0,e));
        vec3 n = normalize(vec3((cx-c)/e, (cy-c)/e, 1.2));

        // metallic chrome palette — brighter, slight blue tint
        vec3 deep    = vec3(0.06, 0.08, 0.11);
        vec3 midCol  = vec3(0.28, 0.34, 0.42);
        vec3 cyanHi  = vec3(0.62, 0.78, 0.92);
        vec3 whiteHi = vec3(0.96, 0.98, 1.00);

        float ang = atan(n.y, n.x);
        float wave = 0.5 + 0.5*sin(ang*1.6 + c*4.0 + u_time*0.04);
        wave = smoothstep(0.12, 0.95, wave);

        float spec = pow(clamp(n.z, 0.0, 1.0), 3.2);
        float glint = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.5);

        vec3 col = mix(deep, midCol, wave);
        col = mix(col, cyanHi, glint * 0.65);
        col += whiteHi * spec * 0.35;

        // subtle cursor halo — soft cool glow follows the pointer
        float mr = length(p - u_mouse);
        float halo = u_mouseA * exp(-mr*mr*6.0);
        col += cyanHi * halo * 0.15;

        col = pow(col, vec3(0.95));

        float v = smoothstep(1.7, 0.15, length(uv));
        col *= mix(0.75, 1.05, v);


        gl_FragColor = vec4(col, 1.0);
      }
    `;



    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseA = gl.getUniformLocation(prog, "u_mouseA");

    // Adaptive quality: manual override via localStorage 'liquid-quality' =
    // 'low' | 'medium' | 'high' | 'auto'. Also exposed as window.setLiquidQuality().
    type Q = "low" | "medium" | "high";
    const PRESETS: Record<Q, { scale: number; fps: number }> = {
      low:    { scale: 0.45, fps: 24 },
      medium: { scale: 0.65, fps: 30 },
      high:   { scale: 0.9,  fps: 60 },
    };
    const readOverride = (): Q | "auto" => {
      try {
        const v = localStorage.getItem("liquid-quality");
        if (v === "low" || v === "medium" || v === "high" || v === "auto") return v;
      } catch {}
      return "auto";
    };
    let override = readOverride();
    let quality: Q = override === "auto" ? "medium" : override;
    const baseDpr = Math.min(window.devicePixelRatio || 1, 1.25);
    let scale = PRESETS[quality].scale;
    let FRAME_MS = 1000 / PRESETS[quality].fps;

    const resize = () => {
      const w = Math.max(1, Math.floor(window.innerWidth * baseDpr * scale));
      const h = Math.max(1, Math.floor(window.innerHeight * baseDpr * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    };
    const applyQuality = (q: Q) => {
      quality = q;
      scale = PRESETS[q].scale;
      FRAME_MS = 1000 / PRESETS[q].fps;
      resize();
    };
    resize();
    window.addEventListener("resize", resize);

    // Expose manual API
    (window as any).setLiquidQuality = (q: Q | "auto") => {
      try { localStorage.setItem("liquid-quality", q); } catch {}
      override = q;
      if (q !== "auto") applyQuality(q);
    };
    (window as any).getLiquidQuality = () => ({ override, active: quality });



    // Cursor tracking — convert to shader uv space (aspect-corrected, y flipped)
    const mouseTarget = { x: 0, y: 0, a: 0 };
    const mouseCurr = { x: 0, y: 0, a: 0 };
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth, h = window.innerHeight;
      mouseTarget.x = ((e.clientX - w * 0.5) / h) * 1.1;
      mouseTarget.y = ((h * 0.5 - e.clientY) / h) * 1.1;
      mouseTarget.a = 1;
    };
    const onLeave = () => { mouseTarget.a = 0; };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);

    let raf = 0;
    let hidden = document.hidden;
    const onVis = () => { hidden = document.hidden; if (!hidden) tick(performance.now()); };
    document.addEventListener("visibilitychange", onVis);

    const start = performance.now();
    const FRAME_MS = 1000 / 30; // cap to 30fps
    let lastDraw = 0;
    const tick = (now: number) => {
      if (hidden) return;
      raf = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      mouseCurr.x += (mouseTarget.x - mouseCurr.x) * 0.08;
      mouseCurr.y += (mouseTarget.y - mouseCurr.y) * 0.08;
      mouseCurr.a += (mouseTarget.a - mouseCurr.a) * 0.06;
      gl.uniform2f(uMouse, mouseCurr.x, mouseCurr.y);
      gl.uniform1f(uMouseA, mouseCurr.a);
      gl.uniform1f(uTime, (now - start) * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (reduced) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(tick);


    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden="true" className="liquid-bg">
      <canvas ref={canvasRef} className="liquid-canvas" />
    </div>
  );
}
