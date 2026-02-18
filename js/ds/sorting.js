import { state } from '../state.js';

// ─── BAR RENDERING ───────────────────────────────────────────

export function renderBars(data, highlights = {}) {
    const stage = state.dom.stage;

    // Remove old containers
    const oldArr = stage.querySelector('.array-container');
    if (oldArr) stage.removeChild(oldArr);
    const oldBars = stage.querySelector('.bar-container');
    if (oldBars) stage.removeChild(oldBars);

    if (!data || data.length === 0) return;

    const maxVal = Math.max(...data);
    const barMaxHeight = 280;

    const cont = document.createElement('div');
    cont.className = 'bar-container';

    data.forEach((v, i) => {
        const barWrap = document.createElement('div');
        barWrap.className = 'bar-wrap';

        const bar = document.createElement('div');
        bar.className = 'bar';
        const h = maxVal > 0 ? (v / maxVal) * barMaxHeight : 4;
        bar.style.height = `${Math.max(h, 4)}px`;

        // Color logic
        if (highlights.swapping && highlights.swapping.includes(i)) {
            bar.classList.add('bar-swap');
        } else if (highlights.pivot !== undefined && highlights.pivot === i) {
            bar.classList.add('bar-pivot');
        } else if (highlights.comparing && highlights.comparing.includes(i)) {
            bar.classList.add('bar-compare');
        } else if (highlights.sorted && highlights.sorted.includes(i)) {
            bar.classList.add('bar-sorted');
        } else if (highlights.merging && highlights.merging.includes(i)) {
            bar.classList.add('bar-merge');
        }

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = v;

        barWrap.appendChild(bar);
        barWrap.appendChild(label);
        cont.appendChild(barWrap);
    });

    stage.appendChild(cont);
}

// ─── LOGGING ─────────────────────────────────────────────────

function logSort(msg) {
    if (state.dom.sortLog) {
        const line = document.createElement('div');
        line.textContent = `> ${msg}`;
        line.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        line.style.padding = '2px 0';
        state.dom.sortLog.appendChild(line);
        state.dom.sortLog.scrollTop = state.dom.sortLog.scrollHeight;
    }
}

// ─── ENTRY POINT ─────────────────────────────────────────────

export function startSort(algorithm) {
    if (state.currentMode !== 'array') return;
    if (!state.dsData || state.dsData.length === 0) {
        alert('Array is empty! Add some values first.');
        return;
    }

    // Reset step controller (inline to avoid circular import)
    state.stepController.steps = [];
    state.stepController.currentStep = 0;
    state.stepController.isActive = false;
    state.stepController.searchTarget = null;
    state.stepController.mode = null;
    if (state.dom.stepControls) {
        state.dom.stepControls.classList.add('hidden');
    }

    // Clear log
    if (state.dom.sortLog) state.dom.sortLog.innerHTML = '';

    // Remove old array boxes
    const oldArr = state.dom.stage.querySelector('.array-container');
    if (oldArr) oldArr.remove();

    const data = state.dsData.map(Number);
    const steps = generateSortSteps(algorithm, data);

    state.stepController.steps = steps;
    state.stepController.currentStep = 0;
    state.stepController.isActive = true;
    state.stepController.mode = 'sort';

    state.dom.stepControls.classList.remove('hidden');
    renderSortStep();

    // Update step buttons
    state.dom.btnPrevStep.disabled = true;
    state.dom.btnNextStep.disabled = steps.length <= 1;
}

// ─── STEP RENDERER ───────────────────────────────────────────

export function renderSortStep() {
    const { steps, currentStep } = state.stepController;
    if (!steps.length) return;

    if (state.dom.stepControls) state.dom.stepControls.classList.remove('hidden');

    const step = steps[currentStep];
    renderBars(step.data, step.highlights);
    state.dom.stepIndicator.innerText = step.msg;

    // Append to log only when stepping forward (avoid duplicates)
    if (step._logged !== true) {
        logSort(step.msg);
        step._logged = true;
    }
}

// ─── STEP GENERATION ─────────────────────────────────────────

function generateSortSteps(algorithm, data) {
    const arr = [...data];
    switch (algorithm) {
        case 'bubble': return bubbleSortSteps(arr);
        case 'selection': return selectionSortSteps(arr);
        case 'insertion': return insertionSortSteps(arr);
        case 'merge': return mergeSortSteps(arr);
        case 'quick': return quickSortSteps(arr);
        default: return bubbleSortSteps(arr);
    }
}

// ─── BUBBLE SORT ─────────────────────────────────────────────

