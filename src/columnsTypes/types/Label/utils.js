import * as nacl from 'tweetnacl';
import {encode as decodeUTF8} from '@stablelib/utf8';
import {encode as encodeBase64} from '@stablelib/base64';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {PluginKey} from 'prosemirror-state';
import {
  EDITOR_LEFT_OFFSET,
  EDITOR_TOP_OFFSET,
} from '../../../headers/headers-menu/utils';

export const tableLabelsMenuKey = new PluginKey('TableLabelsMenu');

export const generateHash = (value) => {
  const buffer = decodeUTF8(value);
  const hashed = nacl.hash(buffer);
  const hashValue = encodeBase64(hashed);
  return hashValue;
};

export const stringToHash = (strToHash) => {
  // randomize so similar words have different colors
  let hash = 0;
  if (strToHash.length === 0) {
    return hash;
  }
  for (let i = 0; i < strToHash.length; i += 1) {
    const char = strToHash.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char;
    // eslint-disable-next-line no-bitwise
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

export const stringToColor = (str, opacity = '1.0') => {
  const stringHash = generateHash(str);
  const numericalHash = stringToHash(stringHash);
  const shortened = numericalHash % 360;
  return `hsla(${shortened}, 68%, 48%, ${opacity})`;
};

export const addLabel = (view, pos, node, newLabel) => {
  const currentLabels = node.attrs.labels;

  const {tr} = view.state;

  const newAttrs = {
    ...node.attrs,
    labels: [...currentLabels, newLabel],
  };

  tr.replaceRangeWith(
    pos,
    pos + 1,
    view.state.schema.nodes.label.create(newAttrs)
  );
  updateTablesLabels(tr, pos, 'add', [newLabel]);

  view.dispatch(tr);
};

export const removeLabel = (view, pos, node, labelTitle) => {
  const currentLabels = node.attrs.labels;

  const {tr} = view.state;

  const newAttrs = {
    ...node.attrs,
    labels: currentLabels.filter((label) => label !== labelTitle),
  };

  tr.replaceRangeWith(
    pos,
    pos + 1,
    view.state.schema.nodes.label.create(newAttrs)
  );
  view.dispatch(tr);
};

export const updateTablesLabels = (tr, pos, action = 'add', newLabels) => {
  const table = findParentNodeOfTypeClosestToPos(
    tr.doc.resolve(pos),
    tr.doc.type.schema.nodes.table
  );

  if (!table) return;

  let newAttrs;

  if (action === 'add') {
    newAttrs = {
      ...table.node.attrs,
      labels: Array.from(new Set([...table.node.attrs.labels, ...newLabels])),
    };
  }
  if (action === 'remove') {
    newAttrs = {
      ...table.node.attrs,
      labels: table.node.attrs.labels.filter(
        (label) => !newLabels.includes(label)
      ),
    };
  }

  tr.setNodeMarkup(table.pos, undefined, newAttrs);
};

export const updateCellLabels = (view, pos, node, labels) => {
  const {tr} = view.state;

  const newAttrs = {
    ...node.attrs,
    labels,
  };

  tr.replaceRangeWith(
    pos,
    pos + 1,
    view.state.schema.nodes.label.create(newAttrs)
  );

  updateTablesLabels(tr, pos, 'add', labels);

  view.dispatch(tr);
};

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `tableLabelsMenu`;
  menuElement.dataset.test = `table-labels-menu`;
  menuElement.style.display = 'none';
  menuElement.style.position = 'absolute';
  menuElement.style.zIndex = '200';

  return menuElement;
};

export const displayPopup = (view, popupDOM) => {
  const menuData = tableLabelsMenuKey.getState(view.state);

  if (menuData) {
    popupDOM.style.display = 'flex';
    return menuData;
  }

  return null;
};

export const calculateMenuPosition = (menuDOM, {node, dom: cellDOM, pos}) => {
  const {style} = menuDOM;

  const {left, top, height: cellHeight} = cellDOM.getBoundingClientRect();

  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');

  style.top = `${
    top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) - 70 + cellHeight
  }px`;
  style.left = `${left - EDITOR_LEFT_OFFSET - 20}px`;
};
