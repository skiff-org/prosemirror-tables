import CellDataType from './Type';
import {NodeNames} from '../../schema/nodeNames';

class CheckboxType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    return !!cell.firstChild.attrs.checked;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, checked) {
    return schema.nodes.checkbox.create({
      checked: typeof checked === 'boolean' ? checked : false
    });
  }

  /**
   * check cell content is valid for the current type
   */
  validateContent(cell) {
    return (
      cell.childCount === 1 && cell.firstChild.type.name === NodeNames.CHECKBOX
    );
  }
}

export default CheckboxType;
