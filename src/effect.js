import {patch} from "./vdom.js";

const refs = {};

export const createRef = (refName) => {
  if (!refs[refName]) {
    refs[refName] = {current: null};
  }
  return refs[refName];
};

let count = 0;
let pseudoCount = null;
let effects = {};
let states = {};
let wrapperCount = 0;
let stateWrapperCount = 0;

const getEffectKey = (count) => `effect_${count}`;

const effectBegin = () => {
  if (count === 0) {
    effects = {};
  }
  const key = getEffectKey(++count);
  effects[key] = {mount: () => {}, update: () => {}, hide: () => {}};
  return key;
};

const effectEnd = (countKey) => {
  delete effects[countKey];
  --count;
};

export const effectWrapper = (component) => {
  return function () {
    const tmpCount = effectBegin();
    const fnResult = component.apply(this, arguments);

    fnResult.mount = effects[tmpCount].mount;
    fnResult.update = effects[tmpCount].update;
    fnResult.hide = effects[tmpCount].hide;

    if (states[tmpCount]) {
      states[tmpCount].onStateChange = () => {
        const countNumber = +tmpCount.split('_')[1];
        pseudoCount = {effectNumber: countNumber, stateNumber: 0};
        patch(states[tmpCount].ref.current, component.apply(this, arguments));
        pseudoCount = null;
      }
    }

    effectEnd(tmpCount);
    wrapperCount++;
    return fnResult;
  }
};

export const createState = (ref, initState) => {
  if (pseudoCount !== null) {
    const tmpCount = getEffectKey(pseudoCount.effectNumber);
    const state = states[tmpCount].states[pseudoCount.stateNumber];
    pseudoCount.stateNumber++;
    if (pseudoCount.stateNumber >= states[tmpCount].states.length) {
      pseudoCount = null;
    }
    return [state.state, state.setState];
  }

  if (wrapperCount !== stateWrapperCount) {
    stateWrapperCount = wrapperCount;
    let tmpCount = getEffectKey(count);
    let neededStateIdx = null;
    if (states[tmpCount]?.ref?.current !== ref.current) {
      let stateIdx = null;
      for (let i = 0; i < states.length; i++) {
        if (states[i].ref.current === ref.current) {
          stateIdx = i;
          break;
        }
      }
      neededStateIdx = stateIdx;
    } else if (states[tmpCount].ref.current === ref.current && ref.current !== null) {
      neededStateIdx = count;
    }
    if (neededStateIdx !== null) {
      tmpCount = getEffectKey(neededStateIdx);
      pseudoCount = {effectNumber: neededStateIdx, stateNumber: 0}
      const state = states[tmpCount].states[pseudoCount.stateNumber];
      pseudoCount.stateNumber++;
      if (pseudoCount.stateNumber >= states[tmpCount].states.length) {
        pseudoCount = null;
      }
      return [state.state, state.setState];
    } else {
      delete states[getEffectKey(count)];
    }
  }

  const tmpCount = getEffectKey(count);
  if (!states[tmpCount] || states[tmpCount].ref.current !== ref.current) {
    states[tmpCount] = {
      ref: ref,
      states: [],
      onStateChange: () => {},
    }
  }
  const state = {
    state: initState,
    setState: () => {},
  };
  state.setState = (newState) => {state.state = newState; states[tmpCount].onStateChange()}
  states[tmpCount].states.push(state);
  return [state.state, state.setState];
}

export const componentEffects = (onMount, onUpdate, onHide) => {
  const tmpCount = getEffectKey(count);
  effects[tmpCount].mount = onMount;
  effects[tmpCount].update = onUpdate;
  effects[tmpCount].hide = onHide;
}

export const mountEffect = (onMount) => {
  const tmpCount = getEffectKey(count);
  effects[tmpCount].mount = onMount;
}

export const updateEffect = (onUpdate) => {
  const tmpCount = getEffectKey(count);
  effects[tmpCount].update = onUpdate;
}

export const hideEffect = (onHide) => {
  const tmpCount = getEffectKey(count);
  effects[tmpCount].hide = onHide;
}


export const memoize = (func) => {
  const memo = {};
  const slice = Array.prototype.slice;

  return function () {
    const args = slice.call(arguments);
    let JSONArgs;
    if (args.length === 1 && (typeof args[0] !== 'object' || typeof args[0] !== 'function')) {
      JSONArgs = args[0];
    } else {
      JSONArgs = JSON.stringify(args);
    }

    if (JSONArgs in memo) {
      return memo[JSONArgs];
    }
    return (memo[JSONArgs] = func.apply(this, arguments));
  }
}


let appRoot;

export const setAppRoot = (root) => {
  appRoot = root;
};

export const renderComponent = (vdom, ...props) => {
  if (!appRoot) {
    console.error('No app root');
  }
  if (typeof vdom === 'function') {
    vdom = vdom(props);
  }
  console.log(vdom)
  patch(appRoot, vdom);
};
