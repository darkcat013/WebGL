"use strict"

//all the next imports are done in index.html file
//getRandomColor, subtractArray, hexToRGB, intToHex, intRGB_ToHex from helper-functions.js
//Shape from Shape.js
//Cube from Cube.js
//Cone from Cone.js
//Pyramid from Pyramid.js
//Cylinder from Cylinder.js
//Sphere from Sphere.js
//LightSource from LightSource.js

var canvas;
var gl;
var program;

var shapes = {};
var shapeTypes = ["Cube", "Cone", "Pyramid", "Cylinder", "Sphere"];

// camera

//minimum distance that the camera can see
var near = "0.3";
//maximum distance that the camera can see
var far = 3.0;
//how far is the camera from the center
var radius = 4.0;
//used to move camera left-right
var theta = 0.0;
//used to move camera up-down
var phi = 0.0;

var fov = 45.0;  // Field-of-view in degrees
var aspect = 1.0; // Viewport aspect ratio

//model matrix creates specific coordinates for each object, not depending on the world center
//view matrix is the first part of the camera (radius, theta, phi)
//projection matrix is the combination of model and view matrix, it represents how we see the scene (fov, aspect, near, far)
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var activeShape;

//light stuff
var lights = {};

var ambientColorLoc, diffuseColorLoc, specularColorLoc, shininessLoc;
var lightPosLoc;
var viewPosLoc;
var ambientColor = [0, 0, 0];
var diffuseColor = [1, 1, 1];
var specularColor = [1, 1, 1];
var shininess = 5.0;

var activeLight;

