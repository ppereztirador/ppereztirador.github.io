(function () {
    'use strict';

    /**
     * This code is inspired by Googles Serial Api example
     * https://codelabs.developers.google.com/codelabs/web-serial/
     *
     * Danial Chitnis 2020
     */
    class ComPort extends EventTarget {
        constructor() {
            super();
            this.strRX = "";
        }
        async disconnect() {
            if (this.port) {
                if (this.reader) {
                    await this.reader.cancel();
                    await this.inputDone.catch((e) => { console.log(e); });
                    this.reader = null;
                    this.inputDone = null;
                }
                if (this.outputStream) {
                    await this.outputStream.getWriter().close();
                    await this.outputDone.catch((e) => { console.log(e); });
                    this.outputStream = null;
                    this.outputDone = null;
                }
                await this.port.close();
                this.log("\nport is now closed!\n");
            }
        }
        async connectSerialApi(baudrate) {
            // CODELAB: Add code to request & open port here.
            // - Request a port and open a connection.
            this.log("Requesting port");
            this.port = await navigator.serial.requestPort();
            // - Wait for the port to open.
            this.log("Openning port");
            await this.port.open({ baudRate: baudrate });
            this.log("Port is now open 🎉");
            // CODELAB: Add code to read the stream here.
            const decoder = new TextDecoderStream();
            this.inputDone = this.port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;
            const encoder = new TextEncoderStream();
            this.outputDone = encoder.readable.pipeTo(this.port.writable);
            this.outputStream = encoder.writable;
            this.reader = inputStream.getReader();
            this.readLoop();
        }
        async connect(baudrate) {
            // CODELAB: Add connect code here.
            try {
                await this.connectSerialApi(baudrate);
                console.log("here2 🥗");
            }
            catch (error) {
                this.log("Error 😢: " + error + "\n");
            }
        }
        async readLoop() {
            // CODELAB: Add read loop here.
            while (true) {
                try {
                    const { value, done } = await this.reader.read();
                    if (value) {
                        this.procInput(value);
                    }
                    if (done) {
                        console.log('[readLoop] DONE', done);
                        this.reader.releaseLock();
                        break;
                    }
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        procInput(str) {
            this.strRX = this.strRX + str;
            const linesRX = this.strRX.split("\n");
            if (linesRX.length > 1) {
                for (let i = 0; i < linesRX.length - 1; i++) {
                    const event = new CustomEvent('rx', { detail: linesRX[i] });
                    this.dispatchEvent(event);
                }
                // save the reminder of the input line
                this.strRX = linesRX[linesRX.length - 1];
            }
        }
        log(str) {
            const event = new CustomEvent("rx-msg", { detail: str });
            this.dispatchEvent(event);
        }
        addEventListener(eventType, listener) {
            super.addEventListener(eventType, listener);
        }
        async writeToStream(line) {
            // CODELAB: Write to output stream
            const writer = this.outputStream.getWriter();
            //console.log('[SEND]', line);
            await writer.write(line + '\n');
            writer.releaseLock();
        }
        sendLine(line) {
            this.writeToStream(line);
        }
    }

    class ColorRGBA {
        constructor(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
    }

    /**
     * Baseline class
     */
    class WebglBaseLine {
        /**
         * @internal
         */
        constructor() {
            this.scaleX = 1;
            this.scaleY = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            this.loop = false;
            this._vbuffer = 0;
            this._prog = 0;
            this._coord = 0;
            this.visible = true;
            this.intensity = 1;
        }
    }

    class WebglPolar extends WebglBaseLine {
        constructor(c, numPoints) {
            super();
            this.webglNumPoints = numPoints;
            this.numPoints = numPoints;
            this.color = c;
            this.intenisty = 1;
            this.xy = new Float32Array(2 * this.webglNumPoints);
            this._vbuffer = 0;
            this._prog = 0;
            this._coord = 0;
            this.visible = true;
            this.offsetTheta = 0;
        }
        /**
         * @param index: index of the line
         * @param theta : angle in deg
         * @param r : radius
         */
        setRtheta(index, theta, r) {
            //const rA = Math.abs(r);
            //const thetaA = theta % 360;
            const x = r * Math.cos((2 * Math.PI * (theta + this.offsetTheta)) / 360);
            const y = r * Math.sin((2 * Math.PI * (theta + this.offsetTheta)) / 360);
            //const index = Math.round( ((theta % 360)/360) * this.numPoints );
            this.setX(index, x);
            this.setY(index, y);
        }
        getTheta(index) {
            //return Math.tan
            return 0;
        }
        getR(index) {
            //return Math.tan
            return Math.sqrt(Math.pow(this.getX(index), 2) + Math.pow(this.getY(index), 2));
        }
        setX(index, x) {
            this.xy[index * 2] = x;
        }
        setY(index, y) {
            this.xy[index * 2 + 1] = y;
        }
        getX(index) {
            return this.xy[index * 2];
        }
        getY(index) {
            return this.xy[index * 2 + 1];
        }
    }

    /**
     * Author Danial Chitnis 2019
     *
     * inspired by:
     * https://codepen.io/AzazelN28
     * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
     */
    /**
     * The main class for the webgl-plot library
     */
    class WebGLPlot {
        /**
         * Create a webgl-plot instance
         * @param canv - the HTML canvas in which the plot appears
         *
         * @example
         * ```typescript
         * const canv = dcoument.getEelementbyId("canvas");
         * const webglp = new WebGLplot(canv);
         * ```
         */
        constructor(canv) {
            const devicePixelRatio = window.devicePixelRatio || 1;
            // set the size of the drawingBuffer based on the size it's displayed.
            canv.width = canv.clientWidth * devicePixelRatio;
            canv.height = canv.clientHeight * devicePixelRatio;
            const webgl = canv.getContext("webgl", {
                antialias: true,
                transparent: false,
            });
            this.lines = [];
            this.webgl = webgl;
            this.gScaleX = 1;
            this.gScaleY = 1;
            this.gXYratio = 1;
            this.gOffsetX = 0;
            this.gOffsetY = 0;
            // Enable the depth test
            webgl.enable(webgl.DEPTH_TEST);
            // Clear the color and depth buffer
            webgl.clear(webgl.COLOR_BUFFER_BIT || webgl.DEPTH_BUFFER_BIT);
            // Set the view port
            webgl.viewport(0, 0, canv.width, canv.height);
        }
        /**
         * updates and redraws the content of the plot
         */
        update() {
            const webgl = this.webgl;
            this.lines.forEach((line) => {
                if (line.visible) {
                    webgl.useProgram(line._prog);
                    const uscale = webgl.getUniformLocation(line._prog, "uscale");
                    webgl.uniformMatrix2fv(uscale, false, new Float32Array([
                        line.scaleX * this.gScaleX,
                        0,
                        0,
                        line.scaleY * this.gScaleY * this.gXYratio,
                    ]));
                    const uoffset = webgl.getUniformLocation(line._prog, "uoffset");
                    webgl.uniform2fv(uoffset, new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY]));
                    const uColor = webgl.getUniformLocation(line._prog, "uColor");
                    webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);
                    webgl.bufferData(webgl.ARRAY_BUFFER, line.xy, webgl.STREAM_DRAW);
                    webgl.drawArrays(line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
                }
            });
        }
        clear() {
            // Clear the canvas  //??????????????????
            //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
            this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);
        }
        /**
         * adds a line to the plot
         * @param line - this could be any of line, linestep, histogram, or polar
         *
         * @example
         * ```typescript
         * const line = new line(color, numPoints);
         * wglp.addLine(line);
         * ```
         */
        addLine(line) {
            line._vbuffer = this.webgl.createBuffer();
            this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
            this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy, this.webgl.STREAM_DRAW);
            const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
         gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;
            // Create a vertex shader object
            const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);
            // Attach vertex shader source code
            this.webgl.shaderSource(vertShader, vertCode);
            // Compile the vertex shader
            this.webgl.compileShader(vertShader);
            // Fragment shader source code
            const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;
            const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
            this.webgl.shaderSource(fragShader, fragCode);
            this.webgl.compileShader(fragShader);
            line._prog = this.webgl.createProgram();
            this.webgl.attachShader(line._prog, vertShader);
            this.webgl.attachShader(line._prog, fragShader);
            this.webgl.linkProgram(line._prog);
            this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
            line._coord = this.webgl.getAttribLocation(line._prog, "coordinates");
            this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
            this.webgl.enableVertexAttribArray(line._coord);
            this.lines.push(line);
        }
        /**
         * Change the WbGL viewport
         * @param a
         * @param b
         * @param c
         * @param d
         */
        viewport(a, b, c, d) {
            this.webgl.viewport(a, b, c, d);
        }
    }

    /**
     * Simple Slide
     *
     * by Danial Chitnis
     * Feb 2020
     */
    class SimpleSlider extends EventTarget {
        /**
         *
         * @param div - The id of the div which the slider is going to be placed
         * @param min - The minimum value for the slider
         * @param max - The maximum value for the slider
         * @param n - number of divisions within the value range, 0 for continuos
         *
         * @example
         * ```javascript
         * slider = new SimpleSlider("slider", 0, 100, 0);
         * ```
         */
        constructor(div, min, max, n) {
            super();
            this.sliderWidth = 0;
            this.handleOffset = 0;
            this.pxMin = 0;
            this.pxMax = 0;
            this.active = false;
            this.currentX = 0;
            this.initialX = 0;
            this.handlePos = 0;
            this.enable = true;
            /**
             * Current value of the slider
             * @default half of the value range
             */
            this.value = -1;
            /**
             * maximum value
             * @default 100
             */
            this.valueMax = 100;
            /**
             * minimum value for the slider
             * @default 0
             */
            this.valueMin = 0;
            /**
             * number of divisions in the value range
             * @default 0
             */
            this.valueN = 0;
            this.valueMax = max;
            this.valueMin = min;
            this.valueN = n;
            this.makeDivs(div);
            this.init();
            this.handleToCentre();
            this.divHandle.addEventListener("mousedown", (e) => {
                const x = e.clientX;
                if (this.enable) {
                    this.dragStart(x);
                }
            });
            this.divMain.addEventListener("mousemove", (e) => {
                const x = e.clientX;
                this.drag(e, x);
            });
            this.divMain.addEventListener("mouseup", () => {
                this.dragEnd();
            });
            this.divMain.addEventListener("mouseleave", () => {
                this.dragEnd();
            });
            this.divBarL.addEventListener("mousedown", (e) => {
                if (this.enable) {
                    const x = e.clientX;
                    this.translateN(x);
                }
            });
            this.divBarR.addEventListener("mousedown", (e) => {
                if (this.enable) {
                    const x = e.clientX;
                    this.translateN(x);
                }
            });
            this.divHandle.addEventListener("touchstart", (e) => {
                const x = e.touches[0].clientX;
                this.dragStart(x);
            });
            this.divMain.addEventListener("touchmove", (e) => {
                const x = e.touches[0].clientX;
                this.drag(e, x);
            });
            this.divMain.addEventListener("touchend", () => {
                this.dragEnd();
            });
        }
        dragStart(x) {
            this.initialX = x - this.handlePos - this.handleOffset;
            this.active = true;
            this.dispatchEvent(new CustomEvent("drag-start"));
        }
        drag(e, x) {
            if (this.active) {
                e.preventDefault();
                this.currentX = x - this.initialX;
                this.translateN(this.currentX);
                this.value = this.getPositionValue();
                this.dispatchEvent(new CustomEvent("update"));
            }
        }
        dragEnd() {
            this.active = false;
            this.dispatchEvent(new CustomEvent("drag-end"));
        }
        /*-----------------------------------------------------------*/
        translateN(xPos) {
            this.translate(xPos);
            if (this.valueN > 0) {
                let val = this.getPositionValue();
                const step = (this.valueMax - this.valueMin) / (this.valueN - 1);
                val = Math.round(val / step) * step;
                this.setValue(val);
            }
        }
        translate(xPos) {
            this.handlePos = xPos - this.handleOffset;
            switch (true) {
                case this.handlePos < this.pxMin: {
                    this.handlePos = this.pxMin;
                    break;
                }
                case this.handlePos > this.pxMax: {
                    this.handlePos = this.pxMax;
                    break;
                }
                default: {
                    this.divHandle.style.left = (this.handlePos - this.handleOffset).toString() + "px";
                    this.divBarL.style.width = (this.handlePos - this.handleOffset).toString() + "px";
                }
            }
        }
        getPositionValue() {
            const innerValue = (this.handlePos - this.pxMin) / this.sliderWidth;
            return (this.valueMax - this.valueMin) * innerValue + this.valueMin;
        }
        /**
         * Sets the value of the slider on demand
         * @param val - the value of the slider
         */
        setValue(val) {
            const valRel = (val - this.valueMin) / (this.valueMax - this.valueMin);
            const newPos = valRel * this.sliderWidth + 2 * this.handleOffset;
            this.translate(newPos);
            this.value = this.getPositionValue();
            this.dispatchEvent(new CustomEvent("update"));
        }
        init() {
            const divMainWidth = parseFloat(getComputedStyle(this.divMain).getPropertyValue("width"));
            const handleWidth = parseFloat(getComputedStyle(this.divHandle).getPropertyValue("width"));
            const handlePad = parseFloat(getComputedStyle(this.divHandle).getPropertyValue("border-left-width"));
            this.handleOffset = handleWidth / 2 + handlePad;
            this.handlePos = parseFloat(getComputedStyle(this.divHandle).left) + this.handleOffset;
            this.divBarL.style.left = this.handleOffset.toString() + "px";
            this.divBarR.style.left = this.handleOffset.toString() + "px";
            this.sliderWidth = divMainWidth - 2 * this.handleOffset;
            this.divBarL.style.width = (this.handlePos - this.handleOffset).toString() + "px";
            this.divBarR.style.width = this.sliderWidth.toString() + "px";
            this.pxMin = this.handleOffset;
            this.pxMax = this.pxMin + this.sliderWidth;
            if (this.value == -1) {
                this.handleToCentre();
            }
            else {
                this.setValue(this.value);
            }
        }
        handleToCentre() {
            const centre = (this.valueMax - this.valueMin) / 2 + this.valueMin;
            this.setValue(centre);
        }
        /**
         * Resize the slider
         *
         * @example
         * ```javascript
         *  window.addEventListener("resize", () => {
         *    slider.resize();
         *  });
         * ```
         */
        resize() {
            this.init();
            this.setValue(this.value);
        }
        /**
         * Change the state of the slider
         * @param state enable state of the slider
         */
        setEnable(state) {
            this.enable = state;
            if (this.enable) {
                this.divHandle.style.backgroundColor = "darkslategrey";
                this.divBarL.style.backgroundColor = "lightskyblue";
                this.divBarR.style.backgroundColor = "lightgray";
            }
            else {
                this.divHandle.style.backgroundColor = "lightgray";
                this.divBarL.style.backgroundColor = "gray";
                this.divBarR.style.backgroundColor = "gray";
            }
        }
        /**
         * Sets the status of the debug mode
         * @param en - enable value true/false
         */
        setDebug(en) {
            if (en) {
                this.divHandle.style.zIndex = "0";
                this.divMain.style.border = "solid red 1px";
            }
            else {
                this.divHandle.style.zIndex = "2";
                this.divMain.style.border = "none";
            }
        }
        /**
         *
         * @param eventName
         * @param listener
         */
        addEventListener(eventName, listener) {
            super.addEventListener(eventName, listener);
        }
        makeDivs(mainDiv) {
            this.divMain = document.getElementById(mainDiv);
            this.divMain.className = "simple-slider";
            this.divHandle = document.createElement("div");
            this.divHandle.id = "handle";
            this.divHandle.className = "simple-slider-handle";
            this.divBarL = document.createElement("div");
            this.divBarL.id = "barL";
            this.divBarL.className = "simple-slider-barL";
            this.divBarR = document.createElement("div");
            this.divBarR.id = "barR";
            this.divBarR.className = "simple-slider-barR";
            this.divMain.append(this.divHandle);
            this.divMain.append(this.divBarL);
            this.divMain.append(this.divBarR);
        }
    }

    /**
     * Benchtop LiDAR Demo
     *
     * Author: Danial Chitnis
     * January 2020
     *
     * Please upload the sketch before running this code
     * chrome://flags/#enable-experimental-web-platform-features
     *
     */
    {
        const canv = document.getElementById("plot");
        let numPoints = 200;
        let rScale = 0.2;
        let wglp;
        let lineForward;
        let lineBackward;
        let lineCursor;
        let lineBorder;
        let port;
        let slider;
        let pScale;
        const btConnect = document.getElementById("btConnect");
        const btStop = document.getElementById("btStop");
        const btStart = document.getElementById("btStart");
        const btSim = document.getElementById("btSim");
        const pLog = document.getElementById("pLog");
        let resizeId;
        window.addEventListener("resize", () => {
            clearTimeout(resizeId);
            resizeId = setTimeout(doneResizing, 100);
            slider.resize();
        });
        createUI();
        init();
        log("Ready...\n");
        function newFrame() {
            wglp.gScaleX = rScale;
            wglp.gScaleY = rScale;
            wglp.update();
            window.requestAnimationFrame(newFrame);
        }
        window.requestAnimationFrame(newFrame);
        btConnect.addEventListener("click", () => {
            port = new ComPort();
            port.connect(9600);
            port.addEventListener("rx", dataRX);
            port.addEventListener("rx-msg", dataRX);
        });
        btStop.addEventListener("click", () => {
            port.disconnect();
        });
        btStart.addEventListener("click", () => {
            sendLine();
        });
        btSim.addEventListener("click", () => {
            init();
            runSim();
        });
        function sendLine() {
            port.sendLine("a");
        }
        function log(str) {
            const str1 = str.replace(/(?:\r\n|\r|\n)/g, "<br>");
            const str2 = str1.replace(/(?:\t)/g, "&nbsp&nbsp");
            pLog.innerHTML = pLog.innerHTML + str2;
        }
        function dataRX(e) {
            log(e.detail + "\n");
            const detail = e.detail.split(",");
            const dir = parseInt(detail[0]);
            const deg = parseInt(detail[1]);
            const rad = parseInt(detail[2]);
            update(dir, deg / 10, rad);
        }
        function init() {
            slider.addEventListener("update", () => {
                pScale.innerHTML = "Scale = " + slider.value.toPrecision(2);
                rScale = 1 / slider.value;
            });
            const devicePixelRatio = window.devicePixelRatio || 1;
            const numX = Math.round(canv.clientWidth * devicePixelRatio);
            const numY = Math.round(canv.clientHeight * devicePixelRatio);
            const lineColor = new ColorRGBA(0.9, 0.9, 0.1, 1);
            lineForward = new WebglPolar(lineColor, numPoints);
            lineForward.loop = false;
            lineBackward = new WebglPolar(new ColorRGBA(0.1, 0.9, 0.9, 1), numPoints);
            lineBackward.loop = false;
            lineCursor = new WebglPolar(new ColorRGBA(0.9, 0.9, 0.9, 1), 2);
            lineBorder = new WebglPolar(new ColorRGBA(0.9, 0.9, 0.9, 1), numPoints);
            lineBorder.loop = true;
            wglp = new WebGLPlot(canv);
            //wglp.offsetX = -1;
            wglp.gXYratio = numX / numY;
            //line.linespaceX(-1, 2  / numX);
            wglp.addLine(lineForward);
            wglp.addLine(lineBackward);
            wglp.addLine(lineCursor);
            wglp.addLine(lineBorder);
            for (let i = 0; i < lineForward.numPoints; i++) {
                const theta = (i * 360) / lineForward.numPoints;
                const r = 0;
                //const r = 1;
                lineForward.setRtheta(i, theta, r);
                lineBackward.setRtheta(i, theta, r);
                lineBorder.setRtheta(i, theta, 1);
            }
        }
        function update(dir, deg, rad) {
            //line.offsetTheta = 10*noise;
            const theta = deg;
            const index = Math.round(theta / 1.8);
            //preR form previous update
            const r = rad / 500;
            if (dir == 0) {
                lineForward.setRtheta(index, theta, r);
            }
            else {
                lineBackward.setRtheta(index, theta, r);
            }
            lineCursor.setRtheta(0, 0, 0);
            lineCursor.setRtheta(1, theta, 1);
        }
        function createUI() {
            slider = new SimpleSlider("slider", 0.1, 10, 0);
            pScale = document.getElementById("scale");
        }
        function doneResizing() {
            wglp.viewport(0, 0, canv.width, canv.height);
            wglp.gXYratio = canv.width / canv.height;
            //init();
        }
        function runSim() {
            let i = 0;
            let theta = 0;
            let dir = 0;
            const T = 100; //ms
            let id = setInterval(() => {
                update(dir, theta * 1.8, i);
                if (i > 200) {
                    theta = 400 - i;
                    dir = 1;
                }
                else {
                    theta = i;
                    dir = 0;
                }
                i === 400 ? clearInterval(id) : i++;
            }, T);
        }
    }

}());
