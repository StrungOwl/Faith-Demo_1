// Black Hole Visual - Instance Mode
// Converted from Visual_1/sketch.js for multi-canvas support

function createBlackHoleSketch(containerId) {
    return function(p) {
        let particles = [];
        let numParticles = 250;
        let noiseScale = 0.003;
        let noiseStrength = 0.5;
        let timeOffset = 0;
        let maxDist;
        let numLayers = 5;
        let blackHoleBuffer;

        // Master alpha for transition fading (0-255)
        let masterAlpha = 255;

        // Alpha animation
        let foreAlpha = 0;
        let maxAlpha = 60;
        let alphaTime = 0;
        let alphaCycleSpeed = 0.02;

        // Color palette system
        let animateColors = false;
        let colorTime = 0;
        let cycleDuration = 10;

        // Palette 1: From reference image (HSB values)
        let palette1 = [
            [57, 67, 97],    // Yellow
            [27, 86, 95],    // Orange
            [14, 83, 83],    // Burnt orange
            [37, 69, 34],    // Brown
            [174, 51, 45]    // Teal
        ];

        // Palette 2: Complementary cool palette
        let palette2 = [
            [200, 70, 90],
            [260, 65, 85],
            [320, 60, 80],
            [220, 50, 50],
            [280, 45, 60]
        ];

        // Palette 3: Warm sunset palette
        let palette3 = [
            [350, 80, 95],
            [20, 90, 100],
            [45, 85, 95],
            [10, 70, 60],
            [30, 60, 70]
        ];

        p.setup = function() {
            let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
            canvas.parent(containerId);
            p.colorMode(p.HSB, 360, 100, 100, 100);

            maxDist = p.width * 0.7;
            createBlackHoleBuffer();

            let particlesPerLayer = p.floor(numParticles / numLayers);
            for (let layer = 0; layer < numLayers; layer++) {
                for (let i = 0; i < particlesPerLayer; i++) {
                    let baseAngle = (i / particlesPerLayer) * p.TWO_PI;
                    particles.push(new Particle(i / particlesPerLayer, layer, baseAngle));
                }
            }
        };

        p.draw = function() {
            // Skip rendering if fully transparent
            if (masterAlpha <= 0) return;

            // Apply master alpha to background fade
            let bgAlpha = p.map(masterAlpha, 0, 255, 0, 12);
            p.background(0, 0, 0, bgAlpha);

            timeOffset += 0.04;
            colorTime += p.deltaTime / 1000;

            alphaTime += alphaCycleSpeed;
            foreAlpha = (p.sin(alphaTime) + 1) * 0.5 * maxAlpha;

            for (let particle of particles) {
                particle.update();
                particle.display();
            }

            drawBlackHole();
        };

        // Public method to control opacity during transition
        p.setMasterAlpha = function(alpha) {
            masterAlpha = alpha;
        };

        p.getMasterAlpha = function() {
            return masterAlpha;
        };

        function getFlowFieldAngle(x, y) {
            let noiseValue = p.noise(x * noiseScale, y * noiseScale, timeOffset);
            return noiseValue * p.TWO_PI * 2;
        }

        function getCurrentPalette() {
            if (!animateColors) {
                return palette1;
            }

            let cycleProgress = (colorTime % cycleDuration) / cycleDuration;
            let phase = cycleProgress * 3;
            let phaseIndex = p.floor(phase);
            let phaseLerp = phase - phaseIndex;
            phaseLerp = phaseLerp * phaseLerp * (3 - 2 * phaseLerp);

            let fromPalette, toPalette;
            if (phaseIndex === 0) {
                fromPalette = palette1;
                toPalette = palette2;
            } else if (phaseIndex === 1) {
                fromPalette = palette2;
                toPalette = palette3;
            } else {
                fromPalette = palette3;
                toPalette = palette1;
            }

            let currentPalette = [];
            for (let i = 0; i < fromPalette.length; i++) {
                let fromColor = p.color(fromPalette[i][0], fromPalette[i][1], fromPalette[i][2]);
                let toColor = p.color(toPalette[i][0], toPalette[i][1], toPalette[i][2]);
                let lerpedColor = p.lerpColor(fromColor, toColor, phaseLerp);
                currentPalette.push([p.hue(lerpedColor), p.saturation(lerpedColor), p.brightness(lerpedColor)]);
            }

            return currentPalette;
        }

        function createBlackHoleBuffer() {
            let centerX = p.width / 2;
            let centerY = p.height / 2;
            let blackHoleSize = p.width * 0.15;
            let glowStep = p.width * 0.01;

            blackHoleBuffer = p.createGraphics(p.width, p.height);
            blackHoleBuffer.colorMode(p.HSB, 360, 100, 100, 100);

            for (let i = 10; i > 0; i--) {
                let alpha = p.map(i, 10, 0, 0, 25);
                let size = blackHoleSize + (i * glowStep);
                blackHoleBuffer.fill(260, 75, 16, alpha);
                blackHoleBuffer.noStroke();
                blackHoleBuffer.ellipse(centerX, centerY, size, size);
            }

            blackHoleBuffer.fill(0, 0, 0);
            blackHoleBuffer.ellipse(centerX, centerY, blackHoleSize, blackHoleSize);

            let blurAmount = p.max(2, p.width * 0.003);
            blackHoleBuffer.filter(p.BLUR, blurAmount);
        }

        function drawBlackHole() {
            // Apply master alpha via tint
            p.tint(255, masterAlpha);
            p.image(blackHoleBuffer, 0, 0);
            p.noTint();
        }

        class Particle {
            constructor(progress = 0, layer = 0, baseAngle = null) {
                this.layer = layer;
                this.baseAngle = (baseAngle !== null) ? baseAngle : p.random(p.TWO_PI);
                this.shootAngle = this.baseAngle + p.random(-0.3, 0.3);
                this.rotationAngle = p.random(p.TWO_PI);
                this.movesOutward = (layer % 2 === 0);

                let sizeRange = [
                    [p.width * 0.21, p.width * 0.26],
                    [p.width * 0.10, p.width * 0.18],
                    [p.width * 0.04, p.width * 0.08],
                    [p.width * 0.015, p.width * 0.036],
                    [p.width * 0.04, p.width * 0.07]
                ];
                this.size = p.random(sizeRange[layer][0], sizeRange[layer][1]);
                this.brightness = p.map(layer, 0, 4, 10, 100);
                this.baseAlpha = 20;

                let baseSpeed = p.width * 0.003;
                this.speed = p.random(baseSpeed + layer * baseSpeed * 0.25, baseSpeed * 2 + layer * baseSpeed * 0.5);
                this.rotationSpeed = this.movesOutward ? 0.04 + layer * 0.02 : -(0.04 + layer * 0.02);
                this.z = p.map(layer, 0, 4, 0.6, 1.2);

                this.maxRadius = maxDist;
                this.minRadius = p.width * 0.02;

                if (this.movesOutward) {
                    this.radius = progress * maxDist;
                } else {
                    this.radius = this.minRadius + progress * (maxDist - this.minRadius);
                }

                this.colorIndex = p.floor(p.random(palette1.length));
                this.trail = [];
                this.trailLength = p.map(layer, 0, 4, 25, 45);
            }

            getCurrentColor() {
                let currentPalette = getCurrentPalette();
                return currentPalette[this.colorIndex];
            }

            getCurrentAlpha() {
                let layerAlpha = p.map(this.layer, 0, 4, this.baseAlpha, foreAlpha);
                // Apply master alpha scaling
                return layerAlpha * (masterAlpha / 255);
            }

            update() {
                let x = p.width / 2 + p.cos(this.shootAngle) * this.radius;
                let y = p.height / 2 + p.sin(this.shootAngle) * this.radius;

                let flowAngle = getFlowFieldAngle(x, y);
                let flowInfluence = p.map(this.layer, 0, 4, 0.025, 0.012);
                this.shootAngle += p.sin(flowAngle) * noiseStrength * flowInfluence;

                this.trail.push({ x: x, y: y });
                if (this.trail.length > this.trailLength) {
                    this.trail.shift();
                }

                if (this.movesOutward) {
                    this.radius += this.speed;
                } else {
                    this.radius -= this.speed;
                }

                this.rotationAngle += this.rotationSpeed;

                if (this.movesOutward && this.radius > maxDist) {
                    this.radius = 0;
                    this.shootAngle = this.baseAngle + p.random(-0.3, 0.3);
                    this.trail = [];
                } else if (!this.movesOutward && this.radius < this.minRadius) {
                    this.radius = this.maxRadius;
                    this.shootAngle = this.baseAngle + p.random(-0.3, 0.3);
                    this.trail = [];
                }
            }

            display() {
                let x = p.width / 2 + p.cos(this.shootAngle) * this.radius;
                let y = p.height / 2 + p.sin(this.shootAngle) * this.radius;
                let scaledSize = this.size * this.z;

                let currentColor = this.getCurrentColor();
                let h = currentColor[0];
                let s = currentColor[1];
                let b = this.brightness;
                let alpha = this.getCurrentAlpha();

                // Draw trail
                for (let i = 0; i < this.trail.length; i++) {
                    let trailAlpha = p.map(i, 0, this.trail.length - 1, 5, alpha * 0.6);
                    let trailSize = p.map(i, 0, this.trail.length - 1, scaledSize * 0.1, scaledSize * 0.5);

                    p.noStroke();
                    p.fill(h, s, b, trailAlpha);
                    p.ellipse(this.trail[i].x, this.trail[i].y, trailSize, trailSize);
                }

                // Draw glow layers
                let glowLayers = p.floor(p.map(this.layer, 0, 4, 4, 8));
                for (let i = glowLayers; i > 0; i--) {
                    let glowAlpha = p.map(i, glowLayers, 0, alpha * 0.1, alpha);
                    let sizeMultiplier = p.map(i, 0, glowLayers, 1, 2.2);

                    p.noStroke();
                    p.fill(h, s, b, glowAlpha);
                    p.ellipse(x, y, scaledSize * sizeMultiplier, scaledSize * sizeMultiplier);
                }

                // Draw center
                let centerBrightness = p.min(100, b + 15);
                let centerAlpha = p.map(this.layer, 0, 4, alpha * 0.7, alpha);
                p.fill(h, s * 0.8, centerBrightness, centerAlpha);
                p.ellipse(x, y, scaledSize * 0.4, scaledSize * 0.4);
            }
        }

        p.windowResized = function() {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            maxDist = p.width * 0.7;
            createBlackHoleBuffer();

            particles = [];
            let particlesPerLayer = p.floor(numParticles / numLayers);
            for (let layer = 0; layer < numLayers; layer++) {
                for (let i = 0; i < particlesPerLayer; i++) {
                    let baseAngle = (i / particlesPerLayer) * p.TWO_PI;
                    particles.push(new Particle(i / particlesPerLayer, layer, baseAngle));
                }
            }
        };
    };
}
