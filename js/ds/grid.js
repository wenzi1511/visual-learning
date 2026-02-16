import { state } from '../state.js';
import { renderQueue, renderStack } from './linear.js';

// ============ GRID DATA STRUCTURE ============

/**
 * Initialize the grid with given rows and columns, filled with 0s.
 */
export function initGrid(rows, cols) {
    rows = Math.max(1, Math.min(rows, 20)); // Clamp 1-20
    cols = Math.max(1, Math.min(cols, 20));

    state.gridData = [];
    for (let r = 0; r < rows; r++) {
        state.gridData.push(new Array(cols).fill(0));
    }
    renderGrid();
}

/**
 * Render the grid on the stage as a CSS grid of clickable cells.
 */
export function renderGrid() {
    const stage = state.dom.stage;
    if (!stage || !state.gridData || state.gridData.length === 0) return;

    const rows = state.gridData.length;
    const cols = state.gridData[0].length;

    // Calculate cell size based on grid dimensions
    const maxCellSize = 80;
    const minCellSize = 40;
    const cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(500 / Math.max(rows, cols))));

    stage.innerHTML = '';

    // Container
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        display: inline-grid;
        grid-template-columns: repeat(${cols}, ${cellSize}px);
        grid-template-rows: repeat(${rows}, ${cellSize}px);
        gap: 3px;
        padding: 16px;
        background: rgba(30, 41, 59, 0.6);
        border-radius: 16px;
        border: 1px solid rgba(100, 116, 139, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    // Top column labels
    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
        position: absolute;
        top: -24px; left: 16px; right: 16px;
        display: grid;
        grid-template-columns: repeat(${cols}, ${cellSize}px);
        gap: 3px;
    `;
    for (let c = 0; c < cols; c++) {
        const lbl = document.createElement('div');
        lbl.style.cssText = `
            text-align: center;
            font-family: "Fira Code", monospace;
            font-size: 0.7rem;
            color: #64748b;
        `;
        lbl.textContent = c;
        labelRow.appendChild(lbl);
    }
    container.appendChild(labelRow);

    // Left row labels
    const labelCol = document.createElement('div');
    labelCol.style.cssText = `
        position: absolute;
        left: -24px; top: 16px; bottom: 16px;
        display: grid;
        grid-template-rows: repeat(${rows}, ${cellSize}px);
        gap: 3px;
    `;
    for (let r = 0; r < rows; r++) {
        const lbl = document.createElement('div');
        lbl.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: "Fira Code", monospace;
            font-size: 0.7rem;
            color: #64748b;
        `;
        lbl.textContent = r;
        labelCol.appendChild(lbl);
    }
    container.appendChild(labelCol);

    // Cells
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            const val = state.gridData[r][c];
            const isEmpty = val === 0 || val === '0';

            cell.style.cssText = `
                width: ${cellSize}px;
                height: ${cellSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: ${cellSize > 50 ? '1.1rem' : '0.85rem'};
                font-family: "Fira Code", monospace;
                border-radius: ${cellSize > 50 ? '10px' : '6px'};
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
                user-select: none;
                background: ${isEmpty
                    ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8))'
                    : 'linear-gradient(145deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.7))'};
                border: 2px solid ${isEmpty ? 'rgba(100, 116, 139, 0.4)' : 'rgba(96, 165, 250, 0.7)'};
                color: ${isEmpty ? '#64748b' : '#ffffff'};
                box-shadow: ${isEmpty
                    ? '0 2px 6px rgba(0, 0, 0, 0.2)'
                    : '0 2px 12px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1) inset'};
            `;

            cell.textContent = val;
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Hover effects
            cell.addEventListener('mouseenter', () => {
                cell.style.transform = 'scale(1.08)';
                cell.style.zIndex = '10';
                if (isEmpty) {
                    cell.style.borderColor = 'rgba(100, 116, 139, 0.7)';
                } else {
                    cell.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.5)';
                }
            });
            cell.addEventListener('mouseleave', () => {
                cell.style.transform = '';
                cell.style.zIndex = '';
                if (isEmpty) {
                    cell.style.borderColor = 'rgba(100, 116, 139, 0.4)';
                } else {
                    cell.style.boxShadow = '0 2px 12px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1) inset';
                }
            });

            // Click to set value
            cell.addEventListener('click', () => {
                handleGridCellClick(r, c);
            });

            container.appendChild(cell);
        }
    }

    stage.appendChild(container);
}

