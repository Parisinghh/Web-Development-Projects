(() => {
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const keys = document.querySelectorAll('.key');

  const OP_SYMBOLS = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷',
  };

  // Internal state: an array of tokens, e.g. ['12', '+', '8']
  let tokens = [];
  let currentEntry = '';   // number currently being typed
  let justEvaluated = false;

  function formatNumber(num) {
    if (!isFinite(num)) return 'Error';
    // Avoid floating point ugliness, cap precision, strip trailing zeros.
    const rounded = Math.round(num * 1e10) / 1e10;
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  function renderExpression() {
    const parts = tokens.map(t => (OP_SYMBOLS[t] ? OP_SYMBOLS[t] : t));
    expressionEl.textContent = parts.join(' ');
  }

  function renderResult(value) {
    resultEl.textContent = value;
    resultEl.classList.remove('is-error');
  }

  function renderCurrentOrLive() {
    if (currentEntry !== '') {
      renderResult(currentEntry);
      return;
    }
    // Show a live preview of the running calculation if possible
    if (tokens.length && !isOperator(tokens[tokens.length - 1])) {
      const preview = safeEvaluate(tokens);
      if (preview !== null) {
        renderResult(formatNumber(preview));
        return;
      }
    }
    renderResult('0');
  }

  function isOperator(tok) {
    return ['add', 'subtract', 'multiply', 'divide'].includes(tok);
  }

  function safeEvaluate(toks) {
    try {
      return evaluate(toks);
    } catch (e) {
      return null;
    }
  }

  // Evaluate tokens with proper * / precedence before + -
  function evaluate(toks) {
    if (!toks.length) return 0;

    // First pass: resolve * and /
    let pass1 = [];
    let i = 0;
    pass1.push(parseFloat(toks[0]));
    i = 1;
    while (i < toks.length) {
      const op = toks[i];
      const nextVal = parseFloat(toks[i + 1]);
      if (op === 'multiply' || op === 'divide') {
        const prev = pass1.pop();
        if (op === 'divide' && nextVal === 0) {
          throw new Error('Division by zero');
        }
        pass1.push(op === 'multiply' ? prev * nextVal : prev / nextVal);
      } else {
        pass1.push(op, nextVal);
      }
      i += 2;
    }

    // Second pass: resolve + and -
    let result = pass1[0];
    for (let j = 1; j < pass1.length; j += 2) {
      const op = pass1[j];
      const val = pass1[j + 1];
      result = op === 'add' ? result + val : result - val;
    }

    return result;
  }

  function flashKey(action) {
    const selector = action
      ? `[data-action="${action}"]`
      : null;
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove('is-flashed');
    // restart animation
    requestAnimationFrame(() => el.classList.add('is-flashed'));
    setTimeout(() => el.classList.remove('is-flashed'), 260);
  }

  function inputDigit(digit) {
    if (justEvaluated) {
      tokens = [];
      currentEntry = '';
      justEvaluated = false;
    }
    if (digit === '.' && currentEntry.includes('.')) return;
    if (digit === '.' && currentEntry === '') {
      currentEntry = '0.';
    } else {
      // prevent leading zeros like "007"
      if (currentEntry === '0' && digit !== '.') {
        currentEntry = digit;
      } else {
        currentEntry += digit;
      }
    }
    render();
  }

  function inputOperator(action) {
    justEvaluated = false;

    if (currentEntry === '') {
      // allow switching the previous operator instead of stacking
      if (tokens.length && isOperator(tokens[tokens.length - 1])) {
        tokens[tokens.length - 1] = action;
        render();
      }
      return;
    }

    tokens.push(currentEntry);
    tokens.push(action);
    currentEntry = '';
    render();
  }

  function equals() {
    if (currentEntry !== '') {
      tokens.push(currentEntry);
      currentEntry = '';
    } else if (tokens.length && isOperator(tokens[tokens.length - 1])) {
      tokens.pop(); // dangling operator, drop it
    }

    if (!tokens.length) return;

    const value = safeEvaluate(tokens);
    if (value === null) {
      resultEl.textContent = 'Error';
      resultEl.classList.add('is-error');
      expressionEl.textContent = '';
      tokens = [];
      currentEntry = '';
      justEvaluated = true;
      return;
    }

    renderExpression();
    renderResult(formatNumber(value));
    tokens = [String(value)];
    currentEntry = '';
    justEvaluated = true;
  }

  function clearAll() {
    tokens = [];
    currentEntry = '';
    justEvaluated = false;
    render();
  }

  function backspace() {
    if (justEvaluated) {
      clearAll();
      return;
    }
    if (currentEntry !== '') {
      currentEntry = currentEntry.slice(0, -1);
    } else if (tokens.length) {
      tokens.pop();
    }
    render();
  }

  function percent() {
    if (currentEntry !== '') {
      const val = parseFloat(currentEntry);
      currentEntry = String(val / 100);
      render();
    } else if (tokens.length && !isOperator(tokens[tokens.length - 1])) {
      const last = parseFloat(tokens[tokens.length - 1]);
      tokens[tokens.length - 1] = String(last / 100);
      render();
    }
  }

  function render() {
    renderExpression();
    renderCurrentOrLive();
  }

  function handleAction(action) {
    switch (action) {
      case 'clear': clearAll(); break;
      case 'backspace': backspace(); break;
      case 'percent': percent(); break;
      case 'equals': equals(); break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        inputOperator(action);
        break;
    }
  }

  keys.forEach(key => {
    key.addEventListener('click', () => {
      const num = key.dataset.num;
      const action = key.dataset.action;
      if (num !== undefined) {
        inputDigit(num);
      } else if (action) {
        handleAction(action);
      }
      key.classList.add('is-pressed');
      setTimeout(() => key.classList.remove('is-pressed'), 100);
    });
  });

  const KEY_TO_ACTION = {
    '+': 'add',
    '-': 'subtract',
    '*': 'multiply',
    '/': 'divide',
    'Enter': 'equals',
    '=': 'equals',
    'Backspace': 'backspace',
    'Escape': 'clear',
    '%': 'percent',
  };

  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      inputDigit(e.key);
      flashKey(null);
      pulseDigit(e.key);
      return;
    }
    if (e.key === '.') {
      inputDigit('.');
      pulseDigit('.');
      return;
    }
    const action = KEY_TO_ACTION[e.key];
    if (action) {
      e.preventDefault();
      handleAction(action);
      flashKey(action);
    }
  });

  function pulseDigit(char) {
    const el = document.querySelector(`[data-num="${char}"]`);
    if (!el) return;
    el.classList.add('is-pressed');
    setTimeout(() => el.classList.remove('is-pressed'), 100);
  }

  render();
})();