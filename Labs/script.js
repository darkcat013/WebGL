"use strict"

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

var ambientColorLoc, diffuseColorLoc, specularColorLoc;
var lightPosLoc;
var viewPosLoc;
var ambientColor = [0.25, 0.25, 0.25];
var diffuseColor = [1, 0.25, 0.5];
var specularColor = [1, 0.25, 0.5];

var activeLight;

function getRandomColor() {
    return vec4(Math.random(), Math.random(), Math.random(), 1.0)
}

function subArrays(a, b) {
    let c = []

    for (let i = 0; i < a.length; i++) {
        c.push(a[i] - b[i]);
    }

    return c;
}

function hexToRGB(hex) {
    var R = hex.slice(1, 3);
    var G = hex.slice(3, 5);
    var B = hex.slice(5, 7);
    return vec3(parseInt(R, 16) / 255, parseInt(G, 16) / 255, parseInt(B, 16) / 255);
}

function intToHex(integer) {
    var str = parseInt(integer*255).toString(16);
    return str.length == 1 ? "0" + str : str;
};

function to_rgb(r, g, b) { return "#" + intToHex(r) + intToHex(g) + intToHex(b); }

class Shape {
    constructor() {
        this.constructor.count++;
        this.id = this.constructor.name + this.constructor.count

        this.theta = [0, 0, 0]
        this.translation = [0, 0, 0];
        this.scaling = [1, 1, 1];
        this.rotAxis = 0;
        this.isRotating = false;
        this.points = []
        this.colors = []
        this.normals = []
    }

    update() {
        if (this.isRotating) {
            this.theta[this.rotAxis] += 1.0;
        }
    }

    draw(program) {
        // vertex array attribute buffer
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        // normal buffer
        var nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);

        var vNormal = gl.getAttribLocation(program, "vNormal")
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        // color buffer
        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW);

        var cPosition = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(cPosition);

        // uniforms
        var thetaLoc = gl.getUniformLocation(program, "theta");
        var transLoc = gl.getUniformLocation(program, "translation");
        var scaleLoc = gl.getUniformLocation(program, "scaling");


        this.update();
        gl.uniform3fv(thetaLoc, this.theta);
        gl.uniform3fv(transLoc, this.translation);
        gl.uniform3fv(scaleLoc, this.scaling);

        gl.drawArrays(gl.TRIANGLES, 0, this.points.length);
    }

    remove() {
        // remove shape from active shape select options on page
        var select = document.getElementById("active-shape-select");
        for (var i = 0; i < select.length; i++) {
            if (select.options[i].value == this.id)
                select.remove(i);
        }
        this.constructor.count--;
        shapes[this.id] = null;
        delete shapes[this.id];
    }


}

class Cube extends Shape {
    static count = 0;

    constructor() {
        super();

        this.setVertices()
    }

    setVertices() {
        var vertices = [
            vec4(-0.35, -0.35, 0.35, 1.0),
            vec4(-0.35, 0.35, 0.35, 1.0),
            vec4(0.35, 0.35, 0.35, 1.0),
            vec4(0.35, -0.35, 0.35, 1.0),
            vec4(-0.35, -0.35, -0.35, 1.0),
            vec4(-0.35, 0.35, -0.35, 1.0),
            vec4(0.35, 0.35, -0.35, 1.0),
            vec4(0.35, -0.35, -0.35, 1.0)
        ];

        const quad = (a, b, c, d, normals) => {
            var indices = [a, b, c, a, c, d];
            var color = getRandomColor();
            for (let i = 0; i < indices.length - 3; ++i) {
                this.points.push(vertices[indices[i]]);
                this.colors.push(color);
                Array.prototype.push.apply(this.normals, normals)
            }
            color = getRandomColor();
            for (let i = 3; i < indices.length; ++i) {
                this.points.push(vertices[indices[i]]);
                this.colors.push(color);
                Array.prototype.push.apply(this.normals, normals)
            }
        }

        quad(1, 0, 3, 2, [0, 0, 1]); // front face
        quad(2, 3, 7, 6, [1, 0, 0]); // right
        quad(3, 0, 4, 7, [0, -1, 0]); // bottom
        quad(6, 5, 1, 2, [0, 1, 0]); // up
        quad(4, 5, 6, 7, [0, 0, -1]); // back
        quad(5, 4, 0, 1, [-1, 0, 0]); // left
    }
}

