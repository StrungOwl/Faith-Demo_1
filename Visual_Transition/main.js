// Visual Transition Controller
// Orchestrates the transition between Visual 1 (Black Hole) and Visual 2 (DNA Helix)
// with glitch effects during the crossfade

class VisualTransitionController {
    constructor() {
        // Timing configuration (in milliseconds)
        this.config = {
            visual1Duration: 30000,      // 30 seconds before transition starts
            glitchBuildUp: 1000,         // 1 second glitch build-up before fade
            transitionDuration: 2000,    // 2 second crossfade
            glitchFadeOut: 500           // 0.5 second glitch fade-out after transition
        };

        // State tracking
        this.currentVisual = 1;
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.startTime = 0;

        // p5 sketch instances
        this.blackHoleSketch = null;
        this.dnaHelixSketch = null;

        // Glitch effects
        this.glitchCanvas = null;
        this.glitchEffects = null;

        // DOM containers
        this.visual1Container = null;
        this.visual2Container = null;

        this.init();
    }

    init() {
        // Get DOM elements
        this.visual1Container = document.getElementById('visual1-container');
        this.visual2Container = document.getElementById('visual2-container');
        this.glitchCanvas = document.getElementById('glitch-canvas');

        // Set up glitch canvas dimensions
        this.glitchCanvas.width = window.innerWidth;
        this.glitchCanvas.height = window.innerHeight;
        this.glitchEffects = new GlitchEffects(this.glitchCanvas);

        // Create p5 instances
        this.blackHoleSketch = new p5(
            createBlackHoleSketch('visual1-container'),
            this.visual1Container
        );

        this.dnaHelixSketch = new p5(
            createDNAHelixSketch('visual2-container'),
            this.visual2Container
        );

        // Set initial states
        this.blackHoleSketch.setMasterAlpha(255);
        this.dnaHelixSketch.setMasterAlpha(0);

        // Set initial CSS opacity
        this.visual1Container.style.opacity = 1;
        this.visual2Container.style.opacity = 0;

        // Record start time and schedule transition
        this.startTime = performance.now();
        this.scheduleTransition();

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());

        // Start the render loop for glitch effects
        this.renderLoop();

        // Debug: Press 'T' to trigger transition immediately (for testing)
        window.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                if (!this.isTransitioning && this.currentVisual === 1) {
                    console.log('Manual transition triggered');
                    this.startTransition();
                }
            }
        });

        console.log('Visual Transition Controller initialized');
        console.log(`Transition will begin in ${this.config.visual1Duration / 1000} seconds`);
        console.log('Press "T" to trigger transition manually');
    }

    scheduleTransition() {
        setTimeout(() => {
            this.startTransition();
        }, this.config.visual1Duration);
    }

    startTransition() {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        this.transitionStartTime = performance.now();

        console.log('Starting transition from Visual 1 to Visual 2');
    }

    renderLoop() {
        requestAnimationFrame(() => this.renderLoop());

        if (!this.isTransitioning) {
            // Clear glitch canvas when not transitioning
            this.glitchEffects.setIntensity(0);
            const ctx = this.glitchCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.glitchCanvas.width, this.glitchCanvas.height);
            return;
        }

        const elapsed = performance.now() - this.transitionStartTime;
        const totalDuration = this.config.glitchBuildUp +
                             this.config.transitionDuration +
                             this.config.glitchFadeOut;

        if (elapsed >= totalDuration) {
            this.completeTransition();
            return;
        }

        this.updateTransition(elapsed);
    }

    updateTransition(elapsed) {
        const { glitchBuildUp, transitionDuration, glitchFadeOut } = this.config;

        // Get canvas elements for glitch compositing
        const canvas1 = this.visual1Container.querySelector('canvas');
        const canvas2 = this.visual2Container.querySelector('canvas');

        // Phase 1: Glitch build-up (Visual 1 still at full opacity)
        if (elapsed < glitchBuildUp) {
            const buildProgress = elapsed / glitchBuildUp;
            const glitchIntensity = Easings.easeInCubic(buildProgress) * 0.8;
            this.glitchEffects.setIntensity(glitchIntensity);

            // Keep Visual 1 at full, Visual 2 hidden
            this.blackHoleSketch.setMasterAlpha(255);
            this.dnaHelixSketch.setMasterAlpha(0);

            // Render glitch effects
            if (canvas1 && canvas2) {
                this.glitchEffects.render(canvas1, canvas2, 0);
            }
        }
        // Phase 2: Crossfade with peak glitch
        else if (elapsed < glitchBuildUp + transitionDuration) {
            const fadeElapsed = elapsed - glitchBuildUp;
            const fadeProgress = fadeElapsed / transitionDuration;

            // Smooth crossfade using easing
            const easedProgress = Easings.easeInOutCubic(fadeProgress);
            const fadeOut = 255 * (1 - easedProgress);
            const fadeIn = 255 * easedProgress;

            this.blackHoleSketch.setMasterAlpha(fadeOut);
            this.dnaHelixSketch.setMasterAlpha(fadeIn);

            // Glitch intensity peaks at middle of transition
            const glitchCurve = Math.sin(fadeProgress * Math.PI);
            const glitchIntensity = 0.5 + glitchCurve * 0.5;
            this.glitchEffects.setIntensity(glitchIntensity);

            // Render glitch effects with both canvases
            if (canvas1 && canvas2) {
                this.glitchEffects.render(canvas1, canvas2, fadeProgress);
            }
        }
        // Phase 3: Glitch fade-out (Visual 2 now at full)
        else {
            const fadeOutElapsed = elapsed - glitchBuildUp - transitionDuration;
            const fadeOutProgress = fadeOutElapsed / glitchFadeOut;

            // Fade out glitch effects
            const glitchIntensity = 0.5 * (1 - Easings.easeOutCubic(fadeOutProgress));
            this.glitchEffects.setIntensity(glitchIntensity);

            // Visual 2 at full, Visual 1 hidden
            this.blackHoleSketch.setMasterAlpha(0);
            this.dnaHelixSketch.setMasterAlpha(255);

            // Render remaining glitch effects
            if (canvas1 && canvas2) {
                this.glitchEffects.render(canvas1, canvas2, 1);
            }
        }

        // Update CSS opacity for visual layers
        this.updateLayerStyles();
    }

    updateLayerStyles() {
        const visual1Alpha = this.blackHoleSketch.getMasterAlpha();
        const visual2Alpha = this.dnaHelixSketch.getMasterAlpha();

        this.visual1Container.style.opacity = visual1Alpha / 255;
        this.visual2Container.style.opacity = visual2Alpha / 255;
    }

    completeTransition() {
        this.isTransitioning = false;
        this.currentVisual = 2;

        // Set final states
        this.blackHoleSketch.setMasterAlpha(0);
        this.dnaHelixSketch.setMasterAlpha(255);
        this.glitchEffects.setIntensity(0);

        // Update layer visibility
        this.visual1Container.style.opacity = 0;
        this.visual2Container.style.opacity = 1;

        // Clear glitch canvas
        const ctx = this.glitchCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.glitchCanvas.width, this.glitchCanvas.height);

        console.log('Transition complete - now showing Visual 2 (DNA Helix)');
    }

    handleResize() {
        // Update glitch canvas dimensions
        this.glitchCanvas.width = window.innerWidth;
        this.glitchCanvas.height = window.innerHeight;
        this.glitchEffects.resize(window.innerWidth, window.innerHeight);
    }

    // Public method to manually trigger transition (for testing)
    triggerTransition() {
        if (!this.isTransitioning && this.currentVisual === 1) {
            this.startTransition();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.visualController = new VisualTransitionController();
});
