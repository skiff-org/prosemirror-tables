export const cellExtraAttrs = {
  id: {
    default: '',
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.id || '';
    },

    setDOMAttr(value, attrs) {
      if (value) attrs.id = value;
    }
  },
  type: {
    default: 'text',
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('type');
    },

    setDOMAttr(value, attrs) {
      if (value) attrs.type = value;
    }
  },
  header: {
    // TODO: remove at some point
    default: false,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('header');
    },

    setDOMAttr(value, attrs) {
      if (value) attrs.header = value;
    }
  },
  colspan: {
    default: 1,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return Number(dom.getAttribute('colspan') || 1);
    },

    setDOMAttr(value, attrs) {
      if (value != 1) attrs.colspan = value;
    }
  },
  rowspan: {
    default: 1,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return Number(dom.getAttribute('rowspan') || 1);
    },

    setDOMAttr(value, attrs) {
      if (value != 1) attrs.rowspan = value;
    }
  },
  colwidth: {
    default: null,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      const widthAttr = dom.getAttribute('data-colwidth');
      const colspan = Number(dom.getAttribute('colspan') || 1);
      const widths =
        widthAttr && /^\d+(,\d+)*$/.test(widthAttr)
          ? widthAttr.split(',').map((s) => Number(s))
          : null;
      return widths && widths.length == colspan ? widths : null;
    },

    setDOMAttr(value, attrs) {
      if (value) attrs['data-colwidth'] = value.join(',');
    }
  },
  background: {
    default: 'transparent',

    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.style?.backgroundColor || null;
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.style = `${attrs.style || ''}background-color: ${value};`;
    }
  }
};
