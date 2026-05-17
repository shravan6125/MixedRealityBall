const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const ball = document.getElementById("ball");
const switchBtn = document.getElementById("switchCam");

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;

let currentFacingMode = "environment";

let camera;

async function setupCamera() {

    // Stop previous camera

    if (videoElement.srcObject) {

        videoElement.srcObject
            .getTracks()
            .forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: currentFacingMode
        }
    });

    videoElement.srcObject = stream;

    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            resolve(videoElement);
        };
    });
}

function moveBall(targetX, targetY) {

    currentX += (targetX - currentX) * 0.25;
    currentY += (targetY - currentY) * 0.25;

    ball.style.left = `${currentX}px`;
    ball.style.top = `${currentY}px`;
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults((results) => {

    canvasCtx.clearRect(
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );

    if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
    ) {

        const landmarks = results.multiHandLandmarks[0];

        // Index finger tip

        const finger = landmarks[8];

        const x =
            window.innerWidth -
            (finger.x * window.innerWidth);

        const y =
            finger.y * window.innerHeight;

        moveBall(x, y);

        // Pinch scaling

        const thumb = landmarks[4];

        const dx = thumb.x - finger.x;
        const dy = thumb.y - finger.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        const size = 60 + (distance * 300);

        ball.style.width = `${size}px`;
        ball.style.height = `${size}px`;
    }
});

function startTracking() {

    if (camera) {
        camera.stop();
    }

    camera = new Camera(videoElement, {

        onFrame: async () => {

            await hands.send({
                image: videoElement
            });
        },

        width: 1280,
        height: 720
    });

    camera.start();
}

// Switch camera button

switchBtn.addEventListener("click", async () => {

    currentFacingMode =
        currentFacingMode === "user"
            ? "environment"
            : "user";

    await setupCamera();

    startTracking();
});

setupCamera().then(() => {

    startTracking();
});
