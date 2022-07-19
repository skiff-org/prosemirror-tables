import {columnTypesMap} from './types.config';
import {TableMap} from '../tablemap';

/**
 * Updates cells within table to inherit types from their column headers,
 * setting attrs.type and rendering the type-appropriate content for cell.
 *
 * Call this whenever cells may have the wrong type, either because they are
 * new or their column type was changed.
 *
 * @param tr A transaction to add the changes to
 * @param tableStart The table's tableStart position, i.e., the pos of the first row
 * (1 + pos of table itself) relative to tr.doc
 * @return tr
 */
export const typeInheritance = (tr, tableStart) => {
  // Subtract one to go from tableStart (start of first row) to actual table node's pos.
  const table = tr.doc.nodeAt(tableStart - 1);

  if (!table.attrs.headers || !table.maybeChild(0)) return tr;

  // Store col types in colTypes (null if we should skip checking the column).
  // we don't allow cells merging, so we fill comfortable to check only the first row
  const tableMap = TableMap.get(table); // Will error if table is not a table
  const colTypes = [];
  for (let col = tableMap.width - 1; col >= 0; col--) {
    if (!table.child(0).maybeChild(col)) colTypes[col] = null;
    else {
      const header = table.child(0).child(col);
      colTypes[col] = header.attrs.type;
    }
  }

  // Loop through cells in reverse node order, so that we don't have to map
  // positions through previous steps or refresh tableMap.
  // Since the order is row-major, this means reverse row order, then reverse column order.
  for (let row = tableMap.height - 1; row >= 0; row--) {
    if (!table.maybeChild(row)) continue;
    for (let col = tableMap.width - 1; col >= 0; col--) {
      const colType = colTypes[col];
      if (colType === null || !table.child(row).maybeChild(col)) continue;

      const cell = table.child(row).maybeChild(col);
      if (cell.attrs.type !== colType) {
        const cellPos = tableMap.map[row * tableMap.width + col] + tableStart;
        const typeHandler = columnTypesMap[colType].handler;

        tr.replaceRangeWith(
          cellPos + 1,
          cellPos + cell.nodeSize - 1,
          typeHandler.renderContentNode(
            table.type.schema,
            typeHandler.convertContent(cell),
            tr,
            cellPos
          )
        );

        const newAttrs = Object.assign(cell.attrs, {
          type: colType
        });

        tr.setNodeMarkup(cellPos, undefined, newAttrs);
      }
    }
  }

  return tr;
};
