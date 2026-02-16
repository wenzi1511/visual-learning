import { state } from '../state.js';

export function renderArray(vals) {
    const stage = state.dom.stage;
    const existing = stage.querySelector('.array-container');
    if (existing) stage.removeChild(existing);

    const cont = document.createElement('div');
    cont.className = 'array-container';
    vals.forEach((v, i) => {
        cont.innerHTML += `
            <div class="array-cell">
                <div class="array-box">${v}</div>
                <div class="array-idx">${i}</div>
            </div>`;
    });
    stage.appendChild(cont);
}

export function insertArray(idx, val) {
    if (state.currentMode !== 'array') return;
    state.dsData.splice(idx, 0, val);
    renderArray(state.dsData);
}

export function updateArray(idx, val) {
    if (state.currentMode !== 'array') return;
    if (idx < 0 || idx >= state.dsData.length) return;
    state.dsData[idx] = val;
    renderArray(state.dsData);
}

export function deleteArray(idx) {
    if (state.currentMode !== 'array') return;
    if (idx < 0 || idx >= state.dsData.length) return;
    state.dsData.splice(idx, 1);
    renderArray(state.dsData);
}

export function searchArray(val) {
    if (state.currentMode !== 'array') return;
    if (state.dsData.length === 0) return;

    // Reset any previous step state
    resetStepController();

    // Store search target
    state.stepController.searchTarget = val;

    // Generate steps: each step represents checking index i
    // Step 0: initial state (nothing highlighted)
    // Step 1 to N: checking each element
    // Final step: show result (found or not found)

    const steps = [];

    // Initial step - show starting state
    steps.push({ type: 'init', index: -1 });

    // Steps for each element check
    for (let i = 0; i < state.dsData.length; i++) {
        steps.push({ type: 'check', index: i });
        if (state.dsData[i] === val) {
            steps.push({ type: 'found', index: i });
            break;
        }
    }

    // If last step isn't 'found', add 'not-found' step
    if (steps[steps.length - 1].type !== 'found') {
        steps.push({ type: 'not-found', index: -1 });
    }

    state.stepController.steps = steps;
    state.stepController.currentStep = 0;
    state.stepController.isActive = true;

    // Show step controls
    state.dom.stepControls.classList.remove('hidden');

    // Render initial step
    renderArrayStep();
    updateStepButtons();
}

export function renderArrayStep() {
    const { steps, currentStep, searchTarget } = state.stepController;
    if (!steps.length) return;

    const step = steps[currentStep];
    const cells = state.dom.stage.querySelectorAll('.array-box');

    // Reset all cells first
    cells.forEach(cell => {
        cell.style.borderColor = '';
        cell.style.backgroundColor = '';
        cell.style.transform = '';
    });

    if (step.type === 'init') {
        // Initial state - nothing highlighted
        state.dom.stepIndicator.innerText = `Ready to search for ${searchTarget}`;
    } else if (step.type === 'check') {
        // Highlight current being checked
        if (cells[step.index]) {
            cells[step.index].style.borderColor = '#3b82f6'; // Blue border
            cells[step.index].style.transform = 'scale(1.05)';
        }
        // Also show previously checked cells as dimmed
        for (let i = 0; i < step.index; i++) {
            if (cells[i]) {
                cells[i].style.borderColor = 'rgba(100, 116, 139, 0.5)';
            }
        }
        state.dom.stepIndicator.innerText = `Checking index ${step.index}`;
    } else if (step.type === 'found') {
        // Found - highlight with success
        if (cells[step.index]) {
            cells[step.index].style.backgroundColor = '#10b981'; // Green
            cells[step.index].style.transform = 'scale(1.15)';
            cells[step.index].style.borderColor = '#34d399';
        }
        state.dom.stepIndicator.innerText = `Found at index ${step.index}!`;
    } else if (step.type === 'not-found') {
        // Not found - show all as checked
        cells.forEach(cell => {
            cell.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        });
        state.dom.stepIndicator.innerText = `Value ${searchTarget} not found`;
    }
}

export function nextStep() {
    if (!state.stepController.isActive) return;
    if (state.stepController.currentStep >= state.stepController.steps.length - 1) return;

    state.stepController.currentStep++;
    if (state.stepController.mode === 'stack-mono') {
        renderStackStep();
    } else if (state.stepController.mode === 'queue-mono') {
        renderQueueStep();
    } else {
        renderArrayStep();
    }
    updateStepButtons();
}

