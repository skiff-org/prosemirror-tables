import CellDataType from '../Type';
import {buildDateObjectFromText, DATE_FORMAT, formatDate} from './utils';
import {NodeNames} from '../../../schema/nodeNames';

class DateType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    const date = buildDateObjectFromText(cell.textContent, DATE_FORMAT);
    if (!date) return -1;
    const dateInMili = date.getTime();

    return isNaN(dateInMili) ? -1 : dateInMili;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, dateInMili) {
    return schema.nodes.date.createAndFill(
      {value: dateInMili},
      dateInMili !== -1
        ? [schema.text(formatDate(new Date(dateInMili), DATE_FORMAT))]
        : []
    );
  }

  /**
   * check cell content is valid for the current type
   */
  validateContent(cell) {
    return (
      cell.childCount === 1 && cell.firstChild.type.name === NodeNames.DATE
    );
  }
}

export default DateType;
