const DrawingState = require('./drawing-state');

const state = new DrawingState();

console.log('Test 1: Add operation');
state.addOperation({ type: 'draw', data: '1' });
if (state.history.length === 1 && state.history[0].active) {
    console.log('PASS');
} else {
    console.error('FAIL', state.history);
}

console.log('Test 2: Add second operation');
state.addOperation({ type: 'draw', data: '2' });
if (state.history.length === 2) {
    console.log('PASS');
} else {
    console.error('FAIL');
}

console.log('Test 3: Undo Last Operation');
const undone = state.undoLastOperation();
if (undone && undone.data === '2' && undone.active === false && state.history[0].active === true) {
    console.log('PASS');
} else {
    console.error('FAIL', undone, state.history);
}

console.log('Test 4: Undo again');
state.undoLastOperation();
if (state.history[0].active === false) {
    console.log('PASS');
} else {
    console.error('FAIL');
}
