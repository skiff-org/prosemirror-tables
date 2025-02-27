import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {selectionCell} from './util';
import {
  addRowBeforeButton,
  addColBeforeButton,
  sortColumn,
  selectRow,
  selectCol
} from './commands';
import {TableMap} from './tablemap';
import {TableView} from './tableview';
import {RowDragHandler} from './table-dragging/rowsdragging';
import {ColDragHandler} from './table-dragging/colsdragging';
import {getColIndex, createElementWithClass} from './util';
import {setNodeAttrs} from './schema/schema';
import {cellExtraAttrs} from './schema/cellAttrs';
import {CellSelection} from './cellselection';
import {tableHeadersMenuKey} from './columnsTypes/types.config';

export const key = new PluginKey('tableColumnHandles');

export class CellView {
  constructor(node, view, getPos) {
    this.getPos = getPos;
    this.node = node;
    this.view = view;
    this.dom = createElementWithClass('td', `${node.attrs.type}-cell`);
    this.contentDOM = this.dom.appendChild(
      createElementWithClass('div', 'cellContent')
    );
    this.checkIfFirstCol(this.view);
    this.checkIfColHeader(this.view);

    this.updatePlaceholder();

    this.setDOMAttrsFromNode(this.node);

    // maybe use transaction to set the attrs
    if (!this.node.attrs.id) {
      // TODO: find a better way, for now give generated id for every cell - fixing the disappear first cell's handles bug
      this.node.attrs.id = '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  setDOMAttrsFromNode(node) {
    const extraAttrs = setNodeAttrs(node, cellExtraAttrs);
    this.dom.style = `${extraAttrs.style}`;
    Object.keys(extraAttrs).forEach((attr) => {
      this.dom.setAttribute(attr, extraAttrs[attr]);
    });
  }

  checkIfFirstCol(view) {
    const pos = this.getPos();
    const resolvePos = view.state.doc.resolve(pos);
    const tableNode = resolvePos.node(-1);
    const tableMap = TableMap.get(tableNode);

    const colNumber = tableMap.colCount(pos - resolvePos.start(-1));

    if (colNumber !== 0 || this.rowHandle) {
      return;
    }

    const rowHandle = createElementWithClass('div', 'tableRowHandle');
    rowHandle.contentEditable = false;
    const rowHandleButton = createElementWithClass(
      'button',
      'tableRowHandleButton'
    );
    rowHandleButton.dataset.test = 'row-handle';
    const buttonContent = createElementWithClass('span', 'buttonContent');
    rowHandleButton.appendChild(buttonContent);

    this.rowHandle = rowHandle.appendChild(rowHandleButton);
    this.dom.appendChild(rowHandle);

    this.rowHandle.onclick = (e) => selectRow(e, view, this.getPos());
    this.rowDragHandler = new RowDragHandler(
      this.view,
      this.rowHandle,
      document.body,
      this.getPos,
      this.dom
    );

    const addRowAfterContainer = createElementWithClass(
      'div',
      'addRowAfterContainer'
    );
    addRowAfterContainer.contentEditable = false;

    const addAfterButton = createElementWithClass('button', 'addAfterButton');
    addAfterButton.dataset.test = 'add-row-after';
    const addAfterButtonText = createElementWithClass('span', 'addButtonText');
    addAfterButtonText.innerText = '+';
    addAfterButton.appendChild(addAfterButtonText);
    addAfterButton.appendChild(
      createElementWithClass('div', 'addRowButtonContent')
    );

    addAfterButton.onclick = () => addRowBeforeButton(view, this.getPos());

    addRowAfterContainer.appendChild(addAfterButton);
    const addRowAfterMarker = createElementWithClass(
      'div',
      'addRowAfterMarker'
    );
    addRowAfterContainer.appendChild(addRowAfterMarker);
    this.dom.appendChild(addRowAfterContainer);
  }

  checkIfColHeader(view) {
    const pos = this.getPos();
    const resolvePos = view.state.doc.resolve(pos);
    const rowStart = pos - resolvePos.parentOffset - 1;
    const rowResolvedPos = view.state.doc.resolve(rowStart);
    rowResolvedPos.parentOffset === 0;
    // const cellInFirstRow = isCellInFirstRow(view.state, pos);
    const cellInFirstRow = rowResolvedPos.parentOffset === 0;

    if (!cellInFirstRow || this.colHandle) return;

    const colHandle = createElementWithClass('div', 'tableColHandle');
    const colHandleButton = createElementWithClass(
      'button',
      'tableColHandleButton'
    );
    colHandleButton.dataset.test = 'column-handle';
    const buttonContent = createElementWithClass('span', 'buttonContent');
    colHandleButton.appendChild(buttonContent);

    colHandleButton.onclick = (e) => selectCol(e, view, this.getPos());

    colHandle.appendChild(colHandleButton);
    colHandle.contentEditable = false;

    this.colHandle = colHandle;
    this.dom.appendChild(colHandle);

    this.colDragHandler = new ColDragHandler(
      this.view,
      this.colHandle,
      document.body,
      this.getPos,
      this.dom
    );

    const addColAfterContainer = createElementWithClass(
      'div',
      'addColAfterContainer'
    );
    addColAfterContainer.contentEditable = false;

    const addAfterButton = createElementWithClass('button', 'addAfterButton');
    addAfterButton.dataset.test = 'add-column-after';
    const addAfterButtonText = createElementWithClass('span', 'addButtonText');
    addAfterButtonText.innerText = '+';
    addAfterButton.appendChild(addAfterButtonText);
    addAfterButton.appendChild(
      createElementWithClass('div', 'addColButtonContent')
    );

    addAfterButton.onclick = () => {
      addColBeforeButton(view, this.getPos());
    };
    addColAfterContainer.appendChild(addAfterButton);
    const addColAfterMarker = createElementWithClass(
      'div',
      'addColAfterMarker'
    );
    addColAfterContainer.appendChild(addColAfterMarker);
    this.colMarker = addColAfterContainer;
    this.dom.appendChild(addColAfterContainer);

    const tableNode = resolvePos.node(-1);
    const tableAttrs = tableNode.attrs;

    // add sort and style only if headers allowed
    if (tableAttrs.headers) {
      this.dom.classList.add('colHeader');

      this.dom.dataset.test = 'col-header';

      const sortButton = createElementWithClass('button', 'sortColButton');
      sortButton.dataset.test = 'sort-button';
      sortButton.contentEditable = false;

      const sortedCol = tableAttrs.sort.col;
      const colIndex = getColIndex(this.view.state, pos);

      if (sortedCol === colIndex) {
        sortButton.classList.add(
          tableAttrs.sort.dir === 'down' ? 'sortedDown' : 'sortedUp'
        );
      }

      sortButton.onclick = (e) => {
        if (colIndex === null) return;
        if (sortedCol !== colIndex || tableAttrs.sort.dir === 'up') {
          sortColumn(view, colIndex, this.getPos(), 1); // sort down
        } else {
          sortColumn(view, colIndex, this.getPos(), -1); // sort up
        }

        view.focus();

        e.preventDefault();
        e.stopPropagation();
      };
      this.sortButton = this.dom.appendChild(sortButton);

      // trigger header menu open
      this.dom.addEventListener('click', (e) => {
        if (this.colMarker.contains(e.target)) return;
        if (this.colHandle.contains(e.target)) return;
        if (this.rowHandle && this.rowHandle.contains(e.target)) return;
        if (!view.editable) return;

        const {tr} = this.view.state;
        tr.setMeta(tableHeadersMenuKey, {
          pos: this.getPos(),
          dom: this.dom,
          node: this.node,
          id: window.id,
          action: 'open'
        });
        setTimeout(() => this.view.dispatch(tr), 0);

        e.preventDefault();
        e.stopPropagation();
      });

      this.dom.addEventListener('mousedown', (e) => {
        if (this.colHandle.contains(e.target)) return;
        if (this.rowHandle && this.rowHandle.contains(e.target)) return;

        e.preventDefault();
        e.stopPropagation();
      });

      const typeIcon = createElementWithClass(
        'div',
        `${this.node.attrs.type}ItemIcon`
      );

      typeIcon.classList.add('typeIcon');
      this.dom.prepend(typeIcon);

      this.updatePlaceholder();
    }
  }

  ignoreMutation(record) {
    if (
      (record.type === 'attributes' &&
        record.target.classList.contains('addRowAfterMarker')) ||
      record.target.classList.contains('addColAfterMarker')
    ) {
      return true;
    }
    return false;
  }

  update(node, b, c) {
    if (node.type != this.node.type) return false;
    if (this.dom && !this.node.sameMarkup(node)) return false;

    this.checkIfFirstCol(this.view);
    this.checkIfColHeader(this.view);

    this.node = node;
    this.setDOMAttrsFromNode(node);

    this.updatePlaceholder();

    return true;
  }

  updatePlaceholder() {
    const resolvePos = this.view.state.doc.resolve(this.getPos());
    const tableAttrs = resolvePos.node(-1).attrs;

    const placeholders = this.dom.getElementsByClassName('empty-header');
    if (
      this.colHandle &&
      this.node.textContent.replace(/[\u200B]/g, '').length === 0 &&
      tableAttrs.headers
    ) {
      if (placeholders.length === 0) {
        const placeholder = createElementWithClass('span', 'empty-header');
        placeholder.innerText = 'Untitled';
        this.dom.appendChild(placeholder);
      }
    } else {
      if (placeholders.length) {
        Array.from(placeholders).forEach((placeholder) => placeholder.remove());
      }
    }
  }
}

export function columnHandles({} = {}) {
  const plugin = new Plugin({
    key,
    props: {
      nodeViews: {
        table_cell: (node, view, getPos) => new CellView(node, view, getPos),
        table: (node, view, getPos) => new TableView(node, 200, view, getPos)
      },
      decorations(state) {
        const sel = state.selection;

        if (sel instanceof CellSelection) {
          const $pos = selectionCell(state);
          if (!$pos) {
            // In case there's no cell
            return null;
          }
          const tableNode = $pos.node(-1);
          const tableStart = $pos.start(-1) - 1;
          const decoration = Decoration.node(
            tableStart,
            tableStart + tableNode.nodeSize,
            {class: 'tableFocus'}
          );
          return DecorationSet.create(state.doc, [decoration]);
        }

        const decorations = [];

        state.doc.nodesBetween(sel.from, sel.to, (node, pos) => {
          if (node.type.name === 'table') {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {class: 'tableFocus'})
            );
            return false;
          }
          return true;
        });

        if (!decorations.length) {
          return null;
        }

        return DecorationSet.create(state.doc, decorations);
      }
    }
  });
  return plugin;
}
