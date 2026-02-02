import { state } from '../state.js';
import { drawLine } from '../utils.js';
import { renderQueue, renderStack } from './linear.js';

let currentRunId = 0;

export function initGraph(vals, isDirected) {
    // Reset state
    state.dsData = { nodes: [], edges: [] };
    state.graphCounter = 1;
    state.graphMode = null;
    state.graphSelectedNode = null;

    // Clear Stage
    state.dom.stage.innerHTML = '';
    state.dom.svgLayer.innerHTML = `<defs>
        <marker id="arrow" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
    </defs>`;
}

export function setGraphMode(mode) {
    state.graphMode = mode;
    state.graphSelectedNode = null; // Reset selection on mode switch

    // Reset highlights
    document.querySelectorAll('.circle-node').forEach(n => n.style.backgroundColor = '');

    // UI Feedback is handled in main.js via class toggling
    let msg = "Select a tool.";
    if (mode === 'node') msg = "Click anywhere on the canvas to add a node.";
    if (mode && mode.startsWith('edge')) msg = "Select Source Node, then Select Target Node.";
    if (mode === 'del-node') msg = "Click a Node to delete it.";
    if (mode === 'del-edge') msg = "Select Source Node, then Select Target Node to remove edge.";
    if (mode === 'bfs') msg = "Click a starting Node for BFS.";
    if (mode === 'dfs') msg = "Click a starting Node for DFS.";

    state.dom.graphInstructions.innerText = msg;
}

export function handleStageClick(e) {
    if (state.currentMode !== 'graph') return;
    if (state.graphMode !== 'node') return;

    // Get click position relative to visual area
    const rect = state.dom.visualArea.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates (accounting for zoom/pan)
    const worldX = (screenX - state.pointX) / state.scale;
    const worldY = (screenY - state.pointY) / state.scale;

    addNode(worldX, worldY);
}

function addNode(x, y) {
    const val = state.graphCounter++;
    // Fallback ID generator since crypto.randomUUID requires secure context
    const id = 'gnode-' + (Date.now().toString(36) + Math.random().toString(36).substr(2, 5));

    const node = { id, x, y, val };
    state.dsData.nodes.push(node);

    const el = document.createElement('div');
    el.className = 'node-wrapper';
    el.id = id;
    el.style.left = (x - 25) + 'px'; // Center
    el.style.top = (y - 25) + 'px';
    el.innerHTML = `<div class="circle-node" onclick="window.onGraphNodeClick(event, '${id}')">${val}</div>`;
    state.dom.stage.appendChild(el);
}

// Global handler exposed for onclick
window.onGraphNodeClick = (e, id) => {
    e.stopPropagation(); // Don't trigger stage click
    if (!state.graphMode) return;

    if (state.graphMode === 'bfs') {
        setGraphMode(null); // Clear mode
        runGraphBFS(id);
        return;
    }
    if (state.graphMode === 'dfs') {
        setGraphMode(null);
        runGraphDFS(id);
        return;
    }

    // Delete Node Mode
    if (state.graphMode === 'del-node') {
        deleteNode(id);
        return;
    }

    // Edge Creation or Deletion Modes
    if (state.graphMode.startsWith('edge') || state.graphMode === 'del-edge') {
        if (!state.graphSelectedNode) {
            // Select Source
            state.graphSelectedNode = id;
            highlightNode(id, '#3b82f6'); // Blue select

            if (state.graphMode === 'del-edge') state.dom.graphInstructions.innerText = "Now select the Target Node to delete connection.";
            else state.dom.graphInstructions.innerText = "Now select the Target Node.";

        } else {
            // Select Target
            if (state.graphSelectedNode === id) {
                // Cancel if same
                resetSelection();
                return;
            }

            if (state.graphMode === 'del-edge') {
                deleteEdge(state.graphSelectedNode, id);
            } else {
                addEdge(state.graphSelectedNode, id, state.graphMode === 'edge-dir');
            }
            resetSelection();
        }
    }
};

function addEdge(sourceId, targetId, isDirected) {
    // Check if exists
    const exists = state.dsData.edges.some(e =>
        (e.source === sourceId && e.target === targetId) ||
        (!isDirected && !e.isDirected && e.source === targetId && e.target === sourceId)
    );
    if (exists) return;

    const edge = { source: sourceId, target: targetId, isDirected };
    state.dsData.edges.push(edge);
    drawLine(sourceId, targetId, isDirected);
}

