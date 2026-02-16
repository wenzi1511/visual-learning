import { state } from '../state.js';

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

    // Row/col labels
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
