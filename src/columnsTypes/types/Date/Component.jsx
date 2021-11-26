import React, {useState, useCallback, useEffect} from 'react';
import useClickOutside from '../../../useClickOutside.jsx';
import EditorContent from '../../../ReactNodeView/EditorContent.jsx';
import {
  formatDate,
  DATE_FORMAT,
  buildDateObjectFromText,
  getClosestDate,
} from './utils';
import {tableDateMenuKey} from '../../../PopupManager'
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import DateUtilDayJS from '@date-io/dayjs';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/core/styles';
import DatePickerTheme from './DatePickerTheme';
import {ThemeProvider} from '@material-ui/core/styles';
import ee from 'event-emitter';
import PopupManager from '../../../PopupManager.js';

const DateEventEmitter = function () {};
ee(DateEventEmitter.prototype);

export const datePopupEmitter = new DateEventEmitter();

const generateClassName = createGenerateClassName({
  seed: 'sgo-tables-plugin-',
});

const DateComponent = ({view, node, getPos, editorContentRef, dom}) => {
  const openChooser = (e) => {
    const {tr} = view.state;
    PopupManager.open(tr, tableDateMenuKey, {
      pos: getPos(),
      dom: dom,
      node: node,
    })

    view.dispatch(tr);
  };

  const pos = getPos();

  useEffect(() => {
    const dateFromAttrs = node.attrs.value;
    if (dateFromAttrs === -1 || !pos) return;
    const formattedDate = formatDate(new Date(dateFromAttrs), DATE_FORMAT);
    if (formattedDate !== node.textContent) {
      const {tr} = view.state;
      tr.insertText(formattedDate, pos + 1, pos + node.nodeSize - 1);

      view.dispatch(tr);
    }
  }, [pos]);

  return (
    <div
      className={`${DATE_FORMAT.replaceAll('/', '_')} date-component`}
      onClick={openChooser}
    >
      <EditorContent ref={editorContentRef} />
    </div>
  );
};

export const DatePickerComponent = ({view, node, pos}) => {
  const [date, setDate] = useState(
    buildDateObjectFromText(node ? node.textContent : '', DATE_FORMAT) ||
      new Date()
  );

  datePopupEmitter.once('updatePopup', (content) => {
    const closestDate = getClosestDate(content, DATE_FORMAT);

    setDate(closestDate || date);
  });

  const ref = useClickOutside((e) => {
    if (!view.dom.contains(e.target)) return;

    const {tr} = view.state;
    PopupManager.close(tr, tableDateMenuKey)

    view.dispatch(tr);
  });

  const handleChange = useCallback(
    (newValue) => {
      const newDate = newValue.toDate();
      setDate(newDate);
      if (pos) {
        const {tr} = view.state;

        const dateNode = findParentNodeOfTypeClosestToPos(
          tr.doc.resolve(pos + 1),
          view.state.schema.nodes.date
        );
        if (!dateNode) return;

        tr.insertText(
          formatDate(newDate, DATE_FORMAT),
          dateNode.start,
          pos + dateNode.node.nodeSize - 1
        );

        tr.setNodeMarkup(dateNode.pos, undefined, {
          ...dateNode.node.attrs,
          value: newDate.getTime(),
        });

        view.dispatch(tr);
      }
    },
    [view, pos]
  );

  return (
    <div className="date-picker" ref={ref}>
      <StylesProvider generateClassName={generateClassName}>
        <ThemeProvider theme={DatePickerTheme}>
          <MuiPickersUtilsProvider utils={DateUtilDayJS}>
            <DatePicker
              autoOk
              onChange={handleChange}
              openTo="date"
              value={date}
              variant="static"
            />
          </MuiPickersUtilsProvider>
        </ThemeProvider>
      </StylesProvider>
    </div>
  );
};

export default DateComponent;
