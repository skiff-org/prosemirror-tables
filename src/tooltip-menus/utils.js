import {CellSelection} from '../cellselection';
import {createElementWithClass, getBaseName} from '../util';

export function enableDeleteItem(view) {
  const {selection: sel} = view.state;

  if (!(sel instanceof CellSelection)) return false;

  return sel.isColSelection() || sel.isRowSelection();
}

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `tablePopup`;
  menuElement.dataset.test = `table-popup`;
  menuElement.style.display = 'none';
  menuElement.style.position = 'absolute';
  menuElement.style.zIndex = '200';

  return menuElement;
};

export const generateColorItemDOM = (color) => {
  const container = createElementWithClass('div', 'colorItemContainer');
  const button = createElementWithClass(
    color === 'transparent' ? 'span' : 'button',
    'colorItemButton'
  );
  const indicator = createElementWithClass('div', 'colorItemIndicator');

  button.style.backgroundColor = color;
  button.dataset.test = `color-button`;

  if (color === 'transparent') button.classList.add('default');

  indicator.style.backgroundColor = color;
  indicator.style.display = 'none';

  container.appendChild(button);
  container.appendChild(indicator);

  return container;
};

export const displayPopup = (view, popupDOM) => {
  // if current selection is not CellSelection don't show menu
  if (!(view.state.selection instanceof CellSelection)) {
    popupDOM.style.display = 'none';
    return false;
  }

  // if current selection is not row/col don't show menu
  if (
    !view.state.selection.isColSelection() &&
    !view.state.selection.isRowSelection()
  ) {
    popupDOM.style.display = 'none';
    return false;
  }

  popupDOM.style.display = 'flex';

  // if the popup cant find his parent don't show him
  if (!popupDOM.offsetParent) {
    if (popupDOM.style.display !== 'none') {
      popupDOM.style.display = 'none';
    }
    return false;
  }

  return true;
};

export const calculatePopupPosition = (view, popupDOM) => {
  const {state} = view;
  // get all selected cells dom
  const selectedCells = document.getElementsByClassName('selectedCell');

  // get rects of first and last cells
  const firstCellRect = selectedCells[0].getBoundingClientRect();
  let lastCellRect;

  if (state.selection.$anchorCell.pos === state.selection.$headCell.pos) {
    lastCellRect = firstCellRect;
  } else {
    lastCellRect =
      selectedCells[selectedCells.length - 1].getBoundingClientRect();
  }

  const offsetParentBox = popupDOM.offsetParent.getBoundingClientRect();

  // scroll offset
  const [scrolledEl] = document.getElementsByClassName(
    `${getBaseName()}-editor-frame-body`
  );
  const {x: EDITOR_LEFT_OFFSET, y: EDITOR_TOP_OFFSET} =
    scrolledEl.getBoundingClientRect();

  const cellCenter =
    firstCellRect.left + (lastCellRect.right - firstCellRect.left) / 2;

  // RowSelection
  if (
    state.selection instanceof CellSelection &&
    state.selection.isRowSelection()
  ) {
    const tableContainer = selectedCells[0].closest('.tableWrapper');
    if (!tableContainer) return;

    const tableContainerBox = tableContainer.getBoundingClientRect();

    popupDOM.style.left = `${
      tableContainerBox.left + tableContainerBox.width / 2 - EDITOR_LEFT_OFFSET
    }px`;
    popupDOM.style.top = `${
      lastCellRect.bottom + (scrolledEl.scrollTop || 0) - EDITOR_TOP_OFFSET + 20
    }px`;

    return;
  }

  // ColSelection
  if (
    state.selection instanceof CellSelection &&
    state.selection.isColSelection()
  ) {
    let top;
    // sometimes prose mirror switches anchor and head cells - fix it
    if (state.selection.$anchorCell.pos > state.selection.$headCell.pos) {
      top = view.coordsAtPos(state.selection.$headCell.pos).top;
    } else {
      top = view.coordsAtPos(state.selection.$anchorCell.pos).top;
    }

    popupDOM.style.top = `${
      top - 35 - (offsetParentBox.top || 0) + (scrolledEl.scrollTop || 0)
    }px`;
    popupDOM.style.left = `${cellCenter - EDITOR_LEFT_OFFSET}px`;

    return;
  }
};

export const getCellsBackgroundColor = (view) => {
  const {selection} = view.state;
  if (!(selection instanceof CellSelection)) return null;
  let color = null;

  selection.forEachCell((cell, pos) => {
    const {background} = cell.attrs;
    if (!color) {
      color = background;
    }
    if (background !== color) {
      color = 'transparent';
    }
  });

  return color;
};

export const isFirstRowSelected = (view) => {
  const {selection: sel} = view.state;
  if (!(sel instanceof CellSelection)) return false;

  let onlyFirstRow = true;

  sel.forEachCell((cell, pos) => {
    const resolvePos = view.state.doc.resolve(pos);
    const rowStart = pos - resolvePos.parentOffset - 1;
    const rowResolvedPos = view.state.doc.resolve(rowStart);

    onlyFirstRow = rowResolvedPos.parentOffset === 0 && onlyFirstRow;
  });

  return onlyFirstRow;
};

export const enableCellsColor = (view) => {
  const {selection: sel} = view.state;
  if (!(sel instanceof CellSelection)) return false;
  const tableAttrs = sel.$anchorCell.node(1).attrs;

  if (isFirstRowSelected(view)) return !tableAttrs.headers;

  return true;
};

export const addTooltips = (popupDOM, classes) => {
  classes.forEach(({className, text}) => {
    const [button] = popupDOM.getElementsByClassName(className);
    if (!button) return;
    const buttonContainer = button.parentElement;
    const tooltip = createElementWithClass('span', 'popup-tooltip');
    tooltip.innerText = text;
    buttonContainer.appendChild(tooltip);
  });
};

export const addDeleteHoverClass = (e) => {
  if (e.target.className !== 'deleteMenuButton') return;
  const [tableWrapper] = document.getElementsByClassName('tableFocus');
  if (!tableWrapper) return;
  tableWrapper.classList.add('markDeleteCells');
};

export const removeDeleteHoverClass = (e) => {
  if (e.target.className !== 'deleteMenuButton') return;
  // remove class from all tables in the document' in case that the focus removed before the delete button was clicked
  const tableWrappers = document.getElementsByClassName('tableScrollWrapper');
  if (!tableWrappers.length) return;
  Array.from(tableWrappers).forEach((table) =>
    table.classList.remove('markDeleteCells')
  );
};
