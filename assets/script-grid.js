const canvas = document.getElementById('waveCanvas');

if (canvas) {
    const ctx = canvas.getContext('2d');

    // --- Configuration ---
    const gridConfig = {
        size: 30,
        lineColor: 'rgba(0, 127, 255, 0.5)',
        lineWidth: 1
    };

    const waveConfig = {
        maxWaves: 5,
        minSpawnInterval: 3500,
        maxSpawnInterval: 7000,
        maxAmplitude: gridConfig.size * 1.8,
        minAmplitudeFactor: 0.5,
        maxAmplitudeFactor: 1.0,
        wavelengthFactor: 0.4,
        baseWavelength: 220,
        baseSpeed: 0.8,
        speedFactor: 0.3,
        durationFactor: 0.5,
        baseDuration: 10000,
        distanceDecayFactor: 0.004,
        edgeMargin: 150
    };
    // --- End Configuration ---

    let width, height;
    let gridPoints = [];
    let waveSources = [];
    let time = 0;
    let lastSpawnTime = 0;
    let nextSpawnInterval = calculateSpawnInterval();
    let animationFrameId = null; // To potentially stop animation

    function calculateSpawnInterval() {
        return waveConfig.minSpawnInterval + Math.random() * (waveConfig.maxSpawnInterval - waveConfig.minSpawnInterval);
    }

    class WaveSource {
        constructor(x, y, time) {
            this.x = x;
            this.y = y;
            this.startTime = time;
            const ampFactor = waveConfig.minAmplitudeFactor + Math.random() * (waveConfig.maxAmplitudeFactor - waveConfig.minAmplitudeFactor);
            this.maxAmplitude = waveConfig.maxAmplitude * ampFactor;
            this.wavelength = waveConfig.baseWavelength * (1 + (Math.random() - 0.5) * 2 * waveConfig.wavelengthFactor);
            this.speed = waveConfig.baseSpeed * (1 + (Math.random() - 0.5) * 2 * waveConfig.speedFactor);
            this.duration = waveConfig.baseDuration * (1 + (Math.random() - 0.5) * 2 * waveConfig.durationFactor);
            this.wavelength = Math.max(50, this.wavelength);
            this.speed = Math.max(0.5, this.speed);
            this.duration = Math.max(2000, this.duration);
        }

        getDisplacement(px, py, currentTime) {
            const dx = px - this.x;
            const dy = py - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const waveAge = currentTime - this.startTime;
            if (waveAge < 0 || waveAge > this.duration) {
                return { dx: 0, dy: 0 };
            }
            const currentRadius = waveAge * this.speed;
            const influenceRadius = this.wavelength * 1.5;
            if (dist > currentRadius + influenceRadius || (currentRadius > influenceRadius && dist < currentRadius - influenceRadius)) {
                return { dx: 0, dy: 0 };
            }
            const timeFactor = 1 - (waveAge / this.duration);
            const temporalAmplitude = this.maxAmplitude * timeFactor * timeFactor;
            const distanceDecay = 1.0 / (1.0 + dist * waveConfig.distanceDecayFactor);
            const currentAmplitude = temporalAmplitude * distanceDecay;
            if (currentAmplitude < 0.1) {
                return { dx: 0, dy: 0 };
            }
            const phase = (dist / this.wavelength) * Math.PI * 2 - (currentRadius / this.wavelength) * Math.PI * 2;
            const displacementMagnitude = currentAmplitude * Math.sin(phase);
            if (dist === 0) return { dx: 0, dy: 0 };
            const displacementX = (dx / dist) * displacementMagnitude;
            const displacementY = (dy / dist) * displacementMagnitude;
            return { dx: displacementX, dy: displacementY };
        }
    }

    function trySpawnWave(currentTime) {
        if (waveSources.length >= waveConfig.maxWaves || currentTime - lastSpawnTime < nextSpawnInterval) {
            return;
        }
        lastSpawnTime = currentTime;
        nextSpawnInterval = calculateSpawnInterval();
        if (Math.random() < 0.85) {
            let x, y;
            const side = Math.floor(Math.random() * 4);
            const margin = waveConfig.edgeMargin * (0.5 + Math.random());
            if (side === 0) { x = Math.random() * (width + margin * 2) - margin; y = -margin * Math.random(); }
            else if (side === 1) { x = width + margin * Math.random(); y = Math.random() * (height + margin * 2) - margin; }
            else if (side === 2) { x = Math.random() * (width + margin * 2) - margin; y = height + margin * Math.random(); }
            else { x = -margin * Math.random(); y = Math.random() * (height + margin * 2) - margin; }
            waveSources.push(new WaveSource(x, y, currentTime));
        }
    }

    function calculateGridPoints(currentTime) {
        const cols = Math.ceil(width / gridConfig.size) + 4;
        const rows = Math.ceil(height / gridConfig.size) + 4;
        const startX = Math.floor(-gridConfig.size * 2);
        const startY = Math.floor(-gridConfig.size * 2);
        if (gridPoints.length !== rows) { gridPoints = new Array(rows); }
        for (let j = 0; j < rows; j++) {
            if (!gridPoints[j] || gridPoints[j].length !== cols) { gridPoints[j] = new Array(cols); }
            for (let i = 0; i < cols; i++) {
                const originalX = startX + i * gridConfig.size;
                const originalY = startY + j * gridConfig.size;
                let totalDisplacementX = 0;
                let totalDisplacementY = 0;
                for (let k = 0; k < waveSources.length; k++) {
                    const displacement = waveSources[k].getDisplacement(originalX, originalY, currentTime);
                    totalDisplacementX += displacement.dx;
                    totalDisplacementY += displacement.dy;
                }
                if (!gridPoints[j][i]) { gridPoints[j][i] = { x: 0, y: 0 }; }
                gridPoints[j][i].x = originalX + totalDisplacementX;
                gridPoints[j][i].y = originalY + totalDisplacementY;
            }
        }
        gridPoints.rows = rows; gridPoints.cols = cols;
    }

    function drawGrid(ctx) {
        ctx.lineWidth = gridConfig.lineWidth;
        ctx.strokeStyle = gridConfig.lineColor;
        const rows = gridPoints.rows; const cols = gridPoints.cols;
        if (!rows || !cols) return;
        for (let j = 0; j < rows; j++) {
            ctx.beginPath();
            for (let i = 0; i < cols; i++) {
                const point = gridPoints[j][i];
                if (i === 0) { ctx.moveTo(point.x, point.y); }
                else { ctx.lineTo(point.x, point.y); }
            }
            ctx.stroke();
        }
        for (let i = 0; i < cols; i++) {
            ctx.beginPath();
            for (let j = 0; j < rows; j++) {
                const point = gridPoints[j][i];
                if (j === 0) { ctx.moveTo(point.x, point.y); }
                else { ctx.lineTo(point.x, point.y); }
            }
            ctx.stroke();
        }
    }

    function animate(timestamp) {
        time = timestamp;

        if (width > 0 && height > 0) {
            ctx.clearRect(0, 0, width, height);
            waveSources = waveSources.filter(wave => (time - wave.startTime) <= wave.duration);
            trySpawnWave(time);
            calculateGridPoints(time);
            drawGrid(ctx);
        }
        animationFrameId = requestAnimationFrame(animate);
    }

    function resizeCanvas() {
        // use the canvas element's actual size in the layout
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        // drawing buffer size to match its display size
        canvas.width = width;
        canvas.height = height;
        console.log(`Grid Canvas resized to ${width}x${height}`);
        gridPoints = [];
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 150); // Increase debounce delay slightly
    });

    // --- Initialization ---
    // Wait a moment for layout to settle before initial sizing
    setTimeout(() => {
        resizeCanvas();

        if (animationFrameId === null) { // Prevent multiple animation loops
             animationFrameId = requestAnimationFrame(animate);
        }
    }, 100);

} else {
    console.log("Grid canvas element not found.");
}
