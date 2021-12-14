import CellDataType from '../Type';
import {randomString, stringToColor, updateTablesLabels} from './utils';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';

class LabelType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    return cell.textContent;
  }

  getLabelColor(tableLabels, title) {
    const existingLabel = tableLabels.find(
      (tableLabel) => tableLabel.title === title
    );
    if (!existingLabel) return stringToColor(randomString());
    return existingLabel.color;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, cellTextContent, tr, pos) {
    let labels = [];

    if (cellTextContent.replace(/[\u200B]/g, '')) {
      const titles = Array.from(new Set(cellTextContent.split(',')))
        .map((title) => title.trim())
        .filter((title) => title.length);

      const table = findParentNodeOfTypeClosestToPos(
        tr.doc.resolve(pos),
        schema.nodes.table
      );

      const tableLabels = table.node.attrs.labels;

      labels = titles.map((title) => ({
        title,
        color: this.getLabelColor(tableLabels, title),
      }));

      updateTablesLabels(tr, pos, 'add', labels);
    }

    return schema.nodes.label.create({
      labels,
    });
  }
}

export default LabelType;
