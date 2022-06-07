const SSR_NODE = 1;
const TEXT_NODE = 3;
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const SVG_NS = "http://www.w3.org/2000/svg";

const effectsArray = [];

const listener = function (event) {
  this.events[event.type](event)
}

const getKey = (vdom) => (vdom == null ? vdom : vdom.key)

const executeEffectIfExist = (vnode, wasPropsUpdated) => {
  const isChildrenChange = effectsArray.pop();
  if (isChildrenChange) {
    if (effectsArray.length > 0) {
      effectsArray[effectsArray.length - 1] = true;
    }
    !wasPropsUpdated && vnode?.update?.();
  }
};

const patchProperty = (node, key, oldValue, newValue, isSvg) => {
  if (key === "key") {
  } else if (key[0] === "o" && key[1] === "n") {
    if (
      !((node.events || (node.events = {}))[(key = key.slice(2))] = newValue)
    ) {
      node.removeEventListener(key, listener)
    } else if (!oldValue) {
      node.addEventListener(key, listener)
    }
  } else if (key === "ref") {
    if (newValue !== oldValue) {
      oldValue && passToRef(oldValue, null)
      newValue && passToRef(newValue, node)
    }
  } else if (!isSvg && key !== "list" && key !== "form" && key in node) {
    node[key] = newValue == null ? "" : newValue
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key)
  } else {
    node.setAttribute(key, newValue)
  }
}

const createNode = (vdom, isSvg) => {
  let props = vdom.props,
    node =
      vdom.type === TEXT_NODE
        ? document.createTextNode(vdom.tag)
        : (isSvg = isSvg || vdom.tag === "svg")
          ? document.createElementNS(SVG_NS, vdom.tag, { is: props.is })
          : document.createElement(vdom.tag, { is: props.is })

  for (let k in props) {
    patchProperty(node, k, null, props[k], isSvg)
  }
  if (effectsArray.length === 0) {
    effectsArray[effectsArray.length - 1] = true;
  }

  for (let i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode((vdom.children[i] = vdomify(vdom.children[i])), isSvg)
    )
  }

  node.props = vdom.props;
  return node;
}