function deleteNode(id) {
    // Remove Node Logic
    state.dsData.nodes = state.dsData.nodes.filter(n => n.id !== id);
    // Remove all associated edges
    state.dsData.edges = state.dsData.edges.filter(e => e.source !== id && e.target !== id);

    // Remove DOM
    const el = document.getElementById(id);
    if (el) el.remove();

    // Redraw all lines (since we removed edges)
    reDrawEdges();
}

function deleteEdge(sourceId, targetId) {
    // Remove Edge
    state.dsData.edges = state.dsData.edges.filter(e =>
        !(e.source === sourceId && e.target === targetId) &&
        !(e.source === targetId && e.target === sourceId && !e.isDirected) // Handle undirected reverse check too
    );
    reDrawEdges();
}

function reDrawEdges() {
    state.dom.svgLayer.innerHTML = `<defs>
        <marker id="arrow" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
    </defs>`;

    state.dsData.edges.forEach(e => {
        drawLine(e.source, e.target, e.isDirected);
    });
}



// --- Traversals ---

function renderVisited(visitedSet) {
    const cont = state.dom.visualVisited;
    cont.innerHTML = '';
    visitedSet.forEach(id => {
        // Find val
        const node = state.dsData.nodes.find(n => n.id === id);
        if (node) {
            cont.innerHTML += `<div class="visited-item">${node.val}</div>`;
        }
    });
}

// Graph Step Controller - Expose to state for auto-play access
state.graphStepController = {
    steps: [],
    currentStep: 0,
    isActive: false,
    traversalType: null // 'bfs' or 'dfs'
};
const graphStepController = state.graphStepController;

// Generate Graph BFS Steps
function generateGraphBFSSteps(startNodeId) {
    const steps = [];
    const visited = new Set();
    const output = [];
    const allNodes = state.dsData.nodes;

    const startNode = allNodes.find(n => n.id === startNodeId);

    // Initial step
    steps.push({
        type: 'init',
        queue: [startNodeId],
        visited: new Set(),
        output: [],
        processing: null,
        highlight: null,
        message: `Starting BFS from node ${startNode.val}`
    });

    // BFS from a given starting node
    function bfsFromNode(nodeId, isNewComponent = false) {
        const queue = [nodeId];
        visited.add(nodeId);
        const node = allNodes.find(n => n.id === nodeId);

        if (isNewComponent) {
            steps.push({
                type: 'new-component',
                queue: [...queue],
                visited: new Set(visited),
                output: [...output],
                processing: null,
                highlight: nodeId,
                message: `Starting new component from node ${node.val}`
            });
        }

        while (queue.length > 0) {
            const currId = queue.shift();
            const currNode = allNodes.find(n => n.id === currId);

            // Dequeue step
            steps.push({
                type: 'dequeue',
                node: currNode,
                queue: [...queue],
                visited: new Set(visited),
                output: [...output],
                processing: currId,
                highlight: null,
                message: `Dequeue node ${currNode.val}`
            });

            // Process step
            output.push(currNode.val);
            steps.push({
                type: 'process',
                node: currNode,
                queue: [...queue],
                visited: new Set(visited),
                output: [...output],
                processing: currId,
                highlight: null,
                message: `Processing node ${currNode.val}`
            });

            // Get neighbors
            const neighbors = getNeighbors(currId);
            for (let neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    const neighborNode = allNodes.find(n => n.id === neighborId);

                    // Highlight neighbor step
                    steps.push({
                        type: 'highlight-neighbor',
                        node: currNode,
                        neighbor: neighborNode,
                        queue: [...queue],
                        visited: new Set(visited),
                        output: [...output],
                        processing: currId,
                        highlight: neighborId,
                        message: `Found unvisited neighbor ${neighborNode.val}`
                    });

                    // Add to visited and queue
                    visited.add(neighborId);
                    queue.push(neighborId);

                    // Enqueue step
                    steps.push({
                        type: 'enqueue',
                        node: currNode,
                        neighbor: neighborNode,
                        queue: [...queue],
                        visited: new Set(visited),
                        output: [...output],
                        processing: currId,
                        highlight: null,
                        message: `Added ${neighborNode.val} to queue`
                    });
                }
            }

            // Done with node
            steps.push({
                type: 'done',
                node: currNode,
                queue: [...queue],
                visited: new Set(visited),
                output: [...output],
                processing: null,
                highlight: null,
                message: `Done with node ${currNode.val}`
            });
        }
    }

    // Start BFS from the starting node
    bfsFromNode(startNodeId, false);

    // Check for disconnected components
    for (const node of allNodes) {
        if (!visited.has(node.id)) {
            bfsFromNode(node.id, true);
        }
    }

    // Complete
    steps.push({
        type: 'complete',
        queue: [],
        visited: new Set(visited),
        output: [...output],
        processing: null,
        highlight: null,
        message: 'BFS Complete! (all components visited)'
    });

    return steps;
}

