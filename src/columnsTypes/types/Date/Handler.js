import CellDataType from '../Type';
import {buildDateObjectFromText, DATE_FORMAT, formatDate} from './utils';

class DateType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell, _, isPaste = false) {
    if (isPaste) {
      // When Prosemirror copies a Date cell, it often doesn't include the textContent,
      // but it does copy the attrs.
      return cell.firstChild?.attrs?.value ?? -1;
    } else {
      const date = buildDateObjectFromText(cell.textContent, DATE_FORMAT);
      if (!date) return -1;
      const dateInMili = date.getTime();

      return isNaN(dateInMili) ? -1 : dateInMili;
    }
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
}

export default DateType;
