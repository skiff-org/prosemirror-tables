import {getColCells} from '../../util';
import {columnTypesMap, tableHeadersMenuKey} from '../types.config';

class CellDataType {
  convert(dispatch, view, typeId) {
    const headerState = tableHeadersMenuKey.getState(view.state);
    if (!headerState) return false;
    const {pos, node, dom} = headerState;
    if (typeId === node.attrs.type) return false;

    if (dispatch) {
      const cells = getColCells(pos, view.state);
      dom.firstChild.className = `${typeId}ItemIcon typeIcon`;

      const {tr} = view.state;

      // save old type before changing attrs
      const oldType = node.attrs.type;

      // change header type
      tr.setNodeMarkup(
        pos,
        undefined,
        Object.assign(node.attrs, {type: typeId})
      );

      cells.reverse().forEach(({node: cell, pos}) => {
        const convertedContent = this.convertContent(cell, oldType);
        const oldTypeContentToAttrs =
          columnTypesMap[oldType].handler.parseContentToAttrsMemory(cell);

        tr.replaceRangeWith(
          pos + 1,
          pos + cell.nodeSize - 1,
          this.renderContentNode(view.state.schema, convertedContent, tr, pos)
        );

        const newAttrs = {
          ...cell.attrs,
          type: typeId,
          typesValues: {
            ...cell.attrs.typesValues,
            [oldType]: oldTypeContentToAttrs
          }
        };

        tr.setNodeMarkup(pos, undefined, newAttrs);
      });

      tr.setMeta(tableHeadersMenuKey, {action: 'close', id: window.id});
      dispatch(tr);
    }
    return true;
  }

  /**
   * convert the content to the type format, should return content that the renderContentNode of the same type can render to node
   */
  convertContent(cell, convertFromType) {
    return cell.textContent;
  }

  /**
   * convert the cell child node to a value that can be saved in the cell attrs
   */
  parseContentToAttrsMemory(cell) {
    return cell.textContent;
  }

  /** should return same value type as `convertContent`*/
  parseContentFromAttrsMemory(attrsValue) {
    return attrsValue;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, content) {
    if (content !== '') {
      const p = schema.nodes.paragraph.createAndFill({}, schema.text(content));
      return p;
    }
    return [];
  }

  /**
   * check cell content is valid for the current type
   */
  validateContent(_cell) {
    return true;
  }
}

export default CellDataType;
