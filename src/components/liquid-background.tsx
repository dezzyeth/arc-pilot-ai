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

      // rotated fbm — rotate between octaves to further kill any alignment
      float fbm(vec2 p){
        float v = 0.0; float a = 0.5;
        mat2 R = mat2(0.8, -0.6, 0.6, 0.8);
        for(int i=0;i<5;i++){
          v += a * snoise(p);
          p = R * p * 2.03;
          a *= 0.5;
        }
        return v;
      }

      float field(vec2 p){
        float t = u_time * 0.06;
        // cursor-driven radial warp — pulls the flow toward the pointer
        vec2 md = p - u_mouse;
        float mr = length(md);
        float infl = u_mouseA * exp(-mr*mr*3.0);
        p += normalize(md + 1e-4) * infl * 0.35;

        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
        vec2 r = vec2(fbm(p + 2.2*q + vec2(1.7,9.2) + t*0.20),
                      fbm(p + 2.2*q + vec2(8.3,2.8) - t*0.18));
        return fbm(p + 2.0*r + infl * 1.2);
      }

      void main(){
        vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
        vec2 p = uv * 1.1;

        float e = 0.004;
        float c  = field(p);
        float cx = field(p + vec2(e,0.0));
        float cy = field(p + vec2(0.0,e));
        vec3 n = normalize(vec3((cx-c)/e, (cy-c)/e, 1.2));

        vec3 deep    = vec3(0.005, 0.015, 0.05);
        vec3 midCol  = vec3(0.03,  0.12,  0.38);
        vec3 cyanHi  = vec3(0.35,  0.85,  1.00);
        vec3 whiteHi = vec3(0.90,  0.97,  1.00);

        float ang = atan(n.y, n.x);
        float wave = 0.5 + 0.5*sin(ang*1.6 + c*4.0 + u_time*0.15);
        wave = smoothstep(0.15, 0.95, wave);

        float spec = pow(clamp(n.z, 0.0, 1.0), 3.5);
        float glint = pow(1.0 - clamp(n.z, 0.0, 1.0), 4.0);

        vec3 col = mix(deep, midCol, wave);
        col = mix(col, cyanHi, glint * 0.75);
        col += whiteHi * spec * 0.35;

        // subtle cursor halo — soft cyan glow follows the pointer
        float mr = length(p - u_mouse);
        float halo = u_mouseA * exp(-mr*mr*6.0);
        col += cyanHi * halo * 0.18;

        col = pow(col, vec3(0.95));

        float v = smoothstep(1.6, 0.15, length(uv));
        col *= mix(0.7, 1.05, v);

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

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const resize = () => {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let hidden = document.hidden;
    const onVis = () => { hidden = document.hidden; if (!hidden) tick(performance.now()); };
    document.addEventListener("visibilitychange", onVis);

    const start = performance.now();
    const tick = (now: number) => {
      if (hidden) return;
      gl.uniform1f(uTime, (now - start) * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden="true" className="liquid-bg">
      <canvas ref={canvasRef} className="liquid-canvas" />
    </div>
  );
}
