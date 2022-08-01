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
  console.log(table, tr.steps, 'before');

  if (!table.attrs.headers || !table.maybeChild(0)) return tr;

  // Store col types in colTypes (null if we should skip checking the column).
  // we don't allow cells merging, so we fill comfortable to check only the first row
  const tableMap = TableMap.get(table); // Will error if table is not a table
  const colTypes = [];
  for (let col = tableMap.width - 1; col >= 0; col--) {
    if (!table.child(0).maybeChild(col)) colTypes[col] = null;
    else {
      const header = table.child(0).child(col);
      colTypes[col] = header.attrs.type ?? 'text';
    }
  }

  // Loop through cells in reverse node order, so that we don't have to map
  // positions through previous steps or refresh tableMap.
  // Since the order is row-major, this means reverse row order, then reverse column order.
  // stop at row index 1 - we never want to change headers content
  for (let row = tableMap.height - 1; row >= 1; row--) {
    if (!table.maybeChild(row)) continue;
    for (let col = tableMap.width - 1; col >= 0; col--) {
      const colType = colTypes[col];
      if (colType === null || !table.child(row).maybeChild(col)) continue;

      const cell = table.child(row).child(col);
      const typeHandler = columnTypesMap[colType].handler;

      // check if types are not the same or the content in the cell is not valid to the col type
      if (cell.attrs.type !== colType || !typeHandler.validateContent(cell)) {
        const cellPos = tableMap.map[row * tableMap.width + col] + tableStart;

        // updated attrs with the correct type
        const newAttrs = Object.assign(cell.attrs, {
          type: colType
        });

        // create cell content according to type
        const cellContent = cell.type.createAndFill(
          newAttrs,
          typeHandler.renderContentNode(
            table.type.schema,
            typeHandler.convertContent(cell),
            tr,
            cellPos
          )
        );

        // replace the cell with new cell with updated type and content
        tr.replaceRangeWith(cellPos, cellPos + cell.nodeSize, cellContent);
      }
    }
  }
  const table1 = tr.doc.nodeAt(tableStart - 1);
  console.log(table1, tr.steps, 'after');
  return tr;
};
