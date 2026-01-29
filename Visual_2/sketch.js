// DNA Helix - Neon Style with DNA Grid Background
// Uses SCREEN blend mode for neon glow

let time = 0;
let numRungs = 50; // Number of horizontal connecting lines
let numGridLayers = 10; // Background grid layers
let shapes = [];
let numShapes = 12;

// DNA parameters
let helixAmplitude; // How wide the helix spreads
let helixFrequency = 0.01; // Vertical frequency of the wave
let rotationSpeed = 0.025; // How fast the helix rotates

// Vibrant Palette based on color_2.png (HSB values - boosted saturation)
let palette = [
    [181, 60, 96],   // Cyan (boosted)
    [144, 55, 92],   // Mint green (boosted)
    [84, 60, 95],    // Lime (boosted)
    [106, 50, 98],   // Green (boosted)
    [350, 65, 100]   // Pink (boosted)
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    helixAmplitude = min(width * 0.25, 200); // Cap at 200px to keep DNA thin

    // Create floating geometric shapes
    for (let i = 0; i < numShapes; i++) {
        shapes.push(new FloatingShape());
    }
}

function draw() {
    // Must reset blend mode before background to avoid washout
    blendMode(BLEND);

    // Dark grey background with motion trail
    background(0, 0, 5, 40);

    time += rotationSpeed;

    // Draw grid layers in background
    for (let layer = 0; layer < numGridLayers; layer++) {
        drawGridLayer(layer);
    }

    // Use ADD blend for main DNA glow effect
    blendMode(ADD);

    // Draw the main DNA structure on top
    drawDNA();

    // Draw floating geometric shapes
    for (let shape of shapes) {
        shape.update();
        shape.display();
    }

    blendMode(BLEND);
}

function drawGridLayer(layer) {
    let depthProgress = layer / (numGridLayers - 1); // 0 = back, 1 = front

    // Grid properties based on depth
    let layerGridSize = width * 0.08 * (1.5 - depthProgress * 0.8); // Larger grids in back
    let alpha = 3 + depthProgress * 12; // Brighter in front
    let brightness = 15 + depthProgress * 45; // Darker in back, brighter in front
    let lineThickness = width * 0.004 * (1.5 - depthProgress * 1.2); // Thicker in back, thinner in front
    let timeOffset = layer * 0.6;
    let waveAmount = width * 0.04 * (1.2 - depthProgress * 0.5); // More wave overall
    let speed = 2.0 + layer * 0.3; // Faster animation, varies by layer

    // Animated offset - each layer drifts differently
    let layerOffsetX = sin(time * 0.5 + layer * 0.8) * width * 0.03;
    let layerOffsetY = cos(time * 0.4 + layer * 0.6) * height * 0.03;

    // Cycle through colors for each layer
    let colorIndex = layer % palette.length;
    let col = palette[colorIndex];

    stroke(col[0], col[1] * 0.6, brightness, alpha);
    strokeWeight(max(0.5, lineThickness));

    // Vertical lines with more dynamic wave
    for (let x = layerOffsetX; x < width + layerGridSize; x += layerGridSize) {
        let wave1 = sin(time * speed + x * 0.008 + timeOffset) * waveAmount;
        let wave2 = cos(time * speed * 0.7 + x * 0.012) * waveAmount * 0.3;
        let offset = wave1 + wave2;
        line(x + offset, 0, x - offset * 0.8, height);
    }

    // Horizontal lines with more dynamic wave
    for (let y = layerOffsetY; y < height + layerGridSize; y += layerGridSize) {
        let wave1 = cos(time * speed + y * 0.008 + timeOffset) * waveAmount;
        let wave2 = sin(time * speed * 0.6 + y * 0.015) * waveAmount * 0.3;
        let offset = wave1 + wave2;
        line(0, y + offset, width, y - offset * 0.8);
    }
}

class FloatingShape {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(width * 0.03, width * 0.1);
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.02, 0.02);
        this.sides = floor(random(3, 7));
        this.colorIndex = floor(random(palette.length));
        this.alpha = random(15, 35);
        this.pulseSpeed = random(1, 2.5);
        this.pulsePhase = random(TWO_PI);
        this.velocityX = random(-width * 0.001, width * 0.001);
        this.velocityY = random(-width * 0.001, width * 0.001);
        this.depth = random(0.6, 1.2);
    }

    update() {
        this.x += this.velocityX * this.depth;
        this.y += this.velocityY * this.depth;
        this.rotation += this.rotationSpeed;

        // Wrap around edges
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
    }

    display() {
        let col = palette[this.colorIndex];
        let pulse = sin(time * this.pulseSpeed + this.pulsePhase) * 0.5 + 0.5;
        let currentSize = this.size * (0.85 + pulse * 0.3);
        let currentAlpha = this.alpha * (0.6 + pulse * 0.4);

        push();
        translate(this.x, this.y);
        rotate(this.rotation);

        // Outer glow
        for (let i = 2; i > 0; i--) {
            let glowAlpha = currentAlpha * 0.15 / i;
            let glowSize = currentSize * (1 + i * 0.25);

            noFill();
            stroke(col[0], col[1], col[2], glowAlpha);
            strokeWeight(width * 0.002 * i);
            this.drawPolygon(0, 0, glowSize / 2, this.sides);
        }

        // Main shape
        noFill();
        stroke(col[0], col[1] * 0.8, col[2], currentAlpha);
        strokeWeight(width * 0.0015);
        this.drawPolygon(0, 0, currentSize / 2, this.sides);

        pop();
    }

    drawPolygon(x, y, radius, sides) {
        beginShape();
        let angleStep = TWO_PI / sides;
        for (let i = 0; i < sides; i++) {
            let angle = i * angleStep - HALF_PI;
            vertex(x + cos(angle) * radius, y + sin(angle) * radius);
        }
        endShape(CLOSE);
    }
}