function bubbleSortSteps(data) {
    const steps = [];
    const arr = [...data];
    const n = arr.length;
    const sorted = [];

    steps.push({ data: [...arr], highlights: {}, msg: `Start Bubble Sort (n=${n})` });

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            // Compare
            steps.push({
                data: [...arr],
                highlights: { comparing: [j, j + 1], sorted: [...sorted] },
                msg: `Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}`
            });

            if (arr[j] > arr[j + 1]) {
                // Swap
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                steps.push({
                    data: [...arr],
                    highlights: { swapping: [j, j + 1], sorted: [...sorted] },
                    msg: `Swap arr[${j}] ↔ arr[${j + 1}]`
                });
            }
        }
        sorted.unshift(n - 1 - i);
    }
    sorted.unshift(0);

    steps.push({
        data: [...arr],
        highlights: { sorted: Array.from({ length: n }, (_, i) => i) },
        msg: `✅ Bubble Sort Complete!`
    });

    // Update state data to sorted
    state.dsData = [...arr];
    return steps;
}

// ─── SELECTION SORT ──────────────────────────────────────────

function selectionSortSteps(data) {
    const steps = [];
    const arr = [...data];
    const n = arr.length;
    const sorted = [];

    steps.push({ data: [...arr], highlights: {}, msg: `Start Selection Sort (n=${n})` });

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;

        steps.push({
            data: [...arr],
            highlights: { comparing: [i], sorted: [...sorted] },
            msg: `Pass ${i + 1}: Find min from index ${i} to ${n - 1}`
        });

        for (let j = i + 1; j < n; j++) {
            steps.push({
                data: [...arr],
                highlights: { comparing: [minIdx, j], pivot: i, sorted: [...sorted] },
                msg: `Compare arr[${minIdx}]=${arr[minIdx]} with arr[${j}]=${arr[j]}`
            });

            if (arr[j] < arr[minIdx]) {
                minIdx = j;
                steps.push({
                    data: [...arr],
                    highlights: { comparing: [minIdx], pivot: i, sorted: [...sorted] },
                    msg: `New min found: arr[${minIdx}]=${arr[minIdx]}`
                });
            }
        }

        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            steps.push({
                data: [...arr],
                highlights: { swapping: [i, minIdx], sorted: [...sorted] },
                msg: `Swap arr[${i}] ↔ arr[${minIdx}]`
            });
        }
        sorted.push(i);
    }
    sorted.push(n - 1);

    steps.push({
        data: [...arr],
        highlights: { sorted: Array.from({ length: n }, (_, i) => i) },
        msg: `✅ Selection Sort Complete!`
    });

    state.dsData = [...arr];
    return steps;
}

// ─── INSERTION SORT ──────────────────────────────────────────

function insertionSortSteps(data) {
    const steps = [];
    const arr = [...data];
    const n = arr.length;

    steps.push({ data: [...arr], highlights: { sorted: [0] }, msg: `Start Insertion Sort (n=${n})` });

    for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;

        steps.push({
            data: [...arr],
            highlights: { pivot: i, sorted: Array.from({ length: i }, (_, k) => k) },
            msg: `Insert arr[${i}]=${key} into sorted portion`
        });

        while (j >= 0 && arr[j] > key) {
            steps.push({
                data: [...arr],
                highlights: { comparing: [j, j + 1], sorted: Array.from({ length: i }, (_, k) => k) },
                msg: `arr[${j}]=${arr[j]} > ${key} → shift right`
            });

            arr[j + 1] = arr[j];
            j--;

            steps.push({
                data: [...arr],
                highlights: { swapping: [j + 1, j + 2], sorted: Array.from({ length: i }, (_, k) => k) },
                msg: `Shifted: arr[${j + 2}] → arr[${j + 1}]`
            });
        }

        arr[j + 1] = key;
        steps.push({
            data: [...arr],
            highlights: { pivot: j + 1, sorted: Array.from({ length: i + 1 }, (_, k) => k) },
            msg: `Placed ${key} at index ${j + 1}`
        });
    }

    steps.push({
        data: [...arr],
        highlights: { sorted: Array.from({ length: n }, (_, i) => i) },
        msg: `✅ Insertion Sort Complete!`
    });

    state.dsData = [...arr];
    return steps;
}

// ─── MERGE SORT ──────────────────────────────────────────────