/**
 * Handle a cell click: set the cell value from the replace input.
 */
export function handleGridCellClick(row, col) {
    const replaceInput = state.dom.gridReplaceVal;
    if (!replaceInput) return;

    const rawVal = replaceInput.value.trim();
    const val = rawVal === '' ? 0 : (isNaN(Number(rawVal)) ? rawVal : Number(rawVal));

    state.gridData[row][col] = val;
    renderGrid();
}

/**
 * Set a specific cell value programmatically.
 */
export function setGridCell(row, col, val) {
    if (!state.gridData || row < 0 || row >= state.gridData.length) return;
    if (col < 0 || col >= state.gridData[0].length) return;
    state.gridData[row][col] = val;
    renderGrid();
}

/**
 * Get a specific cell value.
 */
export function getGridCell(row, col) {
    if (!state.gridData || row < 0 || row >= state.gridData.length) return undefined;
    if (col < 0 || col >= state.gridData[0].length) return undefined;
    return state.gridData[row][col];
}

/**
 * Highlight a specific cell with a color.
 */
export function highlightGridCell(row, col, color) {
    const stage = state.dom.stage;
    if (!stage) return;
    const cells = stage.querySelectorAll('[data-row][data-col]');
    cells.forEach(cell => {
        if (parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col) {
            cell.style.background = color;
            cell.style.borderColor = color;
            cell.style.color = '#ffffff';
            cell.style.boxShadow = `0 2px 16px ${color}66`;
        }
    });
}

/**
 * Clear all highlights — re-renders the grid with default styling.
 */
export function clearGridHighlights() {
    renderGrid();
}

// ============ GRID STEP CONTROLLER ============

// Grid Step Controller - Expose to state for auto-play access
state.gridStepController = {
    steps: [],
    currentStep: 0,
    isActive: false,
    traversalType: null // 'bfs' or 'dfs'
};
const gridStepController = state.gridStepController;

function cellKey(r, c) { return `${r},${c}`; }
function cellLabel(r, c) { return `(${r},${c})`; }
function cellVal(r, c) { return state.gridData[r][c]; }

// Directions: up, right, down, left
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const DIR_NAMES = ['↑', '→', '↓', '←'];

function getGridNeighbors(r, c) {
    const rows = state.gridData.length;
    const cols = state.gridData[0].length;
    const neighbors = [];
    for (let d = 0; d < DIRS.length; d++) {
        const nr = r + DIRS[d][0];
        const nc = c + DIRS[d][1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            neighbors.push({ r: nr, c: nc, dir: DIR_NAMES[d] });
        }
    }
    return neighbors;
}

// --- Render visited cells in the aux panel ---
function renderGridVisited(visitedSet) {
    const cont = state.dom.visualVisited;
    if (!cont) return;
    cont.innerHTML = '';
    visitedSet.forEach(key => {
        cont.innerHTML += `<div class="visited-item">${key}</div>`;
    });
}

// --- Highlight a grid cell by key ---
function highlightGridCellByKey(key, color) {
    const [r, c] = key.split(',').map(Number);
    const cells = state.dom.stage.querySelectorAll('[data-row][data-col]');
    cells.forEach(cell => {
        if (parseInt(cell.dataset.row) === r && parseInt(cell.dataset.col) === c) {
            cell.style.background = color;
            cell.style.borderColor = color;
            cell.style.color = '#ffffff';
            cell.style.boxShadow = `0 4px 20px ${color}66`;
        }
    });
}

// ============ RENDER GRID STEP ============

export function renderGridStep() {
    const { steps, currentStep, traversalType } = gridStepController;
    if (!steps.length) return;

    const step = steps[currentStep];

    // Re-render base grid (resets all colors)
    renderGrid();

    // Mark visited cells (green)
    if (step.visited) {
        step.visited.forEach(key => highlightGridCellByKey(key, '#10b981'));
    }

    // Highlight processing cell (pink)
    if (step.processing) {
        highlightGridCellByKey(step.processing, '#ec4899');
    }

    // Highlight neighbor about to be added (orange)
    if (step.highlight) {
        highlightGridCellByKey(step.highlight, '#f59e0b');
    }

    // Update traversal output
    if (state.dom.traversalOutput) {
        state.dom.traversalOutput.innerText = step.output?.join(' → ') || '';
    }

    // Update visited display
    if (step.visited && state.dom.visualVisited) {
        renderGridVisited(step.visited);
    }

    // Update queue (BFS)
    if (step.queue !== undefined && state.dom.visualQueue) {
        renderQueue(step.queue, state.dom.visualQueue, true);
    }

    // Update stack (DFS)
    if (step.stackFrames !== undefined && state.dom.visualStack) {
        const vals = step.stackFrames.map(f => `<div class="st-val">${f.val}</div><div class="st-status">${f.status}</div>`);
        renderStack(vals, state.dom.visualStack, true);
    }

    // Update step indicator
    if (state.dom.stepIndicator) {
        state.dom.stepIndicator.innerText = step.message || `Step ${currentStep + 1}`;
    }
}