const patchNode = (parent, node, oldVNode, newVNode, isSvg) => {
  let wasNodeCreated = false;
  if (oldVNode === newVNode) {
  } else if (
    oldVNode != null &&
    oldVNode.type === TEXT_NODE &&
    newVNode.type === TEXT_NODE
  ) {
    if (oldVNode.tag !== newVNode.tag) {
      oldVNode?.hide?.();
      node.nodeValue = newVNode.tag;
      if (effectsArray.length > 0) {
        effectsArray[effectsArray.length - 1] = true;
      }
      newVNode?.update?.();
    }
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    oldVNode?.hide?.();
    oldVNode && dismissVNode(oldVNode)

    newVNode = vdomify(newVNode);
    const nodeCopy = node;
    node = parent.insertBefore(
      createNode(newVNode, isSvg),
      node
    )
    newVNode?.mount?.();
    if (oldVNode != null) {
      parent.removeChild(nodeCopy)
    }
  } else {
    let tmpVKid;
    let tmpKid;
    let oldVKid;
    let oldKid;
    let oldKey;
    let newKey;
    let oldProps = oldVNode.props;
    let newProps = newVNode.props;
    let oldVKids = oldVNode.children;
    let oldKids = EMPTY_ARR.slice.call(node?.childNodes);
    let newVKids = newVNode.children;
    let oldHead = 0;
    let newHead = 0;
    let oldTail = oldVKids.length - 1;
    let newTail = newVKids.length - 1;

    isSvg = isSvg || newVNode.tag === "svg"

    let wasPropsUpdated = false;

    for (let i in { ...oldProps, ...newProps }) {
      if (
        (i === "value" || i === "selected" || i === "checked"
          ? node[i]
          : oldProps[i]) !== newProps[i]
      ) {
        if (i.slice(0, 2) !== 'on' || oldProps[i].toString() !== newProps[i].toString()) {
          wasPropsUpdated = true;
          if (effectsArray.length !== 0) {
            effectsArray[effectsArray.length - 1] = true;
          }
        }
        patchProperty(node, i, oldProps[i], newProps[i], isSvg)
      }
    }
    if (wasPropsUpdated) {
      newVNode?.update?.();
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldHead])) == null ||
        oldKey !== getKey(newVKids[newHead])
      ) {
        break;
      }

      effectsArray.push(false);
      patchNode(
        node,
        node?.childNodes[oldHead],
        oldVKids[oldHead++],
        (newVKids[newHead] = vdomify(newVKids[newHead++])),
        isSvg
      )
      executeEffectIfExist(newVNode, wasPropsUpdated);
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      oldKey = getKey(oldVKids[oldTail]);
      if (
        oldKey == null ||
        oldKey !== getKey(newVKids[newTail])
      ) {
        break;
      }

      effectsArray.push(false);
      patchNode(
        node,
        node?.childNodes[oldTail],
        oldVKids[oldTail--],
        (newVKids[newTail] = vdomify(newVKids[newTail--])),
        isSvg
      )
      executeEffectIfExist(newVNode, wasPropsUpdated);
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        oldVKid = oldVKids[oldHead];
        oldKid = oldKids[oldHead];
        node.insertBefore(
          createNode((newVKids[newHead] = vdomify(newVKids[newHead++])), isSvg),
          oldKid
        )
        newVKids[newHead - 1]?.mount?.();
        wasNodeCreated = true;
      }
    } else if (newHead > newTail) {
      const tmpOldHead = oldHead;
      while (oldHead <= oldTail) {
        oldVKids[oldHead]?.hide?.();
        dismissVNode(oldVKids[oldHead])
        node.removeChild(node?.childNodes[tmpOldHead])
        oldHead++;
      }
    } else {
      const keyed = {};
      const keyedNodes = {};
      const newKeyed = {};
      for (let i = oldHead; i <= oldTail; i++) {
        oldKey = oldVKids[i].key
        if (oldKey != null) {
          keyed[oldKey] = oldVKids[i];
          keyedNodes[oldKey] = node?.childNodes[i];
        }
      }

      while (newHead <= newTail) {
        oldVKid = oldVKids[oldHead];
        oldKid = oldKids[oldHead];
        newVKids[newHead] = vdomify(newVKids[newHead]);
        oldKey = getKey(oldVKid)
        newKey = getKey(newVKids[newHead])

        if (
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            oldVKid?.hide?.();
            dismissVNode(oldVKid)
            node.removeChild(oldKid)
          }
          oldHead++
          continue;
        }

        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {

            effectsArray.push(false);
            patchNode(
              node,
              oldKid,
              oldVKid,
              newVKids[newHead],
              isSvg
            )
            executeEffectIfExist(newVNode, wasPropsUpdated);
            newHead++
          }
          oldHead++
        } else {
          if (oldKey === newKey) {
            effectsArray.push(false);
            patchNode(node, oldKid, oldVKid, newVKids[newHead], isSvg)
            executeEffectIfExist(newVNode, wasPropsUpdated);
            newKeyed[newKey] = true
            oldHead++
          } else {
            tmpVKid = keyed[newKey];
            tmpKid = keyedNodes[newKey]
            if (tmpVKid != null) {
              if (effectsArray.length !== 0) {
                effectsArray[effectsArray.length - 1] = true;
              }
              effectsArray.push(false);
              patchNode(
                node.parentNode,
                node.insertBefore(tmpKid, oldKid),
                tmpVKid,
                newVKids[newHead],
                isSvg
              )
              executeEffectIfExist(newVNode, wasPropsUpdated);
              tmpVKid?.update?.();
              newKeyed[newKey] = true
            } else {
              effectsArray.push(false);
              patchNode(
                node,
                oldKid,
                null,
                newVKids[newHead],
                isSvg
              )
              executeEffectIfExist(newVNode, wasPropsUpdated);
            }
          }
          newHead++
        }
      }

      while (oldHead <= oldTail) {
        oldKid = oldKids[oldHead];
        oldVKid = oldVKids[oldHead];
        oldHead++;
        if (getKey(oldVKid) == null) {
          oldVKid?.hide?.();
          dismissVNode(oldVKid)
          node.removeChild(oldKid)
        }
      }

      for (const i in keyed) {
        if (newKeyed[i] == null) {
          oldVKid?.hide?.();
          dismissVNode(keyed[i])
          node.removeChild(keyedNodes[i])
        }
      }
    }
  }

  node.vdom = newVNode;
  if (wasNodeCreated) {
    newVNode?.mount?.();
  }
  return node;
}

const vdomify = (newVNode) => {
  if (typeof newVNode === 'string' || typeof newVNode === 'number' || typeof newVNode === 'bigint' || typeof newVNode === 'boolean') {
    return text(newVNode)
  }
  return newVNode !== true && newVNode !== false && newVNode ? newVNode : text("")
}

const passToRef = (ref, value) =>
  ref && (typeof ref === 'function' ? ref(value) : (ref.current = value))

const dismissVNode = (vnode) =>
  vnode && vnode.props && vnode.props.ref && passToRef(vnode.props.ref, null)

const recycleNode = (node) => {
  return node.nodeType === TEXT_NODE
    ? text(node.nodeValue, node)
    : createVNodeFull(
      node.nodeName?.toLowerCase(),
      node?.props || EMPTY_OBJ,
      EMPTY_ARR.map.call(node?.childNodes, recycleNode),
      SSR_NODE,
      node
    );
}

export const createVNode = (tag, props, ...children) => {
  props = props ?? EMPTY_OBJ;
  if (typeof tag === "function") {
    return tag(props, children);
  }

  return {
    tag,
    props,
    children: children.flat(),
  };
};

export const createVNodeFull = (tag, props, children, type, node) => ({
  tag,
  props,
  key: props?.key,
  children,
  type,
  node,
})

export const text = (value, node) =>
  createVNodeFull(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node)

export const patch = (node, vdom) => {
  node = patchNode(
    node.parentNode,
    node,
    node.vdom || recycleNode(node),
    vdom
  );
  return node;
}
