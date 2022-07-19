import {columnTypesMap} from './columnsTypes/types.config';

/**
 * Helper function that renders content for cells in the range [from, to], adding to tr.
 * You should always call this after inserting table cells or changing
 * their column type, unless you call typeHandler.renderContentNode yourself.
 *
 * Cells' types are read from their columns' header cells (if not set/found, defaults
 * to 'text').
 */
export function renderCellContent(tr, from, to) {
  const schema = tr.doc.type.schema;
  // It is convenient to render cells in reverse order, so that we don't have to map later
  // positions past earlier changes.
  const reversedCells = [];
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === schema.nodes.table_cell) {
      // Extract the columnType from the header cell's attrs.type.

      reversedCells.unshift({cell: node, pos, columnType});
    }
  });

  reversedCells.forEach(({cell, pos, columnType}) => {
    const typeHandler = columnTypesMap[columnType ?? 'text'].handler;
    tr.replaceRangeWith(
      pos + 1,
      pos + cell.nodeSize - 1,
      typeHandler.renderContentNode(
        schema,
        typeHandler.convertContent(cell),
        tr,
        pos
      )
    );
  });
}
