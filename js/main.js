import { state, initGlobals } from './state.js';
import { initCanvas, resetZoom } from './canvas.js';
import { renderArray, renderStack, renderQueue, renderDeque, pushToStack, popFromStack, peekStack, enqueueToQueue, dequeueFromQueue, peekQueue, addFirstDeque, addLastDeque, pollFirstDeque, pollLastDeque, peekFirstDeque, peekLastDeque, insertArray, updateArray, deleteArray, searchArray, nextStep, prevStep, resetStepController } from './ds/linear.js';
import { initList, appendList, prependList, removeListVal, popListHead, popListTail, searchList } from './ds/list.js';
import { initBST, initBT, runBFS, runDFS, nextTreeStep, prevTreeStep, resetTreeStepController, searchBST } from './ds/tree.js';
import { initGraph, nextGraphStep, prevGraphStep, resetGraphStepController } from './ds/graph.js';
import { initHeap, insertHeap, extractHeap, peekHeap } from './ds/heap.js';
import { initHash, putHash, getHash, removeHash, clearHash } from './ds/hash.js';
import { initGrid, renderGrid, runGridBFS, runGridDFS, nextGridStep, prevGridStep, resetGridStepController } from './ds/grid.js';
import { startSort } from './ds/sorting.js';

document.addEventListener('DOMContentLoaded', () => {
    initGlobals();
    initGlobals();
    initCanvas();
    setupStepControls(); // Wire up step navigation

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
            'array': 'Array', 'stack': 'Stack', 'queue': 'Queue', 'deque': 'Deque',
            'sll': 'Singly Linked List', 'dll': 'Doubly Linked List', 'cll': 'Circular Linked List',
            'bt': 'Binary Tree', 'bst': 'Binary Search Tree', 'graph': 'Graph', 'grid': 'Grid',
            'hashmap': 'HashMap', 'hashmap-simple': 'HashMap (Simple)', 'hashset': 'HashSet', 'hashset-simple': 'HashSet (Simple)', 'treemap': 'TreeMap', 'linkedhashmap': 'LinkedHashMap',
            'trie': 'Trie (Prefix Tree)', 'union_find': 'Union Find (DSU)'
        };
        state.dom.structureTitle.innerText = titles[type] || type.toUpperCase();

        state.dom.homeView.classList.add('hidden');
        state.dom.appContainer.classList.remove('hidden');

        // Hide Main Input by default for specific structures (cleaner state)
        if (['graph', 'grid', 'hashmap', 'hashmap-simple', 'hashset', 'hashset-simple', 'treemap', 'linkedhashmap', 'trie', 'union_find'].includes(type)) {
            if (state.dom.mainInputContainer) state.dom.mainInputContainer.classList.add('hidden');
        } else {
            if (state.dom.mainInputContainer) state.dom.mainInputContainer.classList.remove('hidden');
        }

        // Toggle Stack Controls
        if (type === 'stack') {
            state.dom.stackControls.classList.remove('hidden');
            state.stackMonotonic = null;
            state.dom.btnStackMonotonic.textContent = 'Off';
        } else {
            state.dom.stackControls.classList.add('hidden');
        }

        // Toggle Queue Controls
        if (type === 'queue') {
            state.dom.queueControls.classList.remove('hidden');
            state.queueMonotonic = null;
            state.dom.btnQueueMonotonic.textContent = 'Off';
            state.dom.queueWindowK.classList.add('hidden');
            state.dom.queueWindowK.value = '';
        } else {
            state.dom.queueControls.classList.add('hidden');
        }

        // Toggle Deque Controls
        if (type === 'deque') {
            state.dom.dequeControls.classList.remove('hidden');
        } else {
            state.dom.dequeControls.classList.add('hidden');
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

        // Toggle Grid Controls
        if (type === 'grid') {
            state.dom.gridControls.classList.remove('hidden');
            state.dom.auxContainer.classList.remove('hidden'); // Enable Aux for Grid Traversals
            // Build a default 3x3 grid immediately
            const defaultRows = parseInt(state.dom.gridRows.value) || 3;
            const defaultCols = parseInt(state.dom.gridCols.value) || 3;
            initGrid(defaultRows, defaultCols);
        } else {
            state.dom.gridControls.classList.add('hidden');
        }

        // Toggle Hash Controls
        if (['hashmap', 'hashmap-simple', 'hashset', 'hashset-simple', 'treemap', 'linkedhashmap'].includes(type)) {
            state.dom.hashControls.classList.remove('hidden');

            try {
                // Initialize the hash structure immediately
                initHash([], type);
            } catch (err) {
                console.error("Failed to init hash:", err);
            }

            // Customize UI for HashSet vs Maps
            const keyInput = state.dom.hashKey;
            const valInput = state.dom.hashValue;
            const btnGet = state.dom.btnHashGet;

            if (type === 'hashset' || type === 'hashset-simple') {
                keyInput.placeholder = "Value";
                valInput.classList.add('hidden');
                valInput.value = ''; // Clear value
                if (btnGet) btnGet.textContent = "Has";
            } else {
                keyInput.placeholder = "Key";
                valInput.classList.remove('hidden');
                valInput.placeholder = "Value";
                if (btnGet) btnGet.textContent = "Get";
            }

        } else {
            state.dom.hashControls.classList.add('hidden');
        }

        // Toggle Trie Controls
        if (type === 'trie') {
            state.dom.controlsTrie.classList.remove('hidden');
            import('./ds/trie.js').then(module => {
                if (!state.trieRoot) module.initTrie();
                module.renderTrie();
            });
        } else if (state.dom.controlsTrie) { // Safety check
            state.dom.controlsTrie.classList.add('hidden');
        }

        // Toggle Union Find Controls
        if (type === 'union_find') {
            state.dom.controlsUF.classList.remove('hidden');
            import('./ds/union_find.js').then(module => {
                if (state.ufData.length === 0) module.initUF(10);
                module.renderUF();
            });
        } else if (state.dom.controlsUF) {
            state.dom.controlsUF.classList.add('hidden');
        }

        // Toggle Main Input (Enter Values)
        // Hidden for Graph and Hash structures as per user request
        if (['graph', 'grid', 'hashmap', 'hashmap-simple', 'hashset', 'hashset-simple', 'treemap', 'linkedhashmap', 'trie', 'union_find'].includes(type)) {
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

    // Stack Monotonic Toggle: Off → Increasing → Decreasing → Off
    state.dom.btnStackMonotonic.addEventListener('click', () => {
        const modes = [null, 'inc', 'dec'];
        const labels = ['Off', 'Increasing ↑', 'Decreasing ↓'];
        const current = modes.indexOf(state.stackMonotonic);
        const next = (current + 1) % 3;
        state.stackMonotonic = modes[next];
        state.dom.btnStackMonotonic.textContent = labels[next];
        // Clear stack and re-render when mode changes
        state.dsData = [];
        renderStack(state.dsData);
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

    // Deque Operations
    if (state.dom.btnDequeAddFirst) {
        state.dom.btnDequeAddFirst.addEventListener('click', () => {
            const raw = state.dom.dequeInput.value.trim();
            const val = Number(raw);
            if (raw !== '' && !isNaN(val)) {
                addFirstDeque(val);
                state.dom.dequeInput.value = '';
                state.dom.dequeInput.focus();
            }
        });
    }

    if (state.dom.btnDequeAddLast) {
        state.dom.btnDequeAddLast.addEventListener('click', () => {
            const raw = state.dom.dequeInput.value.trim();
            const val = Number(raw);
            if (raw !== '' && !isNaN(val)) {
                addLastDeque(val);
                state.dom.dequeInput.value = '';
                state.dom.dequeInput.focus();
            }
        });
    }

    if (state.dom.btnDequePollFirst) {
        state.dom.btnDequePollFirst.addEventListener('click', () => {
            pollFirstDeque();
        });
    }

    if (state.dom.btnDequePollLast) {
        state.dom.btnDequePollLast.addEventListener('click', () => {
            pollLastDeque();
        });
    }

    if (state.dom.btnDequePeekFirst) {
        state.dom.btnDequePeekFirst.addEventListener('click', () => {
            peekFirstDeque();
        });
    }

    if (state.dom.btnDequePeekLast) {
        state.dom.btnDequePeekLast.addEventListener('click', () => {
            peekLastDeque();
        });
    }

    // Queue Monotonic Toggle: Off → Increasing → Decreasing → Off
    state.dom.btnQueueMonotonic.addEventListener('click', () => {
        const modes = [null, 'inc', 'dec'];
        const labels = ['Off', 'Increasing ↑', 'Decreasing ↓'];
        const current = modes.indexOf(state.queueMonotonic);
        const next = (current + 1) % 3;
        state.queueMonotonic = modes[next];
        state.dom.btnQueueMonotonic.textContent = labels[next];

        // Toggle Window Size Input
        if (state.queueMonotonic) {
            state.dom.queueWindowK.classList.remove('hidden');
            state.dom.queueWindowK.focus();
        } else {
            state.dom.queueWindowK.classList.add('hidden');
        }

        // Clear queue and re-render when mode changes
        state.dsData = [];
        renderQueue(state.dsData);
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

    // Sort button
    state.dom.btnSort.addEventListener('click', () => {
        const algo = state.dom.sortAlgo.value;
        startSort(algo);
    });

    // Step Controls - handle array, tree, and graph modes
    // Step Controls - handle array, tree, and graph modes
    state.dom.btnPrevStep.addEventListener('click', () => {
        // Pause on manual interaction
        if (state.isAutoPlaying) toggleAutoPlay();

        if (state.currentMode === 'array' || state.currentMode === 'stack' || state.currentMode === 'queue') {
            prevStep();
        } else if (['bt', 'bst'].includes(state.currentMode)) {
            prevTreeStep();
        } else if (state.currentMode === 'graph') {
            prevGraphStep();
        } else if (state.currentMode === 'grid') {
            prevGridStep();
        }
    });

    state.dom.btnNextStep.addEventListener('click', () => {
        // Pause on manual interaction
        if (state.isAutoPlaying) toggleAutoPlay();

        manualNextStep();
    });

    // Wrapper for next step to handle dispatching
    function manualNextStep() {
        if (state.currentMode === 'array' || state.currentMode === 'stack' || state.currentMode === 'queue') {
            nextStep();
        } else if (['bt', 'bst'].includes(state.currentMode)) {
            nextTreeStep();
        } else if (state.currentMode === 'graph') {
            nextGraphStep();
        } else if (state.currentMode === 'grid') {
            nextGridStep();
        }
    }

    // --- AUTO STEPPER LOGIC ---
    state.isAutoPlaying = false;
    state.autoPlayDelay = 800; // Default matches slider in HTML
    let autoPlayTimer = null;

    const btnPlay = document.getElementById('btnPlay');
    const speedSlider = document.getElementById('speedSlider');

    function checkIsAtEnd() {
        if (state.stepController && state.stepController.isActive) {
            const { steps, currentStep } = state.stepController;
            return currentStep >= steps.length - 1;
        } else if (state.treeStepController && state.treeStepController.isActive) {
            const { steps, currentStep } = state.treeStepController;
            return currentStep >= steps.length - 1;
        } else if (state.graphStepController && state.graphStepController.isActive) {
            const { steps, currentStep } = state.graphStepController;
            return currentStep >= steps.length - 1;
        } else if (state.gridStepController && state.gridStepController.isActive) {
            const { steps, currentStep } = state.gridStepController;
            return currentStep >= steps.length - 1;
        }
        return true; // not active = at end
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
        state.isAutoPlaying = false;
        if (btnPlay) btnPlay.textContent = '▶';
    }

    function startAutoPlay() {
        stopAutoPlay(); // clear any existing timer first
        state.isAutoPlaying = true;
        if (btnPlay) btnPlay.textContent = '⏸';

        autoPlayTimer = setInterval(() => {
            if (!state.isAutoPlaying || checkIsAtEnd()) {
                stopAutoPlay();
                return;
            }
            manualNextStep();
            // Check again after step — might have just reached the end
            if (checkIsAtEnd()) {
                stopAutoPlay();
            }
        }, state.autoPlayDelay);
    }

    function toggleAutoPlay() {
        if (state.isAutoPlaying) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }

    // Auto-step UI Listeners
    if (btnPlay) {
        btnPlay.addEventListener('click', toggleAutoPlay);
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            state.autoPlayDelay = 2100 - val;
            // If currently playing, restart interval with new speed
            if (state.isAutoPlaying) {
                startAutoPlay();
            }
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

        // For HashSet, the "key input" acts as the value. 
        // We use the string directly for hashing if it's a string, or parse if number.
        // Actually, let's keep it simple: Try to parse as number, if NaN, keep as string.

        let key = keyRaw;
        // Try parsing only if it looks like a number
        if (!isNaN(parseFloat(keyRaw)) && isFinite(keyRaw)) {
            key = parseFloat(keyRaw);
        }

        // For HashSet, value is same as key
        let val = valRaw;
        if (state.currentMode === 'hashset') {
            val = key;
        }

        return { key, val };
    };

    if (state.dom.btnHashPut) {
        state.dom.btnHashPut.addEventListener('click', () => {
            const { key, val } = getHashInputs();
            if (key !== '' && key !== undefined && key !== null) {
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
            if (key !== '' && key !== undefined && key !== null) getHash(key);
        });
    }

    if (state.dom.btnHashRemove) {
        state.dom.btnHashRemove.addEventListener('click', () => {
            const { key } = getHashInputs();
            if (key !== '' && key !== undefined && key !== null) removeHash(key);
        });
    }

    if (state.dom.btnHashClear) {
        state.dom.btnHashClear.addEventListener('click', () => {
            clearHash();
        });
    }

    // --- TRIE CONTROLS ---
    if (state.dom.btnTrieInsert) {
        state.dom.btnTrieInsert.addEventListener('click', () => {
            const word = state.dom.trieInput.value.trim();
            if (word) {
                import('./ds/trie.js').then(module => {
                    module.insertTrie(word);
                    state.dom.trieInput.value = '';
                    state.dom.trieInput.focus();
                });
            }
        });
    }
    if (state.dom.btnTrieSearch) {
        state.dom.btnTrieSearch.addEventListener('click', () => {
            const word = state.dom.trieInput.value.trim();
            if (word) {
                import('./ds/trie.js').then(module => module.searchTrie(word));
            }
        });
    }
    if (state.dom.btnTrieStartsWith) {
        state.dom.btnTrieStartsWith.addEventListener('click', () => {
            const word = state.dom.trieInput.value.trim();
            if (word) {
                import('./ds/trie.js').then(module => module.startsWithTrie(word));
            }
        });
    }
    // Enter key on trie input triggers insert
    if (state.dom.trieInput) {
        state.dom.trieInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                state.dom.btnTrieInsert.click();
            }
        });
    }

    // --- UNION FIND CONTROLS ---
    if (state.dom.btnUfInit) {
        state.dom.btnUfInit.addEventListener('click', () => {
            const size = parseInt(state.dom.ufSize.value) || 10;
            import('./ds/union_find.js').then(module => module.initUF(size));
        });
    }
    if (state.dom.btnUfUnion) {
        state.dom.btnUfUnion.addEventListener('click', () => {
            const p = parseInt(state.dom.ufP.value);
            const q = parseInt(state.dom.ufQ.value);
            if (!isNaN(p) && !isNaN(q)) {
                import('./ds/union_find.js').then(module => module.unionUF(p, q));
            }
        });
    }
    if (state.dom.btnUfFind) {
        state.dom.btnUfFind.addEventListener('click', () => {
            const p = parseInt(state.dom.ufP.value);
            if (!isNaN(p)) {
                import('./ds/union_find.js').then(module => module.findUF(p));
            }
        });
    }

    // --- GRID CONTROLS ---
    if (state.dom.btnBuildGrid) {
        state.dom.btnBuildGrid.addEventListener('click', () => {
            const rows = parseInt(state.dom.gridRows.value) || 3;
            const cols = parseInt(state.dom.gridCols.value) || 3;
            initGrid(rows, cols);
        });
    }

    if (state.dom.btnGridBFS) {
        state.dom.btnGridBFS.addEventListener('click', () => {
            const startRow = parseInt(state.dom.gridStartRow.value) || 0;
            const startCol = parseInt(state.dom.gridStartCol.value) || 0;
            runGridBFS(startRow, startCol);
        });
    }

    if (state.dom.btnGridDFS) {
        state.dom.btnGridDFS.addEventListener('click', () => {
            const startRow = parseInt(state.dom.gridStartRow.value) || 0;
            const startCol = parseInt(state.dom.gridStartCol.value) || 0;
            runGridDFS(startRow, startCol);
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
    resetGridStepController();

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
        case 'deque': renderDeque(vals); break;

        case 'sll': initList(vals, 'sll'); break;
        case 'dll': initList(vals, 'dll'); break;
        case 'cll': initList(vals, 'cll'); break;

        case 'bt': initBT(vals); break;
        case 'bst': initBST(vals); break;

        case 'trie':
            import('./ds/trie.js').then(module => module.renderTrie());
            break;
        case 'union_find':
            import('./ds/union_find.js').then(module => module.renderUF());
            break;

        case 'minheap':
        case 'maxheap':
            initHeap(vals, state.currentMode);
            break;

        case 'hashmap':
        case 'hashmap-simple':
        case 'hashset':
        case 'hashset-simple':
        case 'treemap':
        case 'linkedhashmap':
            initHash(vals, state.currentMode);
            break;

        case 'graph':
            import('./ds/graph.js').then(module => module.initGraph(vals));
            // Show Graph Controls explicitly handled in selectStructure
            break;

        case 'grid':
            // Grid uses its own build flow via Build button
            break;
    }
}

// --- STEP CONTROLLER WIRING ---
function setupStepControls() {
    console.log("Setting up step controls...");
    const btnNext = state.dom.btnNextStep;
    const btnPrev = state.dom.btnPrevStep;
    const btnPlay = document.getElementById('btnPlay');
    const speedSlider = document.getElementById('speedSlider');

    // Queue Log Visibility Helper
    if (state.dom.queueLog) {
        state.dom.queueLog.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    }

    if (!btnNext || !btnPrev) {
        console.error("Step buttons not found in DOM");
        return;
    }

    const triggerNext = () => {
        const mode = state.currentMode;
        if (!mode) return;

        if (['array', 'stack', 'queue', 'deque', 'list', 'sll', 'dll', 'cll'].includes(mode)) {
            nextStep();
        } else if (['bst', 'bt'].includes(mode)) {
            nextTreeStep();
        } else if (mode === 'graph') {
            nextGraphStep();
        } else if (mode === 'grid') {
            nextGridStep();
        } else if (['heap', 'minheap', 'maxheap'].includes(mode)) {
            // Heap steps if implemented
        }
    };

    const triggerPrev = () => {
        const mode = state.currentMode;
        if (!mode) return;

        if (['array', 'stack', 'queue', 'deque', 'list', 'sll', 'dll', 'cll'].includes(mode)) {
            prevStep();
        } else if (['bst', 'bt'].includes(mode)) {
            prevTreeStep();
        } else if (mode === 'graph') {
            prevGraphStep();
        } else if (mode === 'grid') {
            prevGridStep();
        }
    };

    btnNext.addEventListener('click', () => {
        triggerNext();
    });

    btnPrev.addEventListener('click', () => {
        triggerPrev();
    });

    // Auto-Play Logic
    let playTimer = null;
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            if (playTimer) {
                clearInterval(playTimer);
                playTimer = null;
                btnPlay.innerHTML = '▶';
                btnPlay.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else {
                btnPlay.innerHTML = '⏸';
                btnPlay.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; // Red for stop

                let delay = 800;
                if (speedSlider) delay = 2100 - parseInt(speedSlider.value);

                playTimer = setInterval(triggerNext, delay);
            }
        });
    }

    if (speedSlider && btnPlay) {
        speedSlider.addEventListener('input', () => {
            if (playTimer) {
                clearInterval(playTimer);
                let delay = 2100 - parseInt(speedSlider.value); // Higher value = faster speed = lower delay
                playTimer = setInterval(triggerNext, delay);
            }
        });
    }
}