// Generate Graph DFS Steps
function generateGraphDFSSteps(startNodeId) {
    const steps = [];
    const visited = new Set();
    const stackFrames = [];
    const output = [];
    const allNodes = state.dsData.nodes;

    const startNode = allNodes.find(n => n.id === startNodeId);

    // Initial step
    steps.push({
        type: 'init',
        stackFrames: [],
        visited: new Set(),
        output: [],
        processing: null,
        highlight: null,
        message: `Starting DFS from node ${startNode.val}`
    });

    function traverse(nodeId, isNewComponent = false) {
        visited.add(nodeId);
        const node = allNodes.find(n => n.id === nodeId);

        if (isNewComponent) {
            steps.push({
                type: 'new-component',
                stackFrames: stackFrames.map(f => ({ ...f })),
                visited: new Set(visited),
                output: [...output],
                processing: null,
                highlight: nodeId,
                message: `Starting new component from node ${node.val}`
            });
        }

        // Push to stack
        stackFrames.push({ val: node.val, status: 'Enter' });
        steps.push({
            type: 'push',
            node: node,
            stackFrames: stackFrames.map(f => ({ ...f })),
            visited: new Set(visited),
            output: [...output],
            processing: nodeId,
            highlight: null,
            message: `Enter node ${node.val}`
        });

        // Process
        output.push(node.val);
        steps.push({
            type: 'process',
            node: node,
            stackFrames: stackFrames.map(f => ({ ...f })),
            visited: new Set(visited),
            output: [...output],
            processing: nodeId,
            highlight: null,
            message: `Processing node ${node.val}`
        });

        const neighbors = getNeighbors(nodeId);
        for (let neighborId of neighbors) {
            if (!visited.has(neighborId)) {
                const neighborNode = allNodes.find(n => n.id === neighborId);

                // Highlight neighbor
                stackFrames[stackFrames.length - 1].status = `Check ${neighborNode.val}`;
                steps.push({
                    type: 'highlight-neighbor',
                    node: node,
                    neighbor: neighborNode,
                    stackFrames: stackFrames.map(f => ({ ...f })),
                    visited: new Set(visited),
                    output: [...output],
                    processing: nodeId,
                    highlight: neighborId,
                    message: `Found unvisited neighbor ${neighborNode.val}`
                });

                // Recurse
                traverse(neighborId, false);

                // Backtrack
                stackFrames[stackFrames.length - 1].status = 'Back';
                steps.push({
                    type: 'backtrack',
                    node: node,
                    stackFrames: stackFrames.map(f => ({ ...f })),
                    visited: new Set(visited),
                    output: [...output],
                    processing: nodeId,
                    highlight: null,
                    message: `Backtrack to node ${node.val}`
                });
            }
        }

        // Pop from stack
        stackFrames.pop();
        steps.push({
            type: 'pop',
            node: node,
            stackFrames: stackFrames.map(f => ({ ...f })),
            visited: new Set(visited),
            output: [...output],
            processing: null,
            highlight: null,
            message: `Exit node ${node.val}`
        });
    }

    // Start DFS from the starting node
    traverse(startNodeId, false);

    // Check for disconnected components
    for (const node of allNodes) {
        if (!visited.has(node.id)) {
            traverse(node.id, true);
        }
    }

    // Complete
    steps.push({
        type: 'complete',
        stackFrames: [],
        visited: new Set(visited),
        output: [...output],
        processing: null,
        highlight: null,
        message: 'DFS Complete! (all components visited)'
    });

    return steps;
}

