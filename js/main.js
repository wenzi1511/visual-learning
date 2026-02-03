import { state, initGlobals } from './state.js';
import { initCanvas, resetZoom } from './canvas.js';
import { renderArray, renderStack, renderQueue, pushToStack, popFromStack, peekStack, enqueueToQueue, dequeueFromQueue, peekQueue, insertArray, updateArray, deleteArray, searchArray, nextStep, prevStep, resetStepController } from './ds/linear.js';
import { initList, appendList, prependList, removeListVal, popListHead, popListTail, searchList } from './ds/list.js';
import { initBST, initBT, runBFS, runDFS, nextTreeStep, prevTreeStep, resetTreeStepController, searchBST } from './ds/tree.js';
import { initGraph, nextGraphStep, prevGraphStep, resetGraphStepController } from './ds/graph.js';
import { initHeap, insertHeap, extractHeap, peekHeap } from './ds/heap.js';
import { initHash, putHash, getHash, removeHash, clearHash } from './ds/hash.js';

document.addEventListener('DOMContentLoaded', () => {
    initGlobals();
    initCanvas();

    // Zoom sensitivity slider
    const zoomSlider = document.getElementById('zoomSensitivity');
    const zoomValue = document.getElementById('zoomSensitivityValue');
    if (zoomSlider && zoomValue) {
        zoomSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            state.zoomSensitivity = val;
            zoomValue.textContent = val.toFixed(2);
        });
    }

    // Navigation
    window.selectStructure = (type) => {
        state.currentMode = type;
        state.lastMode = type;
        state.dsData = []; // Reset data

        const titles = {
            'array': 'Array', 'stack': 'Stack', 'queue': 'Queue',
            'sll': 'Singly Linked List', 'dll': 'Doubly Linked List', 'cll': 'Circular Linked List',
            'bt': 'Binary Tree', 'bst': 'Binary Search Tree', 'graph': 'Graph',
            'hashmap': 'HashMap', 'hashset': 'HashSet', 'treemap': 'TreeMap', 'linkedhashmap': 'LinkedHashMap'
        };
        state.dom.structureTitle.innerText = titles[type] || type.toUpperCase();

        state.dom.homeView.classList.add('hidden');
        state.dom.appContainer.classList.remove('hidden');

        // Toggle Stack Controls
        if (type === 'stack') {
            state.dom.stackControls.classList.remove('hidden');
        } else {
            state.dom.stackControls.classList.add('hidden');
        }

        // Toggle Queue Controls
        if (type === 'queue') {
            state.dom.queueControls.classList.remove('hidden');
        } else {
            state.dom.queueControls.classList.add('hidden');
        }

        // Toggle Heap Controls
        if (type === 'minheap' || type === 'maxheap') {
            state.dom.heapControls.classList.remove('hidden');
            state.dom.btnHeapExtract.textContent = type === 'minheap' ? 'Poll Min' : 'Poll Max';
        } else {
            state.dom.heapControls.classList.add('hidden');
        }

        // Toggle Array Controls
        if (type === 'array') {
            state.dom.arrayControls.classList.remove('hidden');
        } else {
            state.dom.arrayControls.classList.add('hidden');
        }

        // Toggle List Controls
        if (['sll', 'dll', 'cll'].includes(type)) {
            state.dom.listControls.classList.remove('hidden');
        } else {
            state.dom.listControls.classList.add('hidden');
        }

        // Toggle Tree Controls
        if (['bst', 'bt'].includes(type)) {
            state.dom.treeControls.classList.remove('hidden');
            state.dom.auxContainer.classList.remove('hidden');
            // Show BST search only for BST mode
            if (type === 'bst') {
                state.dom.bstSearchControls.classList.remove('hidden');
            } else {
                state.dom.bstSearchControls.classList.add('hidden');
            }
        } else {
            state.dom.treeControls.classList.add('hidden');
            state.dom.auxContainer.classList.add('hidden');
        }

        // Toggle Graph Controls
        if (type === 'graph') {
            state.dom.graphControls.classList.remove('hidden');
            state.dom.auxContainer.classList.remove('hidden'); // Enable Aux for Graph Traversals
            // Initialize graph data structure immediately so nodes can be added
            import('./ds/graph.js').then(module => module.initGraph([]));
        } else {
            state.dom.graphControls.classList.add('hidden');
        }

        // Toggle Hash Controls
        if (['hashmap', 'hashset', 'treemap', 'linkedhashmap'].includes(type)) {
            state.dom.hashControls.classList.remove('hidden');
        } else {
            state.dom.hashControls.classList.add('hidden');
        }

        // Toggle Main Input (Enter Values)
        // Hidden for Graph and Hash structures as per user request
        if (['graph', 'hashmap', 'hashset', 'treemap', 'linkedhashmap'].includes(type)) {
            if (state.dom.mainInputContainer) state.dom.mainInputContainer.classList.add('hidden');
        } else {
            if (state.dom.mainInputContainer) state.dom.mainInputContainer.classList.remove('hidden');
        }

        state.dom.userInput.value = '';
        state.dom.userInput.focus();
        resetStage();
        resetZoom();

        // Clear chat/logs if we had them
        const chat = document.getElementById('chat');
        if (chat) {
            chat.innerHTML = '';
            chat.style.display = 'none';
        }
    };

    window.showHome = () => {
        state.currentMode = null;
        state.dom.appContainer.classList.add('hidden');
        state.dom.homeView.classList.remove('hidden');
    };

    window.resetZoom = resetZoom; // Expose to HTML

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'ArrowLeft') if (state.currentMode) showHome();
        if (e.altKey && e.key === 'ArrowRight') if (!state.currentMode && state.lastMode) selectStructure(state.lastMode);
    });

    state.dom.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = state.dom.userInput.value.trim();
            renderStructure(val);
        }
    });

    // Stack Operations
    state.dom.btnPush.addEventListener('click', () => {
        const raw = state.dom.stackPushInput.value.trim();
        const val = Number(raw);
        if (raw !== '' && !isNaN(val)) {
            pushToStack(val);
            state.dom.stackPushInput.value = '';
            state.dom.stackPushInput.focus();
        }
    });

    state.dom.btnPop.addEventListener('click', () => {
        popFromStack();
    });

    state.dom.btnPeek.addEventListener('click', () => {
        peekStack();
    });

    // Queue Operations
    state.dom.btnEnqueue.addEventListener('click', () => {
        const raw = state.dom.queueEnqueueInput.value.trim();
        const val = Number(raw);
        if (raw !== '' && !isNaN(val)) {
            enqueueToQueue(val);
            state.dom.queueEnqueueInput.value = '';
            state.dom.queueEnqueueInput.focus();
        }
    });

    state.dom.btnDequeue.addEventListener('click', () => {
        dequeueFromQueue();
    });

    state.dom.btnPeekQueue.addEventListener('click', () => {
        peekQueue();
    });

    // Heap Operations
    state.dom.btnHeapInsert.addEventListener('click', () => {
        const raw = state.dom.heapInput.value.trim();
        const val = Number(raw);
        if (raw !== '' && !isNaN(val)) {
            insertHeap(val);
            state.dom.heapInput.value = '';
            state.dom.heapInput.focus();
        }
    });

    state.dom.btnHeapExtract.addEventListener('click', () => {
        extractHeap();
    });

    state.dom.btnHeapPeek.addEventListener('click', () => {
        peekHeap();
    });

    // Array Operations
    state.dom.btnArrInsert.addEventListener('click', () => {
        const idxRaw = state.dom.arrIdx.value.trim();
        const valRaw = state.dom.arrVal.value.trim();
        if (idxRaw === '' || valRaw === '') return; // Require both fields
        const idx = Number(idxRaw);
        const val = Number(valRaw);
        if (!isNaN(idx) && !isNaN(val)) insertArray(idx, val);
    });
    state.dom.btnArrUpdate.addEventListener('click', () => {
        const idxRaw = state.dom.arrIdx.value.trim();
        const valRaw = state.dom.arrVal.value.trim();
        if (idxRaw === '' || valRaw === '') return; // Require both fields
        const idx = Number(idxRaw);
        const val = Number(valRaw);
        if (!isNaN(idx) && !isNaN(val)) updateArray(idx, val);
    });
    state.dom.btnArrDelete.addEventListener('click', () => {
        const idxRaw = state.dom.arrIdx.value.trim();
        if (idxRaw === '') return; // Require index
        const idx = Number(idxRaw);
        if (!isNaN(idx)) deleteArray(idx);
    });
    state.dom.btnArrSearch.addEventListener('click', () => {
        const valRaw = state.dom.arrVal.value.trim();
        if (valRaw === '') return; // Require value
        if (state.dsData.length === 0) {
            alert('Array is empty!');
            return;
        }
        const val = Number(valRaw);
        if (!isNaN(val)) searchArray(val);
    });

    // Step Controls - handle array, tree, and graph modes
    // Step Controls - handle array, tree, and graph modes
    state.dom.btnPrevStep.addEventListener('click', () => {
        // Pause on manual interaction
        if (state.isAutoPlaying) toggleAutoPlay();

        if (state.currentMode === 'array') {
            prevStep();
        } else if (['bt', 'bst'].includes(state.currentMode)) {
            prevTreeStep();
        } else if (state.currentMode === 'graph') {
            prevGraphStep();
        }
    });

    state.dom.btnNextStep.addEventListener('click', () => {
        // Pause on manual interaction
        if (state.isAutoPlaying) toggleAutoPlay();

        manualNextStep();
    });

    // Wrapper for next step to handle dispatching
    function manualNextStep() {
        if (state.currentMode === 'array') {
            nextStep();
        } else if (['bt', 'bst'].includes(state.currentMode)) {
            nextTreeStep();
        } else if (state.currentMode === 'graph') {
            nextGraphStep();
        }
    }

    // --- AUTO STEPPER LOGIC ---
    state.isAutoPlaying = false;
    state.autoPlayDelay = 800; // Default matches slider in HTML
    let autoPlayTimer = null;

    const btnPlay = document.getElementById('btnPlay');
    const speedSlider = document.getElementById('speedSlider');

    function toggleAutoPlay() {
        state.isAutoPlaying = !state.isAutoPlaying;

        if (state.isAutoPlaying) {
            btnPlay.textContent = '⏸';
            // Start loop
            triggerNextStep();
        } else {
            btnPlay.textContent = '▶';
            if (autoPlayTimer) {
                clearTimeout(autoPlayTimer);
                autoPlayTimer = null;
            }
        }
    }

    function triggerNextStep() {
        if (autoPlayTimer) clearTimeout(autoPlayTimer);

        autoPlayTimer = setTimeout(() => {
            if (!state.isAutoPlaying) return;

            // Check if we can proceed (are we at end?)
            let isAtEnd = false;
            if (state.stepController && state.stepController.isActive) {
                const { steps, currentStep } = state.stepController;
                if (currentStep >= steps.length - 1) isAtEnd = true;
            } else if (state.treeStepController && state.treeStepController.isActive) {
                const { steps, currentStep } = state.treeStepController;
                if (currentStep >= steps.length - 1) isAtEnd = true;
            } else if (state.graphStepController && state.graphStepController.isActive) {
                const { steps, currentStep } = state.graphStepController;
                if (currentStep >= steps.length - 1) isAtEnd = true;
            } else {
                // Not active? Stop.
                isAtEnd = true;
            }

            if (isAtEnd) {
                // Stop auto-play
                toggleAutoPlay();
                return;
            }

            // Execute Step
            manualNextStep();

            // Schedule next if still playing
            if (state.isAutoPlaying) {
                triggerNextStep();
            }

        }, state.autoPlayDelay);
    }

    // Auto-step UI Listeners
    if (btnPlay) {
        btnPlay.addEventListener('click', toggleAutoPlay);
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            // Slider: 100 (Fast) to 2000 (Slow)
            // Just use value directly as delay
            // But usually "Higher Slider" = "Faster Speed". 
            // In test.html we did: delay = 2100 - val.
            // Let's do the same for consistency if slider is "Speed".
            // If slider is "Delay", then direct mapping.
            // Label says "Speed". So Right = Fast?
            // HTML Slider: min="100" max="2000" val="800".
            // Let's assume Right (2000) is Fast (Low delay) -> Delay = 2100 - val.
            const val = parseInt(e.target.value);
            state.autoPlayDelay = 2100 - val;
        });
    }

    // List Operations
    state.dom.btnListAppend.addEventListener('click', () => {
        const val = Number(state.dom.listVal.value);
        if (!isNaN(val)) appendList(val);
    });
    state.dom.btnListPrepend.addEventListener('click', () => {
        const val = Number(state.dom.listVal.value);
        if (!isNaN(val)) prependList(val);
    });
    state.dom.btnListRemove.addEventListener('click', () => {
        const val = Number(state.dom.listVal.value);
        if (!isNaN(val)) removeListVal(val);
    });
    state.dom.btnListSearch.addEventListener('click', () => {
        const val = Number(state.dom.listVal.value);
        if (!isNaN(val)) searchList(val);
    });
    state.dom.btnListPopHead.addEventListener('click', popListHead);
    state.dom.btnListPopTail.addEventListener('click', popListTail);

    // Tree Traversals
    state.dom.btnBFS.addEventListener('click', () => runBFS());
    state.dom.btnPreorder.addEventListener('click', () => runDFS('pre'));
    state.dom.btnInorder.addEventListener('click', () => runDFS('in'));
    state.dom.btnPostorder.addEventListener('click', () => runDFS('post'));

    // BST Search
    state.dom.btnBSTSearch.addEventListener('click', () => {
        const valRaw = state.dom.bstSearchVal.value.trim();
        if (valRaw === '') return;
        const val = Number(valRaw);
        if (!isNaN(val)) searchBST(val);
    });

    // --- GRAPH CONTROLS ---
    // Helper to set mode
    const setGraphBtn = (mode, btn) => {
        import('./ds/graph.js').then(module => {
            module.setGraphMode(mode);
            // Toggle UI
            [
                state.dom.btnAddNode,
                state.dom.btnAddEdgeUndir,
                state.dom.btnAddEdgeDir,
                state.dom.btnDelNode,
                state.dom.btnDelEdge,
                state.dom.btnGraphBFS,
                state.dom.btnGraphDFS
            ].forEach(b => b.classList.remove('active'));

            if (btn) btn.classList.add('active');
        });
    };

    state.dom.btnAddNode.addEventListener('click', () => setGraphBtn('node', state.dom.btnAddNode));
    state.dom.btnAddEdgeUndir.addEventListener('click', () => setGraphBtn('edge-undir', state.dom.btnAddEdgeUndir));
    state.dom.btnAddEdgeDir.addEventListener('click', () => setGraphBtn('edge-dir', state.dom.btnAddEdgeDir));
    state.dom.btnDelNode.addEventListener('click', () => setGraphBtn('del-node', state.dom.btnDelNode));
    state.dom.btnDelEdge.addEventListener('click', () => setGraphBtn('del-edge', state.dom.btnDelEdge));

    state.dom.btnGraphBFS.addEventListener('click', () => setGraphBtn('bfs', state.dom.btnGraphBFS));
    state.dom.btnGraphDFS.addEventListener('click', () => setGraphBtn('dfs', state.dom.btnGraphDFS));

    state.dom.btnResetGraph.addEventListener('click', () => {
        import('./ds/graph.js').then(module => {
            module.initGraph([]);
            setGraphBtn(null, null);
        });
    });

    // Stage Click for Graph Node Creation
    state.dom.stage.addEventListener('click', (e) => {
        if (state.currentMode === 'graph') {
            import('./ds/graph.js').then(module => module.handleStageClick(e));
        }
    });

    // --- HASH CONTROLS ---
    const getHashInputs = () => {
        const keyRaw = state.dom.hashKey.value.trim();
        const valRaw = state.dom.hashValue.value.trim();
        const key = keyRaw !== '' ? Number(keyRaw) : NaN;
        return { key, val: valRaw || keyRaw };
    };

    if (state.dom.btnHashPut) {
        state.dom.btnHashPut.addEventListener('click', () => {
            const { key, val } = getHashInputs();
            if (!isNaN(key)) {
                putHash(key, val);
                state.dom.hashKey.value = '';
                state.dom.hashValue.value = '';
                state.dom.hashKey.focus();
            }
        });
    }

    if (state.dom.btnHashGet) {
        state.dom.btnHashGet.addEventListener('click', () => {
            const { key } = getHashInputs();
            if (!isNaN(key)) getHash(key);
        });
    }

    if (state.dom.btnHashRemove) {
        state.dom.btnHashRemove.addEventListener('click', () => {
            const { key } = getHashInputs();
            if (!isNaN(key)) removeHash(key);
        });
    }

    if (state.dom.btnHashClear) {
        state.dom.btnHashClear.addEventListener('click', () => {
            clearHash();
        });
    }
});