function mergeSortSteps(data) {
    const steps = [];
    const arr = [...data];
    const n = arr.length;

    steps.push({ data: [...arr], highlights: {}, msg: `Start Merge Sort (n=${n})` });

    function mergeSort(arr, left, right) {
        if (left >= right) return;
        const mid = Math.floor((left + right) / 2);

        steps.push({
            data: [...arr],
            highlights: { comparing: range(left, mid), merging: range(mid + 1, right) },
            msg: `Split [${left}..${mid}] | [${mid + 1}..${right}]`
        });

        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }

    function merge(arr, left, mid, right) {
        const leftArr = arr.slice(left, mid + 1);
        const rightArr = arr.slice(mid + 1, right + 1);
        let i = 0, j = 0, k = left;

        steps.push({
            data: [...arr],
            highlights: { merging: range(left, right) },
            msg: `Merge [${leftArr}] and [${rightArr}]`
        });

        while (i < leftArr.length && j < rightArr.length) {
            steps.push({
                data: [...arr],
                highlights: { comparing: [left + i, mid + 1 + j], merging: range(left, right) },
                msg: `Compare ${leftArr[i]} vs ${rightArr[j]}`
            });

            if (leftArr[i] <= rightArr[j]) {
                arr[k] = leftArr[i];
                i++;
            } else {
                arr[k] = rightArr[j];
                j++;
            }
            steps.push({
                data: [...arr],
                highlights: { sorted: range(left, k), merging: range(left, right) },
                msg: `Place ${arr[k]} at index ${k}`
            });
            k++;
        }

        while (i < leftArr.length) {
            arr[k] = leftArr[i];
            steps.push({
                data: [...arr],
                highlights: { sorted: range(left, k), merging: range(left, right) },
                msg: `Place remaining ${arr[k]} at index ${k}`
            });
            i++; k++;
        }

        while (j < rightArr.length) {
            arr[k] = rightArr[j];
            steps.push({
                data: [...arr],
                highlights: { sorted: range(left, k), merging: range(left, right) },
                msg: `Place remaining ${arr[k]} at index ${k}`
            });
            j++; k++;
        }
    }

    mergeSort(arr, 0, n - 1);

    steps.push({
        data: [...arr],
        highlights: { sorted: Array.from({ length: n }, (_, i) => i) },
        msg: `✅ Merge Sort Complete!`
    });

    state.dsData = [...arr];
    return steps;
}

// ─── QUICK SORT ──────────────────────────────────────────────

function quickSortSteps(data) {
    const steps = [];
    const arr = [...data];
    const n = arr.length;
    const globalSorted = new Set();

    steps.push({ data: [...arr], highlights: {}, msg: `Start Quick Sort (n=${n})` });

    function quickSort(arr, low, high) {
        if (low >= high) {
            if (low === high) globalSorted.add(low);
            return;
        }
        const pi = partition(arr, low, high);
        globalSorted.add(pi);

        steps.push({
            data: [...arr],
            highlights: { sorted: [...globalSorted], pivot: pi },
            msg: `Pivot ${arr[pi]} placed at index ${pi}`
        });

        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }

    function partition(arr, low, high) {
        const pivot = arr[high];

        steps.push({
            data: [...arr],
            highlights: { pivot: high, comparing: range(low, high - 1), sorted: [...globalSorted] },
            msg: `Partition [${low}..${high}], pivot=${pivot}`
        });

        let i = low - 1;

        for (let j = low; j < high; j++) {
            steps.push({
                data: [...arr],
                highlights: { comparing: [j], pivot: high, sorted: [...globalSorted] },
                msg: `Compare arr[${j}]=${arr[j]} with pivot ${pivot}`
            });

            if (arr[j] < pivot) {
                i++;
                if (i !== j) {
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    steps.push({
                        data: [...arr],
                        highlights: { swapping: [i, j], pivot: high, sorted: [...globalSorted] },
                        msg: `Swap arr[${i}] ↔ arr[${j}]`
                    });
                }
            }
        }

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        steps.push({
            data: [...arr],
            highlights: { swapping: [i + 1, high], sorted: [...globalSorted] },
            msg: `Place pivot: Swap arr[${i + 1}] ↔ arr[${high}]`
        });

        return i + 1;
    }

    quickSort(arr, 0, n - 1);

    steps.push({
        data: [...arr],
        highlights: { sorted: Array.from({ length: n }, (_, i) => i) },
        msg: `✅ Quick Sort Complete!`
    });

    state.dsData = [...arr];
    return steps;
}

// ─── UTILS ───────────────────────────────────────────────────

function range(start, end) {
    const r = [];
    for (let i = start; i <= end; i++) r.push(i);
    return r;
}
