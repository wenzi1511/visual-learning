window.makeDraggable = function (el) {
    if (!el || el.dataset.draggableAttached) return;
    el.dataset.draggableAttached = 'true';
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    el.addEventListener('mousedown', (e) => {
        // Prevent drag if clicking on a specific internal element like a node/tag
        if (e.target.closest('.array-box') || e.target.closest('.stack-item') || e.target.closest('.hashmap-entry')) return;
        isDown = true;
        el.style.cursor = 'grabbing';
        startX = e.pageX - el.offsetLeft;
        startY = e.pageY - el.offsetTop;
        scrollLeft = el.scrollLeft;
        scrollTop = el.scrollTop;
    });
    el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = 'grab'; });
    el.addEventListener('mouseup', () => { isDown = false; el.style.cursor = 'grab'; });
    el.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const y = e.pageY - el.offsetTop;
        const walkX = (x - startX);
        const walkY = (y - startY);
        el.scrollLeft = scrollLeft - walkX;
        el.scrollTop = scrollTop - walkY;
    });
    el.style.cursor = 'grab';
};

// Active slots registry - stores all slot instances
let activeSlots = {};

// Factory functions to create primitives for a specific slot
const createArrayPrimitive = (slotId, slotConfig = {}) => ({
    slotId,
    displayMode: slotConfig.display || 'standard',
    data: [],
    init(vals) {
        this.data = [...vals];
        this.render();
    },
    get(i) { return this.data[i]; },
    set(i, v) { this.data[i] = v; this.render(); },
    swap(i, j) {
        [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
        this.render();
    },
    push(v) {
        this.data.push(v);
        this.render();
    },
    pop() {
        const v = this.data.pop();
        this.render();
        return v;
    },
    highlight(i, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (this.displayMode === 'bar') {
            const boxes = container.querySelectorAll('.array-box-bar');
            if (boxes[i]) {
                if (color) {
                    boxes[i].style.background = color;
                    boxes[i].style.borderColor = color;
                    boxes[i].style.boxShadow = 'none';
                    boxes[i].style.transform = 'scale(1.05)';
                } else {
                    // Default defined user colors
                    boxes[i].style.background = '#0f5132';
                    boxes[i].style.borderColor = '#28d17c';
                    boxes[i].style.boxShadow = 'none';
                    boxes[i].style.transform = 'scale(1)';
                }
            }
        } else {
            const boxes = container.querySelectorAll('.array-box');
            if (boxes[i]) {
                boxes[i].style.backgroundColor = color;
                boxes[i].style.borderColor = color;
            }
        }
    },
    highlightRange(start, end, color) {
        for (let i = start; i <= end; i++) this.highlight(i, color);
    },
    clearHighlights() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (this.displayMode === 'bar') {
            container.querySelectorAll('.array-box-bar').forEach(b => {
                b.style.background = '#0f5132';
                b.style.borderColor = '#28d17c';
                b.style.boxShadow = 'none';
                b.style.transform = 'scale(1)';
            });
        } else {
            container.querySelectorAll('.array-box').forEach(b => {
                b.style.backgroundColor = '';
                b.style.borderColor = '';
            });
        }
    },
    get length() { return this.data.length; },
    getValues() { return [...this.data]; },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.displayMode === 'bar') {
            if (this.data.length === 0) {
                container.innerHTML = '<div>Empty Array</div>';
                return;
            }
            const maxVal = Math.max(...this.data.map(v => Number(v) || 0), 1);
            container.innerHTML = `<div style="display:flex; align-items:flex-end; gap:12px; height:180px; padding-bottom:10px;">` +
                this.data.map((v, i) => {
                    const valNum = Number(v) || 0;
                    // Ensure a minimum height so number doesn't cut off inside, padding takes up space
                    const h = Math.max(36, (valNum / maxVal) * 150);
                    return `<div class="array-cell">
                                <div class="array-box-bar" style="width: 44px; height: ${h}px; background-color: #0f5132; border: 2px solid #28d17c; border-radius: 6px 6px 0 0; border-bottom: none; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; font-weight: bold; font-family: 'Fira Code', monospace; color: white; transition: all 0.3s; box-shadow: none; font-size: 0.95rem; overflow: hidden;">${v}</div>
                                <div class="array-idx">${i}</div>
                            </div>`;
                }).join('') + `</div>`;
        } else {
            container.innerHTML = this.data.map((v, i) =>
                `<div class="array-cell">
                            <div class="array-box">${v}</div>
                            <div class="array-idx">${i}</div>
                        </div>`
            ).join('');
        }
    },
    clone() {
        return { data: [...this.data] };
    },
    restore(state) {
        this.data = [...state.data];
        this.render();
    }
});

const createStackPrimitive = (slotId) => ({
    slotId,
    data: [],
    init(arr) {
        this.data = [...arr];
        this.render();
    },
    push(v) { this.data.push(v); this.render(); },
    pop() { const v = this.data.pop(); this.render(); return v; },
    peek() { return this.data[this.data.length - 1]; },
    isEmpty() { return this.data.length === 0; },
    size() { return this.data.length; },
    getValues() { return [...this.data]; },
    highlight(i, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        const items = container.querySelectorAll('.stack-item');
        if (items[i]) {
            items[i].style.backgroundColor = color;
            items[i].style.borderColor = color;
        }
    },
    clear() { this.data = []; this.render(); },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        container.innerHTML = `<div class="stack-wrapper"><div class="stack-container">` +
            this.data.map(v => `<div class="stack-item">${v}</div>`).join('') +
            `</div></div>`;
    },
    clone() {
        return { data: [...this.data] };
    },
    restore(state) {
        this.data = [...state.data];
        this.render();
    }
});

const createHashmapPrimitive = (slotId) => ({
    slotId,
    data: new Map(),
    put(key, val) {
        this.data.set(key, val);
        this.render();
    },
    init(entries) {
        this.data = new Map(entries);
        this.render();
    },
    get(key) {
        return this.data.get(key);
    },
    has(key) {
        return this.data.has(key);
    },
    remove(key) {
        this.data.delete(key);
        this.render();
    },
    clear() {
        this.data.clear();
        this.render();
    },
    size() {
        return this.data.size;
    },
    getEntries() {
        return [...this.data.entries()];
    },
    highlight(key, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        container.querySelectorAll('.hashmap-row').forEach(row => {
            if (row.dataset.key === String(key)) {
                row.querySelector('.hashmap-key').style.background = color;
                row.querySelector('.hashmap-value').style.background = color;
            }
        });
    },
    clearHighlights() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        container.querySelectorAll('.hashmap-key').forEach(el => el.style.background = '');
        container.querySelectorAll('.hashmap-value').forEach(el => el.style.background = '');
    },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.data.size === 0) {
            container.innerHTML = '<div class="hashmap-wrapper"><div class="hashmap-container"><div class="hashmap-empty">Empty</div></div></div>';
            return;
        }

        const entries = [...this.data.entries()].sort((a, b) => {
            if (typeof a[0] === 'number' && typeof b[0] === 'number') return a[0] - b[0];
            return String(a[0]).localeCompare(String(b[0]));
        });

        let html = `<div class="hashmap-wrapper"><div class="hashmap-container">
                    <div class="hashmap-header">
                        <div class="hashmap-header-cell">Key</div>
                        <div class="hashmap-header-cell">Value</div>
                    </div>`;

        entries.forEach(([key, val]) => {
            html += `<div class="hashmap-row" data-key="${key}">
                        <div class="hashmap-key">${key}</div>
                        <div class="hashmap-value">${val}</div>
                    </div>`;
        });

        container.innerHTML = html + `</div></div>`;
    },
    clone() {
        // Convert Map to array of entries for reliable cloning
        return { entries: [...this.data.entries()] };
    },
    restore(state) {
        // Restore from array of entries
        this.data = new Map(state.entries);
        this.render();
    }
});

const createGridPrimitive = (slotId) => ({
    slotId,
    data: [],
    init(matrix) {
        this.data = matrix.map(row => [...row]);
        this.render();
    },
    get rows() { return this.data.length; },
    get cols() { return this.data.length > 0 ? this.data[0].length : 0; },
    getCell(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return undefined;
        return this.data[r][c];
    },
    setCell(r, c, val) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
        this.data[r][c] = val;
        this.render();
    },
    highlight(r, c, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const cells = container.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            if (parseInt(cell.dataset.row) === r && parseInt(cell.dataset.col) === c) {
                cell.style.backgroundColor = color;
                cell.style.borderColor = color;
                cell.style.boxShadow = `0 4px 20px ${color}66`;
            }
        });
    },
    clearHighlights() {
        this.render();
    },
    getValues() {
        return this.data.map(row => [...row]);
    },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const rows = this.data.length;
        const cols = rows > 0 ? this.data[0].length : 0;
        if (rows === 0 || cols === 0) {
            container.innerHTML = '<div class="grid-wrapper"><div class="grid-container">Empty</div></div>';
            return;
        }
        const maxCellSize = 64;
        const minCellSize = 36;
        const cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(360 / Math.max(rows, cols))));
        const fontSize = cellSize > 44 ? '0.9rem' : '0.7rem';
        const idxSize = '0.65rem';

        // Grid with extra column for row indices and extra row for col indices
        let html = `<div class="grid-wrapper"><div class="grid-container" style="grid-template-columns: 24px repeat(${cols}, ${cellSize}px); grid-template-rows: 20px repeat(${rows}, ${cellSize}px);">`;

        // Top-left corner (empty)
        html += `<div style="width:24px;height:20px;"></div>`;
        // Column headers (j)
        for (let c = 0; c < cols; c++) {
            html += `<div class="grid-idx-header" style="width:${cellSize}px;height:20px;font-size:${idxSize};">${c}</div>`;
        }

        for (let r = 0; r < rows; r++) {
            // Row header (i)
            html += `<div class="grid-idx-header grid-idx-row" style="width:24px;height:${cellSize}px;font-size:${idxSize};">${r}</div>`;
            for (let c = 0; c < cols; c++) {
                const val = this.data[r][c];
                let cellClass = 'grid-cell ';
                let displayVal = val;
                if (val === true) {
                    cellClass += 'cell-true';
                    displayVal = '✓';
                } else if (val === false) {
                    cellClass += 'cell-false';
                    displayVal = '✗';
                } else if (val === 0 || val === '0') {
                    cellClass += 'cell-empty';
                } else {
                    cellClass += 'cell-filled';
                }
                html += `<div class="${cellClass}" data-row="${r}" data-col="${c}" style="width:${cellSize}px;height:${cellSize}px;font-size:${fontSize};">${displayVal}</div>`;
            }
        }
        html += '</div></div>';
        container.innerHTML = html;
    },
    clone() {
        return { data: this.data.map(row => [...row]) };
    },
    restore(state) {
        this.data = state.data.map(row => [...row]);
        this.render();
    }
});

const createQueuePrimitive = (slotId) => ({
    slotId,
    data: [],
    enqueue(v) { this.data.push(v); this.render(); },
    dequeue() { const v = this.data.shift(); this.render(); return v; },
    peek() { return this.data[0]; },
    isEmpty() { return this.data.length === 0; },
    size() { return this.data.length; },
    getValues() { return [...this.data]; },
    init(arr) { this.data = [...arr]; this.render(); },
    highlight(i, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        const items = container.querySelectorAll('.queue-vis-item');
        if (items[i]) {
            items[i].style.backgroundColor = color;
            items[i].style.borderColor = color;
        }
    },
    clearHighlights() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        container.querySelectorAll('.queue-vis-item').forEach(item => {
            item.style.backgroundColor = '';
            item.style.borderColor = '';
        });
    },
    clear() { this.data = []; this.render(); },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        if (this.data.length === 0) {
            container.innerHTML = '<div class="queue-wrapper"><div class="queue-vis-container" style="justify-content:center;color:#64748b;font-style:italic;">Empty</div></div>';
            return;
        }
        container.innerHTML = '<div class="queue-wrapper"><div class="queue-vis-container">' +
            this.data.map(v => `<div class="queue-vis-item">${v}</div>`).join('') +
            '</div></div>';
    },
    clone() {
        return { data: [...this.data] };
    },
    restore(state) {
        this.data = [...state.data];
        this.render();
    }
});

// Pointer primitive (shared across all slots)
const ptrPrimitive = {
    pointers: {},
    set(name, idx) {
        this.pointers[name] = idx;
        this.render();
    },
    get(name) { return this.pointers[name]; },
    remove(name) {
        delete this.pointers[name];
        this.render();
    },
    clear() {
        this.pointers = {};
        this.render();
    },
    render() {
        const container = document.getElementById('ptr-container');
        if (!container) return;
        container.innerHTML = Object.entries(this.pointers)
            .map(([name, idx]) => `<div class="ptr-indicator">${name}=${idx}</div>`)
            .join('');
    },
    clone() {
        return { pointers: { ...this.pointers } };
    },
    restore(state) {
        this.pointers = { ...state.pointers };
        this.render();
    }
};

