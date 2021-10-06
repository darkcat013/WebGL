"use strict"

var canvas;
var gl;
var program;

var shapes = {};
var shapeTypes = ["Cube", "Cone", "Pyramid", "Cylinder"];

// camera
var near = "0.3";
var far = 3.0;
var radius = 4.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0; // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var activeShape;

function getRandomColor()
{
    return vec4(Math.random(), Math.random(), Math.random(), 1.0)
}

class Shape {
    constructor() {
        this.constructor.count ++;
        this.id = this.constructor.name + this.constructor.count

        this.theta = [0, 0, 0]
        this.translation = [0, 0, 0];
        this.scaling  = [1, 1, 1];
        this.rotAxis = 0;
        this.isRotating = false;
        this.points = []
        this.colors = []
    }

    update() {
        if (this.isRotating) {
            this.theta[this.rotAxis] += 1.0;
        }
    }

    setVertices() {
        throw new Error("You have to implement the method setVertices()")
    }

    setColors() {
        throw new Error("You have to implement the method setColors()")
    }

    draw(program) {
        // vertex array attribute buffer
        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
        
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        // color buffer
        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );

        var cPosition = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0 ,0);
        gl.enableVertexAttribArray(cPosition);

        // uniforms
        var thetaLoc = gl.getUniformLocation(program, "theta");
        var transLoc = gl.getUniformLocation(program, "translation");
        var scaleLoc = gl.getUniformLocation(program, "scaling");


        this.update();
        gl.uniform3fv(thetaLoc, this.theta);
        gl.uniform3fv(transLoc, this.translation);
        gl.uniform3fv(scaleLoc, this.scaling);

      //  console.log("count:",this.points.length)
        gl.drawArrays(gl.TRIANGLES, 0, this.points.length);
    }

    remove() {
        // remove shape from active shape select options on page
        var select = document.getElementById("active-shape-select");
        for (var i=0; i < select.length; i++) {
            if (select.options[i].value == this.id) 
                select.remove(i);
        }

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
            vec4( -0.35, -0.35,  0.35, 1.0 ),
            vec4( -0.35,  0.35,  0.35, 1.0 ),
            vec4(  0.35,  0.35,  0.35, 1.0 ),
            vec4(  0.35, -0.35,  0.35, 1.0 ),
            vec4( -0.35, -0.35, -0.35, 1.0 ),
            vec4( -0.35,  0.35, -0.35, 1.0 ),
            vec4(  0.35,  0.35, -0.35, 1.0 ),
            vec4(  0.35, -0.35, -0.35, 1.0 )
        ];

        const quad = (a, b, c, d) => {
            var indices = [ a, b, c, a, c, d ];
            var color = getRandomColor();
            for (let i = 0; i < indices.length-3; ++i) {
                this.points.push(vertices[indices[i]]);
                this.colors.push(color);
            }
            color = getRandomColor();
            for (let i = 3; i < indices.length; ++i) {
                this.points.push(vertices[indices[i]]);
                this.colors.push(color);
            }
        }

        quad( 1, 0, 3, 2); // front face
        quad( 2, 3, 7, 6); // right
        quad( 3, 0, 4, 7); // bottom
        quad( 6, 5, 1, 2); // up
        quad( 4, 5, 6, 7); // back
        quad( 5, 4, 0, 1); // left
    }
}

class Cone extends Shape {
    static count = 0;

    constructor( n=15) {
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
        for (let i=0; i<n; i++) {
            let alpha = i * 2.0 * Math.PI / n;
            let currVertex = vec4(baseCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            baseVertices.push(currVertex);
        }

        baseVertices.push(baseVertices[0]);
        
        for (let i=0; i < baseVertices.length - 1; i++) {
            let color = getRandomColor();
            // connect to base center
            this.points.push(baseVertices[i])
            this.points.push(baseVertices[i+1])
            this.points.push(baseCenter)

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            // connect to apex
            this.points.push(baseVertices[i]);
            this.points.push(baseVertices[i+1]);
            this.points.push(apex);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);
        }
    }
}

class Pyramid extends Cone {
    static count = 0;

    constructor() {
        super(4)
    }
}

class Cylinder extends Shape{
    static count = 0;

