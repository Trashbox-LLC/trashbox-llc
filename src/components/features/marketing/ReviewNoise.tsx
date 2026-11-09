"use client";

import { useLayoutEffect, useRef, type ReactElement } from "react";

/** Same field as the noise shader, with its catalog defaults. */
const VERTEX = `precision mediump float;
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `precision mediump float;
uniform float u_time;
uniform float u_aspect;
uniform float u_scale;
uniform float u_speed;
uniform float u_contrast;
uniform float u_rotation;
uniform vec3 u_shadow;
uniform vec3 u_mid;
uniform vec3 u_hot;
uniform vec3 u_light;
varying vec2 v_uv;

vec2 spin(vec2 p, float angle) {
  float cs = cos(angle);
  float sn = sin(angle);
  p -= 0.5;
  return mat2(cs, sn, -sn, cs) * p + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = v_uv;
  uv.x = (uv.x - 0.5) * u_aspect + 0.5;
  vec2 p = spin(uv, u_rotation) * u_scale;
  float t = u_time * u_speed;
  float q = noise(p + t);
  float warped = noise(p + q * 1.7 + vec2(t, -t));
  float n = clamp((noise(p * 1.35 + warped * 1.5) - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  vec3 color = mix(u_shadow, u_mid, smoothstep(0.22, 0.55, n));
  color = mix(color, u_hot, smoothstep(0.48, 0.74, n));
  color = mix(color, u_light, smoothstep(0.72, 0.94, n));
  gl_FragColor = vec4(color, 1.0);
}`;

const POSITIONS = new Float32Array([-1, -1, 3, -1, -1, 3]);

function hexToRgb(hex: string): [number, number, number] {
  const int = Number.parseInt(hex.slice(1), 16);
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  ];
}

const UNIFORMS = {
  u_scale: 3.4,
  u_speed: 0.2,
  u_contrast: 1,
  u_rotation: 0,
  u_shadow: hexToRgb("#061018"),
  u_mid: hexToRgb("#1d4ed8"),
  u_hot: hexToRgb("#38bdf8"),
  u_light: hexToRgb("#e8f4ff"),
} as const;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function ReviewNoise(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false,
      });
    } catch {
      return;
    }
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;

    const position = gl.getAttribLocation(program, "a_position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, POSITIONS, gl.STATIC_DRAW);

    const locations = {
      time: gl.getUniformLocation(program, "u_time"),
      aspect: gl.getUniformLocation(program, "u_aspect"),
      scale: gl.getUniformLocation(program, "u_scale"),
      speed: gl.getUniformLocation(program, "u_speed"),
      contrast: gl.getUniformLocation(program, "u_contrast"),
      rotation: gl.getUniformLocation(program, "u_rotation"),
      shadow: gl.getUniformLocation(program, "u_shadow"),
      mid: gl.getUniformLocation(program, "u_mid"),
      hot: gl.getUniformLocation(program, "u_hot"),
      light: gl.getUniformLocation(program, "u_light"),
    };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let stopped = false;
    let visible = true;
    let frame = 0;
    let elapsed = 0;
    let last = performance.now();

    const draw = (now: number): void => {
      frame = 0;
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !reduced) elapsed += dt;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        if (visible && !reduced) frame = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      if (position >= 0) {
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      }
      if (locations.time) gl.uniform1f(locations.time, elapsed);
      if (locations.aspect) {
        gl.uniform1f(
          locations.aspect,
          canvas.clientWidth / Math.max(canvas.clientHeight, 1),
        );
      }
      if (locations.scale) gl.uniform1f(locations.scale, UNIFORMS.u_scale);
      if (locations.speed) gl.uniform1f(locations.speed, UNIFORMS.u_speed);
      if (locations.contrast) {
        gl.uniform1f(locations.contrast, UNIFORMS.u_contrast);
      }
      if (locations.rotation) {
        gl.uniform1f(locations.rotation, UNIFORMS.u_rotation);
      }
      if (locations.shadow) {
        gl.uniform3fv(locations.shadow, UNIFORMS.u_shadow);
      }
      if (locations.mid) gl.uniform3fv(locations.mid, UNIFORMS.u_mid);
      if (locations.hot) gl.uniform3fv(locations.hot, UNIFORMS.u_hot);
      if (locations.light) gl.uniform3fv(locations.light, UNIFORMS.u_light);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (visible && !reduced) frame = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible && !reduced && !stopped && frame === 0) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    });
    observer.observe(canvas);
    draw(last);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
