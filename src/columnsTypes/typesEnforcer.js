import {Plugin, PluginKey} from 'prosemirror-state';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {columnTypesMap} from './types.config';
import {isCellInFirstRow} from './utils';

const typesEnforcerKey = new PluginKey('typesEnforcer');

export const typesEnforcer = () => {
  return new Plugin({
    key: typesEnforcerKey,
    appendTransaction(transactions, oldState, newState) {
      const selectionChanged = transactions.reduce(
        (changed, tr) => changed || tr.selectionSet,
        false
      );

      const docChanged = transactions.reduce(
        (changed, tr) => changed || tr.docChanged,
        false
      );

      const notSingleSelection =
        oldState.selection.from !== oldState.selection.to;

      // if the selection has not changed - return
      if (!selectionChanged || docChanged || notSingleSelection) return null;

      const {schema} = newState;

      const oldParentCell = findParentNodeOfTypeClosestToPos(
        oldState.doc.resolve(oldState.selection.from),
        schema.nodes.table_cell
      );

      // if prev selection wasn't inside cell - return
      if (!oldParentCell) return null;

      const from = oldParentCell.pos;
      const to = oldParentCell.pos + oldParentCell.node.nodeSize;

      const newSel = newState.selection;

      const cellInFirstRow = isCellInFirstRow(oldState, oldParentCell.pos);
      if ((newSel.from < from || newSel.from > to) && !cellInFirstRow) {
        const type = columnTypesMap[oldParentCell.node.attrs.type];
        if (type.dontForce) return null;

        const typeHandler = type.handler;

        const {tr} = newState;

        const typeContent = typeHandler.convertContent(oldParentCell.node);

        tr.replaceRangeWith(
          from + 1,
          to - 1,
          typeHandler.renderContentNode(schema, typeContent)
        );

        return tr;
      }

      return null;
    }
  });
};
