import {Plugin} from 'prosemirror-state';
import TableHeadersMenuView from './menu-view';
import {menuItems} from './items';
import {tableHeadersMenuKey} from '../../columnsTypes/types.config';

window.id = `user_${new Date().getTime()}`;

export const tableHeadersMenu = () => {
  return new Plugin({
    key: tableHeadersMenuKey,
    view(view) {
      const menuView = new TableHeadersMenuView(menuItems, view);

      return menuView;
    },
    state: {
      init() {
        return null;
      },
      apply(tr, value, oldState, newState) {
        const headerData = tr.getMeta(tableHeadersMenuKey);
        if (
          headerData &&
          headerData.id === window.id &&
          headerData.action === 'open'
        ) {
          return headerData;
        }

        if (
          headerData &&
          headerData.id === window.id &&
          headerData.action === 'close'
        ) {
          return null;
        }

        return value;
      }
    }
  });
};
