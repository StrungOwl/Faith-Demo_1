// DNA Helix Visual - Instance Mode
// Converted from Visual_2/sketch.js for multi-canvas support

function createDNAHelixSketch(containerId) {
    return function(p) {
        let time = 0;
        let numRungs = 50;
        let numGridLayers = 10;
        let shapes = [];
        let numShapes = 12;

        // Master alpha for transition fading (0-255)
        let masterAlpha = 0; // Start invisible

        // DNA parameters
        let helixAmplitude;
        let helixFrequency = 0.01;
        let rotationSpeed = 0.025;

        // Vibrant Palette (HSB values)
        let palette = [
            [181, 60, 96],   // Cyan
            [144, 55, 92],   // Mint green
            [84, 60, 95],    // Lime
            [106, 50, 98],   // Green
            [350, 65, 100]   // Pink
        ];

        p.setup = function() {
            let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
            canvas.parent(containerId);
            p.colorMode(p.HSB, 360, 100, 100, 100);
            helixAmplitude = p.min(p.width * 0.25, 200);

            for (let i = 0; i < numShapes; i++) {
                shapes.push(new FloatingShape());
            }
        };

        p.draw = function() {
            // Skip rendering if fully transparent
            if (masterAlpha <= 0) return;

            p.blendMode(p.BLEND);

            // Scale background alpha with master alpha
            let bgAlpha = p.map(masterAlpha, 0, 255, 0, 40);
            p.background(0, 0, 5, bgAlpha);

            time += rotationSpeed;

            // Draw grid layers
            for (let layer = 0; layer < numGridLayers; layer++) {
                drawGridLayer(layer);
            }

            p.blendMode(p.ADD);
            drawDNA();

            for (let shape of shapes) {
                shape.update();
                shape.display();
            }

            p.blendMode(p.BLEND);
        };

        // Public method to control opacity during transition
        p.setMasterAlpha = function(alpha) {
            masterAlpha = alpha;
        };

        p.getMasterAlpha = function() {
            return masterAlpha;
        };

        function drawGridLayer(layer) {
            let depthProgress = layer / (numGridLayers - 1);
            let layerGridSize = p.width * 0.08 * (1.5 - depthProgress * 0.8);
            let baseAlpha = 3 + depthProgress * 12;
            let alpha = baseAlpha * (masterAlpha / 255); // Apply master alpha
            let brightness = 15 + depthProgress * 45;
            let lineThickness = p.width * 0.004 * (1.5 - depthProgress * 1.2);
            let timeOffset = layer * 0.6;
            let waveAmount = p.width * 0.04 * (1.2 - depthProgress * 0.5);
            let speed = 2.0 + layer * 0.3;

            let layerOffsetX = p.sin(time * 0.5 + layer * 0.8) * p.width * 0.03;
            let layerOffsetY = p.cos(time * 0.4 + layer * 0.6) * p.height * 0.03;

            let colorIndex = layer % palette.length;
            let col = palette[colorIndex];

            p.stroke(col[0], col[1] * 0.6, brightness, alpha);
            p.strokeWeight(p.max(0.5, lineThickness));

            // Vertical lines
            for (let x = layerOffsetX; x < p.width + layerGridSize; x += layerGridSize) {
                let wave1 = p.sin(time * speed + x * 0.008 + timeOffset) * waveAmount;
                let wave2 = p.cos(time * speed * 0.7 + x * 0.012) * waveAmount * 0.3;
                let offset = wave1 + wave2;
                p.line(x + offset, 0, x - offset * 0.8, p.height);
            }

            // Horizontal lines
            for (let y = layerOffsetY; y < p.height + layerGridSize; y += layerGridSize) {
                let wave1 = p.cos(time * speed + y * 0.008 + timeOffset) * waveAmount;
                let wave2 = p.sin(time * speed * 0.6 + y * 0.015) * waveAmount * 0.3;
                let offset = wave1 + wave2;
                p.line(0, y + offset, p.width, y - offset * 0.8);
            }
        }

        function drawDNA() {
            let centerX = p.width / 2;
            let strandSpacing = p.height / numRungs;
            let strand1Points = [];
            let strand2Points = [];

            // Calculate points along both vertical strands
            for (let i = 0; i <= numRungs; i++) {
                let y = i * strandSpacing;
                let phase = y * helixFrequency + time;

                let x1 = centerX + p.sin(phase) * helixAmplitude;
                let x2 = centerX + p.sin(phase + p.PI) * helixAmplitude;

                let z1 = p.cos(phase);
                let z2 = p.cos(phase + p.PI);

                strand1Points.push({ x: x1, y: y, z: z1 });
                strand2Points.push({ x: x2, y: y, z: z2 });
            }

            // Draw horizontal rungs (base pairs)
            for (let i = 0; i < strand1Points.length; i++) {
                let pt1 = strand1Points[i];
                let pt2 = strand2Points[i];

                let colorIndex = i % palette.length;
                let col = palette[colorIndex];

                let avgZ = (pt1.z + pt2.z) / 2;
                let baseAlpha = p.map(avgZ, -1, 1, 8, 35);
                let alpha = baseAlpha * (masterAlpha / 255); // Apply master alpha
                let strokeW = p.map(avgZ, -1, 1, 1, 5);

                // Glow for rungs
                p.stroke(col[0], col[1], col[2], alpha * 0.4);
                p.strokeWeight(strokeW * 3);
                p.line(pt1.x, pt1.y, pt2.x, pt2.y);

                // Main rung line
                p.stroke(col[0], col[1], col[2], alpha);
                p.strokeWeight(strokeW);
                p.line(pt1.x, pt1.y, pt2.x, pt2.y);
            }

            // Draw vertical strands with glow
            drawStrand(strand1Points, 0);
            drawStrand(strand2Points, 2);
        }

        function drawStrand(points, colorOffset) {
            // Draw multiple glow layers for neon effect
            for (let g = 4; g > 0; g--) {
                let glowAlpha = p.map(g, 4, 0, 5, 25);
                let glowWeight = g * 10;

                p.noFill();
                for (let i = 0; i < points.length - 1; i++) {
                    let pt1 = points[i];
                    let pt2 = points[i + 1];

                    let colorIndex = (i + colorOffset) % palette.length;
                    let col = palette[colorIndex];

                    let avgZ = (pt1.z + pt2.z) / 2;
                    let baseDepthAlpha = p.map(avgZ, -1, 1, glowAlpha * 0.3, glowAlpha);
                    let depthAlpha = baseDepthAlpha * (masterAlpha / 255); // Apply master alpha

                    p.stroke(col[0], col[1], col[2], depthAlpha);
                    p.strokeWeight(glowWeight * p.map(avgZ, -1, 1, 0.4, 1.2));
                    p.line(pt1.x, pt1.y, pt2.x, pt2.y);
                }
            }

            // Draw main strand line
            p.noFill();
            for (let i = 0; i < points.length - 1; i++) {
                let pt1 = points[i];
                let pt2 = points[i + 1];

                let colorIndex = (i + colorOffset) % palette.length;
                let col = palette[colorIndex];

                let avgZ = (pt1.z + pt2.z) / 2;
                let baseAlpha = p.map(avgZ, -1, 1, 15, 50);
                let alpha = baseAlpha * (masterAlpha / 255); // Apply master alpha
                let weight = p.map(avgZ, -1, 1, 2, 8);

                p.stroke(col[0], col[1] * 0.8, col[2], alpha);
                p.strokeWeight(weight);
                p.line(pt1.x, pt1.y, pt2.x, pt2.y);
            }

            // Draw glowing nodes at each point
            for (let i = 0; i < points.length; i++) {
                let pt = points[i];
                let colorIndex = (i + colorOffset) % palette.length;
                let col = palette[colorIndex];

                let size = p.map(pt.z, -1, 1, 6, 18);
                let baseAlpha = p.map(pt.z, -1, 1, 20, 60);
                let alpha = baseAlpha * (masterAlpha / 255); // Apply master alpha

                p.noStroke();

                // Outer glow
                p.fill(col[0], col[1], col[2], alpha * 0.2);
                p.ellipse(pt.x, pt.y, size * 3, size * 3);

                // Middle glow
                p.fill(col[0], col[1], col[2], alpha * 0.4);
                p.ellipse(pt.x, pt.y, size * 2, size * 2);

                // Core
                p.fill(col[0], col[1] * 0.6, 100, alpha);
                p.ellipse(pt.x, pt.y, size, size);

                // Bright center
                p.fill(col[0], col[1] * 0.3, 100, alpha * 0.8);
                p.ellipse(pt.x, pt.y, size * 0.4, size * 0.4);
            }
        }

        class FloatingShape {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = p.random(p.width);
                this.y = p.random(p.height);
                this.size = p.random(p.width * 0.03, p.width * 0.1);
                this.rotation = p.random(p.TWO_PI);
                this.rotationSpeed = p.random(-0.02, 0.02);
                this.sides = p.floor(p.random(3, 7));
                this.colorIndex = p.floor(p.random(palette.length));
                this.alpha = p.random(15, 35);
                this.pulseSpeed = p.random(1, 2.5);
                this.pulsePhase = p.random(p.TWO_PI);
                this.velocityX = p.random(-p.width * 0.001, p.width * 0.001);
                this.velocityY = p.random(-p.width * 0.001, p.width * 0.001);
                this.depth = p.random(0.6, 1.2);
            }

            update() {
                this.x += this.velocityX * this.depth;
                this.y += this.velocityY * this.depth;
                this.rotation += this.rotationSpeed;

                // Wrap around edges
                if (this.x < -this.size) this.x = p.width + this.size;
                if (this.x > p.width + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = p.height + this.size;
                if (this.y > p.height + this.size) this.y = -this.size;
            }

            display() {
                let col = palette[this.colorIndex];
                let pulse = p.sin(time * this.pulseSpeed + this.pulsePhase) * 0.5 + 0.5;
                let currentSize = this.size * (0.85 + pulse * 0.3);
                let currentAlpha = this.alpha * (0.6 + pulse * 0.4) * (masterAlpha / 255); // Apply master alpha

                p.push();
                p.translate(this.x, this.y);
                p.rotate(this.rotation);

                // Outer glow
                for (let i = 2; i > 0; i--) {
                    let glowAlpha = currentAlpha * 0.15 / i;
                    let glowSize = currentSize * (1 + i * 0.25);

                    p.noFill();
                    p.stroke(col[0], col[1], col[2], glowAlpha);
                    p.strokeWeight(p.width * 0.002 * i);
                    this.drawPolygon(0, 0, glowSize / 2, this.sides);
                }

                // Main shape
                p.noFill();
                p.stroke(col[0], col[1] * 0.8, col[2], currentAlpha);
                p.strokeWeight(p.width * 0.0015);
                this.drawPolygon(0, 0, currentSize / 2, this.sides);

                p.pop();
            }

            drawPolygon(x, y, radius, sides) {
                p.beginShape();
                let angleStep = p.TWO_PI / sides;
                for (let i = 0; i < sides; i++) {
                    let angle = i * angleStep - p.HALF_PI;
                    p.vertex(x + p.cos(angle) * radius, y + p.sin(angle) * radius);
                }
                p.endShape(p.CLOSE);
            }
        }

        p.windowResized = function() {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            helixAmplitude = p.min(p.width * 0.25, 200);

            shapes = [];
            for (let i = 0; i < numShapes; i++) {
                shapes.push(new FloatingShape());
            }
        };
    };
}