const createCallstackPrimitive = (slotId) => ({
    slotId,
    frames: [], // Array of { name, args: {}, locals: {}, retVal?: string }
    init() {
        this.frames = [];
        this.render();
    },
    pushFrame(name, args = {}) {
        this.frames.push({ name, args, locals: {} });
        this.render();
    },
    popFrame(retVal) {
        if (this.frames.length > 0) {
            if (retVal !== undefined) {
                this.frames[this.frames.length - 1].retVal = retVal;
                this.render();
            }
            this.frames.pop();
            this.render();
        }
    },
    updateLocal(key, val) {
        if (this.frames.length > 0) {
            this.frames[this.frames.length - 1].locals[key] = val;
            this.render();
        }
    },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.frames.length === 0) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Call Stack Empty</div>';
            return;
        }

        let html = '<div class="callstack-wrapper" style="display:flex;flex-direction:column-reverse;gap:10px;padding:20px;width:100%;align-items:center;min-height:300px;">';

        this.frames.forEach((frame, idx) => {
            const isTop = idx === this.frames.length - 1;
            const opacity = isTop ? '1' : '0.6';
            const border = isTop ? 'border: 2px solid #3b82f6;' : 'border: 1px solid #64748b;';
            const transform = isTop ? 'transform: translateX(0);' : 'transform: translateX(-10px) scale(0.95);';

            let varsHtml = '';
            const allVars = { ...frame.args, ...frame.locals };
            for (const [k, v] of Object.entries(allVars)) {
                varsHtml += `<div style="font-family:\\'Fira Code\\',monospace;font-size:0.85rem;color:#e2e8f0;margin-top:2px;"><span style="color:#94a3b8;">${k}:</span> ${v}</div>`;
            }
            if (Object.keys(allVars).length === 0) {
                varsHtml = `<div style="font-size:0.75rem;color:#64748b;font-style:italic;">No locals</div>`;
            }

            let retHtml = frame.retVal !== undefined ? `<div style="font-family:\\'Fira Code\\',monospace;font-size:0.85rem;color:#10b981;margin-top:6px;border-top:1px dashed #10b981;padding-top:4px;font-weight:bold;">return: ${frame.retVal}</div>` : '';

            html += `
                    <div class="callstack-frame" style="background:linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.8));${border}border-radius:10px;padding:14px;width:85%;max-width:320px;min-width:220px;opacity:${opacity};${transform}box-shadow:0 8px 16px rgba(0,0,0,0.3);transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                        <div style="font-weight:bold;color:#60a5fa;margin-bottom:10px;border-bottom:1px solid rgba(100,116,139,0.5);padding-bottom:6px;font-family:\\'Fira Code\\',monospace;font-size:1rem;letter-spacing:0.5px;">${frame.name}()</div>
                        <div class="callstack-vars">
                            ${varsHtml}
                            ${retHtml}
                        </div>
                    </div>`;
        });

        html += '</div>';
        container.innerHTML = html;
    },
    clone() {
        return { frames: JSON.parse(JSON.stringify(this.frames)) };
    },
    restore(state) {
        this.frames = JSON.parse(JSON.stringify(state.frames));
        this.render();
    }
});

