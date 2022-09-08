import {parseTextToCurrency} from '../utils';
import CellDataType from './Type';

export const CURRENCY = '$';

class CurrencyCellType extends CellDataType {
  convertContent(cell, convertFromType) {
    return parseTextToCurrency(cell.textContent, CURRENCY);
  }

  /**
   * check cell content is valid for the current type
   */
  validateContent(cell) {
    return cell.firstChild.textContent.includes(CURRENCY);
  }
}

export default CurrencyCellType;