// ============ STEP NAVIGATION ============

export function nextGridStep() {
    if (!gridStepController.isActive) return;
    if (gridStepController.currentStep >= gridStepController.steps.length - 1) return;
    gridStepController.currentStep++;
    renderGridStep();
}

export function prevGridStep() {
    if (!gridStepController.isActive) return;
    if (gridStepController.currentStep <= 0) return;
    gridStepController.currentStep--;
    renderGridStep();
}

export function resetGridStepController() {
    gridStepController.steps = [];
    gridStepController.currentStep = 0;
    gridStepController.isActive = false;
    gridStepController.traversalType = null;
    if (state.dom.stepControls) {
        state.dom.stepControls.classList.add('hidden');
    }
}

// ============ BFS ON GRID ============

function generateGridBFSSteps(startRow, startCol) {
    const steps = [];
    const visited = new Set();
    const output = [];
    const startKey = cellKey(startRow, startCol);

    // Initial step
    steps.push({
        type: 'init',
        queue: [startKey],
        visited: new Set(),
        output: [],
        processing: null,
        highlight: null,
        message: `Starting BFS from ${cellLabel(startRow, startCol)}`
    });

    const queue = [startKey];
    visited.add(startKey);

    while (queue.length > 0) {
        const currKey = queue.shift();
        const [r, c] = currKey.split(',').map(Number);

        // Dequeue step
        steps.push({
            type: 'dequeue',
            queue: [...queue],
            visited: new Set(visited),
            output: [...output],
            processing: currKey,
            highlight: null,
            message: `Dequeue ${cellLabel(r, c)} — val: ${cellVal(r, c)}`
        });

        // Process step
        output.push(cellLabel(r, c));
        steps.push({
            type: 'process',
            queue: [...queue],
            visited: new Set(visited),
            output: [...output],
            processing: currKey,
            highlight: null,
            message: `Processing ${cellLabel(r, c)}`
        });

        // Explore neighbors
        const neighbors = getGridNeighbors(r, c);
        for (const { r: nr, c: nc, dir } of neighbors) {
            const nKey = cellKey(nr, nc);
            if (!visited.has(nKey)) {
                // Highlight neighbor step
                steps.push({
                    type: 'highlight-neighbor',
                    queue: [...queue],
                    visited: new Set(visited),
                    output: [...output],
                    processing: currKey,
                    highlight: nKey,
                    message: `Found unvisited neighbor ${cellLabel(nr, nc)} ${dir}`
                });

                // Add to visited and queue
                visited.add(nKey);
                queue.push(nKey);

                // Enqueue step
                steps.push({
                    type: 'enqueue',
                    queue: [...queue],
                    visited: new Set(visited),
                    output: [...output],
                    processing: currKey,
                    highlight: null,
                    message: `Added ${cellLabel(nr, nc)} to queue`
                });
            }
        }

        // Done with cell
        steps.push({
            type: 'done',
            queue: [...queue],
            visited: new Set(visited),
            output: [...output],
            processing: null,
            highlight: null,
            message: `Done with ${cellLabel(r, c)}`
        });
    }

    // Complete
    steps.push({
        type: 'complete',
        queue: [],
        visited: new Set(visited),
        output: [...output],
        processing: null,
        highlight: null,
        message: `BFS Complete! Visited ${visited.size} cells`
    });

    return steps;
}