function drawDNA() {
    let centerX = width / 2;
    let strandSpacing = height / numRungs;

    // Store points for both strands
    let strand1Points = [];
    let strand2Points = [];

    // Calculate points along both vertical strands
    for (let i = 0; i <= numRungs; i++) {
        let y = i * strandSpacing;
        let phase = y * helixFrequency + time;

        // Two strands offset by PI (180 degrees) - creates the double helix
        let x1 = centerX + sin(phase) * helixAmplitude;
        let x2 = centerX + sin(phase + PI) * helixAmplitude;

        // Z-depth for 3D effect (determines which strand is in front)
        let z1 = cos(phase);
        let z2 = cos(phase + PI);

        strand1Points.push({ x: x1, y: y, z: z1 });
        strand2Points.push({ x: x2, y: y, z: z2 });
    }

    // Draw horizontal rungs (base pairs) - draw behind strands first
    for (let i = 0; i < strand1Points.length; i++) {
        let p1 = strand1Points[i];
        let p2 = strand2Points[i];

        // Color based on position
        let colorIndex = i % palette.length;
        let col = palette[colorIndex];

        // Vary alpha based on depth for 3D effect
        let avgZ = (p1.z + p2.z) / 2;
        let alpha = map(avgZ, -1, 1, 8, 35);
        let strokeW = map(avgZ, -1, 1, 1, 5);

        // Glow for rungs
        stroke(col[0], col[1], col[2], alpha * 0.4);
        strokeWeight(strokeW * 3);
        line(p1.x, p1.y, p2.x, p2.y);

        // Main rung line
        stroke(col[0], col[1], col[2], alpha);
        strokeWeight(strokeW);
        line(p1.x, p1.y, p2.x, p2.y);
    }

    // Draw vertical strands with glow
    drawStrand(strand1Points, 0);
    drawStrand(strand2Points, 2);
}

function drawStrand(points, colorOffset) {
    // Draw multiple glow layers for neon effect
    for (let g = 4; g > 0; g--) {
        let glowAlpha = map(g, 4, 0, 5, 25);
        let glowWeight = g * 10;

        noFill();
        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let p2 = points[i + 1];

            let colorIndex = (i + colorOffset) % palette.length;
            let col = palette[colorIndex];

            // Depth-based alpha
            let avgZ = (p1.z + p2.z) / 2;
            let depthAlpha = map(avgZ, -1, 1, glowAlpha * 0.3, glowAlpha);

            stroke(col[0], col[1], col[2], depthAlpha);
            strokeWeight(glowWeight * map(avgZ, -1, 1, 0.4, 1.2));
            line(p1.x, p1.y, p2.x, p2.y);
        }
    }

    // Draw main strand line
    noFill();
    for (let i = 0; i < points.length - 1; i++) {
        let p1 = points[i];
        let p2 = points[i + 1];

        let colorIndex = (i + colorOffset) % palette.length;
        let col = palette[colorIndex];

        // Brightness and size based on z-depth
        let avgZ = (p1.z + p2.z) / 2;
        let alpha = map(avgZ, -1, 1, 15, 50);
        let weight = map(avgZ, -1, 1, 2, 8);

        stroke(col[0], col[1] * 0.8, col[2], alpha);
        strokeWeight(weight);
        line(p1.x, p1.y, p2.x, p2.y);
    }

    // Draw glowing nodes at each point
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let colorIndex = (i + colorOffset) % palette.length;
        let col = palette[colorIndex];

        // Size and brightness based on depth
        let size = map(p.z, -1, 1, 6, 18);
        let alpha = map(p.z, -1, 1, 20, 60);

        noStroke();

        // Outer glow
        fill(col[0], col[1], col[2], alpha * 0.2);
        ellipse(p.x, p.y, size * 3, size * 3);

        // Middle glow
        fill(col[0], col[1], col[2], alpha * 0.4);
        ellipse(p.x, p.y, size * 2, size * 2);

        // Core
        fill(col[0], col[1] * 0.6, 100, alpha);
        ellipse(p.x, p.y, size, size);

        // Bright center
        fill(col[0], col[1] * 0.3, 100, alpha * 0.8);
        ellipse(p.x, p.y, size * 0.4, size * 0.4);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    helixAmplitude = min(width * 0.25, 200); // Cap at 200px to keep DNA thin

    // Recreate shapes for new size
    shapes = [];
    for (let i = 0; i < numShapes; i++) {
        shapes.push(new FloatingShape());
    }
}