const createRecursionTreePrimitive = (slotId) => ({
    slotId,
    nodes: new Map(),
    rootId: null,
    activeId: null,
    cacheLinks: [],
    nodeCounter: 0,
    stateToNodeMap: new Map(),
    init() {
        this.nodes.clear();
        this.rootId = null;
        this.activeId = null;
        this.cacheLinks = [];
        this.nodeCounter = 0;
        this.stateToNodeMap.clear();
        this.render();
    },
    enterNode(semanticId, label, color = null) {
        const uniqueId = semanticId + '_' + (this.nodeCounter++);
        const newNode = { id: uniqueId, semanticId, label, color, parentId: this.activeId, childrenIds: [], x: 0, y: 0 };

        if (!this.stateToNodeMap.has(semanticId)) {
            this.stateToNodeMap.set(semanticId, uniqueId);
        }

        if (this.activeId && this.nodes.has(this.activeId)) {
            const parent = this.nodes.get(this.activeId);
            newNode.parentId = parent.id;
            if (!parent.childrenIds.includes(uniqueId)) parent.childrenIds.push(uniqueId);
        } else {
            this.rootId = uniqueId;
        }

        this.nodes.set(uniqueId, newNode);
        this.activeId = uniqueId;
        this.render();
    },
    exitNode(statusColor = null) {
        if (this.activeId && this.nodes.has(this.activeId)) {
            const activeNode = this.nodes.get(this.activeId);
            if (statusColor) activeNode.color = statusColor;
            this.activeId = activeNode.parentId;
            this.render();
        }
    },
    cacheHit(semanticId) {
        if (this.activeId && this.stateToNodeMap.has(semanticId)) {
            const targetUniqueId = this.stateToNodeMap.get(semanticId);
            this.cacheLinks.push({ fromId: this.activeId, toId: targetUniqueId });
            const targetNode = this.nodes.get(targetUniqueId);
            if (targetNode && (!targetNode.color || targetNode.color === '#1e293b' || targetNode.color === '')) {
                targetNode.color = '#f59e0b'; // color the cached node orange
            }
            this.render();
        }
    },
    highlight(semanticId, color) {
        if (this.stateToNodeMap.has(semanticId)) {
            const uniqueId = this.stateToNodeMap.get(semanticId);
            const node = this.nodes.get(uniqueId);
            if (node) {
                node.color = color;
                this.render();
            }
        }
    },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.nodes.size === 0 || !this.rootId) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Recursion Tree Empty</div>';
            return;
        }

        let leafCount = 0;
        const nodeWidth = 75; // Increased width to fit 'dist(X, Y)'
        const nodeHeight = 44; // Kept height standard for an oval
        const gapX = 40;
        const gapY = 80;

        const dfs = (id, depth) => {
            const node = this.nodes.get(id);
            if (!node) return;
            if (node.childrenIds.length === 0) {
                node.x = leafCount * (nodeWidth + gapX);
                leafCount++;
            } else {
                let minX = Infinity;
                let maxX = -Infinity;
                node.childrenIds.forEach(cId => {
                    dfs(cId, depth + 1);
                    const childNode = this.nodes.get(cId);
                    if (childNode) {
                        minX = Math.min(minX, childNode.x);
                        maxX = Math.max(maxX, childNode.x);
                    }
                });
                node.x = (minX + maxX) / 2;
            }
            node.y = depth * gapY;
        };

        dfs(this.rootId, 0);

        let minXOut = Infinity, maxXOut = -Infinity, maxYOut = 0;
        this.nodes.forEach(n => {
            minXOut = Math.min(minXOut, n.x);
            maxXOut = Math.max(maxXOut, n.x);
            maxYOut = Math.max(maxYOut, n.y);
        });

        const treeWidth = maxXOut - minXOut;
        const stageWidth = Math.max(treeWidth + 180, 600); // Increased padding to handle wide nodes on edges
        const stageHeight = Math.max(maxYOut + 100, 300);

        // Adjust offset to prevent negative coordinate clipping
        const offsetX = Math.max(90 - minXOut, 0);
        const offsetY = 50;

        let html = `<div class="rt-wrapper" style="position: relative; width: 100%; height: 100%; min-height: 400px; overflow: auto; display: flex; justify-content: center; align-items: flex-start;">
                             <div class="rt-stage" style="position: relative; width: ${stageWidth}px; min-width: 100%; height: ${stageHeight}px; flex-shrink: 0; padding-bottom: 50px;">`;
        html += `<svg style="position: absolute; left: 0; top: 0; width: ${stageWidth}px; min-width: 100%; height: 100%; overflow: visible; pointer-events: none;">`;

        const drawEdge = (id) => {
            const node = this.nodes.get(id);
            if (!node) return '';
            let s = '';
            node.childrenIds.forEach(cId => {
                const child = this.nodes.get(cId);
                if (child) {
                    s += `<line x1="${node.x + offsetX}" y1="${node.y + offsetY}" x2="${child.x + offsetX}" y2="${child.y + offsetY}" stroke="#64748b" stroke-width="2" />`;
                    s += drawEdge(child.id);
                }
            });
            return s;
        };
        html += drawEdge(this.rootId);

        this.cacheLinks.forEach(link => {
            const fromNode = this.nodes.get(link.fromId);
            const toNode = this.nodes.get(link.toId);
            if (fromNode && toNode) {
                html += `<path d="M ${fromNode.x + offsetX} ${fromNode.y + offsetY} Q ${(fromNode.x + toNode.x) / 2 + offsetX} ${(fromNode.y + toNode.y) / 2 - 40 + offsetY} ${toNode.x + offsetX} ${toNode.y + offsetY}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5" fill="none" />`;
            }
        });

        html += `</svg>`;

        this.nodes.forEach(node => {
            const isActive = this.activeId === node.id;
            const bg = node.color ? node.color : (isActive ? '#3b82f6' : '#1e293b');
            const border = isActive ? '#a78bfa' : '#64748b';
            const glow = isActive ? `box-shadow: 0 0 20px ${bg}; transform: translate(-50%, -50%) scale(1.15); border-width: 3px; z-index: 10;` : 'box-shadow: 0 4px 6px rgba(0,0,0,0.3); transform: translate(-50%, -50%); z-index: 2;';

            html += `<div class="rt-node" style="position:absolute; left:${node.x + offsetX}px; top:${node.y + offsetY}px; width:${nodeWidth}px; height:${nodeHeight}px; background:${bg}; border:2px solid ${border}; border-radius:12px; color:white; display:flex; align-items:center; justify-content:center; text-align:center; white-space:nowrap; font-family:'Fira Code', monospace; font-size:0.8rem; font-weight:bold; ${glow} transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);" title="ID: ${node.id}">${node.label}</div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
        if (window.makeDraggable && container.firstElementChild) window.makeDraggable(container.firstElementChild);
    },
    clone() {
        const nodesClone = [];
        this.nodes.forEach(v => nodesClone.push(JSON.parse(JSON.stringify(v))));
        return {
            nodesArray: nodesClone,
            rootId: this.rootId,
            activeId: this.activeId,
            cacheLinks: JSON.parse(JSON.stringify(this.cacheLinks)),
            nodeCounter: this.nodeCounter,
            stateToNodeMap: Array.from(this.stateToNodeMap.entries())
        };
    },
    restore(state) {
        this.nodes.clear();
        if (state.nodesArray) state.nodesArray.forEach(v => this.nodes.set(v.id, v));
        this.rootId = state.rootId;
        this.activeId = state.activeId;
        this.cacheLinks = state.cacheLinks || [];
        this.nodeCounter = state.nodeCounter || 0;
        this.stateToNodeMap = new Map(state.stateToNodeMap || []);
        this.render();
    }
});

// Build slots from JSON config
function buildSlots(slots) {
    const slotsContainer = document.getElementById('slots-container');
    // Keep the input panel where it is (in left column)
    const inputPanel = document.getElementById('input-panel');
    const leftColumn = document.querySelector('.left-column');

    // Safety check: if input panel was previously moved to slots container (by buggy code), move it back
    if (inputPanel && inputPanel.parentElement !== leftColumn) {
        leftColumn.appendChild(inputPanel);
    }

    slotsContainer.innerHTML = '';
    activeSlots = {};

    if (!slots || slots.length === 0) {
        slotsContainer.style.gridTemplateColumns = '1fr';
        return;
    }

    // Set grid columns based on number of slots
    const totalCols = Math.min(slots.length, 3);
    slotsContainer.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;

    let draggedPanel = null;

    slots.forEach((slot, idx) => {
        const slotId = slot.id || `slot${idx}`;
        const slotType = slot.type || 'array';
        const slotLabel = slot.label || slotType.charAt(0).toUpperCase() + slotType.slice(1);

        // Create the slot wrapper UI
        const slotDiv = document.createElement('div');
        slotDiv.className = 'panel';
        slotDiv.id = `slot-panel-${slotId}`;

        // Make specific slot types start full width by default (e.g. recursion trees which get wide)
        if (slotType === 'recursion-tree' || slotType === 'array' || slotType === 'grid') {
            slotDiv.style.flex = "1 1 auto";
            slotDiv.style.width = "100%";
        }

        slotDiv.innerHTML = `
                    <h3 draggable="true" style="cursor: grab; user-select: none;" onmousedown="this.style.cursor='grabbing'" onmouseup="this.style.cursor='grab'">${slotLabel}</h3>
                    <div id="slot-${slotId}-content" class="slot-content"></div>
                `;

        // Panel Drag & Drop logic
        const header = slotDiv.querySelector('h3');
        header.addEventListener('dragstart', (e) => {
            draggedPanel = slotDiv;
            e.dataTransfer.effectAllowed = 'move';
            // Make the drag image the entire panel, not just the text
            e.dataTransfer.setDragImage(slotDiv, 20, 20);
            // Add slight opacity to the original panel being dragged
            setTimeout(() => slotDiv.style.opacity = '0.5', 0);
        });

        slotDiv.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            if (slotDiv !== draggedPanel && draggedPanel) {
                slotDiv.style.border = '2px dashed #00e0ff';
            }
        });

        slotDiv.addEventListener('dragleave', (e) => {
            slotDiv.style.border = '';
        });

        slotDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            slotDiv.style.border = '';
            if (!draggedPanel || draggedPanel === slotDiv) return;

            const allPanels = [...slotsContainer.querySelectorAll('.panel')];
            const draggedIdx = allPanels.indexOf(draggedPanel);
            const targetIdx = allPanels.indexOf(slotDiv);

            // Reorder in DOM
            if (draggedIdx < targetIdx) {
                slotsContainer.insertBefore(draggedPanel, slotDiv.nextSibling);
            } else {
                slotsContainer.insertBefore(draggedPanel, slotDiv);
            }
        });

        slotDiv.addEventListener('dragend', () => {
            slotDiv.style.opacity = '1';
            draggedPanel = null;
        });

        slotsContainer.appendChild(slotDiv);

        // Create primitive instance based on type
        let primitive;
        switch (slotType) {
            case 'array':
                primitive = createArrayPrimitive(slotId, slot);
                break;
            case 'stack':
                primitive = createStackPrimitive(slotId);
                break;
            case 'callstack':
                primitive = createCallstackPrimitive(slotId);
                break;
            case 'recursion-tree':
                primitive = createRecursionTreePrimitive(slotId);
                break;
            case 'hashmap':
            case 'hashmap-simple':
                primitive = createHashmapPrimitive(slotId);
                break;
            case 'grid':
                primitive = createGridPrimitive(slotId);
                break;
            case 'queue':
                primitive = createQueuePrimitive(slotId);
                break;
            case 'hashset':
            case 'hashset-simple':
                primitive = createHashSetPrimitive(slotId);
                break;
            case 'trie':
                primitive = createTriePrimitive(slotId);
                break;
            case 'sll':
                primitive = createSLLPrimitive(slotId);
                break;
            case 'dll':
                primitive = createDLLPrimitive(slotId);
                break;
            case 'deque':
                primitive = createDequePrimitive(slotId);
                break;
            case 'union-find':
                primitive = createUnionFindPrimitive(slotId);
                break;
            case 'binary-tree':
                primitive = createBinaryTreePrimitive(slotId);
                break;
            case 'heap':
                primitive = createHeapPrimitive(slotId);
                break;
            case 'graph':
                primitive = createGraphPrimitive(slotId);
                break;
            case 'callstack':
                primitive = createCallstackPrimitive(slotId);
                break;
            case 'recursion-tree':
                primitive = createRecursionTreePrimitive(slotId);
                break;
            default:
                primitive = createArrayPrimitive(slotId);
        }

        activeSlots[slotId] = primitive;
    });

    // Cleanup existing pointer container if it exists
    const existingPtr = document.getElementById('ptr-container');
    if (existingPtr) {
        existingPtr.remove();
    }

    // Add pointer container after all slots
    const ptrPanel = document.createElement('div');
    ptrPanel.id = 'ptr-container';
    ptrPanel.className = 'ptr-container-global';
    // Insert after the slots container
    if (slotsContainer.nextSibling) {
        slotsContainer.parentElement.insertBefore(ptrPanel, slotsContainer.nextSibling);
    } else {
        slotsContainer.parentElement.appendChild(ptrPanel);
    }
}

const createHashSetPrimitive = (slotId) => ({
    slotId,
    data: new Set(),
    add(val) {
        this.data.add(val);
        this.render();
    },
    has(val) {
        return this.data.has(val);
    },
    delete(val) {
        // Alias for remove
        this.remove(val);
    },
    remove(val) {
        this.data.delete(val);
        this.render();
    },
    clear() {
        this.data.clear();
        this.render();
    },
    size() {
        return this.data.size;
    },
    getValues() {
        return [...this.data];
    },
    init(vals) {
        this.data = new Set(vals);
        this.render();
    },
    highlight(val, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        container.querySelectorAll('.hashset-tag').forEach(tag => {
            if (tag.innerText === String(val)) {
                tag.style.background = color;
                tag.style.transform = 'scale(1.1)';
                tag.style.boxShadow = `0 0 15px ${color}`;
            }
        });
    },
    clearHighlights() {
        this.render();
    },
    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.data.size === 0) {
            container.innerHTML = '<div class="hashset-wrapper"><div class="hashset-container"><div class="hashset-empty">Empty</div></div></div>';
            return;
        }

        const items = [...this.data].sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b));
        });

        let html = `<div class="hashset-wrapper"><div class="hashset-container" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 10px;">`;

        items.forEach(val => {
            html += `<div class="hashset-tag" style="
                        background: rgb(12, 71, 97);
                        border: 2px solid rgb(56, 180, 218);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 20px;
                        font-weight: 600;
                        font-family: 'Fira Code', monospace;
                        box-shadow: 0 4px 12px rgba(56, 180, 218, 0.3);
                        transition: all 0.2s ease;
                        cursor: default;">${val}</div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    },
    clone() {
        return { data: new Set(this.data) };
    },
    restore(state) {
        this.data = new Set(state.data);
        this.render();
    }
});

// ============ UNION FIND PRIMITIVE ============

const createUnionFindPrimitive = (slotId) => ({
    slotId,
    data: [], // Array of { val, parent, rank, x, y, id }

    init(size) {
        size = Math.max(1, Math.min(size, 20));
        this.data = [];
        for (let i = 0; i < size; i++) {
            this.data.push({
                val: i,
                parent: i,
                rank: 0,
                x: 0,
                y: 0,
                id: `uf-${this.slotId}-${i}`
            });
        }
        this.render();
    },

    find(i) {
        if (i < 0 || i >= this.data.length) return -1;
        // Path Compression
        const path = [];
        let curr = i;
        while (this.data[curr].parent !== curr) {
            path.push(curr);
            curr = this.data[curr].parent;
        }

        // Compress & highlight logic can be separate or integrated?
        // For simplicity, just compress
        for (const nodeIdx of path) {
            this.data[nodeIdx].parent = curr;
        }

        // Highlight done in render or explicitly called?
        // The main app does highlight. Let's provide a highlight method.
        this.highlightNode(curr, '#10b981'); // Root Green
        path.forEach(idx => this.highlightNode(idx, '#3b82f6')); // Path Blue

        this.render();
        return curr;
    },

    union(i, j) {
        const rootI = this.find(i);
        const rootJ = this.find(j);

        // We re-find inside union, which is fine, highlights will trigger twice but that's okay for visual step-through or auto-step.
        // Actually if we want step-by-step, we might want to separate find and union calls in the script.

        if (rootI !== -1 && rootJ !== -1 && rootI !== rootJ) {
            const nodeI = this.data[rootI];
            const nodeJ = this.data[rootJ];

            if (nodeI.rank < nodeJ.rank) {
                nodeI.parent = rootJ;
            } else if (nodeI.rank > nodeJ.rank) {
                nodeJ.parent = rootI;
            } else {
                nodeJ.parent = rootI;
                nodeI.rank++;
            }
            this.render();
            return true;
        }
        return false;
    },

    highlightNode(idx, color) {
        if (idx < 0 || idx >= this.data.length) return;
        const id = this.data[idx].id;
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const el = container.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.style.backgroundColor = color;
            el.style.borderColor = color;
            el.style.boxShadow = `0 0 8px ${color}`;
            el.style.transform = 'translate(-50%, -50%) scale(1.2)';
        }
    },

    clearHighlights() {
        this.render();
    },

    getValues() {
        return this.data.map(n => n.parent);
    },

    // Layout
    calculateForestLayout() {
        // Group by roots
        const roots = {};
        this.data.forEach(node => {
            let r = node;
            while (r.parent !== r.val) {
                r = this.data[r.parent];
            }
            if (!roots[r.val]) roots[r.val] = [];
            roots[r.val].push(node);
        });

        const rootKeys = Object.keys(roots);
        // Adjust width per tree based on number of nodes in tree? Or simplistic equal width?
        // Let's use simplistic width allocation.
        // Total width ~ 800px (virtual)
        const widthPerTree = 800 / Math.max(1, rootKeys.length);

        rootKeys.forEach((rootKey, i) => {
            const root = this.data[rootKey];
            const treeNodes = roots[rootKey];
            const centerX = (i * widthPerTree) + (widthPerTree / 2) - 400;
            const startY = 40; // Top relative to stage

            root.x = centerX;
            root.y = startY;

            // Direct Children
            const directChildren = treeNodes.filter(n => n.parent === root.val && n.val !== root.val);
            this.assignSubtree(root, directChildren, centerX, startY + 80, widthPerTree);
        });
    },

    assignSubtree(parent, children, x, y, width) {
        if (children.length === 0) return;
        const slice = width / children.length;
        let startX = x - width / 2 + slice / 2;

        children.forEach((child, i) => {
            child.x = startX + i * slice;
            child.y = y;

            const grandChildren = this.data.filter(n => n.parent === child.val && n.val !== child.val);
            this.assignSubtree(child, grandChildren, child.x, y + 80, slice);
        });
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        this.calculateForestLayout();

        // Bounds
        let minX = Infinity, maxX = -Infinity, maxY = 0;
        this.data.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            maxY = Math.max(maxY, n.y);
        });

        const width = Math.max(600, (maxX - minX) + 200);
        const height = Math.max(400, maxY + 100);

        const shiftX = (width / 2); // 0 is center, so shift by half width relative to 0?
        // Our layout assumes 0 is center.
        // So Stage center is (width/2, 0).

        let html = `<div class="uf-wrapper" style="
                    position: relative; 
                    width: 100%; 
                    height: 100%; 
                    min-height: 400px;
                    overflow: auto; 
                ">
                     <div class="uf-stage" style="
                        position: relative; 
                        width: ${width}px; 
                        height: ${height}px;
                        margin: 0 auto;
                    ">`;

        html += `<svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none;">
                    <defs>
                        <marker id="arrow-${this.slotId}" markerWidth="10" markerHeight="7" refX="24" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>`;

        // Edges
        this.data.forEach(node => {
            if (node.parent !== node.val) {
                const parent = this.data[node.parent];
                // x,y are centered around 0. Need to shift to stage coords.
                const x1 = node.x + shiftX;
                const y1 = node.y;
                const x2 = parent.x + shiftX;
                const y2 = parent.y;

                html += `<path d="M ${x1} ${y1} L ${x2} ${y2}" 
                            stroke="#64748b" stroke-width="2" marker-end="url(#arrow-${this.slotId})" />`;
            }
        });
        html += `</svg>`;

        // Nodes
        this.data.forEach(node => {
            const isRoot = node.parent === node.val;
            const bg = '#3d1a78';
            const border = isRoot ? '#a970ff' : '#64748b';
            const glow = isRoot ? '0 0 10px #a970ff' : '0 4px 6px rgba(0,0,0,0.3)';
            const x = node.x + shiftX;
            const y = node.y;

            html += `<div class="uf-node" data-id="${node.id}" title="Rank: ${node.rank}" style="
                        position: absolute;
                        left: ${x}px;
                        top: ${y}px;
                        width: 36px;
                        height: 36px;
                        background: ${bg};
                        border: 2px solid ${border};
                        border-radius: 50%;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Fira Code', monospace;
                        font-weight: bold;
                        font-size: 0.9rem;
                        transform: translate(-50%, -50%);
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        z-index: 2;
                        box-shadow: ${glow};
                        cursor: help;
                    ">${node.val}</div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
        if (window.makeDraggable && container.firstElementChild) window.makeDraggable(container.firstElementChild);
    },

    clone() {
        return { data: JSON.parse(JSON.stringify(this.data)) };
    },

    restore(state) {
        this.data = JSON.parse(JSON.stringify(state.data));
        this.render();
    }
});



// ============ BINARY TREE PRIMITIVE ============

const createBinaryTreePrimitive = (slotId) => ({
    slotId,
    root: null,
    nodesMap: new Map(), // id -> node

    init(vals) {
        // LeetCode style init: [1, 2, 3, null, null, 4, 5]
        if (!vals || vals.length === 0) {
            this.root = null;
            this.render();
            return;
        }

        // Create nodes
        const nodes = vals.map(v =>
            (v === null || v === undefined) ? null : {
                id: `bt-${this.slotId}-${crypto.randomUUID()}`,
                val: v,
                left: null,
                right: null,
                x: 0,
                y: 0
            }
        );

        if (nodes[0]) {
            this.root = nodes[0];
            // Link up
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i]) continue;
                const leftIdx = 2 * i + 1;
                const rightIdx = 2 * i + 2;
                if (leftIdx < nodes.length && nodes[leftIdx]) {
                    nodes[i].left = nodes[leftIdx];
                }
                if (rightIdx < nodes.length && nodes[rightIdx]) {
                    nodes[i].right = nodes[rightIdx];
                }
            }
        } else {
            this.root = null;
        }

        // Refresh map
        this.nodesMap.clear();
        nodes.forEach(n => {
            if (n) this.nodesMap.set(n.id, n);
        });

        this.render();
    },

    // For external access/traversal
    getRoot() {
        return this.root;
    },

    highlight(nodeOrId, color) {
        const id = (typeof nodeOrId === 'string') ? nodeOrId : nodeOrId?.id;
        if (!id) return;

        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        const el = container.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.style.backgroundColor = color;
            if (color) {
                el.style.borderColor = color;
                el.style.boxShadow = `0 0 15px ${color}`;
                // Text color white for better contrast on colored bg
                el.style.color = '#fff';
            } else {
                // Reset
                const isRoot = (this.root && this.root.id === id);
                el.style.backgroundColor = '#1e293b';
                el.style.borderColor = '#64748b';
                el.style.boxShadow = isRoot ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.3)';
                el.style.color = 'white';
            }
        }
    },

    clearHighlights() {
        this.render(); // Simply easier to re-render to clear all
    },

    // Logic ported from js/ds/tree.js renderTree
    calculateLayout() {
        if (!this.root) return { width: 400, height: 300 };

        let leafCount = 0;
        const nodeWidth = 40;
        const gap = 30;
        const levelHeight = 80;
        // We'll store formatted pos on the node itself for this render cycle

        // First pass: calculate x relative to leaf order
        const posMap = new Map(); // node -> {x, depth}

        const calcPos = (node, depth) => {
            if (!node) return;

            let leftX = null;
            let rightX = null;

            if (node.left) {
                calcPos(node.left, depth + 1);
                leftX = node.left.x;
            } else if (node.right) {
                // Missing left, use ghost
                leftX = leafCount * (nodeWidth + gap);
                leafCount++;
            }

            if (node.right) {
                calcPos(node.right, depth + 1);
                rightX = node.right.x;
            } else if (node.left) {
                // Missing right, use ghost
                rightX = leafCount * (nodeWidth + gap);
                leafCount++;
            }

            if (!node.left && !node.right) {
                node.x = leafCount * (nodeWidth + gap);
                leafCount++;
            } else {
                node.x = (leftX + rightX) / 2;
            }
            node.y = depth * levelHeight;
        };

        calcPos(this.root, 0);

        // Dimensions
        const treeWidth = leafCount * (nodeWidth + gap);

        // Center the tree in the view? 
        // We will center it relative to the 0 x-coordinate of the container (width/2)
        // Or just let it start at 0?
        // Let's maximize width usage.

        // Recenter nodes so that root is roughly in middle? 
        // Actually the algo creates x starting from 0.
        // So the tree spans [0, treeWidth].
        // We'll just return these bounds.

        let maxY = 0;
        this.nodesMap.forEach(n => maxY = Math.max(maxY, n.y));

        return { width: Math.max(treeWidth, 400), height: Math.max(maxY + 100, 300), treeWidth };
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (!this.root) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Empty Tree</div>';
            return;
        }

        const { width, height } = this.calculateLayout();

        let minX = Infinity, maxX = -Infinity;
        this.nodesMap.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
        });

        const realTreeWidth = maxX - minX;
        const stageWidth = Math.max(realTreeWidth + 100, 400);
        const stageHeight = Math.max(height + 50, 300);

        const offsetX = (stageWidth / 2) - ((minX + maxX) / 2);
        const offsetY = 40;

        let html = `<div class="bt-wrapper" style="
                    position: relative; 
                    width: 100%; 
                    height: 100%; 
                    min-height: 400px;
                    overflow: auto;
                    display: flex;
                    justify-content: center;
                ">
                     <div class="bt-stage" style="
                        position: relative; 
                        width: ${stageWidth}px;
                        height: ${stageHeight}px;
                        flex-shrink: 0;
                    ">`;

        html += `<svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none;">`;



        const drawEdge = (node) => {
            if (!node) return '';
            let s = '';
            if (node.left) {
                s += `<line x1="${node.x + offsetX}" y1="${node.y + offsetY}" x2="${node.left.x + offsetX}" y2="${node.left.y + offsetY}" stroke="#64748b" stroke-width="2" />`;
                s += drawEdge(node.left);
            }
            if (node.right) {
                s += `<line x1="${node.x + offsetX}" y1="${node.y + offsetY}" x2="${node.right.x + offsetX}" y2="${node.right.y + offsetY}" stroke="#64748b" stroke-width="2" />`;
                s += drawEdge(node.right);
            }
            return s;
        };
        html += drawEdge(this.root);
        html += `</svg>`;

        // Nodes
        const drawNode = (node) => {
            if (!node) return '';
            let s = '';

            const bg = '#1e293b';
            const border = '#64748b';
            const glow = '0 4px 6px rgba(0,0,0,0.3)';

            s += `<div class="bt-node" data-id="${node.id}" style="
                        position: absolute;
                        left: ${node.x + offsetX}px;
                        top: ${node.y + offsetY}px;
                        width: 40px;
                        height: 40px;
                        background: ${bg};
                        border: 2px solid ${border};
                        border-radius: 50%;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Fira Code', monospace;
                        font-weight: bold;
                        font-size: 0.9rem;
                        transform: translate(-50%, -50%);
                        transition: all 0.3s ease;
                        z-index: 2;
                        box-shadow: ${glow};
                    ">${node.val}</div>`;

            s += drawNode(node.left);
            s += drawNode(node.right);
            return s;
        };
        html += drawNode(this.root);

        html += `</div></div>`;
        container.innerHTML = html;
        if (window.makeDraggable && container.firstElementChild) window.makeDraggable(container.firstElementChild);
    },

    clone() {
        // Deep clone logic if needed, simplify for now
        return {};
    },

    restore(state) {
        // Restore logic
        this.render();
    }
});

// ============ HEAP PRIMITIVE ============

const createHeapPrimitive = (slotId) => ({
    slotId,
    data: [], // Array backing
    type: 'min', // 'min' or 'max'

    init(vals, type = 'min', key = null) {
        this.type = type;
        this.key = key; // Optional property key to extract for comparisons
        this.data = [...vals];
        // Heapify
        for (let i = Math.floor(this.data.length / 2) - 1; i >= 0; i--) {
            this.heapifyDown(i);
        }
        this.render();
    },

    // Operations
    push(val) {
        this.data.push(val);
        this.render();
        // We can't easily animate here since it's one step, 
        // but scripts can use low-level swap/compare if they want animation.
        // For a primitive, we usually just update state.
        this.heapifyUp(this.data.length - 1);
        this.render();
    },

    pop() {
        if (this.data.length === 0) return null;
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this.heapifyDown(0);
        }
        this.render();
        return top;
    },

    peek() {
        return this.data[0];
    },

    getValues() {
        return [...this.data];
    },

    size() {
        return this.data.length;
    },

    isEmpty() {
        return this.data.length === 0;
    },

    // Helpers for internal use
    heapifyUp(idx) {
        if (idx === 0) return;
        const parentIdx = Math.floor((idx - 1) / 2);
        if (this.compare(this.data[idx], this.data[parentIdx])) {
            [this.data[idx], this.data[parentIdx]] = [this.data[parentIdx], this.data[idx]];
            this.heapifyUp(parentIdx);
        }
    },

    heapifyDown(idx) {
        const len = this.data.length;
        let swapIdx = idx;
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;

        if (left < len && this.compare(this.data[left], this.data[swapIdx])) {
            swapIdx = left;
        }
        if (right < len && this.compare(this.data[right], this.data[swapIdx])) {
            swapIdx = right;
        }

        if (swapIdx !== idx) {
            [this.data[idx], this.data[swapIdx]] = [this.data[swapIdx], this.data[idx]];
            this.heapifyDown(swapIdx);
        }
    },

    compare(a, b) {
        let valA = a;
        let valB = b;

        // Extract values if elements are objects or arrays
        const extract = (item) => {
            if (item === null || item === undefined) return item;
            if (this.key && typeof item === 'object' && this.key in item) return item[this.key];
            if (Array.isArray(item)) return item[0];
            if (typeof item === 'object') {
                if ('val' in item) return item.val;
                if ('weight' in item) return item.weight;
                if ('dist' in item) return item.dist;
                if ('count' in item) return item.count;
                if ('priority' in item) return item.priority;
            }
            return item;
        };

        valA = extract(a);
        valB = extract(b);

        if (this.type === 'min') return valA < valB;
        return valA > valB;
    },

    // Visualization Helpers
    highlight(idx, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        // Idx maps to node id by position? 
        // In render, we'll assign IDs based on index to make this easy: `heap-${slotId}-${index}`
        const el = container.querySelector(`[data-index="${idx}"]`);
        if (el) {
            el.style.backgroundColor = color;
            if (color) {
                el.style.borderColor = color;
                el.style.boxShadow = `0 0 15px ${color}`;
                el.style.transform = 'translate(-50%, -50%) scale(1.1)';
            } else {
                el.style.backgroundColor = '#1e293b';
                el.style.borderColor = '#64748b';
                el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
                el.style.transform = 'translate(-50%, -50%)';
            }
        }
    },

    clearHighlights() {
        this.render();
    },

    // Layout (Reuse Tree Layout logic)
    // But we build the tree structure on the fly from array
    calculateLayout() {
        if (this.data.length === 0) return { width: 400, height: 300, treeWidth: 0 };

        // Build generic tree node structure for layout
        const nodes = this.data.map((v, i) => ({
            id: `heap-${this.slotId}-${i}`,
            index: i,
            val: v,
            left: null,
            right: null,
            x: 0, y: 0
        }));

        for (let i = 0; i < nodes.length; i++) {
            let l = 2 * i + 1;
            let r = 2 * i + 2;
            if (l < nodes.length) nodes[i].left = nodes[l];
            if (r < nodes.length) nodes[i].right = nodes[r];
        }

        let leafCount = 0;
        const nodeWidth = 40;
        const gap = 30;
        const levelHeight = 80;

        const calcPos = (node, depth) => {
            if (!node) return;

            let leftX = null;
            let rightX = null;

            if (node.left) {
                calcPos(node.left, depth + 1);
                leftX = node.left.x;
            } else if (node.right) {
                leftX = leafCount * (nodeWidth + gap);
                leafCount++;
            }

            if (node.right) {
                calcPos(node.right, depth + 1);
                rightX = node.right.x;
            } else if (node.left) {
                rightX = leafCount * (nodeWidth + gap);
                leafCount++;
            }

            if (!node.left && !node.right) {
                node.x = leafCount * (nodeWidth + gap);
                leafCount++;
            } else {
                node.x = (leftX + rightX) / 2;
            }
            node.y = depth * levelHeight;
        };

        calcPos(nodes[0], 0);

        let minX = Infinity, maxX = -Infinity, maxY = 0;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            maxY = Math.max(maxY, n.y);
        });

        const realTreeWidth = maxX - minX;
        const stageWidth = Math.max(realTreeWidth + 100, 400);
        const stageHeight = Math.max(maxY + 100, 300);

        return {
            width: stageWidth,
            height: stageHeight,
            nodes,
            minX, maxX
        };
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Empty Heap</div>';
            return;
        }

        const { width, height, nodes, minX, maxX } = this.calculateLayout();

        const stageWidth = width;
        const stageHeight = height;
        const offsetX = (stageWidth / 2) - ((minX + maxX) / 2);
        const offsetY = 40;

        let html = `<div class="heap-wrapper" style="
                    position: relative; 
                    width: 100%; 
                    height: 100%; 
                    min-height: 400px;
                    overflow: auto;
                    display: flex;
                    justify-content: center;
                ">
                     <div class="heap-stage" style="
                        position: relative; 
                        width: ${stageWidth}px;
                        height: ${stageHeight}px;
                        flex-shrink: 0;
                    ">`;

        html += `<svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none;">`;

        const drawEdge = (node) => {
            if (!node) return '';
            let s = '';
            if (node.left) {
                s += `<line x1="${node.x + offsetX}" y1="${node.y + offsetY}" x2="${node.left.x + offsetX}" y2="${node.left.y + offsetY}" stroke="#64748b" stroke-width="2" />`;
                s += drawEdge(node.left);
            }
            if (node.right) {
                s += `<line x1="${node.x + offsetX}" y1="${node.y + offsetY}" x2="${node.right.x + offsetX}" y2="${node.right.y + offsetY}" stroke="#64748b" stroke-width="2" />`;
                s += drawEdge(node.right);
            }
            return s;
        };
        html += drawEdge(nodes[0]);
        html += `</svg>`;

        const drawNode = (node) => {
            if (!node) return '';
            const bg = '#1e293b';
            const border = '#64748b';
            let displayVal = node.val;
            if (displayVal !== null && typeof displayVal === 'object') {
                if (Array.isArray(displayVal)) {
                    // Trim arrays slightly without excessive truncation immediately
                    displayVal = `[${displayVal.map(v => typeof v === 'object' ? '..' : String(v).substring(0, 5)).join(',')}]`;
                } else {
                    // Extract a clean string representation for objects prioritizing common keys
                    if ('word' in displayVal && 'freq' in displayVal) displayVal = `${displayVal.word}:${displayVal.freq}`;
                    else if ('val' in displayVal && 'priority' in displayVal) displayVal = `${displayVal.val}:${displayVal.priority}`;
                    else {
                        const keys = Object.keys(displayVal).slice(0, 2); // Show max 2 keys
                        displayVal = keys.map(k => {
                            const v = displayVal[k];
                            return typeof v === 'object' ? '..' : String(v).substring(0, 4);
                        }).join(',');
                    }
                }
            }
            displayVal = String(displayVal);
            // Prevent massive overlap
            if (displayVal.length > 12) displayVal = displayVal.substring(0, 10) + '..';

            return `<div class="heap-node" data-index="${node.index}" style="
                        position: absolute;
                        left: ${node.x + offsetX}px;
                        top: ${node.y + offsetY}px;
                        width: 40px;
                        height: 40px;
                        background: ${bg};
                        border: 2px solid ${border};
                        border-radius: 50%;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Fira Code', monospace;
                        font-weight: bold;
                        font-size: ${displayVal.length > 8 ? '0.6rem' : (displayVal.length > 4 ? '0.75rem' : '0.9rem')};
                        white-space: nowrap;
                        padding: 0 4px;
                        transform: translate(-50%, -50%);
                        transition: all 0.3s ease;
                        z-index: 2;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    ">${displayVal}</div>` + drawNode(node.left) + drawNode(node.right);
        };
        html += drawNode(nodes[0]);

        html += `</div></div>`;
        container.innerHTML = html;
        if (window.makeDraggable && container.firstElementChild) window.makeDraggable(container.firstElementChild);
    },

    clone() { return { data: [...this.data], type: this.type, key: this.key }; },

    restore(state) {
        this.data = [...state.data];
        this.type = state.type;
        this.key = state.key || null;
        this.render();
    }
});

