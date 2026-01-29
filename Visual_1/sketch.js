let particles = [];
let numParticles = 250;
let noiseScale = 0.003;
let noiseStrength = 0.5;
let timeOffset = 0;
let maxDist;
let numLayers = 5;
let blackHoleBuffer;

// Alpha animation
let foreAlpha = 0;
let maxAlpha = 60; // Maximum alpha for foreground layer
let alphaTime = 0;
let alphaCycleSpeed = 0.02; // Controls how fast the fade cycles

// Color palette system
let animateColors = false; // Set to false to keep palette1 only
let colorTime = 0;
let cycleDuration = 10; // seconds for full cycle

// Palette 1: From reference image (HSB values)
let palette1 = [
    [57, 67, 97],    // Yellow #F7F052
    [27, 86, 95],    // Orange #F28123
    [14, 83, 83],    // Burnt orange #D34E24
    [37, 69, 34],    // Brown #563F1B
    [174, 51, 45]    // Teal #38726C
];

// Palette 2: Complementary/contrasting cool palette
let palette2 = [
    [200, 70, 90],   // Cyan-blue
    [260, 65, 85],   // Purple
    [320, 60, 80],   // Magenta-pink
    [220, 50, 50],   // Dark blue
    [280, 45, 60]    // Violet
];

// Palette 3: Warm sunset palette
let palette3 = [
    [350, 80, 95],   // Red
    [20, 90, 100],   // Bright orange
    [45, 85, 95],    // Gold
    [10, 70, 60],    // Dark red
    [30, 60, 70]     // Tan
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);

    maxDist = width * 0.7;

    // Pre-render the blurred black hole once
    createBlackHoleBuffer();

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

    timeOffset += 0.04;
    colorTime += deltaTime / 1000; // Convert to seconds

    // Animate foreAlpha using sin for smooth fade in/out
    alphaTime += alphaCycleSpeed;
    foreAlpha = (sin(alphaTime) + 1) * 0.5 * maxAlpha; // Maps sin(-1 to 1) to (0 to maxAlpha)

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

// Get interpolated color from palettes based on time
function getCurrentPalette() {
    // If animation is disabled, return palette1
    if (!animateColors) {
        return palette1;
    }

    // Progress through cycle (0 to 1 over cycleDuration seconds)
    let cycleProgress = (colorTime % cycleDuration) / cycleDuration;

    // Divide cycle into 3 phases: palette1->2, palette2->3, palette3->1
    let phase = cycleProgress * 3;
    let phaseIndex = floor(phase);
    let phaseLerp = phase - phaseIndex;

    // Smooth easing for transitions
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

    // Interpolate each color in the palette
    let currentPalette = [];
    for (let i = 0; i < fromPalette.length; i++) {
        let fromColor = color(fromPalette[i][0], fromPalette[i][1], fromPalette[i][2]);
        let toColor = color(toPalette[i][0], toPalette[i][1], toPalette[i][2]);
        let lerpedColor = lerpColor(fromColor, toColor, phaseLerp);
        currentPalette.push([hue(lerpedColor), saturation(lerpedColor), brightness(lerpedColor)]);
    }

    return currentPalette;
}

function createBlackHoleBuffer() {
    let centerX = width / 2;
    let centerY = height / 2;
    let blackHoleSize = width * 0.15;
    let glowStep = width * 0.01; // Scale glow expansion with width

    // Create buffer and set color mode
    blackHoleBuffer = createGraphics(width, height);
    blackHoleBuffer.colorMode(HSB, 360, 100, 100, 100);

    // Draw event horizon glow on buffer
    for (let i = 10; i > 0; i--) {
        let alpha = map(i, 10, 0, 0, 25);
        let size = blackHoleSize + (i * glowStep);

        // Dark purple/blue glow (HSB)
        blackHoleBuffer.fill(260, 75, 16, alpha);
        blackHoleBuffer.noStroke();
        blackHoleBuffer.ellipse(centerX, centerY, size, size);
    }

    // Draw the black hole itself on buffer
    blackHoleBuffer.fill(0, 0, 0);
    blackHoleBuffer.ellipse(centerX, centerY, blackHoleSize, blackHoleSize);

    // Apply blur filter once
    let blurAmount = max(2, width * 0.003);
    blackHoleBuffer.filter(BLUR, blurAmount);
}

