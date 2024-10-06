import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const loader = new GLTFLoader();

const donutAssets = [
    './assets/models/test-donut/scene.gltf',
    //'./assets/models/sprinkle-donut/scene.gltf',
    './assets/models/milkchoco-donut/scene.gltf',
    './assets/models/donut/scene.gltf'
]

var activeDonut;
var activeIndex;

var donuts = [];

var camera, controls, renderer, scene;

var play = false;
var canEat = false;
var time = 0;
var score = 0;

var scoreText, progressBar, progressContainer, progressText;
var bites;

var raycaster;
var pointer;

//test
var screenShake = ScreenShake();
var listener, sound, audioLoader;

init();

animate();

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x7fb0fa );
    document.body.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.005, 1000 );
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0)

    listener = new THREE.AudioListener();
    camera.add( listener );

    sound = new THREE.Audio( listener );
    
    audioLoader = new THREE.AudioLoader();
    audioLoader.load( './assets/sound/bite.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setVolume( 0.1 );
        sound.playbackRate( 1 );
    });

    //Camera Controls
    // controls = new MapControls( camera, renderer.domElement );
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    // controls.maxPolarAngle = Math.PI / 2; // Limit camera rotation
    controls.saveState();

    const ambientLight = new THREE.AmbientLight( 0xf7b7a1 );

    const dirLight1 = new THREE.DirectionalLight( 0xffffff, 4 );
    dirLight1.position.set( 0, 2, 0 );

    const dirLight2 = new THREE.DirectionalLight( 0xdcf4f7, 1 );
	dirLight2.position.set( - 1, - 1, - 1 );

    scene = new THREE.Scene();

    //
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    let donutsLoaded = 0;
    donutAssets.forEach((asset) => {
        loader.load(asset, (gltf) => {
            let donut = gltf.scene;
            donut.position.set(0,0,0);
            donut.visible = false;
            donuts.push(donut);
            scene.add(donut);
            console.log('Loaded ', donut);
            donutsLoaded++;

            // Called only after all donuts are loaded.
            if(donutsLoaded == donutAssets.length) {
                console.log('All donuts have been loaded');
                activeDonut = donuts[0];
                activeIndex = 0;
                activeDonut.visible = true;
                scene.add(activeDonut);
            }
        }, undefined, (err) => {
            console.log('Error loading models: ', err);
        });
    });

    scene.add(ambientLight);
    scene.add(dirLight1);
    scene.add(dirLight2)

    const btnPlay = document.getElementById("btn-play");
    const btnSwitch = document.getElementById("btn-switch");
    const btnLeaderboard = document.getElementById("btn-leaderboard");
    const btnLeaderboardX = document.getElementById("btn-close-leaderboard");
    scoreText = document.getElementById("score-text");
    progressBar = document.getElementById("progress-bar");
    progressText = document.getElementById("progress-text");
    progressContainer = document.getElementById("container-progress");

    bites = 0;

    btnPlay.addEventListener("click", onPlayButtonClick);
    btnSwitch.addEventListener("click", onSwitchButtonClick);
    btnLeaderboard.addEventListener("click", onShowLeaderboard);
    btnLeaderboardX.addEventListener("click", onShowLeaderboard);
}

function animate() {

    window.requestAnimationFrame( animate );

    controls.update();
    
    screenShake.update(camera);

    if(play == true) {
        activeDonut.rotation.y += 0.002;
    }

	render();

}

function render() {

    renderer.render( scene, camera );

}

function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if(intersects.length > 0) {
        //console.log(intersects[0].object);
        canEat = true;
    } else {
        canEat = false;
    }

    //console.log('(', pointer.x, ' ', pointer.y, ')');
}

function onPlayButtonClick() {
    console.log("Play Button Clicked!");

    time = 30;
    score = 0;

    document.getElementById("score-text").textContent = "Resetting Score..."
    document.getElementById("time-text").textContent = "Starting Timer...";

    // Start Timer
    let timer = setInterval(() => {
        if(time <= 0) {
            clearInterval(timer);
            document.getElementById("time-text").textContent = "FINISHED";
            setButtons(false);
            progressBar.style.width = '0%';
            progressText.textContent = 'EATEN ' + '0%';
            play = false;
            onShowLeaderboard();

            let timeNow = new Date().toLocaleString();

            addRecord(score, timeNow.toString());
        } else {
            setButtons(true);
            document.getElementById("score-text").textContent = "SCORE: " + score;
            document.getElementById("time-text").textContent = "TIME LEFT: " + time;
            play = true;
        }
        time--;
    }, 1000);
}

function onSwitchButtonClick() {
    //console.log("Switch Button Clicked!");

    activeDonut.visible = false;

    activeIndex++;

    activeDonut = donuts[activeIndex % donuts.length];

    activeDonut.visible = true;

    controls.reset();

    //reset progress
    bites = 0;
    progressBar.style.width = '0%';
    progressText.textContent = 'EATEN 0%';
}

