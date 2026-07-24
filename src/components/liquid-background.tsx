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

    // Liquid metal: layered domain-warped noise -> normal -> fake env reflection
    const frag = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;

      // hash / noise
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i+vec2(1.0,0.0));
        float c = hash(i+vec2(0.0,1.0));
        float d = hash(i+vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }
      float fbm(vec2 p){
        float v = 0.0; float a = 0.5;
        for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
        return v;
      }

      float field(vec2 p){
        float t = u_time * 0.08;
        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
        vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7,9.2) + t*0.5),
                      fbm(p + 3.0*q + vec2(8.3,2.8) - t*0.4));
        return fbm(p + 2.5*r);
      }

      void main(){
        vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
        vec2 p = uv * 2.2;

        float e = 0.0025;
        float c  = field(p);
        float cx = field(p + vec2(e,0.0));
        float cy = field(p + vec2(0.0,e));
        vec3 n = normalize(vec3((cx-c)/e, (cy-c)/e, 1.0));

        // fake env: vertical bands + highlights driven by normal
        vec3 base   = vec3(0.02, 0.05, 0.12);
        vec3 midCol = vec3(0.05, 0.18, 0.45);
        vec3 hiCol  = vec3(0.55, 0.85, 1.0);
        vec3 deep   = vec3(0.01, 0.02, 0.06);

        float bands = 0.5 + 0.5*sin(n.x*6.2831 + n.y*3.0 + u_time*0.3);
        float spec  = pow(clamp(n.z, 0.0, 1.0), 8.0);
        float rim   = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.5);

        vec3 col = mix(deep, midCol, bands);
        col = mix(col, hiCol, spec*0.9);
        col += rim * vec3(0.15, 0.35, 0.7);
        col = mix(base, col, 0.9);

        // subtle vignette
        float v = smoothstep(1.4, 0.2, length(uv));
        col *= mix(0.65, 1.0, v);

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