class Cone extends Shape {
    static count = 0;

    constructor(n = 15) {
        super();

        this.nBase = n;
        this.setVertices();
    }

    setVertices() {
        this.points = []
        this.colors = []

        let R = 0.35;
        let apex = vec4(0, 0.5, 0, 1);
        let baseCenter = vec4(0, -0.5, 0, 1);
        let baseVertices = []
        let n = this.nBase;

        // generate base vertices
        for (let i = 0; i < n; i++) {
            let alpha = i * 2.0 * Math.PI / n;
            let currVertex = vec4(baseCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            baseVertices.push(currVertex);
        }
        //connect first and last triangle from the base
        baseVertices.push(baseVertices[0]);

        for (let i = 0; i < baseVertices.length - 1; i++) {
            let color = getRandomColor();
            // connect to base center
            this.points.push(baseVertices[i])
            this.points.push(baseVertices[i + 1])
            this.points.push(baseCenter)

            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            // connect to apex
            this.points.push(baseVertices[i]);
            this.points.push(baseVertices[i + 1]);
            this.points.push(apex);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            var p1 = vec3(baseVertices[i]);
            var p2 = vec3(baseVertices[i + 1]);
            var p3 = vec3(apex);

            var v = subArrays(p2, p1);
            var w = subArrays(p3, p1);

            var nx = v[1] * w[2] - v[2] * w[1];
            var ny = v[2] * w[0] - v[0] * w[2];
            var nz = v[0] * w[1] - v[1] - w[0];

            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
        }
    }
}

class Pyramid extends Cone {
    static count = 0;

    constructor() {
        super(4)
    }
}

class Cylinder extends Shape {
    static count = 0;

    constructor(n = 15) {
        super();

        this.nBase = n;
        this.setVertices();
    }

    setVertices() {
        this.points = []
        this.colors = []

        let R = 0.35;
        let topCenter = vec4(0, 0.5, 0, 1);
        let bottomCenter = vec4(0, -0.5, 0, 1);
        let topVertices = [];
        let bottomVertices = [];
        let n = this.nBase;

        // generate bottom and top vertices
        for (let i = 0; i < n; i++) {
            let alpha = i * 2.0 * Math.PI / n;
            let currVertex = vec4(bottomCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            bottomVertices.push(currVertex);

            currVertex = vec4(topCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            topVertices.push(currVertex);
        }

        bottomVertices.push(bottomVertices[0]);
        topVertices.push(topVertices[0]);

        for (let i = 0; i < bottomVertices.length - 1; i++) {
            let color = getRandomColor();
            // connect to bottom center
            this.points.push(bottomVertices[i]);
            this.points.push(bottomVertices[i + 1]);
            this.points.push(bottomCenter);

            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);


            color = getRandomColor();
            // connect to top center
            this.points.push(topVertices[i]);
            this.points.push(topVertices[i + 1]);
            this.points.push(topCenter);

            this.normals.push(vec3(0, 1, 0))
            this.normals.push(vec3(0, 1, 0))
            this.normals.push(vec3(0, 1, 0))

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            //connect bottom to top
            this.points.push(bottomVertices[i])
            this.points.push(bottomVertices[i + 1]);
            this.points.push(topVertices[i]);

            var p1 = vec3(bottomVertices[i]);
            var p2 = vec3(bottomVertices[i + 1]);
            var p3 = vec3(topVertices[i]);

            var v = subArrays(p2, p1);
            var w = subArrays(p3, p1);
            console.log(v, p2, p1)

            var nx = v[1] * w[2] - v[2] * w[1];
            var ny = v[2] * w[0] - v[0] * w[2];
            var nz = v[0] * w[1] - v[1] - w[0];

            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();

            this.points.push(topVertices[i])
            this.points.push(topVertices[i + 1]);
            this.points.push(bottomVertices[i + 1]);

            var p1 = vec3(topVertices[i]);
            var p2 = vec3(topVertices[i + 1]);
            var p3 = vec3(bottomVertices[i + 1]);

            var v = subArrays(p2, p1);
            var w = subArrays(p3, p1);
            console.log(v, p2, p1)

            var nx = v[1] * w[2] - v[2] * w[1];
            var ny = v[2] * w[0] - v[0] * w[2];
            var nz = v[0] * w[1] - v[1] - w[0];

            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);
        }
    }
}
class Sphere extends Shape {
    static count = 0;