// ============ GRAPH PRIMITIVE ============

const createGraphPrimitive = (slotId) => ({
    slotId,
    nodes: [], // { id, val, x, y }
    edges: [], // { source, target, isDirected, weight }

    init(nodes, edges) {
        this.nodes = nodes.map(n => ({
            id: String(n.id || n.val),
            val: n.val,
            x: n.x,
            y: n.y
        }));
        this.edges = edges.map(e => {
            const src = e.source !== undefined ? e.source : (e.u !== undefined ? e.u : e.from);
            const tgt = e.target !== undefined ? e.target : (e.v !== undefined ? e.v : e.to);
            const isDir = e.isDirected !== undefined ? !!e.isDirected : !!e.directed;
            return {
                source: String(src),
                target: String(tgt),
                isDirected: isDir,
                weight: e.weight
            };
        });
        this.applyCircularLayoutIfMissing();
        this.render();
    },

    addNode(id, val, x, y) {
        this.nodes.push({ id: String(id), val, x, y });
        this.render();
    },

    addEdge(u, v, isDirected = false, weight = null) {
        // handle either an object or positional args
        if (typeof u === 'object') {
            const src = u.source !== undefined ? u.source : (u.u !== undefined ? u.u : u.from);
            const tgt = u.target !== undefined ? u.target : (u.v !== undefined ? u.v : u.to);
            const isDir = u.isDirected !== undefined ? !!u.isDirected : !!u.directed;
            this.edges.push({ source: String(src), target: String(tgt), isDirected: isDir, weight: u.weight });
        } else {
            this.edges.push({ source: String(u), target: String(v), isDirected: !!isDirected, weight });
        }
        this.render();
    },

    getNeighbors(u) {
        const uid = String(u);
        const neighbors = [];
        this.edges.forEach(e => {
            if (e.source === uid) neighbors.push({ node: e.target, weight: e.weight });
            else if (!e.isDirected && e.target === uid) neighbors.push({ node: e.source, weight: e.weight });
        });
        return neighbors;
    },

    highlightNode(id, color) {
        const uid = String(id);
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const el = container.querySelector(`[data-node-id="${uid}"]`);
        if (el) {
            if (color) {
                el.style.background = color;
                el.style.borderColor = color;
                el.style.boxShadow = `0 0 8px ${color}`;
            } else {
                el.style.background = 'linear-gradient(145deg, #1b204f, #14183c)';
                el.style.borderColor = '#6c8cff';
                el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            }
        }
    },

    highlightEdge(u, v, color) {
        const uid = String(u);
        const vid = String(v);
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const edgeKey = `edge-${uid}-${vid}`;
        const el = container.querySelector(`[data-edge-key="${edgeKey}"]`) || container.querySelector(`[data-edge-key="edge-${vid}-${uid}"]`);
        if (el) {
            el.style.stroke = color || '#64748b';
            el.style.strokeWidth = color ? '3' : '2';
        }
    },

    clearHighlights() {
        this.render();
    },

    applyCircularLayoutIfMissing() {
        const nodesToLayout = this.nodes.filter(n => n.x === undefined || n.y === undefined);
        if (nodesToLayout.length === 0) return;

        // 1. Find Connected Components
        const visited = new Set();
        const components = [];

        this.nodes.forEach(startNode => {
            if (!visited.has(startNode.id)) {
                const component = [];
                const queue = [startNode.id];
                visited.add(startNode.id);
                while (queue.length > 0) {
                    const u = queue.shift();
                    component.push(u);
                    this.getNeighbors(u).forEach(edge => {
                        if (!visited.has(edge.node)) {
                            visited.add(edge.node);
                            queue.push(edge.node);
                        }
                    });
                }
                components.push(component);
            }
        });

        // 2. Layout each component in its own space
        const componentCount = components.length;
        const cols = Math.ceil(Math.sqrt(componentCount));
        const cellWidth = 400;
        const cellHeight = 350;

        components.forEach((compNodes, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const center = {
                x: col * cellWidth + cellWidth / 2,
                y: row * cellHeight + cellHeight / 2
            };
            const radius = Math.min(120, compNodes.length * 25 + 40);

            compNodes.forEach((nodeId, i) => {
                const n = this.nodes.find(node => node.id === nodeId);
                if (n && (n.x === undefined || n.y === undefined)) {
                    const angle = (2 * Math.PI * i) / compNodes.length;
                    n.x = center.x + radius * Math.cos(angle);
                    n.y = center.y + radius * Math.sin(angle);
                }
            });
        });
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.nodes.length === 0) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Empty Graph</div>';
            return;
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        });

        const width = Math.max(maxX + 100, 500);
        const height = Math.max(maxY + 100, 400);

        let html = `<div class="graph-wrapper" style="position:relative; width:100%; height:100%; min-height:400px; overflow:auto;">
                    <div class="graph-stage" style="position:relative; width:${width}px; height:${height}px;">`;

        html += `<svg style="position:absolute; left:0; top:0; width:100%; height:100%; overflow:visible; pointer-events:none;">
                    <defs>
                        <marker id="graph-arrow-${this.slotId}" markerWidth="10" markerHeight="7" refX="24" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>`;

        // Draw Edges
        this.edges.forEach(e => {
            const s = this.nodes.find(n => n.id === e.source);
            const t = this.nodes.find(n => n.id === e.target);
            if (s && t) {
                const edgeKey = `edge-${s.id}-${t.id}`;
                const marker = e.isDirected ? `marker-end="url(#graph-arrow-${this.slotId})"` : '';

                html += `<path data-edge-key="${edgeKey}" d="M ${s.x} ${s.y} L ${t.x} ${t.y}" 
                                stroke="#64748b" stroke-width="2" ${marker} fill="none" />`;

                if (e.weight !== null && e.weight !== undefined) {
                    const midX = (s.x + t.x) / 2;
                    const midY = (s.y + t.y) / 2;
                    html += `<text x="${midX}" y="${midY}" fill="#94a3b8" font-size="12" font-family="monospace" text-anchor="middle" dy="-5">${e.weight}</text>`;
                }
            }
        });
        html += `</svg>`;

        // Draw Nodes
        this.nodes.forEach(n => {
            html += `<div class="graph-node" data-node-id="${n.id}" style="
                        position:absolute;
                        left:${n.x}px;
                        top:${n.y}px;
                        width:36px;
                        height:36px;
                        background:linear-gradient(145deg, #1b204f, #14183c);
                        border:2px solid #6c8cff;
                        border-radius:50%;
                        color:white;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-family:'Fira Code', monospace;
                        font-weight:bold;
                        font-size:0.9rem;
                        transform:translate(-50%, -50%);
                        transition:all 0.3s ease;
                        z-index:2;
                        box-shadow:0 4px 6px rgba(0,0,0,0.3);
                    ">${n.val}</div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
        if (window.makeDraggable && container.firstElementChild) window.makeDraggable(container.firstElementChild);
    },

    clone() { return { nodes: JSON.parse(JSON.stringify(this.nodes)), edges: JSON.parse(JSON.stringify(this.edges)) }; },
    restore(state) { this.nodes = state.nodes; this.edges = state.edges; this.render(); }
});

// ============ TRIE PRIMITIVE ============

class TrieNode {
    constructor(char = '') {
        this.children = {};
        this.isWord = false;
        this.char = char;
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = 0;
        this.y = 0;
    }
}

const createTriePrimitive = (slotId) => ({
    slotId,
    root: new TrieNode(),

    getRootId() {
        return this.root.id;
    },

    init() {
        this.root = new TrieNode();
        this.render();
    },

    insert(word) {
        if (!word) return;
        word = String(word).toLowerCase();
        let node = this.root;
        for (const char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode(char);
            }
            node = node.children[char];
        }
        node.isWord = true;
        this.render();
    },

    search(word) {
        if (!word) return false;
        word = String(word).toLowerCase();
        let node = this.root;
        for (const char of word) {
            if (!node.children[char]) {
                // this.highlightNode(this.root.id, '#ef4444'); 
                return false;
            }
            node = node.children[char];
        }
        if (node.isWord) {
            this.highlightNode(node.id, '#10b981');
            return true;
        } else {
            this.highlightNode(node.id, '#f59e0b');
            return false;
        }
    },

    startsWith(prefix) {
        if (!prefix) return false;
        prefix = String(prefix).toLowerCase();
        let node = this.root;
        for (const char of prefix) {
            if (!node.children[char]) return false;
            node = node.children[char];
        }
        this.highlightNode(node.id, '#3b82f6');
        return true;
    },

    getAllNodes(node = this.root) {
        let nodes = [node];
        for (const key in node.children) {
            nodes = nodes.concat(this.getAllNodes(node.children[key]));
        }
        return nodes;
    },

    highlightNode(id, color) {
        const actualId = (typeof id === 'object' && id !== null) ? id.id : id;
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const el = container.querySelector(`[data-id="${actualId}"]`);
        if (el) {
            if (color) {
                el.style.background = color;
                el.style.borderColor = color;
                el.style.boxShadow = `0 0 8px ${color}`;
                el.style.transform = 'translate(-50%, -50%) scale(1.2)';
            } else {
                el.style.background = 'linear-gradient(145deg, #1b204f, #14183c)';
                el.style.borderColor = '#6c8cff';
                el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
                el.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        }
    },

    highlight(target, color) {
        if (!target) return;
        // Check if target is a node ID or a word
        let node = this.data?.nodes?.find(n => n.id === target) || this.getAllNodes().find(n => n.id === target);

        if (!node) {
            // Try to treat as word
            let curr = this.root;
            let found = true;
            for (const char of String(target).toLowerCase()) {
                if (!curr.children[char]) {
                    found = false;
                    break;
                }
                curr = curr.children[char];
            }
            if (found) node = curr;
        }

        if (node) {
            this.highlightNode(node.id, color);
        }
    },

    clearHighlights() {
        this.render();
    },

    size() {
        let count = 0;
        const traverse = (node) => {
            if (node.isWord) count++;
            for (const key in node.children) traverse(node.children[key]);
        };
        traverse(this.root);
        return count;
    },

    clear() {
        this.root = new TrieNode();
        this.render();
    },

    // === LAYOUT LOGIC (Smart) ===
    calculateSubtreeWidth(node) {
        const keys = Object.keys(node.children);
        if (keys.length === 0) return 60; // Leaf width
        let width = 0;
        for (const key of keys) {
            width += this.calculateSubtreeWidth(node.children[key]);
        }
        return width;
    },

    assignPositionsSmart(node, x, y) {
        node.x = x;
        node.y = y;

        const keys = Object.keys(node.children).sort();
        const totalWidth = this.calculateSubtreeWidth(node);

        let currentX = x - totalWidth / 2;

        for (const key of keys) {
            const child = node.children[key];
            const childWidth = this.calculateSubtreeWidth(child);
            // Place child center at currentX + half its width
            this.assignPositionsSmart(child, currentX + childWidth / 2, y + 80);
            currentX += childWidth;
        }
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        // 1. Calculate Positions
        // We'll center the root at 0, 40 (relative to the inner stage)
        // The stage will be centered in the scrollable wrapper.
        this.assignPositionsSmart(this.root, 0, 40);

        // Determine bounds to size the stage
        let minX = Infinity, maxX = -Infinity, maxY = 0;
        const activeNodes = this.getAllNodes();
        activeNodes.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            maxY = Math.max(maxY, n.y);
        });

        // Add padding
        const width = Math.max(600, (maxX - minX) + 200);
        const height = Math.max(400, maxY + 100);

        // We want the root (0, 40) to be horizontally centered in the container.
        // stageWidth
        const stageWidth = width;
        const stageHeight = height;

        // Shift all nodes so minX is at padding
        const shiftX = (stageWidth / 2); // Root is at 0, so we shift by half width to center it in stage

        // Update node positions for rendering
        activeNodes.forEach(n => {
            n.renderX = n.x + shiftX;
            n.renderY = n.y;
        });

        let html = `<div class="trie-wrapper" style="
                    position: relative; 
                    width: 100%; 
                    height: 100%; 
                    min-height: 400px;
                    overflow: auto; 
                ">
                    <div class="trie-stage" style="
                        position: relative; 
                        width: ${stageWidth}px; 
                        height: ${stageHeight}px;
                        margin: 0 auto;
                    ">`;

        // SVG Layer
        html += `<svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none;">
                    <defs>
                        <marker id="arrow-${this.slotId}" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>`;

        // Draw Edges
        const queue = [this.root];
        while (queue.length) {
            const node = queue.shift();
            for (const key in node.children) {
                const child = node.children[key];
                // Draw from parent to child
                html += `<path d="M ${node.renderX} ${node.renderY} L ${child.renderX} ${child.renderY}" 
                            stroke="#64748b" stroke-width="2" marker-end="url(#arrow-${this.slotId})" />`;

                // Label (Char) on edge? 
                // The nodes themselves have the char, so edge label is redundant or can be small.
                // Let's stick to node chars as per home page style.
                queue.push(child);
            }
        }
        html += `</svg>`;

        // Draw Nodes
        activeNodes.forEach(n => {
            const isRoot = !n.char;
            const label = isRoot ? '*' : n.char;
            const isWord = n.isWord;

            const bg = isWord ? 'linear-gradient(145deg, #3d2b00, #2e2100)' : 'linear-gradient(145deg, #1b204f, #14183c)';
            const border = isWord ? '#ffb703' : '#6c8cff';
            const glow = isWord ? '0 0 10px rgba(255, 183, 3, 0.4)' : '0 4px 6px rgba(0,0,0,0.3)';
            const scale = isWord ? '1.1' : '1';

            html += `<div class="trie-node" data-id="${n.id}" style="
                        position: absolute;
                        left: ${n.renderX}px;
                        top: ${n.renderY}px;
                        width: 40px;
                        height: 40px;
                        background: ${bg};
                        border: 2px solid ${border};
                        border-radius: 50%;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Fira Code', monospace;
                        font-weight: bold;
                        font-size: 1rem;
                        transform: translate(-50%, -50%) scale(${scale});
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        z-index: 2;
                        box-shadow: ${glow};
                    ">${label}</div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
        if (window.makeDraggable && container.firstElementChild) window.makeDraggable(container.firstElementChild);
    },

    clone() {
        const serialize = (node) => {
            const copy = new TrieNode(node.char);
            copy.isWord = node.isWord;
            copy.id = node.id;
            for (const key in node.children) {
                copy.children[key] = serialize(node.children[key]);
            }
            return copy;
        };
        return { root: serialize(this.root) };
    },

    restore(state) {
        this.root = state.root;
        this.render();
    }
});

// ============ SLL PRIMITIVE ============

const createSLLPrimitive = (slotId) => ({
    slotId,
    data: [], // Array of { id, val, addr }
    pointers: {}, // Map: name -> { nodeId, color }

    _makeNode(val) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            val: val,
            addr: '0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'),
            nextId: null
        };
    },

    _getActualId(id) {
        if (typeof id === 'object' && id !== null) {
            return id.nodeId || id.id || id;
        }
        return id;
    },

    init(vals) {
        this.data = vals.map(v => this._makeNode(v));
        // Set initial sequential links
        for (let i = 0; i < this.data.length - 1; i++) {
            this.data[i].nextId = this.data[i + 1].id;
        }
        this.pointers = {};
        this.render();
    },

    // Pointer API
    createPointer(name, nodeId, color = '#3b82f6') {
        const actualId = this._getActualId(nodeId);
        this.pointers[name] = { nodeId: actualId, color };
        this.render();
    },

    movePointer(name, nodeId) {
        if (this.pointers[name]) {
            const actualId = this._getActualId(nodeId);
            this.pointers[name].nodeId = actualId;
            this.render();
        }
    },

    removePointer(name) {
        delete this.pointers[name];
        this.render();
    },

    getNextId(nodeId) {
        const actualId = this._getActualId(nodeId);
        const node = this.data.find(n => n.id === actualId);
        return node ? node.nextId : null;
    },

    link(fromId, toId) {
        const actualFromId = this._getActualId(fromId);
        const actualToId = this._getActualId(toId);
        const node = this.data.find(n => n.id === actualFromId);
        if (node) {
            node.nextId = actualToId;
            this.render();
        }
    },

    unlink(id) {
        const actualId = this._getActualId(id);
        const node = this.data.find(n => n.id === actualId);
        if (node) {
            node.nextId = null;
            this.render();
        }
    },

    addHead(val) {
        this.data.unshift(this._makeNode(val));
        this.render();
    },

    addTail(val) {
        this.data.push(this._makeNode(val));
        this.render();
    },

    removeHead() {
        if (this.data.length === 0) return;
        this.data.shift();
        this.render();
    },

    removeTail() {
        if (this.data.length === 0) return;
        this.data.pop();
        this.render();
    },

    getHeadId() {
        return this.data.length > 0 ? this.data[0].id : null;
    },

    getTailId() {
        return this.data.length > 0 ? this.data[this.data.length - 1].id : null;
    },

    get(index) {
        if (index < 0 || index >= this.data.length) return undefined;
        return this.data[index].val;
    },

    size() {
        return this.data.length;
    },

    isEmpty() {
        return this.data.length === 0;
    },

    search(val) {
        return this.data.findIndex(n => n.val == val);
    },

    highlight(index, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        // Highlight the specific node box
        const wrapper = container.querySelectorAll('.sll-node-wrapper')[index];
        if (wrapper) {
            const box = wrapper.querySelector('.sll-node-box');
            if (box) {
                box.style.borderColor = color;
                box.style.backgroundColor = color === '' ? '' : (color + '33'); // Transparent fill
                box.style.boxShadow = color === '' ? '' : `0 0 10px ${color}`;
            }
        }
    },

    highlightNode(id, color) {
        const actualId = this._getActualId(id);
        const node = this.data.find(n => n.id === actualId);
        if (node) {
            node.color = color;
            this.render();
        }
    },

    highlightEdge(fromId, toId, color, direction = 'next') {
        const actualFromId = this._getActualId(fromId);
        const node = this.data.find(n => n.id === actualFromId);
        if (node) {
            if (direction === 'next') node.nextColor = color;
            else node.prevColor = color;
            this.render();
        }
    },

    clearHighlights() {
        this.data.forEach(n => {
            delete n.color;
            delete n.nextColor;
            delete n.prevColor;
        });
        this.render();
    },

    clear() {
        this.data = [];
        this.render();
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div class="sll-wrapper"><div class="sll-empty">Empty List</div></div>';
            return;
        }

        // If no head pointer yet, set it to the first node in data
        if (!this.pointers['head'] && this.data.length > 0) {
            this.pointers['head'] = { nodeId: this.data[0].id, color: '#3b82f6' };
        }

        const nodeWidth = 100;
        const gap = 80;
        const startX = 40;
        const startY = 100;

        const nodeMap = {};
        this.data.forEach((n, i) => {
            nodeMap[n.id] = { ...n, x: startX + i * (nodeWidth + gap), y: startY };
        });

        const totalWidth = startX + this.data.length * (nodeWidth + gap) + 100;
        let html = `<div class="sll-wrapper" style="position: relative; width: 100%; height: 300px; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 8px;">`;

        html += `<svg style="position: absolute; left: 0; top: 0; width: ${totalWidth}px; height: 100%; pointer-events: none;">
                    <defs>
                        <marker id="arrow-${this.slotId}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                `;

        // Draw arrows based on nextId
        this.data.forEach(node => {
            if (node.nextId && nodeMap[node.nextId]) {
                const target = nodeMap[node.nextId];
                const x1 = nodeMap[node.id].x + nodeWidth;
                const y1 = nodeMap[node.id].y + 30;
                const x2 = target.x;
                const y2 = target.y + 30;

                const color = node.nextColor || '#64748b';
                if (x1 < x2) {
                    // Forward link (normal or skip)
                    const midY = (y1 + y2) / 2;
                    if (Math.abs(x2 - x1) > (nodeWidth + gap + 10)) {
                        // Long skip: curved
                        const midX = (x1 + x2) / 2;
                        html += `<path d="M ${x1} ${y1} Q ${midX} ${midY - 40} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${this.slotId})" />`;
                    } else {
                        // Normal adjacent: straight
                        html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${this.slotId})" />`;
                    }
                } else {
                    // Backward link (reverse)
                    const by1 = nodeMap[node.id].y + 45;
                    const by2 = target.y + 45;
                    const bx1 = nodeMap[node.id].x;
                    const bx2 = target.x + nodeWidth;

                    if (Math.abs(bx1 - bx2) < (nodeWidth + gap + 10)) {
                        // Normal adjacent reverse: straight with offset
                        html += `<line x1="${bx1}" y1="${by1}" x2="${bx2}" y2="${by2}" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${this.slotId})" />`;
                    } else {
                        // Long skip reverse: curved
                        const midX = (bx1 + bx2) / 2;
                        html += `<path d="M ${bx1} ${by1} Q ${midX} ${by1 + 40} ${bx2} ${by2}" fill="none" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${this.slotId})" />`;
                    }
                }
            }
        });
        html += `</svg>`;

        // Nodes
        this.data.forEach((node) => {
            const pos = nodeMap[node.id];
            const nextNode = this.data.find(n => n.id === node.nextId);
            const nextAddr = nextNode ? nextNode.addr : 'NULL';

            // Collect pointers for this node
            const ptrs = Object.entries(this.pointers)
                .filter(([_, p]) => {
                    const nodeId = (typeof p === 'object' && p !== null) ? p.nodeId : p;
                    return nodeId === node.id;
                })
                .map(([name, p]) => {
                    const color = (typeof p === 'object' && p !== null) && p.color ? p.color : '#3b82f6';
                    return `<div style="background:${color}; color:white; padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold; margin:2px;">${name}</div>`;
                })
                .join('');

            html += `<div class="sll-node-wrapper" style="
                        position: absolute;
                        left: ${pos.x}px;
                        top: ${pos.y}px;
                        width: ${nodeWidth}px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    ">
                        <div class="sll-ptrs" style="position: absolute; bottom: calc(100% + 20px); display:flex; flex-direction:column; align-items:center; z-index:10;">${ptrs}</div>
                        <div class="sll-addr" style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px;">${node.addr}</div>
                        <div class="sll-node-box" style="
                            width: 100%;
                            background: #1e293b;
                            border: 2px solid ${node.color || '#334155'};
                            border-radius: 6px;
                            overflow: hidden;
                            transition: all 0.2s;
                            ${node.color ? `box-shadow: 0 0 10px ${node.color};` : ''}
                        ">
                             <div class="sll-val" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: bold;
                                color: white;
                                border-bottom: 1px solid #334155;
                             ">${node.val}</div>
                             <div class="sll-next" style="
                                padding: 4px;
                                font-size: 0.7rem;
                                color: #64748b;
                                background: #0f172a;
                                text-align: center;
                                font-family: monospace;
                             ">NEXT: ${nextAddr}</div>
                        </div>
                    </div>`;
        });

        container.innerHTML = html;
    },

    clone() {
        return { data: JSON.parse(JSON.stringify(this.data)), pointers: JSON.parse(JSON.stringify(this.pointers)) };
    },

    restore(state) {
        this.data = JSON.parse(JSON.stringify(state.data));
        this.pointers = JSON.parse(JSON.stringify(state.pointers || {}));
        this.render();
    }
});