export function prevStep() {
    if (!state.stepController.isActive) return;
    if (state.stepController.currentStep <= 0) return;

    state.stepController.currentStep--;
    if (state.stepController.mode === 'stack-mono') {
        renderStackStep();
    } else if (state.stepController.mode === 'queue-mono') {
        renderQueueStep();
    } else {
        renderArrayStep();
    }
    updateStepButtons();
}

export function updateStepButtons() {
    const { steps, currentStep } = state.stepController;

    state.dom.btnPrevStep.disabled = currentStep <= 0;
    state.dom.btnNextStep.disabled = currentStep >= steps.length - 1;
}

export function resetStepController() {
    state.stepController.steps = [];
    state.stepController.currentStep = 0;
    state.stepController.isActive = false;
    state.stepController.searchTarget = null;
    state.stepController.mode = null;

    // Hide step controls
    if (state.dom.stepControls) {
        state.dom.stepControls.classList.add('hidden');
    }

    // Reset array cell styles
    const cells = state.dom.stage.querySelectorAll('.array-box');
    cells.forEach(cell => {
        cell.style.borderColor = '';
        cell.style.backgroundColor = '';
        cell.style.transform = '';
    });
}

export function renderStack(vals, container = state.dom.stage, isEmbedded = false) {
    // Remove existing stack container if any
    const existing = container.querySelector('.stack-container');
    if (existing) container.removeChild(existing);

    const cont = document.createElement('div');
    cont.className = 'stack-container' + (isEmbedded ? ' embedded' : '');

    // Force inline style reset for embedded to ensure no absolute positioning override issues
    if (isEmbedded) {
        cont.style.position = 'static';
        cont.style.transform = 'none';
        cont.style.margin = '5px 0';
    }

    vals.forEach(v => {
        cont.innerHTML += `<div class="stack-item">${v}</div>`;
    });
    container.appendChild(cont);
}

