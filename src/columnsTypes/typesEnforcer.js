import {Plugin, PluginKey} from 'prosemirror-state';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {columnTypesMap} from './types.config';
import {isCellInFirstRow} from './utils';

const typesEnforcerKey = new PluginKey('typesEnforcer');

/**
 * Enforces cell's type, replacing it in tr if needed.
 * @param newState The doc state before tr
 * @param cell The cell (node with type schema.nodes.table_cell) in newState
 * @param pos The cell's position in newState (before tr)
 * @param tr The transaction to add to, may already have some steps
 * @param isPaste Whether the cell is being pasted
 */
const enforceOneCell = (newState, cell, pos, tr, isPaste) => {
  const columnType = cell.attrs.type;
  const type = columnTypesMap[columnType];
  if (type.dontForce) return;

  const typeHandler = type.handler;

  const typeContent = typeHandler.convertContent(cell, undefined, isPaste);

  // from and to are the start & end positions of cell in newState.apply(tr).
  // We replace the range [from + 1, to - 1] because we want to replace cell's
  // contents (children), not the cell itself.
  const from = tr.mapping.map(pos, -1);
  const to = tr.mapping.map(pos + cell.nodeSize, 1);
  tr.replaceRangeWith(
    from + 1,
    to - 1,
    typeHandler.renderContentNode(newState.schema, typeContent, tr, from)
  );
};

/**
 * Maps the given pos through transactions, starting at transactions[i].steps[j] (inclusive).
 * assoc is as in Prosemirror's Mappable.Map: -1 or 1, denoting the "side" to stick to when
 * content is inserted at pos.
 *
 * @return The mapped position
 */
const mapThrough = (pos, assoc, transactions, i, j) => {
  pos = transactions[i].mapping.slice(j).map(pos, assoc);
  for (let t = i + 1; t < transactions.length; t++) {
    pos = transactions[t].mapping.map(pos, assoc);
  }
  return pos;
};

/**
 * Returns an array of objects {from: number, to: number} giving the ranges of
 * content pasted by transactions. Ranges are relative to the new state
 * after all transactions.
 */
const getPastedRanges = (transactions) => {
  const ranges = [];
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    // We only care about paste actions.
    if (transaction.getMeta('uiEvent') !== 'paste') continue;

    for (let j = 0; j < transaction.steps.length; j++) {
      const step = transaction.steps[j];
      if (step.from === undefined || step.to === undefined) continue;
      // Map step.from and step.to to their positions in newState.
      ranges.push({
        from: mapThrough(step.from, -1, transactions, i, j),
        to: mapThrough(step.to, 1, transactions, i, j)
      });
    }
  }
  return ranges;
};

export const typesEnforcer = () => {
  return new Plugin({
    key: typesEnforcerKey,
    appendTransaction(transactions, oldState, newState) {
      const {tr} = newState;

      // We enforce cell types after the local user changes a cell. There are a few cases:
      // 1. The user edited the cell directly - wait until they move their selection from inside to outside the cell.
      // 2. The user pasted cells copied from another table (pasting either as a new table or in an existing table).

      // Case 1

      const selectionChanged = transactions.reduce(
        (changed, transaction) => changed || transaction.selectionSet,
        false
      );

      const docChanged = transactions.reduce(
        (changed, transaction) => changed || transaction.docChanged,
        false
      );

      const notSingleSelection =
        oldState.selection.from !== oldState.selection.to;

      // if the selection has not changed - skip
      if (selectionChanged && !docChanged && !notSingleSelection) {
        const {schema} = newState;

        const oldParentCell = findParentNodeOfTypeClosestToPos(
          oldState.doc.resolve(oldState.selection.from),
          schema.nodes.table_cell
        );

        // if prev selection wasn't inside cell - skip
        if (oldParentCell) {
          const from = oldParentCell.pos;
          const to = oldParentCell.pos + oldParentCell.node.nodeSize;

          const newSel = newState.selection;

          const cellInFirstRow = isCellInFirstRow(oldState, oldParentCell.pos);
          if ((newSel.from < from || newSel.from > to) && !cellInFirstRow) {
            enforceOneCell(newState, oldParentCell.node, from, tr, false);
          }
        }
      }

      // Case 2

      // Find position ranges {from, to} pasted by the transaction.
      const ranges = getPastedRanges(transactions);
      for (const {from, to} of ranges) {
        newState.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type !== newState.schema.nodes.table_cell) return;

          const cellInFirstRow = isCellInFirstRow(newState, pos);
          if (!cellInFirstRow) {
            enforceOneCell(newState, node, pos, tr, true);
          }
        });
      }

      if (tr.steps.length !== 0) {
        return tr;
      } else return null;
    }
  });
};
