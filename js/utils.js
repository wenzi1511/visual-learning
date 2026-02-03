import { state } from './state.js';

export const getAddr = () => "0x" + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

export function createPath(d, hasArrow, color = "#94a3b8", width = "2", dashed = false) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", width);
    path.setAttribute("fill", "none");
    if (dashed) path.setAttribute("stroke-dasharray", "4, 4");
    if (hasArrow) path.setAttribute("marker-end", "url(#arrow)");
    state.dom.svgLayer.appendChild(path);
}

export function drawStraightArrow(sId, tId, yOffset = 0) {
    const sEl = document.getElementById(sId);
    const tEl = document.getElementById(tId);
    if (!sEl || !tEl) return;

    const cRect = state.dom.pzContainer.getBoundingClientRect();
    const sRect = sEl.getBoundingClientRect();
    const tRect = tEl.getBoundingClientRect();

    // Centers for direction check
    const sCx = sRect.left + sRect.width / 2;
    const tCx = tRect.left + tRect.width / 2;
    const movingRight = (tCx > sCx);

    const scale = state.scale;

    // Apply offset to BOTH start and end Y
    const y1 = (sRect.top + sRect.height / 2 - cRect.top) / scale + yOffset;
    const y2 = (tRect.top + tRect.height / 2 - cRect.top) / scale + yOffset;

    const gap = 5 / scale;
    const arrowLen = 10;

    let x1, x2;

    if (movingRight) {
        x1 = (sRect.right - cRect.left) / scale;
        x2 = (tRect.left - cRect.left) / scale - gap - arrowLen;
    } else {
        x1 = (sRect.left - cRect.left) / scale;
        x2 = (tRect.right - cRect.left) / scale + gap + arrowLen;
    }

    createPath(`M ${x1} ${y1} L ${x2} ${y2}`, true);
}

export function drawCLLReturnArrow(sId, tId) {
    const sEl = document.getElementById(sId);
    const tEl = document.getElementById(tId);
    if (!sEl || !tEl) return;

    const cRect = state.dom.pzContainer.getBoundingClientRect();
    const sRect = sEl.getBoundingClientRect();
    const tRect = tEl.getBoundingClientRect();
    const scale = state.scale;

    const sx = (sRect.right - cRect.left) / scale;
    const sy = (sRect.top + sRect.height / 2 - cRect.top) / scale;

    const tx = (tRect.left - cRect.left) / scale;
    const ty = (tRect.top + tRect.height / 2 - cRect.top) / scale;

    const drop = 80;
    const buffer = 30;
    const gap = 5 / scale;
    const arrowLen = 10;

    const d = `M ${sx} ${sy} 
               L ${sx + buffer} ${sy} 
               L ${sx + buffer} ${sy + drop} 
               L ${tx - buffer} ${sy + drop} 
               L ${tx - buffer} ${ty} 
               L ${tx - gap - arrowLen} ${ty}`;

    createPath(d, true);
}

export function drawLine(sId, tId, hasArrow, color = "#94a3b8", width = "2", dashed = false) {
    const sEl = document.getElementById(sId);
    const tEl = document.getElementById(tId);
    if (!sEl || !tEl) return;

    const sW = sEl.offsetWidth, sH = sEl.offsetHeight;
    const tW = tEl.offsetWidth, tH = tEl.offsetHeight;

    const sx = sEl.offsetLeft + sW / 2;
    const sy = sEl.offsetTop + sH / 2;
    const tx = tEl.offsetLeft + tW / 2;
    const ty = tEl.offsetTop + tH / 2;

    const angle = Math.atan2(ty - sy, tx - sx);
    const r = 27; // Circle Radius approx

    const x1 = sx + r * Math.cos(angle);
    const y1 = sy + r * Math.sin(angle);
    const x2 = tx - r * Math.cos(angle);
    const y2 = ty - r * Math.sin(angle);

    createPath(`M ${x1} ${y1} L ${x2} ${y2}`, hasArrow, color, width, dashed);
}