export function pushToStack(val) {
    if (state.currentMode !== 'stack') return;

    // Reset previous steps
    resetStepController();

    const mono = state.stackMonotonic;
    if (!mono) {
        // Normal push
        state.dsData.push(val);
        renderStack(state.dsData);
        return;
    }

    // Monotonic Step Generation
    const steps = [];
    // Copy data to simulate steps without mutating actual state yet
    let simData = [...state.dsData];

    // Step 0: Initial state
    steps.push({ type: 'init', data: [...simData], val: val, msg: `Prepare to push ${val}` });

    if (mono === 'inc') {
        // Monotonic Increasing: Pop while top >= val
        while (simData.length > 0) {
            const top = simData[simData.length - 1];
            steps.push({ type: 'compare', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Compare top (${top}) >= ${val}?` });

            if (top >= val) {
                steps.push({ type: 'pop', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `${top} >= ${val} is true → Pop ${top}` });
                simData.pop();
                steps.push({ type: 'popped', data: [...simData], val: val, msg: 'Popped.' });
            } else {
                steps.push({ type: 'keep', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `${top} < ${val} → Keep ${top}` });
                break;
            }
        }
    } else if (mono === 'dec') {
        // Monotonic Decreasing: Pop while top <= val
        while (simData.length > 0) {
            const top = simData[simData.length - 1];
            steps.push({ type: 'compare', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Compare top (${top}) <= ${val}?` });

            if (top <= val) {
                steps.push({ type: 'pop', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `${top} <= ${val} is true → Pop ${top}` });
                simData.pop();
                steps.push({ type: 'popped', data: [...simData], val: val, msg: 'Popped.' });
            } else {
                steps.push({ type: 'keep', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `${top} > ${val} → Keep ${top}` });
                break;
            }
        }
    }

    // Final Push
    simData.push(val);
    steps.push({ type: 'push', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Push ${val}` });

    // Update actual data immediately for consistency
    state.dsData = simData;

    // Activate Step Controller
    state.stepController.steps = steps;
    state.stepController.currentStep = 0;
    state.stepController.isActive = true;
    state.stepController.mode = 'stack-mono';

    state.dom.stepControls.classList.remove('hidden');
    renderStackStep();
    updateStepButtons();
}

export function popFromStack() {
    if (state.currentMode !== 'stack') return;
    resetStepController();
    if (state.dsData.length === 0) {
        alert("Stack is empty!");
        renderStack(state.dsData); // Just to be safe
        return;
    }
    state.dsData.pop();
    renderStack(state.dsData);
}

export function renderStackStep() {
    const { steps, currentStep } = state.stepController;
    if (!steps.length) return;

    if (state.dom.stepControls) state.dom.stepControls.classList.remove('hidden');

    const step = steps[currentStep];

    // Render the state of the stack at this step
    renderStack(step.data, state.dom.stage, false);
    state.dom.stepIndicator.innerText = step.msg;

    let items = state.dom.stage.querySelectorAll('.stack-item');
    if (items.length === 0 && step.data.length > 0) {
        items = state.dom.stage.querySelectorAll('.stack-item');
    }

    // reset styles
    items.forEach(el => {
        el.style.backgroundColor = '';
        el.style.borderColor = '';
        el.style.transform = '';
    });

    if (step.type === 'compare') {
        if (items[step.highlightIdx]) {
            items[step.highlightIdx].style.borderColor = '#3b82f6'; // Blue border
            items[step.highlightIdx].style.transform = 'scale(1.05)';
        }
    } else if (step.type === 'pop') {
        if (items[step.highlightIdx]) {
            items[step.highlightIdx].style.backgroundColor = '#ef4444'; // Red
            items[step.highlightIdx].style.borderColor = '#ef4444';
        }
    } else if (step.type === 'push') {
        if (items[step.highlightIdx]) {
            items[step.highlightIdx].style.backgroundColor = '#10b981'; // Green
            items[step.highlightIdx].style.transform = 'scale(1.1)';
        }
    }
}

export function peekStack() {
    if (state.currentMode !== 'stack') return;
    resetStepController();
    if (state.dsData.length === 0) {
        alert("Stack is empty!");
        return;
    }
    const val = state.dsData[state.dsData.length - 1];

    // Visual feedback
    const items = state.dom.stage.querySelectorAll('.stack-item');
    if (items.length > 0) {
        const topItem = items[items.length - 1];
        topItem.style.backgroundColor = '#ec4899'; // Pink/Highlight
        topItem.style.transform = 'scale(1.1)';
        setTimeout(() => {
            topItem.style.backgroundColor = '';
            topItem.style.transform = '';
        }, 1000);
    }
}

export function renderQueue(vals, container = state.dom.stage, isEmbedded = false) {
    const existing = container.querySelector('.queue-container');
    if (existing) container.removeChild(existing);

    const cont = document.createElement('div');
    cont.className = 'queue-container' + (isEmbedded ? ' embedded' : '');

    if (isEmbedded) {
        cont.style.position = 'static';
        cont.style.transform = 'none';
        cont.style.margin = '5px 0';
    }

    vals.forEach(v => {
        cont.innerHTML += `<div class="queue-item">${v}</div>`;
    });
    container.appendChild(cont);
}

export function enqueueToQueue(val) {
    if (state.currentMode !== 'queue') return;

    resetStepController();

    const mono = state.queueMonotonic;
    const kRaw = state.dom.queueWindowK ? state.dom.queueWindowK.value : '';
    const k = parseInt(kRaw);
    const hasWindow = !isNaN(k) && k > 0;

    if (!mono) {
        // Normal enqueue
        state.dsData.push(val);
        logQueue(`Enqueue ${val}`);

        // Limit window if needed
        if (hasWindow) {
            while (state.dsData.length > k) {
                const shifted = state.dsData.shift();
                logQueue(`Window Limit (${k}): Removed Front ${shifted}`);
            }
        }

        renderQueue(state.dsData);
        return;
    }

    // Monotonic Step Generation
    const steps = [];
    let simData = [...state.dsData];

    steps.push({ type: 'init', data: [...simData], val: val, msg: `Prepare to enqueue ${val}` });

    // 1. Monotonic Checks (Remove from Back)
    if (mono === 'inc') {
        while (simData.length > 0) {
            const back = simData[simData.length - 1];
            steps.push({ type: 'compare', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Compare Back to ${val}: ${back} >= ${val}?` });

            if (back >= val) {
                steps.push({ type: 'pop', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Back ${back} >= ${val} -> Pop Back` });
                simData.pop();
                steps.push({ type: 'popped', data: [...simData], val: val, msg: 'Popped Back.' });
                logQueue(`Monotonic: Back (${back}) >= Current (${val}) -> Pop Back`);
            } else {
                steps.push({ type: 'keep', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Back ${back} < ${val} -> Keep` });
                break;
            }
        }
    } else if (mono === 'dec') {
        while (simData.length > 0) {
            const back = simData[simData.length - 1];
            steps.push({ type: 'compare', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Compare Back to ${val}: ${back} <= ${val}?` });

            if (back <= val) {
                steps.push({ type: 'pop', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Back ${back} <= ${val} -> Pop Back` });
                simData.pop();
                steps.push({ type: 'popped', data: [...simData], val: val, msg: 'Popped Back.' });
                logQueue(`Monotonic: Back (${back}) <= Current (${val}) -> Pop Back`);
            } else {
                steps.push({ type: 'keep', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Back ${back} > ${val} -> Keep` });
                break;
            }
        }
    }

    // 2. Push New Value
    simData.push(val);
    steps.push({ type: 'push', data: [...simData], val: val, highlightIdx: simData.length - 1, msg: `Push ${val} to Back` });
    logQueue(`Push ${val} to Back`);

    // 3. Window Limit Checks (Remove from Front)
    if (hasWindow) {
        while (simData.length > k) {
            const front = simData[0];
            steps.push({ type: 'compare-window', data: [...simData], val: val, highlightIdx: 0, msg: `Size ${simData.length} > ${k}? Remove Front ${front}` });
            simData.shift();
            steps.push({ type: 'popped-front', data: [...simData], val: val, msg: `Removed Front ${front} (Window Limit)` });
            logQueue(`Window Limit (${k}): Removed Front ${front}`);
        }
    }

    state.dsData = simData;

    // Build Steps
    state.stepController.steps = steps;
    state.stepController.currentStep = 0;
    state.stepController.isActive = true;
    state.stepController.mode = 'queue-mono';

    state.dom.stepControls.classList.remove('hidden');
    renderQueueStep();
    updateStepButtons();
}

export function renderQueueStep() {
    const { steps, currentStep } = state.stepController;
    if (!steps.length) return;

    if (state.dom.stepControls) state.dom.stepControls.classList.remove('hidden');

    const step = steps[currentStep];
    renderQueue(step.data, state.dom.stage, false);
    state.dom.stepIndicator.innerText = step.msg;

    let items = state.dom.stage.querySelectorAll('.queue-item');
    if (items.length === 0 && step.data.length > 0) {
        items = state.dom.stage.querySelectorAll('.queue-item');
    }

    // Reset styles
    items.forEach(el => {
        el.style.backgroundColor = '';
        el.style.borderColor = '';
        el.style.transform = '';
    });

    if (step.type === 'compare') {
        // Highlight back item (last one)
        if (items[step.highlightIdx]) {
            items[step.highlightIdx].style.borderColor = '#3b82f6'; // Blue border
            items[step.highlightIdx].style.transform = 'scale(1.05)';
        }
    } else if (step.type === 'pop') {
        // Highlight back item for removal
        if (items[step.highlightIdx]) {
            items[step.highlightIdx].style.backgroundColor = '#ef4444'; // Red
            items[step.highlightIdx].style.borderColor = '#ef4444';
        }
    } else if (step.type === 'push') {
        // Highlight new item at back
        if (items[step.highlightIdx]) {
            items[step.highlightIdx].style.backgroundColor = '#10b981'; // Green
            items[step.highlightIdx].style.transform = 'scale(1.1)';
        }
    } else if (step.type === 'compare-window') {
        // Highlight front item for removal
        if (items[0]) {
            items[0].style.backgroundColor = '#fca5a5'; // Light Red
            items[0].style.borderColor = '#ef4444';
        }
    }
}

export function dequeueFromQueue() {
    if (state.currentMode !== 'queue') return;
    if (state.dsData.length === 0) {
        alert("Queue is empty!");
        return;
    }
    const val = state.dsData.shift();
    logQueue(`Dequeue ${val}`);
    renderQueue(state.dsData);
}

function logQueue(msg) {
    if (state.dom.queueLog) {
        const line = document.createElement('div');
        line.textContent = `> ${msg}`;
        line.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        line.style.padding = '2px 0';
        state.dom.queueLog.appendChild(line);
        state.dom.queueLog.scrollTop = state.dom.queueLog.scrollHeight;
    }
}

export function peekQueue() {
    if (state.currentMode !== 'queue') return;
    if (state.dsData.length === 0) {
        alert("Queue is empty!");
        return;
    }

    // Visual feedback - First item is front of queue
    const items = state.dom.stage.querySelectorAll('.queue-item');
    if (items.length > 0) {
        const frontItem = items[0];
        frontItem.style.backgroundColor = '#ec4899'; // Pink/Highlight
        frontItem.style.transform = 'scale(1.1)';
        setTimeout(() => {
            frontItem.style.backgroundColor = '';
            frontItem.style.transform = '';
        }, 1000);
    }
}