//texture stuff
var activeObjShape;
var textureCount = 0;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas)

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    ambientColorLoc = gl.getUniformLocation(program, "ambientColor");
    diffuseColorLoc = gl.getUniformLocation(program, "diffuseColor");
    specularColorLoc = gl.getUniformLocation(program, "specularColor");
    shininessLoc = gl.getUniformLocation(program,'shininess');
    lightPosLoc = gl.getUniformLocation(program, "lightPos")
    viewPosLoc = gl.getUniformLocation(program, "viewPos")

    // Add select options for available shapes
    for (let i = 0; i < shapeTypes.length; i++) {
        let select = document.getElementById("add-shape-select");
        let opt = document.createElement('option');
        opt.value = shapeTypes[i];
        opt.innerHTML = shapeTypes[i];
        select.appendChild(opt);
    }

    //addThreeShapes();
    // Add event listeners for buttons
    document.getElementById("add-shape-btn").onclick = function () {
        let e1 = document.getElementById("add-shape-select");
        let shapeType = e1.options[e1.selectedIndex].value;

        let shape;
        switch (shapeType) {
            case "Cone":
                shape = new Cone();
                break;
            case "Cube":
                shape = new Cube();
                break;
            case "Pyramid":
                shape = new Pyramid();
                break;
            case "Cylinder":
                shape = new Cylinder();
                break;
            case "Sphere":
                shape = new Sphere();
                break;
            default:
                console.log("Shape not identified");
        }

        addNewShape(shape)
        console.log(shape);
        addNewShapeForTexture(shape);
    }

    document.getElementById("active-shape-btn").onclick = function () {
        let e = document.getElementById("active-shape-select");
        let activeShapeName = e.options[e.selectedIndex].value;

        setActiveShape(shapes[activeShapeName]);
    }

    document.getElementById("remove-shape-btn").onclick = function () {
        activeShape.remove();

        activeShape = shapes[Object.keys(shapes)[0]]
        if (activeShape) document.getElementById("active-shape").innerHTML = activeShape.id
        else document.getElementById("active-shape").innerHTML = "None";
        document.getElementById("current-object").innerHTML = "None";
        
    }

    // sliders 
    document.getElementById("translateX").onchange = function (event) {
        activeShape.translation[0] = event.target.value;
    }

    document.getElementById("translateY").onchange = function (event) {
        activeShape.translation[1] = event.target.value;
    }

    document.getElementById("translateZ").onchange = function (event) {
        activeShape.translation[2] = event.target.value;
    }

    // scale sliders
    document.getElementById("scaleX").onchange = function (event) {
        activeShape.scaling[0] = event.target.value;
    }

    document.getElementById("scaleY").onchange = function (event) {
        activeShape.scaling[1] = event.target.value;
    }

    document.getElementById("scaleZ").onchange = function (event) {
        activeShape.scaling[2] = event.target.value;
    }

    // rotate buttons
    document.getElementById("xButton").onclick = function () {
        activeShape.rotAxis = 0;
    };
    document.getElementById("yButton").onclick = function () {
        activeShape.rotAxis = 1;
    };
    document.getElementById("zButton").onclick = function () {
        activeShape.rotAxis = 2;
    };
    document.getElementById("toggleRotation").onclick = function () {
        activeShape.isRotating = !activeShape.isRotating;
    };


    // sliders for viewing parameters
    document.getElementById("zFarSlider").onchange = function (event) {
        far = event.target.value;
    };
    document.getElementById("zNearSlider").onchange = function (event) {
        near = event.target.value;
    };
    document.getElementById("radiusSlider").onchange = function (event) {
        radius = event.target.value;
    };
    document.getElementById("thetaSlider").onchange = function (event) {
        theta = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("phiSlider").onchange = function (event) {
        phi = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("aspectSlider").onchange = function (event) {
        aspect = event.target.value;
    };
    document.getElementById("fovSlider").onchange = function (event) {
        fov = event.target.value;
    };

    // set up light sources
    addLightSource([0.5, 0.5, 0.5], [0, 0, 0])
    addLightSource([-1, 0.5, 0.5], [0, 0, 0])
    addLightSource([0, -1, 0.5], [1, 1, 1])

    activeLight = lights["LightSource3"]

    //light controls
    document.getElementById("translateX-light").onchange = function (event) {
        activeLight.translation[0] = event.target.value;
    }

    document.getElementById("translateY-light").onchange = function (event) {
        activeLight.translation[1] = event.target.value;
    }

    document.getElementById("translateZ-light").onchange = function (event) {
        activeLight.translation[2] = event.target.value;
    }

    document.getElementById("active-light-btn").onclick = function () {
        let e = document.getElementById("active-light-select");
        let activeShapeName = e.options[e.selectedIndex].value;

        setActiveLight(lights[activeShapeName]);
    }

    //light color pickers
    document.getElementById("diffuse-color").oninput = function (event) {
        activeLight.diffuseColor = hexToRGB(event.target.value);
        activeLight.adjustFragColor()
    }

    document.getElementById("specular-color").oninput = function (event) {
        activeLight.specularColor = hexToRGB(event.target.value);
        activeLight.adjustFragColor()
    }

    document.getElementById("ambient-color").oninput = function (event) {
        ambientColor = hexToRGB(event.target.value);
    }

    //shininess
    document.getElementById("shininess").onchange = function (event) {
        activeLight.shininess = event.target.value;
    }

    // object loading
    document.querySelector("#file-input").onchange = function () {
        var selectedFiles = this.files;
        if (selectedFiles.length == 0) {
            alert('Error : No file selected');
            return;
        }
        var firstFile = selectedFiles[0]; // picking the first file from the selected ones
        if(firstFile.name.indexOf(".obj")==-1)
        {
            alert('Error: invalid file type');
            this.value='';
            return;
        }
        readTextFromFile(firstFile);
    }

    document.getElementById("active-object-btn").onclick = function (e) {
        var e = document.getElementById("active-object-select");
        var name = e.options[e.selectedIndex].value;
        var span = document.getElementById("current-object");
        activeObjShape = shapes[name];
        span.innerHTML = activeObjShape.id;
        console.log("active:", activeObjShape);
        
    }

    setLoadTextureListener();

    render();
}

function addNewShape(shape) {
    shapes[shape.id] = shape;
    setActiveShape(shape);

    // add select option of the new shape
    var opt = document.createElement('option');
    opt.value = shape.id;
    opt.innerHTML = shape.id;
    document.getElementById("active-shape-select").appendChild(opt);
}

function addNewShapeForTexture(shape) {
    var opt = document.createElement('option');
    opt.value = shape.id;
    opt.innerHTML = shape.id;
    document.getElementById("active-object-select").appendChild(opt);
    var span = document.getElementById("current-object");
    span.innerHTML = shape.id;
    activeObjShape = shape;
}
function setLoadTextureListener() {
    // setting listeners for both buttons, they will load different texture at different locations
    document.getElementById('file-loader').onchange = function () {
        var selectedFiles = this.files;
        if (selectedFiles.length == 0) {
            alert('Error : No file selected');
            return;
        }
        var firstFile = selectedFiles[0];
        readImageFromFile(firstFile, textureCount++);
    }
}

function readImageFromFile(file, textureNumber) {
    var reader = new FileReader();
    reader.addEventListener('load', function (e) {
        var imgRawData = e.target.result;
        var texture = loadTexture(gl, imgRawData, textureNumber);
        activeObjShape.hasTexture = true;
        activeObjShape.textureData = textureNumber;
        clearFileInput("file-loader")
    });

    reader.addEventListener('error', function () {
        alert('File error happened!');
    });

    reader.readAsDataURL(file);
}

function loadTexture(gl, dataRaw, activeTextureNumber) {
    // using the offsets like gl.TEXTURE+0 or gl.TEXTURE1+1 etc to load different textures in different memory locations
    gl.activeTexture(gl.TEXTURE0 + activeTextureNumber);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, srcFormat, srcType, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = dataRaw;

    return texture;
}


function readTextFromFile(file) {
    var reader = new FileReader(); // creating the object that will help us read the file
    // setting a listener that will catch the 'load' event of reader functions		
    reader.addEventListener('load', function (e) {
        // when the contents are loaded --- execute all of these actions
        var text = e.target.result;
        var v = text.split("\n").filter(x => x[0] == 'v' && x[1] == ' ');
        var vn = text.split("\n").filter(x => x[0] == 'v' && x[1] == 'n');
        var vt = text.split("\n").filter(x => x[0] == 'v' && x[1] == 't');
        var f = text.split("\n").filter(x => x[0] == 'f');

        v = v.map(x => x.slice(3).split(" "));
        v = v.map(x => x.map(y => parseFloat(y)));
        for (let i = 0; i < v.length; i++) {
            v[i].push(1)
        }

        vn = vn.map(x => x.slice(3).split(" "));
        vn = vn.map(x => x.map(y => parseFloat(y)));

        vt = vt.map(x => x.slice(3).split(" "));
        vt = vt.map(x => x.map(y => parseFloat(y)));
        
        for (let i = 0; i < vt.length; i++)  vt[i].pop()

        f = f.map(x => x.slice(2).split(" "));
        f = f.map(x => x.map(y => y.split("/").map(z => parseFloat(z) - 1)));

        console.log(v);
        console.log(vt);
        console.log(vn);
        console.log(f);
        var objectModel = new ObjShape(v, vt, vn, f);
        shapes[objectModel.id] = objectModel;

        activeObjShape = objectModel;

        // add select option of the new shape
        addNewShapeForTexture(objectModel)


        addNewShape(objectModel)
        clearFileInput("file-input")
    });
    // listener for errors that may occur
    reader.addEventListener('error', function () {
        alert('File error happened!');
    });
    // the readAsText function will get the plain text from the file
    reader.readAsText(file); // when the function will complete execution, the 'load' event will fire
}

function addThreeShapes() {
    let cube = new Cube();
    cube.translation[0] -= 1;
    addNewShape(cube);

    let cone = new Cone();
    cone.translation[0] += 1;
    addNewShape(cone);

    let pyramid = new Pyramid();
    pyramid.translation[1] += 1;
    addNewShape(pyramid);
}

function setActiveShape(shape) {
    activeShape = shape;
    document.getElementById('active-shape').innerHTML = shape.id;

    let translateX = document.getElementById("translateX");
    let translateY = document.getElementById("translateY");
    let translateZ = document.getElementById("translateZ");

    let scaleX = document.getElementById("scaleX");
    let scaleY = document.getElementById("scaleY");
    let scaleZ = document.getElementById("scaleZ");

    translateX.value = activeShape.translation[0]
    translateY.value = activeShape.translation[1]
    translateZ.value = activeShape.translation[2]

    scaleX.value = activeShape.scaling[0]
    scaleY.value = activeShape.scaling[1]
    scaleZ.value = activeShape.scaling[2]
}

function addLightSource(pos, color) {
    let light = new LightSource(color, color)
    light.translation = pos;

    lights[light.id] = light

    // add selection option for the current light source
    let activeLightSelect = document.getElementById("active-light-select")
    let opt = document.createElement('option');
    opt.value = light.id;
    opt.innerHTML = light.id;
    activeLightSelect.appendChild(opt)
    setActiveLight(light)
}

function setActiveLight(lightSource) {
    activeLight = lightSource;
    document.getElementById('active-light').innerHTML = activeLight.id;

    let translateX = document.getElementById("translateX-light");
    let translateY = document.getElementById("translateY-light");
    let translateZ = document.getElementById("translateZ-light");

    let diffColorPicker = document.getElementById("diffuse-color");

    let specColorPicker = document.getElementById("specular-color");

    let shininessSlider = document.getElementById("shininess");

    translateX.value = activeLight.translation[0]
    translateY.value = activeLight.translation[1]
    translateZ.value = activeLight.translation[2]

    diffColorPicker.value = intRGB_ToHex(activeLight.diffuseColor[0], activeLight.diffuseColor[1], activeLight.diffuseColor[2]);

    specColorPicker.value = intRGB_ToHex(activeLight.specularColor[0], activeLight.specularColor[1], activeLight.specularColor[2]);

    shininessSlider.value = activeLight.shininess;
}
function clearFileInput(id) {
    var oldInput = document.getElementById(id);

    var newInput = document.createElement("input");

    newInput.type = "file";
    newInput.id = oldInput.id;
    newInput.name = oldInput.name;
    newInput.className = oldInput.className;
    newInput.style.cssText = oldInput.style.cssText;
    newInput.onchange = oldInput.onchange;
    // TODO: copy any other relevant attributes 

    oldInput.parentNode.replaceChild(newInput, oldInput);
}
function render() {
    gl.clearColor(28 / 255, 17 / 255, 80 / 255, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // get diffuse/specular light colors of each light source
    let diffuseColor = [];
    let specularColor = [];
    let lightPos = [];
    let shininess1 = [];
    for (let lightId in lights) {
        let currLight = lights[lightId]

        Array.prototype.push.apply(diffuseColor, currLight.diffuseColor)
        Array.prototype.push.apply(specularColor, currLight.specularColor)
        Array.prototype.push.apply(lightPos, currLight.translation)
        shininess1.push(currLight.shininess);
    }

    // set projection, modelView matrices
    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fov, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // light
    gl.uniform3fv(ambientColorLoc, ambientColor);
    gl.uniform3fv(diffuseColorLoc, diffuseColor);
    gl.uniform3fv(specularColorLoc, specularColor);

    gl.uniform1fv(shininessLoc, shininess1);
    gl.uniform3fv(viewPosLoc, eye)
    gl.uniform3fv(lightPosLoc, lightPos);

    // render shapes
    for (let shapeName in shapes) {
        let currShape = shapes[shapeName];
        //console.log("name:", shapeName)
        //console.log(currShape)
        currShape.draw(program);
    }

    // render light sources
    gl.uniform3fv(ambientColorLoc, [1, 1, 1]);
    gl.uniform3fv(lightPosLoc, [0, 0, 0]);

    for (let name in lights) {
        let currLightSource = lights[name]
        currLightSource.draw(program)
    }

    requestAnimFrame(render);
}