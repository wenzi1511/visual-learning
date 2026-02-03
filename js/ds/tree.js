import { state } from '../state.js';
import { drawLine } from '../utils.js';
import { renderStack, renderQueue } from './linear.js';

export function initBST(vals) {
    const Node = (v) => ({ id: crypto.randomUUID(), val: v, left: null, right: null });
    let root = null;

    vals.forEach(v => {
        if (!root) { root = Node(v); return; }
        let curr = root;
        while (true) {
            if (v < curr.val) {
                if (!curr.left) { curr.left = Node(v); break; }
                curr = curr.left;
            } else {
                if (!curr.right) { curr.right = Node(v); break; }
                curr = curr.right;
            }
        }
    });
    state.treeRoot = root; // Export to state for traversals
    renderTree(root);
}

// --- Traversal Logic ---

// Helper: Highlight node
function highlightNode(id, color = '#ec4899') {
    const el = document.getElementById(id);
    if (el) {
        const circle = el.querySelector('.circle-node');
        if (circle) circle.style.backgroundColor = color;
    }
}

function resetNodeColor(id) {
    const el = document.getElementById(id);
    if (el) {
        const circle = el.querySelector('.circle-node');
        if (circle) circle.style.backgroundColor = '';
    }
}

// Helper: Update Output
function appendToOutput(val) {
    const out = state.dom.traversalOutput;
    if (out.innerText === '') out.innerText = val;
    else out.innerText += ` -> ${val}`;
}

// Helper: Render Queue
function renderVisualQueue(queue) {
    // Map nodes to values for the linear renderer
    const vals = queue.map(n => n.val);
    renderQueue(vals, state.dom.visualQueue, true);
}

// Helper: Render Stack (Recursion)
function renderVisualStack(stackFrames) {
    // stackFrames is [{val, status}, ...]. We map to strings.
    const vals = stackFrames.map(f => `<div class="st-val">${f.val}</div><div class="st-status">${f.status}</div>`);
    renderStack(vals, state.dom.visualStack, true);
}

// Global ID to track current animation run
let currentRunId = 0;

// Tree Step Controller - Expose to state for auto-play access
state.treeStepController = {
    steps: [],
    currentStep: 0,
    isActive: false,
    traversalType: null // 'bfs', 'pre', 'in', 'post'
};
const treeStepController = state.treeStepController;

// Generate BFS steps
function generateBFSSteps(root) {
    const steps = [];
    if (!root) return steps;

    const queue = [root];
    const output = [];

    // Initial step
    steps.push({
        type: 'init',
        queue: [...queue],
        output: [...output],
        processing: null,
        visited: []
    });

    while (queue.length > 0) {
        const curr = queue.shift();

        // Dequeue step
        steps.push({
            type: 'dequeue',
            node: curr,
            queue: [...queue],
            output: [...output],
            processing: curr.id,
            visited: steps[steps.length - 1].visited
        });

        // Process step
        output.push(curr.val);
        const visitedSoFar = [...steps[steps.length - 1].visited, curr.id];
        steps.push({
            type: 'process',
            node: curr,
            queue: [...queue],
            output: [...output],
            processing: curr.id,
            visited: visitedSoFar
        });

        // Enqueue left
        if (curr.left) {
            // First highlight the child we're about to add
            steps.push({
                type: 'highlight-left',
                node: curr,
                child: curr.left,
                queue: [...queue],
                output: [...output],
                processing: curr.id,
                highlight: curr.left.id,
                visited: visitedSoFar
            });
            // Then add to queue
            queue.push(curr.left);
            steps.push({
                type: 'enqueue-left',
                node: curr,
                child: curr.left,
                queue: [...queue],
                output: [...output],
                processing: curr.id,
                visited: visitedSoFar
            });
        }

        // Enqueue right
        if (curr.right) {
            // First highlight the child we're about to add
            steps.push({
                type: 'highlight-right',
                node: curr,
                child: curr.right,
                queue: [...queue],
                output: [...output],
                processing: curr.id,
                highlight: curr.right.id,
                visited: visitedSoFar
            });
            // Then add to queue
            queue.push(curr.right);
            steps.push({
                type: 'enqueue-right',
                node: curr,
                child: curr.right,
                queue: [...queue],
                output: [...output],
                processing: curr.id,
                visited: visitedSoFar
            });
        }

        // Mark done
        steps.push({
            type: 'done',
            node: curr,
            queue: [...queue],
            output: [...output],
            processing: null,
            visited: visitedSoFar
        });
    }

    // Final step
    steps.push({
        type: 'complete',
        queue: [],
        output: [...output],
        processing: null,
        visited: steps[steps.length - 1].visited
    });

    return steps;
}

