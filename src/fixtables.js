// This file defines helpers for normalizing tables, making sure no
// cells overlap (which can happen, if you have the wrong col- and
// rowspans) and that each row has the same width. Uses the problems
// reported by `TableMap`.

import {PluginKey} from 'prosemirror-state';
import {TableMap} from './tablemap';
import {setAttr, removeColSpan} from './util';
import {tableNodeTypes} from './schema/schema';
import {typeInheritance} from './columnsTypes/typeInheritance';

export const fixTablesKey = new PluginKey('fix-tables');

// Helper for iterating through the nodes in a document that changed
// compared to the given previous document. Useful for avoiding
// duplicate work on each transaction.
function changedDescendants(old, cur, offset, f) {
  const oldSize = old.childCount,
    curSize = cur.childCount;
  outer: for (let i = 0, j = 0; i < curSize; i++) {
    if (cur.type.name === 'table_row' && cur.childCount > 100) {
      // Don't loop on row with more than 100 cols (infinity cols bug)
      continue outer;
    }
    const child = cur.child(i);
    for (let scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) {
      if (old.child(scan) == child) {
        j = scan + 1;
        offset += child.nodeSize;
        continue outer;
      }
    }
    f(child, offset);
    if (j < oldSize && old.child(j).sameMarkup(child))
      changedDescendants(old.child(j), child, offset + 1, f);
    else child.nodesBetween(0, child.content.size, f, offset + 1);
    offset += child.nodeSize;
  }
}

// :: (EditorState, ?EditorState) → ?Transaction
// Inspect all tables in the given state's document and return a
// transaction that fixes them, if necessary. If `oldState` was
// provided, that is assumed to hold a previous, known-good state,
// which will be used to avoid re-scanning unchanged parts of the
// document.
export function fixTables(state, oldState) {
  let tr;
  const check = (node, pos) => {
    if (node.type.spec.tableRole == 'table')
      tr = fixTable(state, node, pos, tr);
  };
  if (!oldState) state.doc.descendants(check);
  else if (oldState.doc != state.doc)
    changedDescendants(oldState.doc, state.doc, 0, check);
  return tr;
}

// : (EditorState, Node, number, ?Transaction) → ?Transaction
// Fix the given table, if necessary. Will append to the transaction
// it was given, if non-null, or create a new one if necessary.
export function fixTable(state, table, tablePos, tr) {
  const map = TableMap.get(table);
  if (!map.problems) return tr;
  if (!tr) tr = state.tr;

  // Track which rows we must add cells to, so that we can adjust that
  // when fixing collisions.
  const mustAdd = [];
  for (let i = 0; i < map.height; i++) mustAdd.push(0);
  for (let i = 0; i < map.problems.length; i++) {
    const prob = map.problems[i];
    if (prob.type == 'collision') {
      const cell = table.nodeAt(prob.pos);
      for (let j = 0; j < cell.attrs.rowspan; j++)
        mustAdd[prob.row + j] += prob.n;
      tr.setNodeMarkup(
        tr.mapping.map(tablePos + 1 + prob.pos),
        null,
        removeColSpan(cell.attrs, cell.attrs.colspan - prob.n, prob.n)
      );
    } else if (prob.type == 'missing') {
      mustAdd[prob.row] += prob.n;
    } else if (prob.type == 'overlong_rowspan') {
      const cell = table.nodeAt(prob.pos);
      tr.setNodeMarkup(
        tr.mapping.map(tablePos + 1 + prob.pos),
        null,
        setAttr(cell.attrs, 'rowspan', cell.attrs.rowspan - prob.n)
      );
    } else if (prob.type == 'colwidth mismatch') {
      const cell = table.nodeAt(prob.pos);
      tr.setNodeMarkup(
        tr.mapping.map(tablePos + 1 + prob.pos),
        null,
        setAttr(cell.attrs, 'colwidth', prob.colwidth)
      );
    }
  }
  let first, last;
  for (let i = 0; i < mustAdd.length; i++)
    if (mustAdd[i]) {
      if (first == null) first = i;
      last = i;
    }
  // Add the necessary cells, using a heuristic for whether to add the
  // cells at the start or end of the rows (if it looks like a 'bite'
  // was taken out of the table, add cells at the start of the row
  // after the bite. Otherwise add them at the end).
  for (let i = 0, pos = tablePos + 1; i < map.height; i++) {
    const row = table.child(i);
    const end = pos + row.nodeSize;
    const add = mustAdd[i];
    if (add > 0) {
      let tableNodeType = 'cell';
      if (row.firstChild) {
        tableNodeType = row.firstChild.type.spec.tableRole;
      }
      const nodes = [];
      for (let j = 0; j < add; j++)
        nodes.push(
          tableNodeTypes(state.schema)[tableNodeType].createAndFill({})
        );
      const side = (i == 0 || first == i - 1) && last == i ? pos + 1 : end - 1;
      tr.insert(tr.mapping.map(side), nodes);
    }
    pos = end;
  }
  typeInheritance(tr, tablePos + 1);
  return tr.setMeta(fixTablesKey, {fixTables: true});
}
