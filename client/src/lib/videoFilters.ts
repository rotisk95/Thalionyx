import * as THREE from 'three';
import { FilterType } from '@/types/reflection';

export interface FilterConfig {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export const filterConfigs: Record<FilterType, FilterConfig> = {
  vintage: {
    name: 'Vintage',
    description: 'Warm, nostalgic tone with subtle grain',
    parameters: { sepia: 0.3, vignette: 0.2, grain: 0.1 }
  },
  warm: {
    name: 'Warm',
    description: 'Comforting warm color temperature',
    parameters: { temperature: 0.3, brightness: 0.1 }
  },
  cool: {
    name: 'Cool',
    description: 'Calming cool blue tones',
    parameters: { temperature: -0.3, saturation: 0.9 }
  },
  high_contrast: {
    name: 'High Contrast',
    description: 'Enhanced clarity and definition',
    parameters: { contrast: 0.4, sharpness: 0.2 }
  },
  soft_focus: {
    name: 'Soft Focus',
    description: 'Gentle, dreamy blur effect',
    parameters: { blur: 0.3, glow: 0.2 }
  },
  mirror: {
    name: 'Mirror',
    description: 'Reflective symmetrical effect',
    parameters: { axis: 'vertical', intensity: 1.0 }
  },
  kaleidoscope: {
    name: 'Kaleidoscope',
    description: 'Multi-faceted reflection pattern',
    parameters: { segments: 6, rotation: 0 }
  },
  particle_overlay: {
    name: 'Particle Overlay',
    description: 'Floating particles for contemplative mood',
    parameters: { density: 0.5, speed: 0.2 }
  },
  dreamy: {
    name: 'Dreamy',
    description: 'Ethereal, cloud-like softness',
    parameters: { softness: 0.4, luminance: 0.2 }
  },
  crystalline: {
    name: 'Crystalline',
    description: 'Geometric crystal-like refractions',
    parameters: { facets: 8, intensity: 0.3 }
  },
  flowing: {
    name: 'Flowing',
    description: 'Gentle wave-like distortions',
    parameters: { amplitude: 0.1, frequency: 2.0 }
  },
  geometric: {
    name: 'Geometric',
    description: 'Abstract geometric overlays',
    parameters: { complexity: 0.5, opacity: 0.3 }
  }
};

// Shader for color temperature and basic adjustments
const colorAdjustmentShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float temperature;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float sepia;
    uniform float vignette;
    uniform float grain;
    varying vec2 vUv;

    vec3 adjustTemperature(vec3 color, float temp) {
      if (temp > 0.0) {
        color.r = mix(color.r, 1.0, temp * 0.3);
        color.g = mix(color.g, 0.8, temp * 0.1);
      } else {
        color.b = mix(color.b, 1.0, abs(temp) * 0.3);
        color.g = mix(color.g, 0.9, abs(temp) * 0.1);
      }
      return color;
    }