// Differs from onSwitch
function switchDonut() {
    activeDonut.visible = false;

    //activeIndex++;
    activeIndex = Math.random() * donuts.length;
    activeIndex = activeIndex.toFixed();

    activeDonut = donuts[activeIndex % donuts.length];

    activeDonut.visible = true;

    controls.reset();

    //reset progress
    bites = 0;
    progressBar.style.width = '0%';
    progressText.textContent = 'EATEN 0%';
}

function onShowLeaderboard() {
    console.log("Leaderboard toggle.");

    let leaderboard = document.getElementById("container-leaderboard");

    if(leaderboard.style.visibility == "visible") {
        leaderboard.style.visibility = "hidden";
    } else {
        leaderboard.style.visibility = "visible";
    }
}

function addRecord(result, date) {
    let leaderboardRecord = document.createElement("div");
    let recordScore = document.createElement("div");
    let recordDate = document.createElement("div");

    leaderboardRecord.className = "leaderboard-record";
    recordScore.className = "record-score";
    recordDate.className = "record-date";

    recordScore.textContent = "SCORE: " + result;
    recordDate.textContent = "Time: " + date;

    let container = document.getElementById("container-leaderboard-records");
    container.append(leaderboardRecord);
    leaderboardRecord.append(recordScore);
    leaderboardRecord.append(recordDate);
}

function bite() {
    // play - if play button is clicked
    // canEat - if mouse pointer is hovering on donut
    if(play && canEat) {
        bites++;
        sound.play();
        screenShake.shake( camera, new THREE.Vector3(0.1, -0.05, 0), 300 );
        if (bites <= 5) {
            const progress = (bites / 5) * 100;
            progressBar.style.width = progress + '%';
            progressText.textContent = 'EATEN ' + progress.toFixed(0) + '%';
        } else {
            bites = 0;
            progressBar.style.width = '0%';
            progressText.textContent = 'EATEN 0%';
            score++;
            scoreText.textContent = 'SCORE: ' + score.toFixed(0);
            //console.log("score: ", score);
            eat();
        }
    }
}

function eat() {
    switchDonut();
}

function setButtons(bool) {
    document.getElementById("btn-play").disabled = bool;
    //document.getElementById("btn-switch").disabled = bool;
    document.getElementById("btn-leaderboard").disabled = bool;
}

// A tool provided by Felix Mariotto (2019)
function ScreenShake() {

	return {

		// When a function outside ScreenShake handle the camera, it should
		// always check that ScreenShake.enabled is false before.
		enabled: false,

		_timestampStart: undefined,

		_timestampEnd: undefined,

		_startPoint: undefined,

		_endPoint: undefined,



		// update(camera) must be called in the loop function of the renderer,
		// it will re-position the camera according to the requested shaking.
		update: function update(camera) {
			if ( this.enabled == true ) {
				const now = Date.now();
				if ( this._timestampEnd > now ) {
					let interval = (Date.now() - this._timestampStart) / 
						(this._timestampEnd - this._timestampStart) ;
					this.computePosition( camera, interval );
				} else {
					camera.position.copy(this._startPoint);
					this.enabled = false;
				};
			};
		},



		// This initialize the values of the shaking.
		// vecToAdd param is the offset of the camera position at the climax of its wave.
		shake: function shake(camera, vecToAdd, milliseconds) {
			this.enabled = true ;
			this._timestampStart = Date.now();
			this._timestampEnd = this._timestampStart + milliseconds;
			this._startPoint = new THREE.Vector3().copy(camera.position);
			this._endPoint = new THREE.Vector3().addVectors( camera.position, vecToAdd );
		},




		computePosition: function computePosition(camera, interval) {

			// This creates the wavy movement of the camera along the interval.
			// The first bloc call this.getQuadra() with a positive indice between
			// 0 and 1, then the second call it again with a negative indice between
			// 0 and -1, etc. Variable position will get the sign of the indice, and
			// get wavy.
			if (interval < 0.4) {
				var position = this.getQuadra( interval / 0.4 );
			} else if (interval < 0.7) {
				var position = this.getQuadra( (interval-0.4) / 0.3 ) * -0.6;
			} else if (interval < 0.9) {
				var position = this.getQuadra( (interval-0.7) / 0.2 ) * 0.3;
			} else {
				var position = this.getQuadra( (interval-0.9) / 0.1 ) * -0.1;
			}
			
			// Here the camera is positioned according to the wavy 'position' variable.
			camera.position.lerpVectors( this._startPoint, this._endPoint, position );
		},

		// This is a quadratic function that return 0 at first, then return 0.5 when t=0.5,
		// then return 0 when t=1 ;
		getQuadra: function getQuadra(t) {
			return 9.436896e-16 + (4*t) - (4*(t*t)) ;
		}

	};

};

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', bite);