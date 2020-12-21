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
import { ComPort } from "@danchitnis/comport";
import WebGLplot, { ColorRGBA, WebglPolar } from "webgl-plot";
import { SimpleSlider } from "@danchitnis/simple-slider";
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
        wglp = new WebGLplot(canv);
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
//# sourceMappingURL=Echo.js.map