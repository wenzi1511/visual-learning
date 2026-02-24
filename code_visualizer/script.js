// ----------------------------------------------------
// UI Elements & State
// ----------------------------------------------------
let editorInstance = null;
const btnRun = document.getElementById('btnRunCode');
const btnReset = document.getElementById('btnResetCode');
const btnNext = document.getElementById('btnNextStep');
const btnPlay = document.getElementById('btnPlayPause');
const speedSlider = document.getElementById('execution-speed');
const executionControls = document.getElementById('execution-controls');
const variablesList = document.getElementById('variables-list');
const consoleOutput = document.getElementById('console-output');
const langSelect = document.getElementById('lang-select');

// State
let isPlaying = false;
let executionSpeed = 800; // ms
let resolveStep = null;
let currentLine = null;
let currentTrace = [];
let traceIndex = 0;
let isExecuting = false;
let decoratedLineId = null; // Monaco decoration ID

// ----------------------------------------------------
// Initialize Monaco Editor
// ----------------------------------------------------
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {

    // Custom Golden Theme for Monaco to match our app
    monaco.editor.defineTheme('visuallyTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: 'fbbf24' },
            { token: 'string', foreground: '10b981' },
            { token: 'number', foreground: '38bdf8' },
            { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        ],
        colors: {
            'editor.background': '#0f172a',
            'editor.lineHighlightBackground': '#1e293b',
            'editorLineNumber.foreground': '#64748b',
            'editorLineNumber.activeForeground': '#fbbf24',
        }
    });

    editorInstance = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: window.DEFAULT_CODE || "count = 0\nfor i in range(3):\n    count += i\nprint(f\"Total: {count}\")",
        language: 'python',
        theme: 'visuallyTheme',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: '"Fira Code", monospace',
        minimap: { enabled: false },
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
        },
        padding: { top: 15 }
    });

    langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        monaco.editor.setModelLanguage(editorInstance.getModel(), lang);

        if (lang === 'javascript') {
            editorInstance.setValue("let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n    sum += i;\n}\nconsole.log('Total:', sum);");
        } else if (lang === 'python') {
            editorInstance.setValue("count = 0\nfor i in range(3):\n    count += i\nprint(f\"Total: {count}\")");
        }
    });
});

speedSlider.addEventListener('input', (e) => {
    executionSpeed = parseInt(e.target.value);
});

// ----------------------------------------------------
// Editor Highlighting
// ----------------------------------------------------
function updateHighlight(lineNum) {
    if (!editorInstance) return;

    if (!lineNum) {
        if (decoratedLineId) {
            editorInstance.deltaDecorations(decoratedLineId, []);
            decoratedLineId = null;
        }
        return;
    }

    // Monaco decorations
    const decorations = [
        {
            range: new monaco.Range(lineNum, 1, lineNum, 1),
            options: {
                isWholeLine: true,
                className: 'active-line-highlight',
                marginClassName: 'active-line-margin'
            }
        }
    ];

    decoratedLineId = editorInstance.deltaDecorations(decoratedLineId || [], decorations);

    // Reveal line in center
    editorInstance.revealLineInCenter(lineNum);
}