// Render current graph step
export function renderGraphStep() {
    const { steps, currentStep, traversalType } = graphStepController;
    if (!steps.length) return;

    const step = steps[currentStep];

    // Reset all node colors
    document.querySelectorAll('.circle-node').forEach(n => n.style.backgroundColor = '');

    // Mark visited nodes (green)
    if (step.visited) {
        step.visited.forEach(id => highlightNode(id, '#10b981'));
    }

    // Highlight processing node (pink)
    if (step.processing) {
        highlightNode(step.processing, '#ec4899');
    }

    // Highlight neighbor about to be added (orange)
    if (step.highlight) {
        highlightNode(step.highlight, '#f59e0b');
    }

    // Update output
    state.dom.traversalOutput.innerText = step.output?.join(' -> ') || '';

    // Update visited display
    if (step.visited) {
        renderVisited(step.visited);
    }

    // Update queue (BFS)
    if (step.queue !== undefined) {
        const vals = step.queue.map(id => state.dsData.nodes.find(n => n.id === id)?.val);
        renderQueue(vals.filter(v => v !== undefined), state.dom.visualQueue, true);
    }

    // Update stack (DFS)
    if (step.stackFrames !== undefined) {
        const vals = step.stackFrames.map(f => `<div class="st-val">${f.val}</div><div class="st-status">${f.status}</div>`);
        renderStack(vals, state.dom.visualStack, true);
    }

    // Update step indicator
    state.dom.stepIndicator.innerText = step.message || `Step ${currentStep + 1}`;
}

export function nextGraphStep() {
    if (!graphStepController.isActive) return;
    if (graphStepController.currentStep >= graphStepController.steps.length - 1) return;

    graphStepController.currentStep++;
    renderGraphStep();
    updateGraphStepButtons();
}

export function prevGraphStep() {
    if (!graphStepController.isActive) return;
    if (graphStepController.currentStep <= 0) return;

    graphStepController.currentStep--;
    renderGraphStep();
    updateGraphStepButtons();
}

export function updateGraphStepButtons() {
    const { steps, currentStep } = graphStepController;
    state.dom.btnPrevStep.disabled = currentStep <= 0;
    state.dom.btnNextStep.disabled = currentStep >= steps.length - 1;
}

export function resetGraphStepController() {
    graphStepController.steps = [];
    graphStepController.currentStep = 0;
    graphStepController.isActive = false;
    graphStepController.traversalType = null;

    // Reset node colors
    document.querySelectorAll('.circle-node').forEach(n => n.style.backgroundColor = '');
}

export function runGraphBFS(startNodeId) {
    // Reset previous
    resetGraphStepController();
    document.querySelectorAll('.circle-node').forEach(n => n.style.backgroundColor = '');
    state.dom.traversalOutput.innerText = '';
    state.dom.visualQueue.innerHTML = '';
    state.dom.visualStack.innerHTML = '';
    state.dom.visualVisited.innerHTML = '';

    // Generate steps
    const steps = generateGraphBFSSteps(startNodeId);
    graphStepController.steps = steps;
    graphStepController.currentStep = 0;
    graphStepController.isActive = true;
    graphStepController.traversalType = 'bfs';

    // Show step controls
    state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderGraphStep();
    updateGraphStepButtons();
}

export function runGraphDFS(startNodeId) {
    // Reset previous
    resetGraphStepController();
    document.querySelectorAll('.circle-node').forEach(n => n.style.backgroundColor = '');
    state.dom.traversalOutput.innerText = '';
    state.dom.visualQueue.innerHTML = '';
    state.dom.visualStack.innerHTML = '';
    state.dom.visualVisited.innerHTML = '';

    // Generate steps
    const steps = generateGraphDFSSteps(startNodeId);
    graphStepController.steps = steps;
    graphStepController.currentStep = 0;
    graphStepController.isActive = true;
    graphStepController.traversalType = 'dfs';

    // Show step controls
    state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderGraphStep();
    updateGraphStepButtons();
}

function getNeighbors(nodeId) {
    // Find all edges where source is nodeId (directed)
    // Or if undirected, also where target is nodeId
    // Sort logic for consistency?

    // For now simple adjacency
    let neighbors = [];
    state.dsData.edges.forEach(e => {
        if (e.source === nodeId) neighbors.push(e.target);
        else if (!e.isDirected && e.target === nodeId) neighbors.push(e.source);
    });
    return neighbors;
}

function renderVisualQueue(queueIds) {
    const vals = queueIds.map(id => state.dsData.nodes.find(n => n.id === id).val);
    renderQueue(vals, state.dom.visualQueue, true);
}

function renderVisualStack(frames) {
    const vals = frames.map(f => `<div class="st-val">${f.val}</div><div class="st-status">${f.status}</div>`);
    renderStack(vals, state.dom.visualStack, true);
}

function highlightNode(id, color) {
    const el = document.getElementById(id);
    if (el) {
        el.querySelector('.circle-node').style.backgroundColor = color;
    }
}

function resetSelection() {
    state.graphSelectedNode = null;
    document.querySelectorAll('.circle-node').forEach(n => n.style.backgroundColor = '');
    state.dom.graphInstructions.innerText = "Select Source Node, then Select Target Node.";
}