// ============ DLL PRIMITIVE ============

const createDLLPrimitive = (slotId) => ({
    slotId,
    data: [], // Array of { id, val, addr, nextId, prevId }
    pointers: {}, // Map: name -> { nodeId, color }

    _makeNode(val) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            val: val,
            addr: '0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'),
            nextId: null,
            prevId: null
        };
    },

    _getActualId(id) {
        if (typeof id === 'object' && id !== null) {
            return id.nodeId || id.id || id;
        }
        return id;
    },

    init(vals) {
        this.data = vals.map(v => this._makeNode(v));
        // Set initial sequential links
        for (let i = 0; i < this.data.length; i++) {
            if (i < this.data.length - 1) this.data[i].nextId = this.data[i + 1].id;
            if (i > 0) this.data[i].prevId = this.data[i - 1].id;
        }
        this.pointers = {};
        this.render();
    },

    // Pointer API
    createPointer(name, nodeId, color = '#3b82f6') {
        const actualId = this._getActualId(nodeId);
        this.pointers[name] = { nodeId: actualId, color };
        this.render();
    },
    movePointer(name, nodeId) {
        if (this.pointers[name]) {
            const actualId = this._getActualId(nodeId);
            this.pointers[name].nodeId = actualId;
            this.render();
        }
    },
    removePointer(name) {
        delete this.pointers[name];
        this.render();
    },

    getNextId(nodeId) {
        const actualId = this._getActualId(nodeId);
        const node = this.data.find(n => n.id === actualId);
        return node ? node.nextId : null;
    },
    getPrevId(nodeId) {
        const actualId = this._getActualId(nodeId);
        const node = this.data.find(n => n.id === actualId);
        return node ? node.prevId : null;
    },

    link(fromId, toId, direction = 'next') {
        const actualFromId = this._getActualId(fromId);
        const actualToId = this._getActualId(toId);
        const node = this.data.find(n => n.id === actualFromId);
        if (node) {
            if (direction === 'next') node.nextId = actualToId;
            else node.prevId = actualToId;
            this.render();
        }
    },

    unlink(id, direction = 'both') {
        const actualId = this._getActualId(id);
        const node = this.data.find(n => n.id === actualId);
        if (node) {
            if (direction === 'next' || direction === 'both') node.nextId = null;
            if (direction === 'prev' || direction === 'both') node.prevId = null;
            this.render();
        }
    },

    addFirst(val) {
        const newNode = this._makeNode(val);
        if (this.data.length > 0) {
            newNode.nextId = this.data[0].id;
            this.data[0].prevId = newNode.id;
        }
        this.data.unshift(newNode);
        this.render();
    },

    addLast(val) {
        const newNode = this._makeNode(val);
        if (this.data.length > 0) {
            const last = this.data[this.data.length - 1];
            last.nextId = newNode.id;
            newNode.prevId = last.id;
        }
        this.data.push(newNode);
        this.render();
    },

    removeFirst() {
        if (this.data.length === 0) return;
        const head = this.data.shift();
        if (this.data.length > 0) {
            this.data[0].prevId = null;
        }
        this.render();
    },

    removeLast() {
        if (this.data.length === 0) return;
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[this.data.length - 1].nextId = null;
        }
        this.render();
    },

    getHeadId() {
        return this.data.length > 0 ? this.data[0].id : null;
    },

    getTailId() {
        return this.data.length > 0 ? this.data[this.data.length - 1].id : null;
    },

    get(index) {
        if (index < 0 || index >= this.data.length) return undefined;
        return this.data[index].val;
    },

    highlight(index, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const wrapper = container.querySelectorAll('.dll-node-wrapper')[index];
        if (wrapper) {
            const box = wrapper.querySelector('.dll-node-box');
            if (box) {
                box.style.borderColor = color;
                box.style.backgroundColor = color === '' ? '' : (color + '33');
                box.style.boxShadow = color === '' ? '' : `0 0 15px ${color}`;
            }
        }
    },

    highlightNode(id, color) {
        const actualId = this._getActualId(id);
        const node = this.data.find(n => n.id === actualId);
        if (node) {
            node.color = color;
            this.render();
        }
    },

    highlightEdge(fromId, toId, color, direction = 'next') {
        const actualFromId = this._getActualId(fromId);
        const node = this.data.find(n => n.id === actualFromId);
        if (node) {
            if (direction === 'next') node.nextColor = color;
            else node.prevColor = color;
            this.render();
        }
    },

    clearHighlights() {
        this.data.forEach(n => {
            delete n.color;
            delete n.nextColor;
            delete n.prevColor;
        });
        this.render();
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div class="dll-wrapper" style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Empty DLL</div>';
            return;
        }

        // Default head/tail pointers
        if (!this.pointers['head'] && this.data.length > 0) {
            this.pointers['head'] = { nodeId: this.data[0].id, color: '#ef4444' };
        }
        if (!this.pointers['tail'] && this.data.length > 0) {
            this.pointers['tail'] = { nodeId: this.data[this.data.length - 1].id, color: '#3b82f6' };
        }

        const nodeWidth = 220;
        const nodeHeight = 70;
        const gap = 80;
        const startX = 40;
        const startY = 100;

        const nodeMap = {};
        this.data.forEach((n, i) => {
            nodeMap[n.id] = { ...n, x: startX + i * (nodeWidth + gap), y: startY };
        });

        const totalWidth = startX + this.data.length * (nodeWidth + gap) + 100;
        let html = `<div class="dll-wrapper" style="position: relative; width: 100%; height: 350px; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 8px;">`;

        html += `<svg style="position: absolute; left: 0; top: 0; width: ${totalWidth}px; height: 100%; pointer-events: none;">
                    <defs>
                        <marker id="dll-arrow-r-${this.slotId}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                        <marker id="dll-arrow-l-${this.slotId}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>`;

        // Draw arrows
        this.data.forEach(node => {
            const pos = nodeMap[node.id];
            const nextColor = node.nextColor || '#64748b';
            const prevColor = node.prevColor || '#64748b';

            if (node.nextId && nodeMap[node.nextId]) {
                const target = nodeMap[node.nextId];
                const x1 = pos.x + nodeWidth;
                const x2 = target.x;
                const y = pos.y + 24 + (nodeHeight / 2) - 6;

                html += `<path d="M ${x1} ${y} L ${x2} ${y}" stroke="${nextColor}" stroke-width="2" marker-end="url(#dll-arrow-r-${this.slotId})" fill="none" />`;
            }
            if (node.prevId && nodeMap[node.prevId]) {
                const target = nodeMap[node.prevId];
                const x1 = pos.x;
                const x2 = target.x + nodeWidth;
                const y = pos.y + 24 + (nodeHeight / 2) + 6;

                html += `<path d="M ${x1} ${y} L ${x2} ${y}" stroke="${prevColor}" stroke-width="2" marker-end="url(#dll-arrow-l-${this.slotId})" fill="none" />`;
            }
        });
        html += `</svg>`;

        // Nodes
        this.data.forEach((node) => {
            const pos = nodeMap[node.id];
            const nextNode = this.data.find(n => n.id === node.nextId);
            const prevNode = this.data.find(n => n.id === node.prevId);
            const nextAddr = nextNode ? nextNode.addr : 'NULL';
            const prevAddr = prevNode ? prevNode.addr : 'NULL';

            // Collect pointers for this node
            const ptrs = Object.entries(this.pointers)
                .filter(([_, p]) => {
                    const nodeId = (typeof p === 'object' && p !== null) ? p.nodeId : p;
                    return nodeId === node.id;
                })
                .map(([name, p]) => {
                    const color = (typeof p === 'object' && p !== null) && p.color ? p.color : '#3b82f6';
                    return `<div style="background:${color}; color:white; padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold; margin:2px;">${name}</div>`;
                })
                .join('');

            html += `<div class="dll-node-wrapper" style="position: absolute; left: ${pos.x}px; top: ${pos.y}px; width: ${nodeWidth}px; display:flex; flex-direction:column; align-items:center;">
                        <div class="dll-ptrs" style="position: absolute; bottom: calc(100% + 20px); display:flex; flex-direction:column; align-items:center; z-index:10;">${ptrs}</div>
                        <div style="font-size: 0.7rem; color: #ef4444; font-family: 'Fira Code', monospace; margin-bottom: 6px; font-weight: bold;">${node.addr}</div>
                        <div class="dll-node-box" style="
                            width: 100%;
                            height: ${nodeHeight}px;
                            background: #1e293b;
                            border: 2px solid ${node.color || '#334155'};
                            border-radius: 8px;
                            display: flex;
                            overflow: hidden;
                            transition: all 0.2s;
                            ${node.color ? `box-shadow: 0 0 15px ${node.color};` : 'box-shadow: 0 4px 6px rgba(0,0,0,0.3);'}
                        ">
                            <!-- PREV Section -->
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #334155; background: rgba(255,255,255,0.02);">
                                <div style="font-size: 0.55rem; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px;">PREV</div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-family: monospace;">${prevAddr}</div>
                            </div>

                            <!-- DATA Section -->
                            <div style="flex: 1.2; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2);">
                                <div style="font-weight: 900; color: white; font-size: 1.4rem; font-family: 'Fira Code', monospace;">${node.val}</div>
                            </div>

                            <!-- NEXT Section -->
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #334155; background: rgba(255,255,255,0.02);">
                                <div style="font-size: 0.55rem; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px;">NEXT</div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-family: monospace;">${nextAddr}</div>
                            </div>
                        </div>
                    </div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    clone() { return { data: JSON.parse(JSON.stringify(this.data)), pointers: JSON.parse(JSON.stringify(this.pointers)) }; },
    restore(state) { this.data = JSON.parse(JSON.stringify(state.data)); this.pointers = JSON.parse(JSON.stringify(state.pointers || {})); this.render(); }
});


// ============ DEQUE PRIMITIVE ============

const createDequePrimitive = (slotId) => ({
    slotId,
    data: [],

    pushFront(v) { this.data.unshift(v); this.render(); },
    popFront() { const v = this.data.shift(); this.render(); return v; },
    pushBack(v) { this.data.push(v); this.render(); },
    popBack() { const v = this.data.pop(); this.render(); return v; },
    // Aliases for poll/add
    addFirst(v) { this.pushFront(v); },
    addLast(v) { this.pushBack(v); },
    pollFirst() { return this.popFront(); },
    pollLast() { return this.popBack(); },
    peekFirst() { return this.data[0]; },
    peekBack() { return this.data[this.data.length - 1]; },
    peekLast() { return this.peekBack(); },
    isEmpty() { return this.data.length === 0; },
    size() { return this.data.length; },
    init(arr) { this.data = [...arr]; this.render(); },

    highlight(i, color) {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;
        const items = container.querySelectorAll('.deque-item');
        if (items[i]) {
            items[i].style.backgroundColor = color;
            items[i].style.borderColor = color;
            if (color) items[i].style.boxShadow = `0 0 15px ${color}`;
        }
    },

    clearHighlights() {
        this.render();
    },

    render() {
        const container = document.getElementById(`slot-${this.slotId}-content`);
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-style:italic;">Empty Deque</div>';
            return;
        }

        let html = `<div class="deque-wrapper" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px; padding: 20px;">
                    <div class="deque-container" style="display: flex; gap: 10px; padding: 15px; background: rgba(30, 41, 59, 0.5); border: 2px dashed #475569; border-radius: 12px; position: relative;">`;

        this.data.forEach((v, i) => {
            const isHead = i === 0;
            const isTail = i === this.data.length - 1;
            let label = '';
            if (isHead && isTail) label = '<span style="color:#ef4444">H/T</span>';
            else if (isHead) label = '<span style="color:#ef4444">Head</span>';
            else if (isTail) label = '<span style="color:#3b82f6">Tail</span>';

            html += `<div class="deque-item" style="
                        width: 50px;
                        height: 50px;
                        background: #1e293b;
                        border: 2px solid #334155;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-family: 'Fira Code', monospace;
                        position: relative;
                        transition: all 0.3s;
                    ">
                        ${v}
                        ${label ? `<div style="position: absolute; top: -25px; font-size: 0.7rem; font-weight: bold; width: 100%; text-align: center;">${label}</div>` : ''}
                    </div>`;
        });

        html += `</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">Double-Ended Queue (Front ⟷ Back)</div>
                </div>`;
        container.innerHTML = html;
    },

    clone() { return { data: [...this.data] }; },
    restore(state) { this.data = [...state.data]; this.render(); }
});


function log(msg) {
    document.getElementById('log-container').textContent = msg;
}

// ============ STEP CONTROLLER ============

let resolveStep = null;
let stepSnapshots = [];  // Indexed array: stepSnapshots[stepIndex] = complete state
let currentStepIndex = 0;
let maxStepReached = 0;
let isAutoPlaying = false;
let autoPlayTimer = null;
let autoPlayDelay = 800;
let algorithmComplete = false;

function updateStepIndicator() {
    document.getElementById('step-indicator').textContent = `Step ${currentStepIndex}`;
}

// Capture highlights from a specific slot container
function captureSlotHighlights(slotId) {
    const container = document.getElementById(`slot-${slotId}-content`);
    if (!container) return [];

    const highlights = [];

    container.querySelectorAll('.array-box').forEach((box, i) => {
        highlights.push({
            type: 'array-box',
            index: i,
            bg: box.style.backgroundColor || '',
            border: box.style.borderColor || ''
        });
    });

    container.querySelectorAll('.array-box-bar').forEach((box, i) => {
        highlights.push({
            type: 'array-box-bar',
            index: i,
            bg: box.style.background || '',
            border: box.style.borderColor || '',
            shadow: box.style.boxShadow || '',
            transform: box.style.transform || ''
        });
    });

    container.querySelectorAll('.stack-item').forEach((item, i) => {
        highlights.push({
            type: 'stack-item',
            index: i,
            bg: item.style.backgroundColor || '',
            border: item.style.borderColor || ''
        });
    });

    container.querySelectorAll('.hashmap-row').forEach((row) => {
        const keyEl = row.querySelector('.hashmap-key');
        const valEl = row.querySelector('.hashmap-value');
        highlights.push({
            type: 'hashmap-row',
            key: row.dataset.key,
            keyBg: keyEl ? keyEl.style.background : '',
            valBg: valEl ? valEl.style.background : ''
        });
    });

    container.querySelectorAll('.grid-cell').forEach((cell) => {
        highlights.push({
            type: 'grid-cell',
            row: cell.dataset.row,
            col: cell.dataset.col,
            bg: cell.style.backgroundColor || '',
            border: cell.style.borderColor || '',
            shadow: cell.style.boxShadow || ''
        });
    });

    container.querySelectorAll('.queue-vis-item').forEach((item, i) => {
        highlights.push({
            type: 'queue-vis-item',
            index: i,
            bg: item.style.backgroundColor || '',
            border: item.style.borderColor || ''
        });
    });

    container.querySelectorAll('.hashset-tag').forEach(tag => {
        highlights.push({
            type: 'hashset-tag',
            text: tag.innerText,
            bg: tag.style.background || '',
            transform: tag.style.transform || '',
            shadow: tag.style.boxShadow || ''
        });
    });

    container.querySelectorAll('.sll-node-box').forEach((box, i) => {
        highlights.push({ type: 'sll-node-box', index: i, border: box.style.borderColor || '', bg: box.style.backgroundColor || '', shadow: box.style.boxShadow || '' });
    });

    container.querySelectorAll('.dll-node-box').forEach((box, i) => {
        highlights.push({ type: 'dll-node-box', index: i, border: box.style.borderColor || '', bg: box.style.backgroundColor || '', shadow: box.style.boxShadow || '' });
    });

    container.querySelectorAll('.deque-item').forEach((item, i) => {
        highlights.push({ type: 'deque-item', index: i, bg: item.style.backgroundColor || '', border: item.style.borderColor || '', shadow: item.style.boxShadow || '' });
    });

    container.querySelectorAll('.bt-node, .heap-node, .uf-node, .graph-node, .trie-node').forEach((node) => {
        highlights.push({
            type: 'generic-node',
            id: node.dataset.id || node.dataset.index || node.dataset.nodeId,
            bg: node.style.backgroundColor || '',
            border: node.style.borderColor || '',
            shadow: node.style.boxShadow || '',
            transform: node.style.transform || ''
        });
    });

    return highlights;
}

// Restore highlights to a specific slot container
function restoreSlotHighlights(slotId, highlights) {
    const actualContainer = document.getElementById(`slot-${slotId}-content`);
    if (!actualContainer || !highlights) return;

    highlights.forEach(h => {
        if (h.type === 'array-box') {
            const boxes = actualContainer.querySelectorAll('.array-box');
            if (boxes[h.index]) {
                boxes[h.index].style.backgroundColor = h.bg;
                boxes[h.index].style.borderColor = h.border;
            }
        } else if (h.type === 'array-box-bar') {
            const boxes = actualContainer.querySelectorAll('.array-box-bar');
            if (boxes[h.index]) {
                boxes[h.index].style.background = h.bg;
                boxes[h.index].style.borderColor = h.border;
                boxes[h.index].style.boxShadow = h.shadow;
                boxes[h.index].style.transform = h.transform;
            }
        } else if (h.type === 'stack-item') {
            const items = actualContainer.querySelectorAll('.stack-item');
            if (items[h.index]) {
                items[h.index].style.backgroundColor = h.bg;
                items[h.index].style.borderColor = h.border;
            }
        } else if (h.type === 'hashmap-row') {
            actualContainer.querySelectorAll('.hashmap-row').forEach(row => {
                if (row.dataset.key === h.key) {
                    const keyEl = row.querySelector('.hashmap-key');
                    const valEl = row.querySelector('.hashmap-value');
                    if (keyEl) keyEl.style.background = h.keyBg;
                    if (valEl) valEl.style.background = h.valBg;
                }
            });
        } else if (h.type === 'grid-cell') {
            actualContainer.querySelectorAll('.grid-cell').forEach(cell => {
                if (cell.dataset.row === h.row && cell.dataset.col === h.col) {
                    cell.style.backgroundColor = h.bg;
                    cell.style.borderColor = h.border;
                    cell.style.boxShadow = h.shadow;
                }
            });
        } else if (h.type === 'queue-vis-item') {
            const items = actualContainer.querySelectorAll('.queue-vis-item');
            if (items[h.index]) {
                items[h.index].style.backgroundColor = h.bg;
                items[h.index].style.borderColor = h.border;
            }
        } else if (h.type === 'hashset-tag') {
            actualContainer.querySelectorAll('.hashset-tag').forEach(tag => {
                if (tag.innerText === h.text) {
                    tag.style.background = h.bg;
                    tag.style.transform = h.transform;
                    tag.style.boxShadow = h.shadow;
                }
            });
        } else if (h.type === 'sll-node-box') {
            const boxes = actualContainer.querySelectorAll('.sll-node-box');
            if (boxes[h.index]) {
                boxes[h.index].style.borderColor = h.border;
                boxes[h.index].style.backgroundColor = h.bg;
                boxes[h.index].style.boxShadow = h.shadow;
            }
        } else if (h.type === 'dll-node-box') {
            const boxes = actualContainer.querySelectorAll('.dll-node-box');
            if (boxes[h.index]) {
                boxes[h.index].style.borderColor = h.border;
                boxes[h.index].style.backgroundColor = h.bg;
                boxes[h.index].style.boxShadow = h.shadow;
            }
        } else if (h.type === 'deque-item') {
            const items = actualContainer.querySelectorAll('.deque-item');
            if (items[h.index]) {
                items[h.index].style.backgroundColor = h.bg;
                items[h.index].style.borderColor = h.border;
                items[h.index].style.boxShadow = h.shadow;
            }
        } else if (h.type === 'generic-node') {
            const node = actualContainer.querySelector(`[data-id="${h.id}"]`) ||
                actualContainer.querySelector(`[data-index="${h.id}"]`) ||
                actualContainer.querySelector(`[data-node-id="${h.id}"]`);
            if (node) {
                node.style.backgroundColor = h.bg;
                node.style.borderColor = h.border;
                node.style.boxShadow = h.shadow;
                node.style.transform = h.transform;
            }
        }
    });
}

// Capture complete snapshot of ALL state
function captureSnapshot() {
    const snapshot = {
        slots: {},
        highlights: {},
        pointers: { ...ptrPrimitive.pointers },
        log: document.getElementById('log-container').textContent
    };

    for (const [id, slot] of Object.entries(activeSlots)) {
        const cloned = slot.clone();
        console.log(`[CAPTURE] Slot "${id}":`, cloned);
        snapshot.slots[id] = cloned;
        snapshot.highlights[id] = captureSlotHighlights(id);
    }

    console.log(`[CAPTURE] Full snapshot at step ${currentStepIndex}:`, JSON.stringify(snapshot.slots));
    return snapshot;
}

// Restore complete state from snapshot
function restoreSnapshot(snapshot) {
    if (!snapshot) {
        console.error('[RESTORE] Snapshot is null/undefined!');
        return;
    }

    console.log(`[RESTORE] Restoring to step ${currentStepIndex}:`, JSON.stringify(snapshot.slots));

    // Restore slot data (which re-renders)
    for (const [id, state] of Object.entries(snapshot.slots)) {
        if (activeSlots[id]) {
            console.log(`[RESTORE] Restoring slot "${id}" with:`, state);
            activeSlots[id].restore(state);
        } else {
            console.error(`[RESTORE] Slot "${id}" not found in activeSlots!`);
        }
    }

    // Restore highlights after render completed
    for (const [id, highlights] of Object.entries(snapshot.highlights)) {
        restoreSlotHighlights(id, highlights);
    }

    // Restore pointers
    ptrPrimitive.pointers = { ...snapshot.pointers };
    ptrPrimitive.render();

    // Restore log
    document.getElementById('log-container').textContent = snapshot.log;
}

function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    const btn = document.getElementById('btn-play');

    if (isAutoPlaying) {
        btn.textContent = '⏸';
        if (resolveStep) {
            triggerNextStep();
        }
    } else {
        btn.textContent = '▶';
        if (autoPlayTimer) {
            clearTimeout(autoPlayTimer);
            autoPlayTimer = null;
        }
    }
}

function triggerNextStep() {
    if (autoPlayTimer) clearTimeout(autoPlayTimer);
    const delay = autoPlayDelay || 800;

    autoPlayTimer = setTimeout(() => {
        if (isAutoPlaying) {
            // If we are reviewing history, simulate a next click
            if (currentStepIndex < maxStepReached) {
                document.getElementById('btn-next').click();
                triggerNextStep(); // Schedule next
            } else if (resolveStep) {
                // We are at the frontier, let the algorithm proceed
                document.getElementById('btn-next').disabled = true;
                resolveStep();
                resolveStep = null;
                // updateButtons and next trigger will happen in awaitStep
            } else {
                // Finished
                isAutoPlaying = false;
                document.getElementById('btn-play').textContent = '▶';
            }
        }
    }, delay);
}

function awaitStep(runId) {
    if (runId !== undefined && runId !== executionId) {
        // If this step comes from an old/cancelled run, return a promise that never resolves
        // This effectively kills the old async execution
        return new Promise(() => { });
    }
    return new Promise(resolve => {
        // Increment FIRST, then store at the new step index
        currentStepIndex++;
        maxStepReached = currentStepIndex;

        // Store snapshot AT the step that's now being displayed
        stepSnapshots[currentStepIndex] = captureSnapshot();
        updateStepIndicator();

        resolveStep = resolve;
        updateButtons();

        if (isAutoPlaying) {
            triggerNextStep();
        }

        if (isAutoPlaying) {
            triggerNextStep();
        }
    });
}

function updateButtons() {
    // Prev enabled if we are past step 0
    document.getElementById('btn-prev').disabled = currentStepIndex <= 0;

    // Next enabled if:
    // 1. We have history ahead (current < max)
    // 2. OR we are at frontier and algorithm is running (!complete)
    const canGoNext = (currentStepIndex < maxStepReached) || (!algorithmComplete);
    document.getElementById('btn-next').disabled = !canGoNext;
}

document.getElementById('btn-next').addEventListener('click', () => {
    // Case 1: Navigate forward in history
    if (currentStepIndex < maxStepReached) {
        currentStepIndex++;
        restoreSnapshot(stepSnapshots[currentStepIndex]);
        updateStepIndicator();
        updateButtons();
        return;
    }

    // Case 2: Resume algorithm execution
    if (!algorithmComplete && resolveStep) {
        document.getElementById('btn-next').disabled = true;
        resolveStep();
        resolveStep = null;
    }
});

document.getElementById('btn-prev').addEventListener('click', () => {
    // Pause if playing
    if (isAutoPlaying) toggleAutoPlay();

    if (currentStepIndex > 0) {
        currentStepIndex--;
        restoreSnapshot(stepSnapshots[currentStepIndex]);
        updateStepIndicator();
        updateButtons();
    }
});

// Auto-play controls
document.getElementById('btn-play').addEventListener('click', toggleAutoPlay);

document.getElementById('speed-slider').addEventListener('input', (e) => {
    // Invert value so higher slider = faster (lower delay)
    // Slider 100-2000.  Map to delay. 
    // We want nice feel. Let's just use raw value but invert definition if needed?
    // Actually, let's keep it simple: slider value IS delay. 
    // So left (low number) is FAST, right (high number) is SLOW.
    // Wait, usually right is faster.
    // Let's do: Delay = Max - Val + Min.
    // Max=2000, Min=100. Val=2000 => Delay=100 (Fast). Val=100 => Delay=2000 (Slow).
    const val = parseInt(e.target.value);
    autoPlayDelay = 2100 - val;
});

// ============ PLAYGROUND EXECUTOR ============

let playgroundSlots = []; // Store slot config from JSON

let executionId = 0;

async function runPlayground(code, input) {
    // Increment execution ID to invalidate any previous runs
    executionId++;
    const currentRunId = executionId;

    // Reset step tracking
    stepSnapshots = [];
    currentStepIndex = 0;
    maxStepReached = 0;
    algorithmComplete = false;
    updateStepIndicator();
    updateButtons();

    // Stop any existing autoplay
    isAutoPlaying = false;
    document.getElementById('btn-play').textContent = '▶';
    if (autoPlayTimer) clearTimeout(autoPlayTimer);

    // Build slots from JSON config
    buildSlots(playgroundSlots);

    // Clear pointers
    ptrPrimitive.clear();

    // Create Playground class from code string
    const PlaygroundClass = new Function('return ' + code)();
    const playground = new PlaygroundClass();

    // Inject slot primitives dynamically
    for (const [id, slot] of Object.entries(activeSlots)) {
        playground[id] = slot;
    }

    // Always inject ptr and log
    playground.ptr = ptrPrimitive;
    playground.log = log;
    playground.await = () => awaitStep(currentRunId);

    // Capture Step 0 (Initial State)
    stepSnapshots[0] = captureSnapshot();

    // Run!
    log('Starting...');
    try {
        const result = await playground.run(input);

        // Save final state snapshot (increment first to match awaitStep pattern)
        currentStepIndex++;
        maxStepReached = currentStepIndex;
        stepSnapshots[currentStepIndex] = captureSnapshot();
        updateStepIndicator();

        // Mark algorithm as complete for navigation
        algorithmComplete = true;
        updateButtons();

        if (result !== undefined) {
            log(` Finished! Result: ${JSON.stringify(result)}`);
        } else {
            log(` Finished!`);
        }
    } catch (e) {
        log(`❌ Error: ${e.message}`);
        console.error(e);
        algorithmComplete = true;  // Still allow navigation even on error
    }
}

// ============ LOAD PLACEHOLDER ============

let playgroundCode = null;
let playgroundInputs = [];

const params = new URLSearchParams(window.location.search);
const configFile = params.get('config') || 'placeholder.json';

// Populate History Dropdown
fetch('/api/history?section=playground')
    .then(res => res.json())
    .then(historyData => {
        const dropdown = document.getElementById('history-dropdown');
        if (historyData.success && historyData.history.length > 0) {
            dropdown.innerHTML = ''; // Clear loading
            historyData.history.forEach(item => {
                const date = new Date(item.timestamp).toLocaleString();
                const a = document.createElement('a');
                a.href = `?config=../${item.path}`;
                a.innerHTML = `
                            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">${date} &bull; ${item.difficulty}</div>
                        `;
                dropdown.appendChild(a);
            });
        } else {
            dropdown.innerHTML = '<div style="padding: 12px 16px; color: var(--text-sub); font-size: 0.8rem; font-style: italic;">No history yet.</div>';
        }
    })
    .catch(err => {
        console.error("Failed to load history:", err);
        const dropdown = document.getElementById('history-dropdown');
        if (dropdown) dropdown.innerHTML = '<div style="padding: 12px 16px; color: #f87171; font-size: 0.8rem;">Failed to load history</div>';
    });

if (configFile !== 'placeholder.json') {
    document.getElementById('delete-visual-btn').style.display = 'flex';
}

fetch(configFile)
    .then(r => r.json())
    .then(data => {
        playgroundCode = data.code;
        playgroundSlots = data.slots || [];
        playgroundInputs = data.inputs || [];

        // Build input fields from JSON config
        buildInputFields(playgroundInputs);

        // Populate problem description
        document.getElementById('problem-title').textContent = data.name || 'Problem';

        if (data.description) {
            document.getElementById('problem-description').innerHTML = data.description;
        } else {
            document.getElementById('problem-description').innerHTML = '<p>No description provided.</p>';
        }

        // Build tags
        const tagsContainer = document.getElementById('problem-tags');
        tagsContainer.innerHTML = '';

        if (data.difficulty) {
            const diffTag = document.createElement('span');
            diffTag.className = `tag ${data.difficulty.toLowerCase()}`;
            diffTag.textContent = data.difficulty;
            tagsContainer.appendChild(diffTag);
        }

        if (data.tags) {
            data.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
        }

        log('✓ Loaded! Click "Start" to begin.');
    })
    .catch(e => {
        log('❌ Failed to load placeholder.json');
        console.error(e);
    });

function buildInputFields(inputs) {
    const container = document.getElementById('inputs-container');
    container.innerHTML = '';

    if (inputs.length === 0) {
        // Fallback: single generic input
        container.innerHTML = `
                    <div class="input-group">
                        <label class="input-label">Input</label>
                        <input type="text" class="input-field" id="input-0" placeholder="Enter values...">
                    </div>
                `;
        return;
    }

    inputs.forEach((inp, idx) => {
        const group = document.createElement('div');
        group.className = 'input-group';

        const label = document.createElement('label');
        label.className = 'input-label';
        label.textContent = inp.label || `Input ${idx + 1}`;
        label.setAttribute('for', `input-${idx}`);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-field';
        input.id = `input-${idx}`;
        input.placeholder = inp.placeholder || '';
        if (inp.default !== undefined) {
            input.value = inp.default;
        }

        group.appendChild(label);
        group.appendChild(input);
        container.appendChild(group);
    });
}

function reset() {
    if (!playgroundCode) {
        log('Still loading...');
        return;
    }

    // Collect all input values
    const inputValues = [];
    const inputFields = document.querySelectorAll('#inputs-container .input-field');
    inputFields.forEach(field => {
        inputValues.push(field.value);
    });

    runPlayground(playgroundCode, inputValues);
}

// ============ AI GENERATOR ============

// Load API key, platform, and model from localStorage on load
document.addEventListener('DOMContentLoaded', () => {
    const savedPlatform = localStorage.getItem('aiPlatform');
    if (savedPlatform) {
        const platformSelect = document.getElementById('ai-platform');
        if (platformSelect) {
            platformSelect.value = savedPlatform;
        }
    }

    const platform = document.getElementById('ai-platform') ? document.getElementById('ai-platform').value : 'gemini';
    const savedKey = localStorage.getItem(platform === 'groq' ? 'groqApiKey' : 'geminiApiKey');

    // Trigger UI update based on platform
    handlePlatformChange(false); // pass false to avoid double fetching models

    if (savedKey) {
        document.getElementById('ai-api-key').value = savedKey;
        fetchModels();
    }
});

function handlePlatformChange(shouldFetch = true) {
    const platform = document.getElementById('ai-platform').value;
    const keyLabel = document.getElementById('api-key-label');
    const apiKeyInput = document.getElementById('ai-api-key');
    const modelSelect = document.getElementById('ai-model');

    // Save platform selection
    localStorage.setItem('aiPlatform', platform);

    if (platform === 'groq') {
        keyLabel.textContent = 'Groq API Key';
        const savedKey = localStorage.getItem('groqApiKey');
        apiKeyInput.value = savedKey || '';
    } else {
        keyLabel.textContent = 'Gemini API Key';
        const savedKey = localStorage.getItem('geminiApiKey');
        apiKeyInput.value = savedKey || '';
    }

    if (shouldFetch) {
        // Re-fetch models if key exists
        if (apiKeyInput.value.trim()) {
            fetchModels();
        } else {
            modelSelect.innerHTML = '<option value="">Enter API Key to load models...</option>';
        }
    }
}

async function fetchModels() {
    const apiKey = document.getElementById('ai-api-key').value.trim();
    const platform = document.getElementById('ai-platform') ? document.getElementById('ai-platform').value : 'gemini';
    const modelSelect = document.getElementById('ai-model');
    const statusEl = document.getElementById('ai-status');

    if (apiKey) {
        if (platform === 'groq') localStorage.setItem('groqApiKey', apiKey);
        else localStorage.setItem('geminiApiKey', apiKey);
    }

    if (!apiKey) {
        modelSelect.innerHTML = '<option value="">Enter API Key to load models...</option>';
        return;
    }

    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    modelSelect.disabled = true;

    try {
        const apiUrl = window.location.protocol === 'http:' && window.location.hostname === 'localhost' && window.location.port === '3000'
            ? '/api/models'
            : 'http://localhost:3000/api/models';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: apiKey, platform: platform })
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Server returned invalid response. Is the backend running?');
        }

        if (response.ok) {
            modelSelect.innerHTML = '';
            if (data.models && data.models.length > 0) {
                const savedModel = localStorage.getItem('aiModel');
                let modelFound = false;

                data.models.forEach(model => {
                    const option = document.createElement('option');
                    // Extract just the model name part if it has "models/" prefix
                    const modelId = model.name.replace('models/', '');
                    option.value = modelId;
                    option.textContent = model.displayName || modelId;

                    if (savedModel && savedModel === modelId) {
                        option.selected = true;
                        modelFound = true;
                    }

                    modelSelect.appendChild(option);
                });

                // If the saved model wasn't in the list, fallback to defaults
                if (!modelFound) {
                    Array.from(modelSelect.options).forEach(option => {
                        const modelId = option.value;
                        if (platform === 'groq') {
                            if (modelId.includes('llama3-8b-8192') || modelId.includes('mixtral')) {
                                option.selected = true;
                            }
                        } else {
                            if (modelId === 'gemini-3-flash-preview' || modelId === 'gemini-2.5-pro' || modelId === 'gemini-2.5-flash') {
                                option.selected = true;
                            }
                        }
                    });
                }
                modelSelect.disabled = false;
            } else {
                modelSelect.innerHTML = '<option value="">No generating models found</option>';
            }
        } else {
            throw new Error(data.error || 'Failed to fetch models');
        }
    } catch (error) {
        console.error(error);
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
        if (error.message.includes('Failed to fetch')) {
            alert('Error: Could not connect to the local server. Please ensure you have started it by running "node server.js" in your terminal, and access the playground via http://localhost:3000/playground/test.html');
        } else {
            alert("Model Unavailable : " + error.message);
        }
    }
}