// ----------------------------------------------------
// UI Renderers
// ----------------------------------------------------
function renderVariables(variablesDict) {
    variablesList.innerHTML = '';
    const keys = Object.keys(variablesDict || {});
    if (keys.length === 0) {
        variablesList.innerHTML = '<div class="empty-state">No variables tracked at this step.</div>';
        return;
    }

    for (const key of keys) {
        const el = document.createElement('div');
        el.className = 'var-item';

        const nameEl = document.createElement('span');
        nameEl.className = 'var-name';
        nameEl.textContent = key;

        const valContainer = document.createElement('div');
        valContainer.className = 'var-val-container';
        valContainer.style.width = '100%';

        const rawVal = variablesDict[key];

        if (rawVal && typeof rawVal === 'object' && rawVal.__type) {
            // It's a structured Visual Learning Data Structure
            el.style.flexDirection = 'column';
            el.style.alignItems = 'flex-start';

            if (rawVal.__type === 'list') {
                const arrCont = document.createElement('div');
                arrCont.className = 'cv-array-container';
                rawVal.val.forEach((item, idx) => {
                    arrCont.innerHTML += `
                        <div class="cv-array-cell">
                            <div class="cv-array-box">${item}</div>
                            <div class="cv-array-idx">${idx}</div>
                        </div>`;
                });
                if (rawVal.val.length === 0) arrCont.innerHTML = '<span style="color:#94a3b8; font-size: 0.8rem; padding: 4px;">[]</span>';
                valContainer.appendChild(arrCont);
            }
            else if (rawVal.__type === 'dict') {
                const dictCont = document.createElement('div');
                dictCont.className = 'cv-dict-container';
                const dictKeys = Object.keys(rawVal.val);
                dictKeys.forEach(dk => {
                    dictCont.innerHTML += `
                        <div class="cv-dict-row">
                            <div class="cv-dict-key">${dk}</div>
                            <div class="cv-dict-val">${rawVal.val[dk]}</div>
                        </div>`;
                });
                if (dictKeys.length === 0) dictCont.innerHTML = '<span style="color:#94a3b8; font-size: 0.8rem; padding: 4px;">{}</span>';
                valContainer.appendChild(dictCont);
            }
            else if (rawVal.__type === 'set') {
                const setCont = document.createElement('div');
                setCont.className = 'cv-set-container';
                rawVal.val.forEach(item => {
                    setCont.innerHTML += `<div class="cv-set-tag">${item}</div>`;
                });
                if (rawVal.val.length === 0) setCont.innerHTML = '<span style="color:#94a3b8; font-size: 0.8rem; padding: 4px;">set()</span>';
                valContainer.appendChild(setCont);
            }
        } else {
            // Standard string/primitive dump
            const valEl = document.createElement('span');
            valEl.className = 'var-val';
            valEl.textContent = rawVal;
            valContainer.appendChild(valEl);

            // Align to right for standard primitive variables
            valContainer.style.textAlign = 'right';
            valContainer.style.width = 'auto';
        }

        el.appendChild(nameEl);
        el.appendChild(valContainer);
        variablesList.appendChild(el);
    }
}

