export const state = {
    // Canvas Zoom/Pan State
    scale: 1,
    pPanning: false,
    pointX: 0,
    pointY: 0,
    startX: 0,
    startY: 0,
    zoomSensitivity: 0.05, // Default zoom sensitivity (lower = less sensitive)

    // App Mode
    currentMode: null,
    lastMode: null,

    // Data Structure State
    dsData: [],

    // Graph Interaction
    graphMode: null, // 'node', 'edge-dir', 'edge-undir'
    graphSelectedNode: null, // ID of first node for edge creation
    graphCounter: 1, // Auto-increment for node values

    // Step Control State
    stepController: {
        steps: [],      // Array of step functions or state snapshots
        currentStep: 0,
        isActive: false,
        searchTarget: null
    },

    // DOM Elements
    dom: {
        stage: null,
        svgLayer: null,
        mainInputContainer: null,
        userInput: null,
        homeView: null,
        appContainer: null,
        structureTitle: null,
        pzContainer: null,
        visualArea: null,
        stackControls: null,
        stackPushInput: null,
        btnPush: null,
        btnPop: null,
        btnPeek: null,
        queueControls: null,
        queueEnqueueInput: null,
        btnEnqueue: null,
        btnDequeue: null,
        btnPeekQueue: null,
        heapControls: null,
        heapInput: null,
        btnHeapInsert: null,
        btnHeapExtract: null,
        btnHeapPeek: null,

        treeControls: null,
        btnBFS: null,
        btnPreorder: null,
        btnInorder: null,
        btnPostorder: null,

        auxContainer: null,
        traversalOutput: null,
        visualQueue: null,
        visualStack: null,
        // Array
        arrayControls: null,
        arrIdx: null,
        arrVal: null,
        btnArrInsert: null,
        btnArrUpdate: null,
        btnArrDelete: null,
        btnArrSearch: null,
        // List
        listControls: null,
        listVal: null,
        btnListAppend: null,
        btnListPrepend: null,
        btnListRemove: null,
        btnListSearch: null,
        btnListPopHead: null,
        btnListPopTail: null,

        // Hash
        hashControls: null,
        hashKey: null,
        hashValue: null,
        btnHashPut: null,
        btnHashGet: null,
        btnHashRemove: null,
        btnHashClear: null,
        hashInfo: null
    }
};

export const initGlobals = () => {
    state.dom.stage = document.getElementById('stage');
    state.dom.svgLayer = document.getElementById('svg-layer');
    state.dom.mainInputContainer = document.getElementById('main-input-container');
    state.dom.userInput = document.getElementById('userInput');
    state.dom.homeView = document.getElementById('home-view');
    state.dom.appContainer = document.getElementById('app-container');
    state.dom.structureTitle = document.getElementById('structure-title');
    state.dom.pzContainer = document.getElementById('pan-zoom-container');
    state.dom.visualArea = document.getElementById('visual-area');
    state.dom.stackControls = document.getElementById('stack-controls');
    state.dom.stackPushInput = document.getElementById('stackPushInput');
    state.dom.btnPush = document.getElementById('btnPush');
    state.dom.btnPop = document.getElementById('btnPop');
    state.dom.btnPeek = document.getElementById('btnPeek');

    state.dom.queueControls = document.getElementById('queue-controls');
    state.dom.queueEnqueueInput = document.getElementById('queueEnqueueInput');
    state.dom.btnEnqueue = document.getElementById('btnEnqueue');
    state.dom.btnDequeue = document.getElementById('btnDequeue');
    state.dom.btnPeekQueue = document.getElementById('btnPeekQueue');

    state.dom.heapControls = document.getElementById('heap-controls');
    state.dom.heapInput = document.getElementById('heapInput');
    state.dom.btnHeapInsert = document.getElementById('btnHeapInsert');
    state.dom.btnHeapExtract = document.getElementById('btnHeapExtract');
    state.dom.btnHeapPeek = document.getElementById('btnHeapPeek');

    // Array
    state.dom.arrayControls = document.getElementById('array-controls');
    state.dom.arrIdx = document.getElementById('arrIdx');
    state.dom.arrVal = document.getElementById('arrVal');
    state.dom.btnArrInsert = document.getElementById('btnArrInsert');
    state.dom.btnArrUpdate = document.getElementById('btnArrUpdate');
    state.dom.btnArrDelete = document.getElementById('btnArrDelete');
    state.dom.btnArrSearch = document.getElementById('btnArrSearch');

    // List
    state.dom.listControls = document.getElementById('list-controls');
    state.dom.listVal = document.getElementById('listVal');
    state.dom.btnListAppend = document.getElementById('btnListAppend');
    state.dom.btnListPrepend = document.getElementById('btnListPrepend');
    state.dom.btnListRemove = document.getElementById('btnListRemove');
    state.dom.btnListSearch = document.getElementById('btnListSearch');
    state.dom.btnListPopHead = document.getElementById('btnListPopHead');
    state.dom.btnListPopTail = document.getElementById('btnListPopTail');

    // Tree Traversals
    state.dom.treeControls = document.getElementById('tree-controls');
    state.dom.btnBFS = document.getElementById('btnBFS');
    state.dom.btnPreorder = document.getElementById('btnPreorder');
    state.dom.btnInorder = document.getElementById('btnInorder');
    state.dom.btnPostorder = document.getElementById('btnPostorder');

    // BST Search
    state.dom.bstSearchControls = document.getElementById('bst-search-controls');
    state.dom.bstSearchVal = document.getElementById('bstSearchVal');
    state.dom.btnBSTSearch = document.getElementById('btnBSTSearch');

    // Graph
    state.dom.graphControls = document.getElementById('graph-controls');
    state.dom.btnAddNode = document.getElementById('btnAddNode');
    state.dom.btnResetGraph = document.getElementById('btnResetGraph');
    state.dom.btnAddEdgeUndir = document.getElementById('btnAddEdgeUndir');
    state.dom.btnAddEdgeDir = document.getElementById('btnAddEdgeDir');
    state.dom.btnDelNode = document.getElementById('btnDelNode');
    state.dom.btnDelEdge = document.getElementById('btnDelEdge');
    state.dom.btnGraphBFS = document.getElementById('btnGraphBFS');
    state.dom.btnGraphDFS = document.getElementById('btnGraphDFS');
    state.dom.graphInstructions = document.getElementById('graph-instructions');

    // Hash
    state.dom.hashControls = document.getElementById('hash-controls');
    state.dom.hashKey = document.getElementById('hashKey');
    state.dom.hashValue = document.getElementById('hashValue');
    state.dom.btnHashPut = document.getElementById('btnHashPut');
    state.dom.btnHashGet = document.getElementById('btnHashGet');
    state.dom.btnHashRemove = document.getElementById('btnHashRemove');
    state.dom.btnHashClear = document.getElementById('btnHashClear');
    state.dom.hashInfo = document.getElementById('hash-info');

    // Aux
    state.dom.auxContainer = document.getElementById('aux-panel');
    state.dom.traversalOutput = document.getElementById('traversal-output');
    state.dom.visualVisited = document.getElementById('visual-visited');
    state.dom.visualQueue = document.getElementById('visual-queue');
    state.dom.visualStack = document.getElementById('visual-stack');

    // Step Controls
    state.dom.stepControls = document.getElementById('step-controls');
    state.dom.btnPrevStep = document.getElementById('btnPrevStep');
    state.dom.btnNextStep = document.getElementById('btnNextStep');
    state.dom.stepIndicator = document.getElementById('step-indicator');
};
