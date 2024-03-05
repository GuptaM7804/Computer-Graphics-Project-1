import buildingShaderSrc from './building.vert.js';
import flatShaderSrc from './flat.vert.js';
import fragmentShaderSrc from './fragment.glsl.js';

var gl;

var layers = null;

var modelMatrix;
var projectionMatrix;
var viewMatrix;

var currRotate = 0;
var currZoom = 0;
var currProj = 'perspective';

/*
    Vertex shader with normals
*/
class BuildingProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, buildingShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        // TODO: set attrib and uniform locations
        this.normalLoc = gl.getAttribLocation(this.program, 'normal');
        this.modelLoc = gl.getUniformLocation(this.program, 'uModel');
        this.projectionLoc = gl.getUniformLocation(this.program, 'uProjection');
        this.viewLoc = gl.getUniformLocation(this.program, 'uView');
        this.posAttribLoc = gl.getAttribLocation(this.program, 'position');
        this.colorLoc = gl.getUniformLocation(this.program, 'uColor');
    }

    use() {
        gl.useProgram(this.program);
    }
}

/*
    Vertex shader with uniform colors
*/
class FlatProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, flatShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        // TODO: set attrib and uniform locations
        this.modelLoc = gl.getUniformLocation(this.program, 'uModel');
        this.projectionLoc = gl.getUniformLocation(this.program, 'uProjection');
        this.viewLoc = gl.getUniformLocation(this.program, 'uView');
        this.posAttribLoc = gl.getAttribLocation(this.program, 'position');
        this.colorLoc = gl.getUniformLocation(this.program, 'uColor');
    }

    use() {
        gl.useProgram(this.program);
    }
}


/*
    Collection of layers
*/
class Layers {
    constructor() {
        this.layers = {};
        this.centroid = [0,0,0];
    }

