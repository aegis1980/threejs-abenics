import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://threejs.org/examples/jsm/libs/dat.gui.module.js";
import { STLLoader } from 'https://threejs.org/examples/jsm/loaders/STLLoader.js';


const csgPDia = 96; //pitch diameter
const mpgPDia = 48; //pitch diameter
const centreDist = 0.5 * (csgPDia + mpgPDia)

var renderer, scene, camera, controls;
let arrowX, arrowY, arrowZ;
let arrowXm, arrowYm, arrowZm;
let csg, mpgA, mpgB;
let csgAxis, mpgAAxis, mpgBAxis;

// Table V Mechanical constants - the orentrations of the deriver unit relative to global.
const mechConstA = [Math.PI/2, 0 , -Math.PI/4];
const mechConstB = [-Math.PI/2, 0 ,3* Math.PI/4];

function translationFromEuler(a,r){
  const e = new THREE.Euler(a[0],a[1],a[2]);
  return new THREE.Vector3(r,0,0).applyEuler(e);
} 


const rotEuler = new function() {
  this.a = 0;
  this.b = 0;
  this.c = 0;
}

function mpGear(r,p,y, beta) {
    const Cb = Math.cos(beta);
    const Sb = Math.sin(beta);

    const Cr = Math.cos(r); 
    const Cy = Math.cos(y);
    const Cp = Math.cos(p);

    const Sp = Math.sin(p);
    const Sy = Math.sin(y);
    const Sr = Math.sin(r);
  
  // eqns 54...56
  const A1 = Math.atan((Cr*Sy + Cy*Sp*Sr)/(Cr*Cy*Sp - Sr*Sy));
  const A2 = Math.acos(Cp * Cy);
  const A3 = - Math.atan(Cp * Sy/Sp);
  
  //eqns 57 ... 59
  const B1 = -Math.atan((Cy*Cb*Cr + Sy * (Sb*Cp - Cb*Sp*Sr))/(Cr*Sp*Sy + Cy*Sr));
  const B2 = Math.acos(Cy*Cr*Sb - Sy * (Cb*Cp + Sb*Sp*Sr));
  const B3 = Math.atan((Cy * (Cb*Cp + Sb*Sp*Sr) + Sy*Sb*Cr)/(-Cb*Sp + Sb*Cp*Sr));
  
  return [A1,A2,A3,B1,B2,B3];
}



const loader = new STLLoader();
function loadModel(url) {
    return new Promise(resolve => {
      loader.load(url, resolve);
    });
}