// Generate DFS steps
function generateDFSSteps(root, order) {
    const steps = [];
    if (!root) return steps;

    const output = [];
    const stackFrames = [];

    // Initial step
    steps.push({
        type: 'init',
        stackFrames: [],
        output: [],
        processing: null,
        visited: [],
        current: null
    });

    function traverse(node) {
        if (!node) return;

        // Push frame
        const frame = { val: node.val, status: 'Enter' };
        stackFrames.push(frame);
        steps.push({
            type: 'push',
            node: node,
            stackFrames: stackFrames.map(f => ({ ...f })),
            output: [...output],
            processing: node.id,
            visited: steps[steps.length - 1].visited,
            current: node.id
        });

        // Preorder: process before children
        if (order === 'pre') {
            frame.status = 'Process';
            output.push(node.val);
            steps.push({
                type: 'process',
                node: node,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: [...steps[steps.length - 1].visited, node.id],
                current: node.id
            });
        }

        // Go left
        if (node.left) {
            frame.status = 'Go Left';
            steps.push({
                type: 'go-left',
                node: node,
                child: node.left,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: steps[steps.length - 1].visited,
                current: node.id
            });
            traverse(node.left);

            // Back from left
            frame.status = 'Back from Left';
            steps.push({
                type: 'back-left',
                node: node,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: steps[steps.length - 1].visited,
                current: node.id
            });
        }

        // Inorder: process after left, before right
        if (order === 'in') {
            frame.status = 'Process';
            output.push(node.val);
            steps.push({
                type: 'process',
                node: node,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: [...steps[steps.length - 1].visited, node.id],
                current: node.id
            });
        }

        // Go right
        if (node.right) {
            frame.status = 'Go Right';
            steps.push({
                type: 'go-right',
                node: node,
                child: node.right,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: steps[steps.length - 1].visited,
                current: node.id
            });
            traverse(node.right);

            // Back from right
            frame.status = 'Back from Right';
            steps.push({
                type: 'back-right',
                node: node,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: steps[steps.length - 1].visited,
                current: node.id
            });
        }

        // Postorder: process after children
        if (order === 'post') {
            frame.status = 'Process';
            output.push(node.val);
            steps.push({
                type: 'process',
                node: node,
                stackFrames: stackFrames.map(f => ({ ...f })),
                output: [...output],
                processing: node.id,
                visited: [...steps[steps.length - 1].visited, node.id],
                current: node.id
            });
        }

        // Pop frame
        stackFrames.pop();
        steps.push({
            type: 'pop',
            node: node,
            stackFrames: stackFrames.map(f => ({ ...f })),
            output: [...output],
            processing: null,
            visited: steps[steps.length - 1].visited,
            current: stackFrames.length > 0 ? null : null
        });
    }

    traverse(root);

    // Final step
    steps.push({
        type: 'complete',
        stackFrames: [],
        output: [...output],
        processing: null,
        visited: steps[steps.length - 1].visited,
        current: null
    });

    return steps;
}

// Render current tree step
export function renderTreeStep() {
    const { steps, currentStep, traversalType } = treeStepController;
    if (!steps.length) return;

    const step = steps[currentStep];

    // Reset all node colors
    const allNodes = state.dom.stage.querySelectorAll('.circle-node');
    allNodes.forEach(n => n.style.backgroundColor = '');

    // Apply visited colors (green)
    if (step.visited) {
        step.visited.forEach(id => highlightNode(id, '#10b981'));
    }

    // Apply current processing color (pink)
    if (step.processing) {
        highlightNode(step.processing, '#ec4899');
    }

    // Apply highlight color for child about to be enqueued (orange/amber)
    if (step.highlight) {
        highlightNode(step.highlight, '#f59e0b');
    }

    // Update output
    if (step.output) {
        state.dom.traversalOutput.innerText = step.output.join(' -> ') || '';
    }

    // Update visual queue (BFS)
    if (step.queue !== undefined) {
        const vals = step.queue.map(n => n.val);
        renderQueue(vals, state.dom.visualQueue, true);
    }

    // Update visual stack (DFS)
    if (step.stackFrames !== undefined) {
        const vals = step.stackFrames.map(f => `<div class="st-val">${f.val}</div><div class="st-status">${f.status}</div>`);
        renderStack(vals, state.dom.visualStack, true);
    }

    // Update step indicator
    const stepLabels = {
        'init': 'Ready to start',
        'dequeue': `Dequeue node ${step.node?.val}`,
        'process': `Processing node ${step.node?.val}`,
        'highlight-left': `Found left child ${step.child?.val}`,
        'highlight-right': `Found right child ${step.child?.val}`,
        'enqueue-left': `Added ${step.child?.val} to queue`,
        'enqueue-right': `Added ${step.child?.val} to queue`,
        'done': `Done with node ${step.node?.val}`,
        'push': `Enter node ${step.node?.val}`,
        'go-left': `Going to left child`,
        'go-right': `Going to right child`,
        'back-left': `Back from left subtree`,
        'back-right': `Back from right subtree`,
        'pop': `Exit node ${step.node?.val}`,
        'complete': 'Traversal complete!'
    };

    state.dom.stepIndicator.innerText = stepLabels[step.type] || `Step ${currentStep + 1}`;
}