function resetStage() {
    // Aggressively clear the stage
    const stage = state.dom.stage;
    while (stage.firstChild) {
        stage.removeChild(stage.firstChild);
    }

    // Clear SVG Layer but preserve defs
    const defs = state.dom.svgLayer.querySelector('defs');
    state.dom.svgLayer.innerHTML = '';
    if (defs) state.dom.svgLayer.appendChild(defs);

    // Reset Aux containers if they exist (for Tree Traversals)
    if (state.dom.traversalOutput) state.dom.traversalOutput.innerText = '';
    if (state.dom.visualQueue) state.dom.visualQueue.innerHTML = '';
    if (state.dom.visualStack) state.dom.visualStack.innerHTML = '';

    // Reset step controller
    resetStepController();
    resetTreeStepController();
    resetGraphStepController();

    // Hide step controls
    if (state.dom.stepControls) {
        state.dom.stepControls.classList.add('hidden');
    }
}

function renderStructure(inputStr) {
    if (!state.currentMode) return;
    resetStage();
    const vals = inputStr.split(/\s+/).map(Number).filter(n => !isNaN(n));
    state.dsData = [...vals]; // Sync with state

    switch (state.currentMode) {
        case 'array': renderArray(vals); break;
        case 'stack': renderStack(vals); break;
        case 'queue': renderQueue(vals); break;

        case 'sll': initList(vals, 'sll'); break;
        case 'dll': initList(vals, 'dll'); break;
        case 'cll': initList(vals, 'cll'); break;

        case 'bt': initBT(vals); break;
        case 'bst': initBST(vals); break;

        case 'minheap':
        case 'maxheap':
            initHeap(vals, state.currentMode);
            break;

        case 'hashmap':
        case 'hashset':
        case 'treemap':
        case 'linkedhashmap':
            initHash(vals, state.currentMode);
            break;

        case 'graph':
            import('./ds/graph.js').then(module => module.initGraph(vals));
            // Show Graph Controls explicitly handled in selectStructure
            break;
    }
}