function renderConsole(outputStr) {
    consoleOutput.innerHTML = '';
    if (!outputStr) return;

    const lines = outputStr.split('\n');
    for (const line of lines) {
        if (!line) continue;
        const el = document.createElement('div');
        el.className = 'log-entry';
        el.textContent = '> ' + line;
        consoleOutput.appendChild(el);
    }
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// ----------------------------------------------------
// Execution Engine 
// ----------------------------------------------------

async function runCode() {
    if (isExecuting || !editorInstance) return;

    const code = editorInstance.getValue();
    const lang = langSelect.value;

    if (!code.trim()) return;

    isExecuting = true;
    consoleOutput.innerHTML = '<div class="log-entry" style="color:#fbbf24">> Executing...</div>';
    variablesList.innerHTML = '';

    executionControls.classList.remove('hidden');
    editorInstance.updateOptions({ readOnly: true });
    btnRun.disabled = true;

    if (lang === 'python') {
        // Use Native Python Backend
        try {
            const res = await fetch('http://localhost:8000/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, language: lang })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                renderConsole("Error: " + (data.detail || data.error));
                cleanupExecution();
                return;
            }

            currentTrace = data.trace;
            traceIndex = 0;

            // Start step-by-step playback
            await playTraceLoop();

            // Final output flush
            renderConsole(data.final_output + "\n--- Execution Finished ---");

        } catch (e) {
            renderConsole("Failed to connect to Python backend.\nPlease ensure it's running on port 8000.");
            cleanupExecution();
        }
    } else if (lang === 'javascript') {
        // Fallback to in-browser AST (Previous Implementation if needed)
        renderConsole("JavaScript AST execution currently paused while upgrading engine.");
        cleanupExecution();
    }
}

async function playTraceLoop() {
    while (traceIndex < currentTrace.length) {
        const step = currentTrace[traceIndex];

        if (step.line) {
            updateHighlight(step.line);
        }
        renderVariables(step.variables);
        renderConsole(step.output);

        if (isPlaying) {
            await new Promise(r => setTimeout(r, executionSpeed));
            traceIndex++;
        } else {
            // Wait for user 'Next' click
            await new Promise(r => resolveStep = r);
            traceIndex++;
        }
    }
    cleanupExecution();
}

function cleanupExecution() {
    isExecuting = false;
    editorInstance.updateOptions({ readOnly: false });
    btnRun.disabled = false;
    executionControls.classList.add('hidden');
    currentLine = null;
    updateHighlight(null);
    isPlaying = false;
    btnPlay.textContent = 'Play';
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------

btnRun.addEventListener('click', () => {
    isPlaying = false;
    runCode();
});

btnPlay.addEventListener('click', () => {
    if (!isExecuting) {
        isPlaying = true;
        runCode();
    } else {
        isPlaying = !isPlaying;
        btnPlay.textContent = isPlaying ? 'Pause' : 'Play';
        if (isPlaying && resolveStep) {
            resolveStep();
            resolveStep = null;
        }
    }
});

btnNext.addEventListener('click', () => {
    if (resolveStep) {
        resolveStep();
        resolveStep = null;
    }
});

btnReset.addEventListener('click', () => {
    window.location.reload();
});

// ----------------------------------------------------
// Resizer Logic
// ----------------------------------------------------

const resizer = document.getElementById('resizer');
const sidebar = document.getElementById('sidebar');

let isResizing = false;

if (resizer && sidebar) {
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        resizer.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        let newWidth = e.clientX;

        // Boundaries (min 250px, max 80vw)
        if (newWidth < 250) newWidth = 250;
        if (newWidth > window.innerWidth * 0.8) newWidth = window.innerWidth * 0.8;

        sidebar.style.width = `${newWidth}px`;

        // Notify Monaco Editor to resize
        if (editorInstance) {
            editorInstance.layout();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            resizer.classList.remove('dragging');
        }
    });
}

// ----------------------------------------------------
// Console Resizer Logic
// ----------------------------------------------------

const consoleResizer = document.getElementById('console-resizer');
const variablesPanel = document.getElementById('variables-panel');
const stateContainer = document.querySelector('.state-container');

let isConsoleResizing = false;

if (consoleResizer && variablesPanel && stateContainer) {
    consoleResizer.addEventListener('mousedown', (e) => {
        isConsoleResizing = true;
        document.body.style.cursor = 'col-resize';
        consoleResizer.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isConsoleResizing) return;

        const containerRect = stateContainer.getBoundingClientRect();

        // Calculate new width relative to the state container's left edge
        // Note: The new width is e.clientX - containerRect.left
        let newWidth = e.clientX - containerRect.left;

        // Safety boundaries: don't let variables be smaller than 250px 
        // and don't let console be smaller than 250px
        if (newWidth < 250) newWidth = 250;
        if (newWidth > containerRect.width - 250) newWidth = containerRect.width - 250;

        variablesPanel.style.flex = 'none';
        variablesPanel.style.width = `${newWidth}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isConsoleResizing) {
            isConsoleResizing = false;
            document.body.style.cursor = ''; // Reverts to CSS defined cursor
            consoleResizer.classList.remove('dragging');
        }
    });

    // Reset flex styles if window shrinks to mobile view (column layout)
    window.addEventListener('resize', () => {
        if (window.innerWidth < 1000) {
            variablesPanel.style.flex = '';
            variablesPanel.style.width = '';
        }
    });
}