    vec3 adjustSaturation(vec3 color, float sat) {
      float grey = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(grey), color, sat);
    }

    vec3 adjustContrast(vec3 color, float cont) {
      return (color - 0.5) * (1.0 + cont) + 0.5;
    }

    vec3 applySepia(vec3 color, float amount) {
      vec3 sepia = vec3(
        color.r * 0.393 + color.g * 0.769 + color.b * 0.189,
        color.r * 0.349 + color.g * 0.686 + color.b * 0.168,
        color.r * 0.272 + color.g * 0.534 + color.b * 0.131
      );
      return mix(color, sepia, amount);
    }

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Apply adjustments
      color = adjustTemperature(color, temperature);
      color = adjustSaturation(color, saturation);
      color = adjustContrast(color, contrast);
      color += brightness;
      color = applySepia(color, sepia);

      // Vignette effect
      float dist = distance(vUv, vec2(0.5));
      color *= 1.0 - smoothstep(0.3, 1.0, dist) * vignette;

      // Film grain
      if (grain > 0.0) {
        float noise = random(vUv + fract(time * 0.001)) * 2.0 - 1.0;
        color += noise * grain * 0.1;
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

// Blur shader for soft focus effects
const blurShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float blur;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      vec4 color = vec4(0.0);
      float total = 0.0;
      
      if (blur > 0.0) {
        float blurSize = blur * 0.01;
        
        for (float x = -3.0; x <= 3.0; x++) {
          for (float y = -3.0; y <= 3.0; y++) {
            vec2 offset = vec2(x, y) * blurSize / resolution;
            float weight = exp(-(x*x + y*y) / 8.0);
            color += texture2D(tDiffuse, vUv + offset) * weight;
            total += weight;
          }
        }
        
        color /= total;
      } else {
        color = texture2D(tDiffuse, vUv);
      }

      gl_FragColor = color;
    }
  `
};

export class VideoFilterProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private quad: THREE.Mesh;

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;

    // Three.js setup for advanced filters
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);

    // Quad for full-screen effects
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry);
    this.scene.add(this.quad);
  }

  async applyFilter(
    videoElement: HTMLVideoElement,
    filterType: FilterType,
    settings?: Record<string, any>
  ): Promise<HTMLCanvasElement> {
    const config = filterConfigs[filterType];
    const params = { ...config.parameters, ...settings };

    // Draw video frame to canvas
    this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);

    switch (filterType) {
      case 'vintage':
      case 'warm':
      case 'cool':
      case 'high_contrast':
        return this.applyColorAdjustment(params);
      
      case 'soft_focus':
      case 'dreamy':
        return this.applyBlur(params);
      
      case 'mirror':
        return this.applyMirror(params);
      
      case 'kaleidoscope':
        return this.applyKaleidoscope(params);
      
      case 'particle_overlay':
        return this.applyParticleOverlay(params);
      
      case 'crystalline':
        return this.applyCrystalline(params);
      
      case 'flowing':
        return this.applyFlowing(params);
      
      case 'geometric':
        return this.applyGeometric(params);
      
      default:
        return this.canvas;
    }
  }

  private applyColorAdjustment(params: Record<string, any>): HTMLCanvasElement {
    const texture = new THREE.CanvasTexture(this.canvas);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: texture },
        temperature: { value: params.temperature || 0 },
        brightness: { value: params.brightness || 0 },
        contrast: { value: params.contrast || 0 },
        saturation: { value: params.saturation || 1 },
        sepia: { value: params.sepia || 0 },
        vignette: { value: params.vignette || 0 },
        grain: { value: params.grain || 0 },
        time: { value: Date.now() }
      },
      vertexShader: colorAdjustmentShader.vertexShader,
      fragmentShader: colorAdjustmentShader.fragmentShader
    });

    this.quad.material = material;
    this.renderer.render(this.scene, this.camera);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;
    outputCtx.drawImage(this.renderer.domElement, 0, 0);

    return outputCanvas;
  }

  private applyBlur(params: Record<string, any>): HTMLCanvasElement {
    const texture = new THREE.CanvasTexture(this.canvas);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: texture },
        blur: { value: params.blur || params.softness || 0 },
        resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) }
      },
      vertexShader: blurShader.vertexShader,
      fragmentShader: blurShader.fragmentShader
    });

    this.quad.material = material;
    this.renderer.render(this.scene, this.camera);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;
    outputCtx.drawImage(this.renderer.domElement, 0, 0);

    return outputCanvas;
  }

  private applyMirror(params: Record<string, any>): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    if (params.axis === 'vertical') {
      // Left half normal, right half mirrored
      outputCtx.drawImage(this.canvas, 0, 0, this.canvas.width / 2, this.canvas.height, 
                         0, 0, this.canvas.width / 2, this.canvas.height);
      outputCtx.scale(-1, 1);
      outputCtx.drawImage(this.canvas, 0, 0, this.canvas.width / 2, this.canvas.height,
                         -this.canvas.width, 0, this.canvas.width / 2, this.canvas.height);
    } else {
      // Top half normal, bottom half mirrored
      outputCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height / 2,
                         0, 0, this.canvas.width, this.canvas.height / 2);
      outputCtx.scale(1, -1);
      outputCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height / 2,
                         0, -this.canvas.height, this.canvas.width, this.canvas.height / 2);
    }

    return outputCanvas;
  }

  private applyKaleidoscope(params: Record<string, any>): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const segments = params.segments || 6;
    const angleStep = (Math.PI * 2) / segments;

    outputCtx.translate(centerX, centerY);

    for (let i = 0; i < segments; i++) {
      outputCtx.save();
      outputCtx.rotate(i * angleStep + (params.rotation || 0));
      outputCtx.drawImage(this.canvas, -centerX, -centerY);
      outputCtx.restore();
    }

    return outputCanvas;
  }

  private applyParticleOverlay(params: Record<string, any>): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    // Draw original video
    outputCtx.drawImage(this.canvas, 0, 0);

    // Add floating particles
    const density = params.density || 0.5;
    const particleCount = Math.floor(this.canvas.width * this.canvas.height * density * 0.0001);

    outputCtx.globalCompositeOperation = 'screen';
    outputCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = Math.random() * 3 + 1;
      
      outputCtx.beginPath();
      outputCtx.arc(x, y, size, 0, Math.PI * 2);
      outputCtx.fill();
    }

    outputCtx.globalCompositeOperation = 'source-over';
    return outputCanvas;
  }

  private applyCrystalline(params: Record<string, any>): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    // Create crystalline facet effect
    const facets = params.facets || 8;
    const intensity = params.intensity || 0.3;

    for (let i = 0; i < facets; i++) {
      const angle = (i / facets) * Math.PI * 2;
      const offsetX = Math.cos(angle) * intensity * 20;
      const offsetY = Math.sin(angle) * intensity * 20;

      outputCtx.globalAlpha = 0.3 / facets;
      outputCtx.drawImage(this.canvas, offsetX, offsetY);
    }

    outputCtx.globalAlpha = 0.7;
    outputCtx.drawImage(this.canvas, 0, 0);
    outputCtx.globalAlpha = 1;

    return outputCanvas;
  }

  private applyFlowing(params: Record<string, any>): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    const amplitude = params.amplitude || 0.1;
    const frequency = params.frequency || 2.0;
    const time = Date.now() * 0.001;

    // Create wave distortion
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const distortedData = outputCtx.createImageData(this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const waveX = Math.sin(y * frequency * 0.01 + time) * amplitude * this.canvas.width * 0.1;
        const waveY = Math.cos(x * frequency * 0.01 + time) * amplitude * this.canvas.height * 0.05;

        const sourceX = Math.floor(x + waveX);
        const sourceY = Math.floor(y + waveY);

        if (sourceX >= 0 && sourceX < this.canvas.width && sourceY >= 0 && sourceY < this.canvas.height) {
          const sourceIndex = (sourceY * this.canvas.width + sourceX) * 4;
          const targetIndex = (y * this.canvas.width + x) * 4;

          distortedData.data[targetIndex] = imageData.data[sourceIndex];
          distortedData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
          distortedData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
          distortedData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
        }
      }
    }

    outputCtx.putImageData(distortedData, 0, 0);
    return outputCanvas;
  }

  private applyGeometric(params: Record<string, any>): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.canvas.width;
    outputCanvas.height = this.canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    // Draw original video
    outputCtx.drawImage(this.canvas, 0, 0);

    // Add geometric overlays
    const complexity = params.complexity || 0.5;
    const opacity = params.opacity || 0.3;
    const shapeCount = Math.floor(complexity * 20);

    outputCtx.globalAlpha = opacity;
    outputCtx.strokeStyle = '#ffffff';
    outputCtx.lineWidth = 2;

    for (let i = 0; i < shapeCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = Math.random() * 100 + 20;
      const sides = Math.floor(Math.random() * 6) + 3;

      this.drawPolygon(outputCtx, x, y, size, sides);
    }

    outputCtx.globalAlpha = 1;
    return outputCanvas;
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
    const angle = (Math.PI * 2) / sides;
    ctx.beginPath();
    
    for (let i = 0; i < sides; i++) {
      const px = x + Math.cos(i * angle) * radius;
      const py = y + Math.sin(i * angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
  }

  dispose() {
    this.renderer.dispose();
  }
}