export function runGridBFS(startRow, startCol) {
    // Reset previous
    resetGridStepController();
    renderGrid();
    if (state.dom.traversalOutput) state.dom.traversalOutput.innerText = '';
    if (state.dom.visualQueue) state.dom.visualQueue.innerHTML = '';
    if (state.dom.visualStack) state.dom.visualStack.innerHTML = '';
    if (state.dom.visualVisited) state.dom.visualVisited.innerHTML = '';

    // Show aux panel
    if (state.dom.auxContainer) state.dom.auxContainer.classList.remove('hidden');

    // Generate steps
    const steps = generateGridBFSSteps(startRow, startCol);
    gridStepController.steps = steps;
    gridStepController.currentStep = 0;
    gridStepController.isActive = true;
    gridStepController.traversalType = 'bfs';

    // Show step controls
    if (state.dom.stepControls) state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderGridStep();
}

// ============ DFS ON GRID ============

function generateGridDFSSteps(startRow, startCol) {
    const steps = [];
    const visited = new Set();
    const stackFrames = [];
    const output = [];

    // Initial step
    steps.push({
        type: 'init',
        stackFrames: [],
        visited: new Set(),
        output: [],
        processing: null,
        highlight: null,
        message: `Starting DFS from ${cellLabel(startRow, startCol)}`
    });

    function traverse(r, c) {
        const key = cellKey(r, c);
        visited.add(key);

        // Push to stack
        stackFrames.push({ val: cellLabel(r, c), status: 'Enter' });
        steps.push({
            type: 'push',
            stackFrames: stackFrames.map(f => ({ ...f })),
            visited: new Set(visited),
            output: [...output],
            processing: key,
            highlight: null,
            message: `Enter ${cellLabel(r, c)} — val: ${cellVal(r, c)}`
        });

        // Process
        output.push(cellLabel(r, c));
        steps.push({
            type: 'process',
            stackFrames: stackFrames.map(f => ({ ...f })),
            visited: new Set(visited),
            output: [...output],
            processing: key,
            highlight: null,
            message: `Processing ${cellLabel(r, c)}`
        });

        // Explore neighbors
        const neighbors = getGridNeighbors(r, c);
        for (const { r: nr, c: nc, dir } of neighbors) {
            const nKey = cellKey(nr, nc);
            if (!visited.has(nKey)) {
                // Highlight neighbor
                stackFrames[stackFrames.length - 1].status = `Check ${cellLabel(nr, nc)}`;
                steps.push({
                    type: 'highlight-neighbor',
                    stackFrames: stackFrames.map(f => ({ ...f })),
                    visited: new Set(visited),
                    output: [...output],
                    processing: key,
                    highlight: nKey,
                    message: `Found unvisited neighbor ${cellLabel(nr, nc)} ${dir}`
                });

                // Recurse
                traverse(nr, nc);

                // Backtrack
                stackFrames[stackFrames.length - 1].status = 'Back';
                steps.push({
                    type: 'backtrack',
                    stackFrames: stackFrames.map(f => ({ ...f })),
                    visited: new Set(visited),
                    output: [...output],
                    processing: key,
                    highlight: null,
                    message: `Backtrack to ${cellLabel(r, c)}`
                });
            }
        }

        // Pop from stack
        stackFrames.pop();
        steps.push({
            type: 'pop',
            stackFrames: stackFrames.map(f => ({ ...f })),
            visited: new Set(visited),
            output: [...output],
            processing: null,
            highlight: null,
            message: `Exit ${cellLabel(r, c)}`
        });
    }

    // Start DFS
    traverse(startRow, startCol);

    // Complete
    steps.push({
        type: 'complete',
        stackFrames: [],
        visited: new Set(visited),
        output: [...output],
        processing: null,
        highlight: null,
        message: `DFS Complete! Visited ${visited.size} cells`
    });

    return steps;
}

export function runGridDFS(startRow, startCol) {
    // Reset previous
    resetGridStepController();
    renderGrid();
    if (state.dom.traversalOutput) state.dom.traversalOutput.innerText = '';
    if (state.dom.visualQueue) state.dom.visualQueue.innerHTML = '';
    if (state.dom.visualStack) state.dom.visualStack.innerHTML = '';
    if (state.dom.visualVisited) state.dom.visualVisited.innerHTML = '';

    // Show aux panel
    if (state.dom.auxContainer) state.dom.auxContainer.classList.remove('hidden');

    // Generate steps
    const steps = generateGridDFSSteps(startRow, startCol);
    gridStepController.steps = steps;
    gridStepController.currentStep = 0;
    gridStepController.isActive = true;
    gridStepController.traversalType = 'dfs';

    // Show step controls
    if (state.dom.stepControls) state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderGridStep();
}
