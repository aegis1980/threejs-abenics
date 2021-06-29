import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://threejs.org/examples/jsm/libs/dat.gui.module.js";
import { STLLoader } from 'https://threejs.org/examples/jsm/loaders/STLLoader.js';

var renderer, scene, camera, controls;
let arrowX, arrowY, arrowZ;
let arrowXm, arrowYm, arrowZm;
let csg, mpg1, mpg2;
let csgAxis, mpg1Axis, mpg2Axis;

const rotEuler = new function() {
  this.a = 30;
  this.b = 0;
  this.c = 0;
}

function mpGear(r,p,y, beta) {
    const Cb = Math.cos(beta);
    const Sb = Math.sin(beta);

  const Cr = Math.cos(r); 
  const Cp = Math.cos(p);
  const Cy = Math.cos(y);
  const Sp = Math.sin(p);
  const Sy = Math.sin(y);
  const Sr = Math.sin(r);
  
  // eqns 54...56
  const t1 = Math.atan((Cr * Sy + Cy* Sp*Sr)/(Cr*Cy*Sp - Sr*Sy));
  const t2 = Math.acos(Cp * Cy);
  const t3 = - Math.atan(Cp * Sy/Sp);
  
  //eqns 57 ... 59
  const t4 = -Math.atan((Cy*Cb*Cr + Sy * (Sb*Cp - Cb*Sp*Sr))/(Cr*Sp*Sy + Cy*Sr));
  const t5 = Math.acos(Cy*Cr*Sb - Sy * (Cb*Cp + Sb*Sp*Sr));
  const t6 = Math.atan((Cy * (Cb*Cp + Sb*Sp*Sr) + Sy*Sb*Cr)/(-Cb*Sp + Sb*Cp*Sr));
  
  return [t1,t2,t3, t4, t5, t6];
}


init();
animate();

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
    camera.position.set( 20, 20, 20 );

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
  
  				//

	window.addEventListener( 'resize', onWindowResize );
  
  
    



    // ambient
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    
    // light
    scene.add( new THREE.AmbientLight( 0x666666 ) );
    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 20,20, 0 );
    scene.add( light );
    
    // axes
    scene.add( new THREE.AxesHelper( 20 ) );
    
    var aLength = 50
    var sWidth = 1
    var sL = aLength- 2*sWidth
    
    const hWidth = 2 * sWidth
    // geometry
    const shaft = new THREE.CylinderGeometry( 1, 1,sL , 10 );
    shaft.translate(0,sL/2,0)
    const head = new THREE.ConeGeometry(hWidth,hWidth*2,10);
    head.translate(0,sL + hWidth,0)
  
  
    var shaftMesh = new THREE.Mesh(shaft);
    var headMesh = new THREE.Mesh(head);
    arrowX = new THREE.Geometry();
    arrowX.matrixAutoUpdate = false;
    arrowY = new THREE.Geometry();
    arrowX.matrixAutoUpdate = false;
    arrowZ = new THREE.Geometry();
    arrowX.matrixAutoUpdate = false;

    shaftMesh.updateMatrix();
    arrowX.merge(shaftMesh.geometry, shaftMesh.matrix)
  
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

    mpg1Axis = csgAxis.clone();
    mpg1Axis.position.set( - 20, 0, 0 );


    mpg2Axis = csgAxis.clone();
    mpg2Axis.position.set( 20, 20, 0 );


    //scene.add(csgAxis)
    //scene.add(mpg1);
    //scene.add(mpg2);

    const loader = new STLLoader();
    loader.load( 'stl/mpg.stl', function ( geometry ) {

        const material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );
        mpg1 = new THREE.Mesh( geometry, material );

        mpg1.scale.set( 1,1,1);
        mpg1.position.set( - 20, 0, 0 );
        mpg1.castShadow = true;
        mpg1.receiveShadow = true;

        scene.add( mpg1 );
        scene.add( mpg1Axis );
        scene.add(csgAxis);
        scene.add(mpg2Axis);
    } );


    const gui = new GUI({ autoPlace: true });
    gui.add(rotEuler, 'a', 0,360 ).name( 'α' );
    gui.add(rotEuler, 'b', 0,360).name( 'β' );
    gui.add(rotEuler, 'c',0,360 ).name( '𝛾' );
}

//

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    
    //controls.update();
    render();

    renderer.render( scene, camera );

}


function render() {
  const csgEuler = new THREE.Euler(rotEuler.a * Math.PI / 180 , rotEuler.b * Math.PI / 180, rotEuler.c * Math.PI / 180, 'XYZ' );
  const beta = 1;
  const t1 = mpGear(rotEuler.a * Math.PI / 180 , rotEuler.b * Math.PI / 180, rotEuler.c * Math.PI / 180,beta);
  const mpg1Euler = new THREE.Euler(t1[0],t1[1],t1[2], 'XYZ');
  const mpg2Euler = new THREE.Euler(t1[3],t1[4],t1[5], 'XYZ');
  
  csgAxis.setRotationFromEuler(csgEuler);
  mpg1Axis.setRotationFromEuler(mpg1Euler);
  mpg1.setRotationFromEuler(mpg1Euler);
  mpg2Axis.setRotationFromEuler(mpg2Euler);
}