export function nextTreeStep() {
    if (!treeStepController.isActive) return;
    if (treeStepController.currentStep >= treeStepController.steps.length - 1) return;

    treeStepController.currentStep++;
    if (treeStepController.traversalType === 'bst-search') {
        renderBSTSearchStep();
    } else {
        renderTreeStep();
    }
    updateTreeStepButtons();
}

export function prevTreeStep() {
    if (!treeStepController.isActive) return;
    if (treeStepController.currentStep <= 0) return;

    treeStepController.currentStep--;
    if (treeStepController.traversalType === 'bst-search') {
        renderBSTSearchStep();
    } else {
        renderTreeStep();
    }
    updateTreeStepButtons();
}

export function updateTreeStepButtons() {
    const { steps, currentStep } = treeStepController;

    state.dom.btnPrevStep.disabled = currentStep <= 0;
    state.dom.btnNextStep.disabled = currentStep >= steps.length - 1;
}

export function resetTreeStepController() {
    treeStepController.steps = [];
    treeStepController.currentStep = 0;
    treeStepController.isActive = false;
    treeStepController.traversalType = null;

    // Reset node colors
    const allNodes = state.dom.stage.querySelectorAll('.circle-node');
    allNodes.forEach(n => n.style.backgroundColor = '');
}

export function runBFS() {
    if (!state.treeRoot) return;

    // Reset previous
    resetTreeStepController();
    state.dom.traversalOutput.innerText = '';
    state.dom.visualQueue.innerHTML = '';
    state.dom.visualStack.innerHTML = '';

    // Generate steps
    const steps = generateBFSSteps(state.treeRoot);
    treeStepController.steps = steps;
    treeStepController.currentStep = 0;
    treeStepController.isActive = true;
    treeStepController.traversalType = 'bfs';

    // Show step controls
    state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderTreeStep();
    updateTreeStepButtons();
}

export function runDFS(order = 'pre') {
    if (!state.treeRoot) return;

    // Reset previous
    resetTreeStepController();
    state.dom.traversalOutput.innerText = '';
    state.dom.visualQueue.innerHTML = '';
    state.dom.visualStack.innerHTML = '';

    // Generate steps
    const steps = generateDFSSteps(state.treeRoot, order);
    treeStepController.steps = steps;
    treeStepController.currentStep = 0;
    treeStepController.isActive = true;
    treeStepController.traversalType = order;

    // Show step controls
    state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderTreeStep();
    updateTreeStepButtons();
}

export function initBT(vals) {
    if (vals.length === 0) return;
    const nodes = vals.map(v => ({ id: crypto.randomUUID(), val: v, left: null, right: null }));
    for (let i = 0; i < nodes.length; i++) {
        let leftIdx = 2 * i + 1;
        let rightIdx = 2 * i + 2;
        if (leftIdx < nodes.length) nodes[i].left = nodes[leftIdx];
        if (rightIdx < nodes.length) nodes[i].right = nodes[rightIdx];
    }
    state.treeRoot = nodes[0];
    renderTree(nodes[0]);
}

export function renderTree(root) {
    if (!root) return;

    let leafCount = 0;
    const nodeWidth = 50;
    const gap = 30;
    const posMap = new Map();

    function calcPos(node, depth) {
        if (!node) return;

        let leftX = null;
        let rightX = null;

        // Traverse Left
        if (node.left) {
            calcPos(node.left, depth + 1);
            leftX = posMap.get(node.left).x;
        } else if (node.right) {
            // If we have a right child but no left, treat left as a "ghost" leaf to push parent right
            leftX = leafCount * (nodeWidth + gap);
            leafCount++;
        }

        // Traverse Right
        if (node.right) {
            calcPos(node.right, depth + 1);
            rightX = posMap.get(node.right).x;
        } else if (node.left) {
            // If we have a left child but no right, treat right as a "ghost" leaf to push parent left
            rightX = leafCount * (nodeWidth + gap);
            leafCount++;
        }

        let x;
        if (!node.left && !node.right) {
            // Real Leaf
            x = leafCount * (nodeWidth + gap);
            leafCount++;
        } else {
            // Parent: Center between (Real Left | Ghost Left) and (Real Right | Ghost Right)
            // Note: If a child is missing, we used the ghost value calculated above.
            x = (leftX + rightX) / 2;
        }

        posMap.set(node, { x, depth });
    }

    calcPos(root, 0);

    const treeWidth = leafCount * (nodeWidth + gap);
    const offset = (state.dom.visualArea.offsetWidth - treeWidth) / 2;

    posMap.forEach((pos, node) => {
        const finalX = pos.x + offset;
        const finalY = 50 + pos.depth * 90;

        const el = document.createElement('div');
        el.className = 'node-wrapper';
        el.id = node.id;
        el.style.left = finalX + 'px';
        el.style.top = finalY + 'px';
        el.innerHTML = `<div class="circle-node">${node.val}</div>`;
        state.dom.stage.appendChild(el);
    });

    setTimeout(() => {
        posMap.forEach((_, node) => {
            if (node.left) drawLine(node.id, node.left.id, false);
            if (node.right) drawLine(node.id, node.right.id, false);
        });
    }, 50);
}