function init() {

    // renderer
    renderer = new THREE.WebGLRenderer( {antialias : true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild( renderer.domElement );

    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcce0ff );
    
    // camera
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 150, 150, 150 );

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
  
  				//

	window.addEventListener( 'resize', onWindowResize );
  
    // ambient
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    
    // light
    scene.add( new THREE.AmbientLight( 0x666666 ) );
    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 200,200, 0 );
    scene.add( light );
    
    // axes
    scene.add( new THREE.AxesHelper( 100 ) );
    
    var aLength = 70;
    var sWidth = 1;
    var sL = aLength- 2*sWidth;
    
    const hWidth = 2 * sWidth;
    // geometry
    const shaft = new THREE.CylinderGeometry( 1, 1,sL , 10 );
    shaft.translate(0,sL/2,0);
    const head = new THREE.ConeGeometry(hWidth,hWidth*2,10);
    head.translate(0,sL + hWidth,0);
  
  
    var shaftMesh = new THREE.Mesh(shaft);
    var headMesh = new THREE.Mesh(head);
    arrowX = new THREE.Geometry();
    arrowX.matrixAutoUpdate = false;
    arrowY = new THREE.Geometry();
    arrowX.matrixAutoUpdate = false;
    arrowZ = new THREE.Geometry();
    arrowX.matrixAutoUpdate = false;

    shaftMesh.updateMatrix();
    arrowX.merge(shaftMesh.geometry, shaftMesh.matrix);
  
    headMesh.updateMatrix();
    arrowX.merge(headMesh.geometry, headMesh.matrix)
    // material
    const green = new THREE.MeshPhongMaterial( {
        color: 0x00ff00, 
        flatShading: true,
        transparent: true,
        opacity: 0.7,
    } );
      const red = new THREE.MeshPhongMaterial( {
        color: 0xff0000, 
        flatShading: true,
        transparent: true,
        opacity: 0.7,
    } );
        const blue = new THREE.MeshPhongMaterial( {
        color: 0x0000ff, 
        flatShading: true,
        transparent: true,
        opacity: 0.7,
    } );
  

    
    arrowY = arrowX.clone().rotateZ(-Math.PI/2);
    arrowZ = arrowX.clone().rotateX(Math.PI/2);
    // mesh
  
    arrowXm = new THREE.Mesh( arrowX, green );
    arrowYm = new THREE.Mesh( arrowY, red );
    arrowZm = new THREE.Mesh( arrowZ, blue );


    //create a csg.and add the two cubes
    //These cubes can now be rotated / scaled etc as a csg.    
    csgAxis = new THREE.Group();
    csgAxis.add(arrowXm);
    csgAxis.add(arrowYm);
    csgAxis.add(arrowZm);

    mpgAAxis = csgAxis.clone();
    mpgAAxis.position.copy( translationFromEuler(mechConstA,centreDist));

    mpgBAxis = csgAxis.clone();
    mpgBAxis.position.copy( translationFromEuler(mechConstB,centreDist));


    let p1 = loadModel('stl/mpg.stl').then(result => {  
        const material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );
        mpgA = new THREE.Mesh( result, material );
        mpgA.castShadow = true;
        mpgA.receiveShadow = true;

        mpgB = mpgA.clone();
     });
    let p2 = loadModel('stl/csg.stl').then(result => {  
        const material = new THREE.MeshPhongMaterial( { color: 0xdd1144, specular: 0x111111, shininess: 200 } );
        csg = new THREE.Mesh( result, material );
        csg.castShadow = true;
        csg.receiveShadow = true;
    });

    const gui = new GUI({ autoPlace: true });
    gui.add(rotEuler, 'a',0,180 ).name( 'α' );
    gui.add(rotEuler, 'b',0,180).name( 'β' );
    gui.add(rotEuler, 'c',0,180 ).name( '𝛾' );
    
    //if all Promises for model loading resolved 
    Promise.all([p1,p2]).then(() => {
        //do something to the model
        mpgA.scale.multiplyScalar( 1/0.6 ); //saved 60% scales stl (used for 3d print) by mistake
        mpgA.position.copy( translationFromEuler(mechConstA,centreDist));
    
        mpgB.scale.multiplyScalar( 1/0.6 );// ditto
        mpgB.position.copy( translationFromEuler(mechConstB,centreDist));

        scene.add(mpgA);
        scene.add(mpgB);
        scene.add(csg);

        scene.add( mpgAAxis );
        scene.add(csgAxis);
        scene.add(mpgBAxis);
        
        //continue the process
        animate();
    });
}

//

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    render();
    renderer.render( scene, camera );

}


function render() {
    const csgEuler = new THREE.Euler(rotEuler.a * Math.PI / 180 , rotEuler.b * Math.PI / 180, rotEuler.c * Math.PI / 180);
    const beta = Math.PI/2;
    const t1 = mpGear(rotEuler.a * Math.PI / 180 , rotEuler.b * Math.PI / 180, rotEuler.c * Math.PI / 180,beta);
    const mpgAEuler = new THREE.Euler(t1[0],t1[1],t1[2]);
    const mpgBEuler = new THREE.Euler(t1[3],t1[4],t1[5]);
  
    csgAxis.setRotationFromEuler(csgEuler);
    csg.setRotationFromEuler(csgEuler);

    mpgAAxis.setRotationFromEuler(mpgAEuler);
    mpgA.setRotationFromEuler(mpgAEuler);

    mpgBAxis.setRotationFromEuler(mpgBEuler);
    mpgB.setRotationFromEuler(mpgBEuler);

}



init();