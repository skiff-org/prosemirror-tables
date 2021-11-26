import {PluginKey} from 'prosemirror-state'

export const tableHeadersMenuKey = new PluginKey('headersMenu');
export const tableLabelsMenuKey = new PluginKey('TableLabelsMenu');
export const tableFiltersMenuKey = new PluginKey('TableFiltersMenu');
export const tablePopUpMenuKey = new PluginKey('tablePopUpMenu');
export const tableDateMenuKey = new PluginKey('TableDateMenu');

const POPUPS_KEYS = [tableHeadersMenuKey, tableLabelsMenuKey, tableFiltersMenuKey, tableDateMenuKey];

class PopupsManager {
  open(tr, popupKey, payload) {
    tr.setMeta(popupKey, {
      id: window.id,
      action: 'open',
      ...payload
    });

    POPUPS_KEYS.filter((key) => key.key !== popupKey.key).forEach((key) => this.close(tr, key))
  }

  close(tr, popupKey) {
    tr.setMeta(popupKey, {
      action: 'close',
      id: window.id
    })
  }
}

export default new PopupsManager();