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
        this.hasTexture = false;
        this.textureCord = [];
    }

    update() {
        if (this.isRotating) {
            this.theta[this.rotAxis] += 1.0;
        }
    }

    draw(program) {
        // vertex array attribute buffer
        let vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        let vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        // normal buffer
        let nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);

        let vNormal = gl.getAttribLocation(program, "vNormal")
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        // color buffer
        let cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW);

        var cPosition = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(cPosition);

        var hasTextureLocation = gl.getUniformLocation(program, 'hasTexture');
        gl.uniform1f(hasTextureLocation, Number(this.hasTexture));

        if (this.hasTexture) {
            var tcBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, tcBuffer);
            gl.bufferData( gl.ARRAY_BUFFER, flatten(this.textureCord), gl.STATIC_DRAW );
            var tcAttributeLocation = gl.getAttribLocation( program, 'vTextureCoord' );
            gl.vertexAttribPointer( tcAttributeLocation, 2, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( tcAttributeLocation);
    
            var textureDataLocation = gl.getUniformLocation(program, 'textureData');
            gl.uniform1i(textureDataLocation, this.textureData);

        }
        
        // uniforms
        let thetaLoc = gl.getUniformLocation(program, "theta");
        let transLoc = gl.getUniformLocation(program, "translation");
        let scaleLoc = gl.getUniformLocation(program, "scaling");


        this.update();
        gl.uniform3fv(thetaLoc, this.theta);
        gl.uniform3fv(transLoc, this.translation);
        gl.uniform3fv(scaleLoc, this.scaling);

        gl.drawArrays(gl.TRIANGLES, 0, this.points.length);
    }

    remove() {
        // remove shape from active shape select options on page
        let select = document.getElementById("active-shape-select");
        for (let i = 0; i < select.length; i++) {
            if (select.options[i].value == this.id)
                select.remove(i);
        }
        select = document.getElementById("active-object-select");
        for (let i = 0; i < select.length; i++) {
            if (select.options[i].value == this.id)
                select.remove(i);
        }
        this.constructor.count--;
        shapes[this.id] = null;
        delete shapes[this.id];
    }


}