    constructor( n=15) {
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
        for (let i=0; i<n; i++) {
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
        
        for (let i=0; i < bottomVertices.length - 1; i++) {
            let color = getRandomColor();
            // connect to bottom center
            this.points.push(bottomVertices[i]);
            this.points.push(bottomVertices[i+1]);
            this.points.push(bottomCenter);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            // connect to top center
            this.points.push(topVertices[i]);
            this.points.push(topVertices[i+1]);
            this.points.push(topCenter);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            //connect bottom to top
            this.points.push(bottomVertices[i])
            this.points.push(bottomVertices[i+1]);
            this.points.push(topVertices[i]);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();

            this.points.push(topVertices[i])
            this.points.push(topVertices[i+1]);
            this.points.push(bottomVertices[i+1]);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);
        }
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas)

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LEQUAL);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    // Add select options for available shapes
    for (let i = 0; i < shapeTypes.length; i++) {
        var select = document.getElementById("add-shape-select");
        var opt = document.createElement('option');
        opt.value = shapeTypes[i];
        opt.innerHTML = shapeTypes[i];
        select.appendChild(opt);
    }
    
    // Add event listeners for buttons
    document.getElementById("add-shape-btn").onclick = function() {
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
            default:
                console.log("Shape not identified");
        }
        
        addNewShape(shape)
    }

    document.getElementById("active-shape-btn").onclick = function() {
        var e = document.getElementById("active-shape-select");
        var activeShapeName = e.options[e.selectedIndex].value;

        setActiveShape(shapes[activeShapeName]);
    }

    document.getElementById("remove-shape-btn").onclick = function() {
        activeShape.remove();

        activeShape = shapes[Object.keys(shapes)[0]]
        if (activeShape) document.getElementById("active-shape").innerHTML = activeShape.id
        else document.getElementById("active-shape").innerHTML = "None";
     }

    // sliders 
    document.getElementById("translateX").onchange = function(event) {
        activeShape.translation[0] = event.target.value;
    }

    document.getElementById("translateY").onchange = function(event) {
        activeShape.translation[1] = event.target.value;
    }
    
    document.getElementById("translateZ").onchange = function(event) {
        activeShape.translation[2] = event.target.value;
    }

    // scale sliders
    document.getElementById("scaleX").onchange = function(event) {
        activeShape.scaling[0] = event.target.value;
    }

    document.getElementById("scaleY").onchange = function(event) {
        activeShape.scaling[1] = event.target.value;
    }
    
    document.getElementById("scaleZ").onchange = function(event) {
        activeShape.scaling[2] = event.target.value;
    }

    // rotate buttons
    document.getElementById( "xButton" ).onclick = function () {
        activeShape.rotAxis = 0;
    };
    document.getElementById( "yButton" ).onclick = function () {
        activeShape.rotAxis = 1;
    };
    document.getElementById( "zButton" ).onclick = function () {
        activeShape.rotAxis = 2;
    };
    document.getElementById( "toggleRotation" ).onclick = function () {
        activeShape.isRotating = !activeShape.isRotating;
    };


    // sliders for viewing parameters
    document.getElementById("zFarSlider").onchange = function(event) {
        far = event.target.value;
    };
    document.getElementById("zNearSlider").onchange = function(event) {
        near = event.target.value;
    };
    document.getElementById("radiusSlider").onchange = function(event) {
       radius = event.target.value;
    };
    document.getElementById("thetaSlider").onchange = function(event) {
        theta = event.target.value* Math.PI/180.0;
    };
    document.getElementById("phiSlider").onchange = function(event) {
        phi = event.target.value* Math.PI/180.0;
    };
    document.getElementById("aspectSlider").onchange = function(event) {
        aspect = event.target.value;
    };
    document.getElementById("fovSlider").onchange = function(event) {
        fovy = event.target.value;
    };

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

function render() {
    gl.clearColor(232/255, 232/255, 232/255, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set projection, modelView matrices
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
    radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    // render shapes
    for (let shapeName in shapes) {
        let currShape = shapes[shapeName];
        //console.log("name:", shapeName)
        //console.log(currShape)
        currShape.draw(program);
    }
    requestAnimFrame(render);
}