// --- BST Search with Steps ---

function generateBSTSearchSteps(root, target) {
    const steps = [];
    if (!root) return steps;

    // Initial step
    steps.push({
        type: 'init',
        target: target,
        current: null,
        path: [],
        found: false,
        message: `Searching for ${target}`
    });

    let curr = root;
    const path = [];

    while (curr) {
        path.push(curr.id);

        if (curr.val === target) {
            // Found
            steps.push({
                type: 'compare',
                node: curr,
                target: target,
                comparison: 'equal',
                path: [...path],
                current: curr.id,
                found: false,
                message: `${target} == ${curr.val}? Yes!`
            });
            steps.push({
                type: 'found',
                node: curr,
                target: target,
                path: [...path],
                current: curr.id,
                found: true,
                message: `Found ${target}!`
            });
            return steps;
        } else if (target < curr.val) {
            // Go left
            steps.push({
                type: 'compare',
                node: curr,
                target: target,
                comparison: 'less',
                path: [...path],
                current: curr.id,
                found: false,
                message: `${target} < ${curr.val}, go left`
            });
            if (curr.left) {
                steps.push({
                    type: 'move',
                    node: curr,
                    direction: 'left',
                    next: curr.left,
                    path: [...path],
                    current: curr.id,
                    found: false,
                    message: `Moving to left child (${curr.left.val})`
                });
            }
            curr = curr.left;
        } else {
            // Go right
            steps.push({
                type: 'compare',
                node: curr,
                target: target,
                comparison: 'greater',
                path: [...path],
                current: curr.id,
                found: false,
                message: `${target} > ${curr.val}, go right`
            });
            if (curr.right) {
                steps.push({
                    type: 'move',
                    node: curr,
                    direction: 'right',
                    next: curr.right,
                    path: [...path],
                    current: curr.id,
                    found: false,
                    message: `Moving to right child (${curr.right.val})`
                });
            }
            curr = curr.right;
        }
    }

    // Not found
    steps.push({
        type: 'not-found',
        target: target,
        path: [...path],
        current: null,
        found: false,
        message: `${target} not found in BST`
    });

    return steps;
}

export function renderBSTSearchStep() {
    const { steps, currentStep } = treeStepController;
    if (!steps.length) return;

    const step = steps[currentStep];

    // Reset all node colors
    const allNodes = state.dom.stage.querySelectorAll('.circle-node');
    allNodes.forEach(n => n.style.backgroundColor = '');

    // Highlight path (visited nodes in blue)
    if (step.path) {
        step.path.forEach(id => highlightNode(id, '#3b82f6'));
    }

    // Highlight current node
    if (step.current) {
        if (step.found) {
            highlightNode(step.current, '#10b981'); // Green for found
        } else {
            highlightNode(step.current, '#ec4899'); // Pink for current
        }
    }

    // Update step indicator
    state.dom.stepIndicator.innerText = step.message || `Step ${currentStep + 1}`;

    // Clear queue/stack visuals for search
    state.dom.visualQueue.innerHTML = '';
    state.dom.visualStack.innerHTML = '';
    state.dom.traversalOutput.innerText = step.found ? `Found: ${step.target}` : `Searching: ${step.target}`;
}

export function searchBST(target) {
    if (!state.treeRoot) {
        alert('Create a BST first!');
        return;
    }

    // Reset previous
    resetTreeStepController();
    state.dom.traversalOutput.innerText = '';
    state.dom.visualQueue.innerHTML = '';
    state.dom.visualStack.innerHTML = '';

    // Generate steps
    const steps = generateBSTSearchSteps(state.treeRoot, target);
    treeStepController.steps = steps;
    treeStepController.currentStep = 0;
    treeStepController.isActive = true;
    treeStepController.traversalType = 'bst-search';

    // Show step controls
    state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderBSTSearchStep();
    updateTreeStepButtons();
}

