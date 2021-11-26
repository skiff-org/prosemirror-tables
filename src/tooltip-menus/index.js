import {Plugin} from 'prosemirror-state';
import TablePopUpMenuView from './menu-view';
import {popUpItems} from './items';
import {tablePopUpMenuKey} from '../PopupManager'

const tablePopUpMenu = () => {
  return new Plugin({
    key: tablePopUpMenuKey,
    view(view) {
      const menuView = new TablePopUpMenuView(popUpItems, view);

      return menuView;
    },
  });
};

export default tablePopUpMenu;