    constructor( scale = 1) {
        super()
        this.scaling = [scale, scale, scale]
        this.setVertices()
    }

    setVertices() {
        let radius = 0.40;
        let stackCount = 15;
        let sectorCount = 15;
        let sectorStep = 2 * Math.PI / sectorCount;
        let stackStep = Math.PI / stackCount;
        let lengthInv = 1.0 / radius;

        var vertices = [];
        var normals = [];
        for (let i = 0; i <= stackCount; i++) {
            let stackAngle = Math.PI / 2 - i * stackStep;
            let xy = radius * Math.cos(stackAngle);
            let z = radius * Math.sin(stackAngle);

            for (let j = 0; j <= sectorCount; j++) {
                let sectorAngle = j * sectorStep;

                // vertex position
                let x = xy * Math.cos(sectorAngle);
                let y = xy * Math.sin(sectorAngle);
                vertices.push([x, y, z, 1.0]);

                // normals
                let nx = x * lengthInv;
                let ny = y * lengthInv;
                let nz = z * lengthInv;
                normals.push([nx, ny, nz]);
            }
        }

        for (var i = 0; i < stackCount; i++) {
            var k1 = i * (sectorCount + 1);
            var k2 = k1 + sectorCount + 1;

            for (var j = 0; j < sectorCount; j++, k1++, k2++) {
                if (i != 0) {
                    this.points.push(vertices[k1]);
                    this.points.push(vertices[k2]);
                    this.points.push(vertices[k1 + 1]);

                    this.normals.push(normals[k1])
                    this.normals.push(normals[k2])
                    this.normals.push(normals[k1 + 1])
                    let color = getRandomColor();
                    this.colors.push(color);
                    this.colors.push(color);

                    // this.colors.push(COLORS['white']);
                    this.colors.push(color);
                }

                if (i != stackCount - 1) {
                    this.points.push(vertices[k1 + 1]);
                    this.points.push(vertices[k2]);
                    this.points.push(vertices[k2 + 1]);

                    this.normals.push(normals[k1 + 1])
                    this.normals.push(normals[k2])
                    this.normals.push(normals[k2 + 1])
                    let color = getRandomColor();
                    this.colors.push(color);
                    this.colors.push(color);
                    this.colors.push(color);

                    // this.colors.push(this.color.map(x => x * 0.95));
                }

            }
        }
    }
}

class LightSource extends Sphere {
    static count = 0;

    constructor(diffuseColor = [1, 1, 1], specularColor = [1, 1, 1]) {
        super(0.1);

        this.diffuseColor = diffuseColor;
        this.specularColor = specularColor;
        this.adjustFragColor()
    }

    adjustFragColor() {
        this.color = vec4(this.diffuseColor, 1)
        for (let i = 0; i < this.colors.length; i++) {
            this.colors[i] = this.color;
        }
    }
}

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
    lightPosLoc = gl.getUniformLocation(program, "lightPos")
    viewPosLoc = gl.getUniformLocation(program, "viewPos")

