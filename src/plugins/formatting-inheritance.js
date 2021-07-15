import {Plugin, PluginKey} from 'prosemirror-state';
import {isInTable, nextCell} from '../util';

export const formattingInheritanceKey = new PluginKey('formattingInheritance');

const CELL_DEPTH = 3;

export const formattingInheritancePlugin = (schema) => {
  return new Plugin({
    key: formattingInheritanceKey,
    appendTransaction(transactions, oldState, newState) {
      const lastTr = transactions[transactions.length - 1];

      const currentCell = oldState.doc
        .resolve(oldState.selection.from)
        .node(CELL_DEPTH);

      // if the cell already has content return.
      if (
        currentCell &&
        currentCell.content.content[0].childCount > 0 &&
        (currentCell.textContent.replace(/[^\x00-\x7F]/g, '') !== '' ||
          !currentCell.content.content[0].isTextblock)
      ) {
        return null;
      }

      //not in table, more than one step or no steps at all
      if (
        !isInTable(newState) || // not in table
        newState.doc.nodeSize <= oldState.doc.nodeSize || // new doc is equal or smaller
        !lastTr.steps.length || // no changes in the doc
        lastTr.steps.length > 1 // more than one step - not a typing transaction
      ) {
        return null;
      }

      const {from, to} = lastTr.steps[0];

      const typingContent = lastTr.steps[0].slice.content.content[0];

      // not a typing transaction
      if (
        from !== to ||
        (lastTr.steps[0].slice &&
          lastTr.steps[0].slice.content &&
          typingContent.type.name !== 'text')
      )
        return null;

      const withWeirdCharacter = /[^\x00-\x7F]/g.test(currentCell.textContent);

      const resFrom = newState.doc.resolve(
        withWeirdCharacter ? from - 3 : from - 2
      );

      if (resFrom.node(-1).type.name !== 'table') return null;

      const prevCellStart = nextCell(resFrom, 'vertical', -1);

      // no cell to the left of the current cell
      if (!prevCellStart) return null;

      const prevCellNode = newState.doc.resolve(prevCellStart.pos + 1).parent;

      let firstTextBlockInCell;
      let firstTextNodeInCellMarks;

      prevCellNode.descendants((node, pos, parent) => {
        if (node.isTextblock && !firstTextBlockInCell)
          firstTextBlockInCell = node;
        if (
          node.isText &&
          !firstTextNodeInCellMarks &&
          node.textContent !== '​'
        ) {
          firstTextNodeInCellMarks = node.marks;
          return false;
        }
        return true;
      });

      // no text nodes in prev cell
      if (!firstTextBlockInCell) return null;

      const {tr} = newState;

      const newTextNode = firstTextBlockInCell.type.createAndFill(
        firstTextBlockInCell.attrs,
        schema.text(typingContent.textContent, firstTextNodeInCellMarks)
      );

      tr.replaceRangeWith(from - 1, to + 2, newTextNode);
      tr.setSelection(newState.selection);

      return tr;
    },
  });
};