    addBuildingLayer(name, vertices, indices, normals, color){
        var layer = new BuildingLayer(vertices, indices, normals, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    addLayer(name, vertices, indices, color) {
        var layer = new Layer(vertices, indices, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    removeLayer(name) {
        delete this.layers[name];
    }

    draw() {
        for(var layer in this.layers) {
            this.layers[layer].draw(this.centroid);
        }
    }

    
    getCentroid() {
        var sum = [0,0,0];
        var numpts = 0;
        for(var layer in this.layers) {
            numpts += this.layers[layer].vertices.length/3;
            for(var i=0; i<this.layers[layer].vertices.length; i+=3) {
                var x = this.layers[layer].vertices[i];
                var y = this.layers[layer].vertices[i+1];
                var z = this.layers[layer].vertices[i+2];
    
                sum[0]+=x;
                sum[1]+=y;
                sum[2]+=z;
            }
        }
        return [sum[0]/numpts,sum[1]/numpts,sum[2]/numpts];
    }
}

/*
    Layers without normals (water, parks, surface)
*/
class Layer {
    constructor(vertices, indices, color) {
        this.vertices = vertices;
        this.indices = indices;
        this.color = color;
    }

    init() {
        // TODO: create program, set vertex and index buffers, vao
        this.flatLayer = new FlatProgram();
        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
        this.LayerVao = createVAO(gl, this.flatLayer.posAttribLoc, this.vertexBuffer);
    }

    draw(centroid) {
        // TODO: use program, update model matrix, view matrix, projection matrix
        this.flatLayer.use();
        updateModelMatrix(centroid);
        updateProjectionMatrix();
        updateViewMatrix(centroid);
        // TODO: set uniforms
        gl.uniform4fv(this.flatLayer.colorLoc, this.color);
        gl.uniformMatrix4fv(this.flatLayer.modelLoc, false, new Float32Array(modelMatrix));
        gl.uniformMatrix4fv(this.flatLayer.projectionLoc, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.flatLayer.viewLoc, false, new Float32Array(viewMatrix));
        // TODO: bind vao, bind index buffer, draw elements
        gl.bindVertexArray(this.LayerVao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
    }
}

/*
    Layer with normals (building)
*/
class BuildingLayer extends Layer {
    constructor(vertices, indices, normals, color) {
        super(vertices, indices, color);
        this.normals = normals;
    }

    init() {
        // TODO: create program, set vertex, normal and index buffers, vao
        this.buildingLayer = new BuildingProgram();
        this.normalBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.normals));
        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
        this.LayerVao = createVAO(gl, this.buildingLayer.posAttribLoc, this.vertexBuffer, this.buildingLayer.normalLoc, this.normalBuffer);
    }

    draw(centroid) {
        // TODO: use program, update model matrix, view matrix, projection matrix
        this.buildingLayer.use();
        updateModelMatrix(centroid);
        updateProjectionMatrix();
        updateViewMatrix(centroid);
        // TODO: set uniforms
        gl.uniform4fv(this.buildingLayer.colorLoc, this.color);
        gl.uniformMatrix4fv(this.buildingLayer.modelLoc, false, new Float32Array(modelMatrix));
        gl.uniformMatrix4fv(this.buildingLayer.projectionLoc, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.buildingLayer.viewLoc, false, new Float32Array(viewMatrix));
        // TODO: bind vao, bind index buffer, draw elements
        gl.bindVertexArray(this.LayerVao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
    }
}

/*
    Event handlers
*/
window.updateRotate = function() {
    currRotate = parseInt(document.querySelector("#rotate").value);
}

window.updateZoom = function() {
    currZoom = parseFloat(document.querySelector("#zoom").value);
}

window.updateProjection = function() {
    currProj = document.querySelector("#projection").value;
}

/*
    File handler
*/
window.handleFile = function(e) {
    var reader = new FileReader();
    reader.onload = function(evt) {
        // TODO: parse JSON
        var parsed = JSON.parse(evt.target.result);
        for(var layer in parsed){
            switch (layer) {
                // TODO: add to layers
                case 'buildings':
                    layers.addBuildingLayer('buildings', parsed[layer]['coordinates'], parsed[layer]['indices'], parsed[layer]['normals'], parsed[layer]['color']);
                    break;
                case 'water':
                    layers.addLayer('water', parsed[layer]['coordinates'], parsed[layer]['indices'], parsed[layer]['color']);
                    break;
                case 'parks':
                    layers.addLayer('parks', parsed[layer]['coordinates'], parsed[layer]['indices'], parsed[layer]['color']);
                    break;
                case 'surface':
                    layers.addLayer('surface', parsed[layer]['coordinates'], parsed[layer]['indices'], parsed[layer]['color']);
                    break;
                default:
                    break;
            }
        }
    }
    reader.readAsText(e.files[0]);
}

/*
    Update transformation matrices
*/
function updateModelMatrix(centroid) {
    // TODO: update model matrix
    var first = translateMatrix(-centroid[0], -centroid[1], -centroid[2]);
    var rotate = rotateZMatrix(currRotate * Math.PI/180.0);
    var second = translateMatrix(centroid[0], centroid[1], centroid[2]);

    modelMatrix = multiplyArrayOfMatrices([first, rotate, second]);
}

function updateProjectionMatrix() {
    // TODO: update projection matrix
    var aspect = window.innerWidth /  window.innerHeight;
    if (currProj == 'perspective') {
        projectionMatrix = perspectiveMatrix(45.0 * Math.PI / 180.0, aspect, 1, 30000);
    } else {
        var zoom = 4000 - (currZoom/100.0) * 4000 + 200;
        projectionMatrix = orthographicMatrix(-aspect * zoom, aspect * zoom, -zoom, zoom, 0, 30000);
    }
}

function updateViewMatrix(centroid){
    // TODO: update view matrix
    // TIP: use lookat function
    var zoom = 4000 - (currZoom/100.0) * 4000 + 200;
    var eyePos = add(centroid, [zoom, zoom, zoom])
    viewMatrix = lookAt(eyePos, centroid, [0,0,1]);
}

/*
    Main draw function (should call layers.draw)
*/
function draw() {

    gl.clearColor(190/255, 210/255, 215/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    layers.draw();

    requestAnimationFrame(draw);

}

// Variables to track mouse movement
var isMouseDown = false;
var prevMouseX = 0;
var prevMouseY = 0;

// Event handler for mouse down event
window.onmousedown = function(event) {
    isMouseDown = true;
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;
}

// Event handler for mouse up event
window.onmouseup = function(event) {
    isMouseDown = false;
}

// Event handler for mouse move event
window.onmousemove = function(event) {
    if (isMouseDown) {
        var deltaX = event.clientX - prevMouseX;
        var deltaY = event.clientY - prevMouseY;

        // Update rotate slider based on horizontal mouse movement
        var rotateSlider = document.querySelector("#rotate");
        var newRotate = parseInt(rotateSlider.value) + deltaX;
        newRotate = Math.min(Math.max(newRotate, 0), 360); // Ensure the value stays within the range [0, 360]
        rotateSlider.value = newRotate;
        updateRotate();

        // Update zoom slider based on vertical mouse movement
        var zoomSlider = document.querySelector("#zoom");
        var newZoom = parseFloat(zoomSlider.value) + deltaY;
        newZoom = Math.min(Math.max(newZoom, 1), 100); // Ensure the value stays within the range [1, 100]
        zoomSlider.value = newZoom;
        updateZoom();

        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
    }
}


/*
    Initialize everything
*/
function initialize() {

    var canvas = document.querySelector("#glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl2");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    layers = new Layers();

    window.requestAnimationFrame(draw);

}


window.onload = initialize;