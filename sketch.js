let particles = [];
let numParticles = 250;
let noiseScale = 0.003;
let noiseStrength = 0.5;
let timeOffset = 0;
let maxDist;
let numLayers = 5;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);

    maxDist = max(width, height) * 0.7;

    // Create particles distributed across 5 layers
    let particlesPerLayer = floor(numParticles / numLayers);
    for (let layer = 0; layer < numLayers; layer++) {
        for (let i = 0; i < particlesPerLayer; i++) {
            // Distribute angles evenly around the circle for each particle
            let baseAngle = (i / particlesPerLayer) * TWO_PI;
            particles.push(new Particle(i / particlesPerLayer, layer, baseAngle));
        }
    }
}

function draw() {
    // Create tracer/motion blur effect
    background(0, 0, 0, 12);

    timeOffset += 0.02;

    // Particles are created in layer order (back-to-front)
    for (let particle of particles) {
        particle.update();
        particle.display();
    }

    // Draw black hole in center (on top)
    drawBlackHole();
}

// Flow field function using Perlin noise
function getFlowFieldAngle(x, y) {
    // Use Perlin noise to create smooth, flowing curves
    let noiseValue = noise(x * noiseScale, y * noiseScale, timeOffset);
    // Map noise to an angle (0 to TWO_PI)
    return noiseValue * TWO_PI * 2;
}

function drawBlackHole() {
    let centerX = width / 2;
    let centerY = height / 2;
    let blackHoleSize = min(width, height) * 0.15;

    // Draw event horizon glow
    for (let i = 10; i > 0; i--) {
        let alpha = map(i, 10, 0, 0, 25);
        let size = blackHoleSize + (i * 15);

        // Dark purple/blue glow (HSB)
        fill(260, 75, 16, alpha);
        noStroke();
        ellipse(centerX, centerY, size, size);
    }

    // Draw the black hole itself
    fill(0, 0, 0);
    ellipse(centerX, centerY, blackHoleSize, blackHoleSize);
}

class Particle {
    constructor(progress = 0, layer = 0, baseAngle = null) {
        this.layer = layer;
        // Store base angle for respawning with consistent spacing
        this.baseAngle = (baseAngle !== null) ? baseAngle : random(TWO_PI);
        // Use base angle with small random offset to spread particles evenly
        this.shootAngle = this.baseAngle + random(-0.3, 0.3);
        this.rotationAngle = random(TWO_PI);

        // Layer 0 = back (biggest, darkest), Layer 4 = front (smallest, brightest)
        // Each layer alternates direction: even layers move outward, odd layers move inward
        this.movesOutward = (layer % 2 === 0);

        // Size: biggest at back (layer 0), smallest at front (layer 4)
        let sizeRange = [
            [400, 500],  // Layer 0 - biggest
            [200, 350],  // Layer 1
            [80, 150],   // Layer 2
            [30, 70],    // Layer 3
            [8, 25]      // Layer 4 - smallest
        ];
        this.size = random(sizeRange[layer][0], sizeRange[layer][1]);

        // Brightness: darkest at back, brightest at front (0-100 scale)
        this.brightness = map(layer, 0, 4, 40, 100);

        // Alpha/opacity: more opaque so layers are visible
        this.alpha = map(layer, 0, 4, 50, 85);

        // Speed varies by layer
        this.speed = random(2 + layer * 0.5, 4 + layer * 1);

        // Rotation direction alternates with movement
        this.rotationSpeed = this.movesOutward ? 0.03 + layer * 0.01 : -(0.03 + layer * 0.01);

        // Z-depth for scaling
        this.z = map(layer, 0, 4, 0.6, 1.2);

        this.maxRadius = maxDist;

        // Initialize radius based on progress and direction
        if (this.movesOutward) {
            this.radius = progress * maxDist;
        } else {
            this.radius = 30 + progress * (maxDist - 30);
        }

        this.color = this.getRandomColor();

        this.trail = [];
        this.trailLength = map(layer, 0, 4, 25, 45);
    }

    getRandomColor() {
        // HSB colors: [hue, saturation, brightness]
        const colors = [
            [52, 100, 100],    // Yellow
            [144, 100, 100],   // Green
            [198, 100, 100],   // Cyan
            [300, 100, 100],   // Magenta
            [282, 100, 100],   // Purple
            [24, 100, 100],    // Orange
            [325, 100, 100],   // Pink
            [96, 100, 100],    // Lime
            [42, 100, 100],    // Amber
            [275, 100, 100]    // Violet
        ];
        return random(colors);
    }

    update() {
        let x = width / 2 + cos(this.shootAngle) * this.radius;
        let y = height / 2 + sin(this.shootAngle) * this.radius;

        let flowAngle = getFlowFieldAngle(x, y);

        // Flow influence varies by layer
        let flowInfluence = map(this.layer, 0, 4, 0.025, 0.012);
        this.shootAngle += sin(flowAngle) * noiseStrength * flowInfluence;

        this.trail.push({ x: x, y: y });

        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }

        // Move based on direction
        if (this.movesOutward) {
            this.radius += this.speed;
        } else {
            this.radius -= this.speed;
        }

        this.rotationAngle += this.rotationSpeed;

        // Respawn when reaching bounds
        if (this.movesOutward) {
            if (this.radius > maxDist) {
                this.radius = 0;
                this.shootAngle = this.baseAngle + random(-0.3, 0.3);
                this.trail = [];
            }
        } else {
            if (this.radius < 30) {
                this.radius = this.maxRadius;
                this.shootAngle = this.baseAngle + random(-0.3, 0.3);
                this.trail = [];
            }
        }
    }

    display() {
        let x = width / 2 + cos(this.shootAngle) * this.radius;
        let y = height / 2 + sin(this.shootAngle) * this.radius;

        let scaledSize = this.size * this.z;

        let h = this.color[0];
        let s = this.color[1];
        let b = this.brightness; // Use layer-based brightness

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            let trailAlpha = map(i, 0, this.trail.length - 1, 5, this.alpha * 0.6);
            let trailSize = map(i, 0, this.trail.length - 1, scaledSize * 0.1, scaledSize * 0.5);

            noStroke();
            fill(h, s, b, trailAlpha);
            ellipse(this.trail[i].x, this.trail[i].y, trailSize, trailSize);
        }

        // Draw glow layers - fewer for back layers, more for front
        let glowLayers = floor(map(this.layer, 0, 4, 4, 8));

        for (let i = glowLayers; i > 0; i--) {
            let glowAlpha = map(i, glowLayers, 0, this.alpha * 0.1, this.alpha);
            let sizeMultiplier = map(i, 0, glowLayers, 1, 2.2);

            noStroke();
            fill(h, s, b, glowAlpha);
            ellipse(x, y, scaledSize * sizeMultiplier, scaledSize * sizeMultiplier);
        }

        // Draw center - brighter for front layers
        let centerBrightness = min(100, b + 15);
        let centerAlpha = map(this.layer, 0, 4, this.alpha * 0.7, this.alpha);
        fill(h, s * 0.8, centerBrightness, centerAlpha);
        ellipse(x, y, scaledSize * 0.4, scaledSize * 0.4);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    maxDist = max(width, height) * 0.7;

    // Recreate particles across all layers
    particles = [];
    let particlesPerLayer = floor(numParticles / numLayers);
    for (let layer = 0; layer < numLayers; layer++) {
        for (let i = 0; i < particlesPerLayer; i++) {
            // Distribute angles evenly around the circle for each particle
            let baseAngle = (i / particlesPerLayer) * TWO_PI;
            particles.push(new Particle(i / particlesPerLayer, layer, baseAngle));
        }
    }
}