    // Add select options for available shapes
    for (let i = 0; i < shapeTypes.length; i++) {
        var select = document.getElementById("add-shape-select");
        var opt = document.createElement('option');
        opt.value = shapeTypes[i];
        opt.innerHTML = shapeTypes[i];
        select.appendChild(opt);
    }

    //addThreeShapes();
    // Add event listeners for buttons
    document.getElementById("add-shape-btn").onclick = function () {
        var e1 = document.getElementById("add-shape-select");
        var shapeType = e1.options[e1.selectedIndex].value;

        var shape;
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
    }

    document.getElementById("active-shape-btn").onclick = function () {
        var e = document.getElementById("active-shape-select");
        var activeShapeName = e.options[e.selectedIndex].value;

        setActiveShape(shapes[activeShapeName]);
    }

    document.getElementById("remove-shape-btn").onclick = function () {
        activeShape.remove();

        activeShape = shapes[Object.keys(shapes)[0]]
        if (activeShape) document.getElementById("active-shape").innerHTML = activeShape.id
        else document.getElementById("active-shape").innerHTML = "None";
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
        var e = document.getElementById("active-light-select");
        var activeShapeName = e.options[e.selectedIndex].value;

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

function addThreeShapes() {
    var cube = new Cube();
    cube.translation[0] -= 1;
    addNewShape(cube);

    var cone = new Cone();
    cone.translation[0] += 1;
    addNewShape(cone);

    var pyramid = new Pyramid();
    pyramid.translation[1] += 1;
    addNewShape(pyramid);
}

function setActiveShape(shape) {
    activeShape = shape;
    document.getElementById('active-shape').innerHTML = shape.id;

    // change shape slider values
    var translateX = document.getElementById("translateX");
    var translateY = document.getElementById("translateY");
    var translateZ = document.getElementById("translateZ");

    var scaleX = document.getElementById("scaleX");
    var scaleY = document.getElementById("scaleY");
    var scaleZ = document.getElementById("scaleZ");

    translateX.value = activeShape.translation[0]
    translateY.value = activeShape.translation[1]
    translateZ.value = activeShape.translation[2]

    scaleX.value = activeShape.scaling[0]
    scaleY.value = activeShape.scaling[1]
    scaleZ.value = activeShape.scaling[2]
}

function addLightSource(pos, color) {
    var light = new LightSource(color, color)
    light.translation = pos;

    lights[light.id] = light

    // add selection option for the current light source
    var activeLightSelect = document.getElementById("active-light-select")
    var opt = document.createElement('option');
    opt.value = light.id;
    opt.innerHTML = light.id;
    activeLightSelect.appendChild(opt)
    setActiveLight(light)
}

function setActiveLight(lightSource) {
    activeLight = lightSource;
    document.getElementById('active-light').innerHTML = activeLight.id;

    // change shape slider values
    var translateX = document.getElementById("translateX-light");
    var translateY = document.getElementById("translateY-light");
    var translateZ = document.getElementById("translateZ-light");

    // change shape slider values
    var diffColorPicker = document.getElementById("diffuse-color");

    // change shape slider values
    var specColorPicker = document.getElementById("specular-color");

    translateX.value = activeLight.translation[0]
    translateY.value = activeLight.translation[1]
    translateZ.value = activeLight.translation[2]

    diffColorPicker.value = to_rgb(activeLight.diffuseColor[0], activeLight.diffuseColor[1], activeLight.diffuseColor[2]);

    specColorPicker.value =  to_rgb(activeLight.specularColor[0], activeLight.specularColor[1], activeLight.specularColor[2]);
}

function render() {
    gl.clearColor(28 / 255, 17 / 255, 80 / 255, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // get diffuse/specular light colors of each light source
    var diffuseColor = [];
    var specularColor = [];
    var lightPos = [];

    for (let lightId in lights) {
        let currLight = lights[lightId]

        Array.prototype.push.apply(diffuseColor, currLight.diffuseColor)
        Array.prototype.push.apply(specularColor, currLight.specularColor)
        Array.prototype.push.apply(lightPos, currLight.translation)
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