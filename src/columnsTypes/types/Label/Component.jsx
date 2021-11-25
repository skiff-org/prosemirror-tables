import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import React, {useState, useEffect} from 'react';
import {
  addLabel,
  removeLabel,
  stringToColor,
  updateCellLabels,
  tableLabelsMenuKey,
  updateTablesLabels,
  removeLabelsFromTableCells,
  randomString,
} from './utils';
import useClickOutside from '../../../useClickOutside.jsx';

const Label = ({theme, title, onDelete, color, editMode, openChooser}) => {
  return (
    <div
      className="label-container"
      style={
        theme === 'dark'
          ? {backgroundColor: color.replace('1.0', '0.3')}
          : {backgroundColor: color}
      }
    >
      <span
        className="label-title"
        onClick={editMode ? openChooser : () => null}
        style={
          theme === 'dark'
            ? {
                color: color,
              }
            : {
                color: 'white',
              }
        }
      >
        {title}
      </span>
      {editMode && (
        <span
          className="delete-label"
          onClick={onDelete}
          style={
            theme === 'dark'
              ? {
                  backgroundColor: color,
                }
              : {
                  backgroundColor: 'white',
                }
          }
        />
      )}
    </div>
  );
};

const LabelOption = ({
  theme,
  color,
  title,
  onChange,
  checked,
  onDelete,
  inFilters,
}) => {
  const [selected, setSelected] = useState(checked);

  return (
    <div
      className={`label-option ${theme}`}
      onClick={() => {
        setSelected(!selected);
        onChange(title, !selected);
      }}
    >
      <span
        className={
          selected ? 'label-option-checkbox selected' : 'label-option-checkbox'
        }
      />
      <span
        className="label-color"
        style={{backgroundColor: `${color}`}}
      ></span>
      <span className="label-title">{title}</span>
      {inFilters ? (
        <></>
      ) : (
        <button
          className="remove-label"
          onClick={(e) => {
            onDelete(title);
            e.stopPropagation();
            e.preventDefault();
          }}
          type="button"
        >
          <span className="remove-label-icon"></span>
        </button>
      )}
    </div>
  );
};

export const LabelsChooser = ({
  theme,
  view,
  pos,
  node,
  inFilters,
  handleLabelChoose,
  initialChosenLabels,
  onClose,
}) => {
  const [tableLabels, setTableLabels] = useState([]);
  const [chosenLabels, setChosenLabels] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(
    stringToColor(randomString())
  );

  const handleClose = (currentChosenLabels) => {
    if (onClose) onClose();
    if (inFilters) return;

    // execute default close procedure
    if (typeof currentChosenLabels === 'string') {
      addLabel(view, pos, node, {
        title: currentChosenLabels,
        color: newLabelColor,
      });
    } else {
      updateCellLabels(view, pos, node, currentChosenLabels);
    }
  };

  const ref = useClickOutside(() => {
    handleClose(chosenLabels);
  }, 'mousedown');

  const filteredLabels =
    inputValue === ''
      ? tableLabels
      : tableLabels.filter((label) =>
          label.title.toLowerCase().includes(inputValue.toLowerCase())
        );

  const isNotExists = (label) =>
    !tableLabels.some(({title}) => title === label);

  useEffect(() => {
    const input = document.getElementById('labels-input');
    if (input) input.focus();
    const tableParent = findParentNodeOfTypeClosestToPos(
      view.state.doc.resolve(pos),
      view.state.schema.nodes.table
    );

    if (!tableParent) handleClose();

    setTableLabels(tableParent.node.attrs.labels);
    setChosenLabels(initialChosenLabels);

    return () => (ref.current = undefined);
  }, []);

  const handleLabelCheck = React.useCallback(
    (title, color, checked) => {
      const newChosenLabels = checked
        ? [...chosenLabels, {title, color}]
        : chosenLabels.filter((label) => label.title !== title);
      setChosenLabels(newChosenLabels);
      if (inFilters) handleLabelChoose(title, checked, newChosenLabels);
      updateCellLabels(view, pos, node, newChosenLabels, false);
      const input = document.getElementById('labels-input');
      if (input) input.focus();
    },
    [chosenLabels]
  );

  const createNewLabel = React.useCallback(() => {
    inputValue.length
      ? handleClose(inputValue)
      : () => {
          const input = document.getElementById('labels-input');
          if (input) input.focus();
        };

    setNewLabelColor(stringToColor(randomString()));
  }, [inputValue, handleClose]);

  const handleLabelDelete = (labelTitle) => {
    const {tr} = view.state;
    updateTablesLabels(tr, pos, 'remove', [labelTitle]);
    removeLabelsFromTableCells(view.state, pos, labelTitle, tr);
    view.dispatch(tr);

    setTableLabels((oldLabels) =>
      oldLabels.filter((label) => label.title !== labelTitle)
    );
    setChosenLabels((oldLabels) =>
      oldLabels.filter((label) => label.title !== labelTitle)
    );
  };

  return (
    <>
      <div className="labels-chooser-container" ref={ref}>
        <input
          className="labels-search"
          id="labels-input"
          onChange={(e) => setInputValue(e.target.value)}
          onClick={() => {
            const input = document.getElementById('labels-input');
            if (input) input.focus();
          }}
          onKeyDown={(e) => {
            if (!view) return;
            e.stopPropagation();
            view.editable = false;

            if (e.key === 'Enter' && filteredLabels.length === 0) {
              inFilters ? () => null : createNewLabel();
            }
          }}
          placeholder={
            tableLabels.length
              ? 'Type to filter / create new'
              : 'Type to create new label'
          }
          type="text"
        />
        <div className="labels-list">
          {inputValue.length && isNotExists(inputValue) ? (
            <div className="add-new-label" onClick={createNewLabel}>
              +
              <span
                className="label-color"
                style={{backgroundColor: `${newLabelColor}`}}
              ></span>
              <span className="new-label-title">Create "{inputValue}"</span>
            </div>
          ) : (
            ''
          )}
          {filteredLabels.length
            ? filteredLabels.map(({title, color}, index) => (
                <LabelOption
                  checked={chosenLabels.find((label) => label.title === title)}
                  color={color}
                  inFilters={inFilters}
                  key={`${title}${index}`}
                  onChange={(title, checked) =>
                    handleLabelCheck(title, color, checked)
                  }
                  onDelete={handleLabelDelete}
                  theme={theme}
                  title={title}
                />
              ))
            : ''}
        </div>
      </div>
    </>
  );
};

const LabelComponent = ({view, node, getPos, dom}) => {
  const labels = node.attrs.labels;

  const theme = window.localStorage.getItem('THEME_MODE') || 'light';

  const openChooser = (e) => {
    const {tr} = view.state;
    tr.setMeta(tableLabelsMenuKey, {
      pos: getPos(),
      dom: dom,
      node: node,
      id: window.id,
      action: 'open',
    });
    setTimeout(() => view.dispatch(tr), 0);

    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <div className="all-labels-container">
        {labels.map(({title, color}, index) => (
          <Label
            color={color}
            editMode={view.editable}
            key={`${color}${title}${index}`}
            onDelete={() => removeLabel(view, getPos(), node, title)}
            openChooser={openChooser}
            theme={theme}
            title={title}
          />
        ))}

        {view.editable && (
          <button
            className={`add-label ${theme}`}
            data-test="add-label"
            onClick={openChooser}
          >
            <span className="add-label-icon"></span>
          </button>
        )}
      </div>
    </>
  );
};

export default LabelComponent;
