// Glitch Effects Library for Visual Transitions
// Provides RGB split, scanlines, screen tear, noise, and block glitch effects

class GlitchEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isActive = false;
        this.intensity = 0; // 0-1 scale
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
        this.isActive = intensity > 0.01;
    }

    // Main render function - call each frame during transition
    render(sourceCanvas1, sourceCanvas2, blendRatio) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (!this.isActive || this.intensity < 0.01) {
            return;
        }

        // Apply effects based on intensity thresholds
        if (this.intensity > 0.1 && sourceCanvas1 && sourceCanvas2) {
            this.applyRGBSplit(sourceCanvas1, sourceCanvas2, blendRatio);
        }

        if (this.intensity > 0.2) {
            this.applyScanlines();
        }

        if (this.intensity > 0.4) {
            this.applyScreenTear();
        }

        if (this.intensity > 0.5) {
            this.applyNoise();
        }

        if (this.intensity > 0.7) {
            this.applyBlockGlitch();
        }
    }

    // RGB Channel Splitting Effect
    applyRGBSplit(canvas1, canvas2, blend) {
        const offset = this.intensity * 25 * (Math.random() * 0.5 + 0.5);

        // Save current state
        this.ctx.save();

        // Use screen blend for additive glow
        this.ctx.globalCompositeOperation = 'screen';

        // Red channel - offset left, from outgoing visual
        this.ctx.globalAlpha = 0.3 * this.intensity;
        this.ctx.drawImage(canvas1, -offset, Math.random() * 4 - 2);

        // Green channel - center, blend between visuals
        this.ctx.globalAlpha = 0.25 * this.intensity;
        if (blend < 0.5) {
            this.ctx.drawImage(canvas1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        } else {
            this.ctx.drawImage(canvas2, Math.random() * 2 - 1, Math.random() * 2 - 1);
        }

        // Blue channel - offset right, from incoming visual
        this.ctx.globalAlpha = 0.3 * this.intensity;
        this.ctx.drawImage(canvas2, offset, Math.random() * 4 - 2);

        this.ctx.restore();
    }

    // Horizontal scanlines with occasional bright flashes
    applyScanlines() {
        const lineSpacing = 3 + Math.floor(Math.random() * 2);
        const alpha = this.intensity * 0.2;

        // Dark scanlines
        this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        for (let y = 0; y < this.height; y += lineSpacing) {
            this.ctx.fillRect(0, y, this.width, 1);
        }

        // Occasional bright interference line
        if (Math.random() < this.intensity * 0.4) {
            const brightY = Math.floor(Math.random() * this.height);
            const brightHeight = 1 + Math.floor(Math.random() * 3);

            // White flash
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.intensity * 0.15})`;
            this.ctx.fillRect(0, brightY, this.width, brightHeight);

            // Colored tint
            const hue = Math.random() * 360;
            this.ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${this.intensity * 0.1})`;
            this.ctx.fillRect(0, brightY - 2, this.width, brightHeight + 4);
        }
    }

    // Screen tearing / horizontal displacement
    applyScreenTear() {
        const numTears = Math.floor(this.intensity * 6);

        for (let i = 0; i < numTears; i++) {
            if (Math.random() < 0.4) {
                const y = Math.floor(Math.random() * this.height);
                const tearHeight = 3 + Math.floor(Math.random() * 25);
                const offsetX = (Math.random() - 0.5) * this.intensity * 80;

                // Only proceed if within bounds
                if (y + tearHeight < this.height && y > 0) {
                    try {
                        const imageData = this.ctx.getImageData(
                            Math.max(0, -offsetX),
                            y,
                            this.width - Math.abs(offsetX),
                            tearHeight
                        );
                        this.ctx.putImageData(imageData, Math.max(0, offsetX), y);
                    } catch (e) {
                        // Ignore cross-origin errors
                    }
                }
            }
        }
    }

    // Static noise overlay
    applyNoise() {
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = this.width;
        noiseCanvas.height = this.height;
        const noiseCtx = noiseCanvas.getContext('2d');

        const imageData = noiseCtx.createImageData(this.width, this.height);
        const data = imageData.data;
        const noiseStrength = this.intensity * 0.15;

        // Generate noise pattern
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < noiseStrength) {
                const value = Math.random() * 255;
                data[i] = value;     // R
                data[i + 1] = value; // G
                data[i + 2] = value; // B
                data[i + 3] = Math.random() * 100 * this.intensity; // A
            }
        }

        noiseCtx.putImageData(imageData, 0, 0);

        // Blend noise onto main canvas
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.globalAlpha = this.intensity * 0.5;
        this.ctx.drawImage(noiseCanvas, 0, 0);
        this.ctx.restore();
    }

    // Block displacement glitch
    applyBlockGlitch() {
        const numBlocks = Math.floor(this.intensity * 10);

        for (let i = 0; i < numBlocks; i++) {
            if (Math.random() < 0.5) {
                const blockWidth = 30 + Math.floor(Math.random() * 150);
                const blockHeight = 8 + Math.floor(Math.random() * 40);
                const srcX = Math.floor(Math.random() * (this.width - blockWidth));
                const srcY = Math.floor(Math.random() * (this.height - blockHeight));
                const destX = srcX + (Math.random() - 0.5) * this.intensity * 120;
                const destY = srcY + (Math.random() - 0.5) * this.intensity * 20;

                try {
                    const blockData = this.ctx.getImageData(srcX, srcY, blockWidth, blockHeight);

                    // Optionally color shift the block
                    if (Math.random() < 0.3) {
                        const data = blockData.data;
                        const shift = Math.floor(Math.random() * 3);
                        for (let j = 0; j < data.length; j += 4) {
                            // Rotate RGB channels
                            const r = data[j];
                            const g = data[j + 1];
                            const b = data[j + 2];
                            if (shift === 0) {
                                data[j] = g;
                                data[j + 1] = b;
                                data[j + 2] = r;
                            } else if (shift === 1) {
                                data[j] = b;
                                data[j + 1] = r;
                                data[j + 2] = g;
                            }
                        }
                    }

                    this.ctx.putImageData(blockData, destX, destY);
                } catch (e) {
                    // Ignore errors
                }
            }
        }
    }

    // Quick flash effect (call once, not every frame)
    flash(color = 'white', duration = 50) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
    }
}

// Easing functions for smooth transition curves
const Easings = {
    linear: t => t,

    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

    // Glitch-specific: creates stepping/stuttering effect
    glitchStep: t => {
        const steps = 8;
        const base = Math.floor(t * steps) / steps;
        const jitter = Math.random() < 0.2 ? (Math.random() * 0.1 - 0.05) : 0;
        return Math.max(0, Math.min(1, base + jitter));
    },

    // Smooth curve with occasional random spikes
    glitchSpike: t => {
        const base = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        if (Math.random() < 0.15) {
            return Math.min(1, base + Math.random() * 0.25);
        }
        return base;
    }
};