function drawBlackHole() {
    // Just draw the pre-rendered blurred buffer
    image(blackHoleBuffer, 0, 0);
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
        // Sizes scale based on screen width
        let sizeRange = [
            [width * 0.21, width * 0.26],   // Layer 0 - background
            [width * 0.10, width * 0.18],   // Layer 1
            [width * 0.04, width * 0.08],   // Layer 2
            [width * 0.015, width * 0.036], // Layer 3
            [width * 0.04, width * 0.07]  // Layer 4 - foreground
        ];
        this.size = random(sizeRange[layer][0], sizeRange[layer][1]);

        // Brightness: darkest at back, brightest at front (0-100 scale)
        this.brightness = map(layer, 0, 4, 10, 100);

        // Alpha will be calculated dynamically using global foreAlpha
        this.baseAlpha = 20; // Minimum alpha for back layers

        // Speed varies by layer (scales with width)
        let baseSpeed = width * 0.003;
        this.speed = random(baseSpeed + layer * baseSpeed * 0.25, baseSpeed * 2 + layer * baseSpeed * 0.5);

        // Rotation direction alternates with movement
        this.rotationSpeed = this.movesOutward ? 0.04 + layer * 0.02 : -(0.04 + layer * 0.02);

        // Z-depth for scaling
        this.z = map(layer, 0, 4, 0.6, 1.2);

        this.maxRadius = maxDist;
        this.minRadius = width * 0.02; // Inner radius scales with width

        // Initialize radius based on progress and direction
        if (this.movesOutward) {
            this.radius = progress * maxDist;
        } else {
            this.radius = this.minRadius + progress * (maxDist - this.minRadius);
        }

        // Store palette index instead of fixed color - color will be computed from current palette
        this.colorIndex = floor(random(palette1.length));

        this.trail = [];
        this.trailLength = map(layer, 0, 4, 25, 45);
    }

    getCurrentColor() {
        // Get interpolated color from current palette based on stored index
        let currentPalette = getCurrentPalette();
        return currentPalette[this.colorIndex];
    }

    getCurrentAlpha() {
        // Dynamically calculate alpha based on layer and animated foreAlpha
        // Back layers (0) use baseAlpha, front layers (4) use global foreAlpha
        return map(this.layer, 0, 4, this.baseAlpha, foreAlpha);
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
            if (this.radius < this.minRadius) {
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

        let currentColor = this.getCurrentColor();
        let h = currentColor[0];
        let s = currentColor[1];
        let b = this.brightness; // Use layer-based brightness
        let alpha = this.getCurrentAlpha(); // Get animated alpha

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            let trailAlpha = map(i, 0, this.trail.length - 1, 5, alpha * 0.6);
            let trailSize = map(i, 0, this.trail.length - 1, scaledSize * 0.1, scaledSize * 0.5);

            noStroke();
            fill(h, s, b, trailAlpha);
            ellipse(this.trail[i].x, this.trail[i].y, trailSize, trailSize);
        }

        // Draw glow layers - fewer for back layers, more for front
        let glowLayers = floor(map(this.layer, 0, 4, 4, 8));

        for (let i = glowLayers; i > 0; i--) {
            let glowAlpha = map(i, glowLayers, 0, alpha * 0.1, alpha);
            let sizeMultiplier = map(i, 0, glowLayers, 1, 2.2);

            noStroke();
            fill(h, s, b, glowAlpha);
            ellipse(x, y, scaledSize * sizeMultiplier, scaledSize * sizeMultiplier);
        }

        // Draw center - brighter for front layers
        let centerBrightness = min(100, b + 15);
        let centerAlpha = map(this.layer, 0, 4, alpha * 0.7, alpha);
        fill(h, s * 0.8, centerBrightness, centerAlpha);
        ellipse(x, y, scaledSize * 0.4, scaledSize * 0.4);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    maxDist = width * 0.7;

    // Recreate the blurred black hole for new size
    createBlackHoleBuffer();

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
