let timeOffset = 0;
let numRungs = 40; // Number of horizontal connecting lines

// DNA parameters
let helixAmplitude; // How wide the helix spreads
let helixFrequency = 0.008; // Vertical frequency of the wave
let rotationSpeed = 0.02; // How fast the helix rotates

// Color palette (HSB values)
let palette = [
    [57, 67, 97],    // Yellow #F7F052
    [27, 86, 95],    // Orange #F28123
    [14, 83, 83],    // Burnt orange #D34E24
    [37, 69, 34],    // Brown #563F1B
    [174, 51, 45]    // Teal #38726C
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    helixAmplitude = min(width * 0.2, 180); // Cap at 180px to keep DNA thin
}

function draw() {
    // Motion blur effect
    background(0, 0, 0, 15);

    timeOffset += rotationSpeed;

    // Draw the DNA structure
    drawDNA();
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
        let phase = y * helixFrequency + timeOffset;

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
        let alpha = map(avgZ, -1, 1, 20, 60);
        let strokeW = map(avgZ, -1, 1, 1, 4);

        // Draw the connecting rung
        stroke(col[0], col[1], col[2], alpha);
        strokeWeight(strokeW);
        line(p1.x, p1.y, p2.x, p2.y);
    }

    // Draw vertical strands with glow
    drawStrand(strand1Points, 0);
    drawStrand(strand2Points, 2);
}

function drawStrand(points, colorOffset) {
    // Draw glow/trail effect
    for (let g = 3; g > 0; g--) {
        let glowAlpha = map(g, 3, 0, 10, 40);
        let glowWeight = g * 8;

        noFill();
        beginShape();
        for (let i = 0; i < points.length; i++) {
            let p = points[i];
            let colorIndex = (i + colorOffset) % palette.length;
            let col = palette[colorIndex];

            // Depth-based alpha
            let depthAlpha = map(p.z, -1, 1, glowAlpha * 0.3, glowAlpha);

            stroke(col[0], col[1], col[2], depthAlpha);
            strokeWeight(glowWeight * map(p.z, -1, 1, 0.5, 1.5));

            if (i === 0) {
                curveVertex(p.x, p.y);
            }
            curveVertex(p.x, p.y);
            if (i === points.length - 1) {
                curveVertex(p.x, p.y);
            }
        }
        endShape();
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
        let alpha = map(avgZ, -1, 1, 30, 80);
        let weight = map(avgZ, -1, 1, 2, 6);

        stroke(col[0], col[1], col[2], alpha);
        strokeWeight(weight);
        line(p1.x, p1.y, p2.x, p2.y);
    }

    // Draw nodes at each point
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let colorIndex = (i + colorOffset) % palette.length;
        let col = palette[colorIndex];

        // Size and brightness based on depth
        let size = map(p.z, -1, 1, 4, 12);
        let alpha = map(p.z, -1, 1, 30, 90);

        noStroke();
        // Glow
        fill(col[0], col[1], col[2], alpha * 0.3);
        ellipse(p.x, p.y, size * 2, size * 2);
        // Core
        fill(col[0], col[1] * 0.7, 100, alpha);
        ellipse(p.x, p.y, size, size);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    helixAmplitude = min(width * 0.2, 180); // Cap at 180px to keep DNA thin
}
