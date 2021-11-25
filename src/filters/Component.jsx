import React, {useCallback, useEffect, useRef, useState} from 'react';
import Filter from './Filter';
import {
  createDefaultFilter,
  getColsOptions,
  executeFilters,
  tableFiltersMenuKey,
} from './utils';
import SelectDropdown, {SelectDropdownButton} from './Dropdown.jsx';
import useClickOutside from '../useClickOutside.jsx';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import DateUtilDayJS from '@date-io/dayjs';
import {
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/core/styles';
import DatePickerTheme from '../columnsTypes/types/Date/DatePickerTheme';
import {ThemeProvider} from '@material-ui/core/styles';
import {DATE_FORMAT} from '../columnsTypes/types/Date/utils';
import {LabelsChooser} from '../columnsTypes/types/Label/Component.jsx';

const generateClassName = createGenerateClassName({
  seed: 'sgo-tables-plugin-',
});

const FiltersDatePicker = ({onFilterChange, filterHandler}) => {
  const [date, setDate] = useState(filterHandler.getDefaultValue());
  return (
    <StylesProvider generateClassName={generateClassName}>
      <ThemeProvider theme={DatePickerTheme}>
        <MuiPickersUtilsProvider utils={DateUtilDayJS}>
          <DatePicker
            format={DATE_FORMAT}
            onChange={(newValue) => {
              setDate(newValue.toDate().getTime());
              onFilterChange({
                ...filterHandler.toAttrsValue(),
                filterValue: newValue.toDate().getTime(),
              });
            }}
            openTo="date"
            style={{width: '100px', cursor: 'pointer'}}
            value={date}
            variant="inline"
          />
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </StylesProvider>
  );
};

const FiltersInputDropdown = ({filterHandler, onFilterChange}) => {
  return (
    <SelectDropdown
      className="input-dropdown"
      initialValue={filterHandler.getDefaultValue()}
      items={filterHandler.getDropdownInputItems()}
      onValueChange={(filterValue) =>
        onFilterChange({
          ...filterHandler.toAttrsValue(),
          filterValue,
        })
      }
    />
  );
};

const FiltersTextInput = ({filterHandler, onFilterChange}) => {
  const inputRef = useRef();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [inputRef]);

  return (
    <input
      className="filter-value-input"
      defaultValue={filterHandler.getDefaultValue()}
      onChange={(e) =>
        onFilterChange({
          ...filterHandler.toAttrsValue(),
          filterValue: e.target.value,
        })
      }
      ref={inputRef}
    ></input>
  );
};

const FiltersLabelsDropdown = ({filterHandler, onFilterChange}) => {
  const [openDropdown, setOpenDropdown] = useState(false);

  const tablePos = tableFiltersMenuKey.getState(filterHandler.view.state);
  const handleLabelChoose = (title, checked, allChosenLabels) => {
    let newChosenLabels = allChosenLabels.map((label) => label.title);

    if (checked) {
      newChosenLabels = [...newChosenLabels, title];
    } else {
      newChosenLabels = newChosenLabels.filter((label) => label !== title);
    }

    onFilterChange({
      ...filterHandler.toAttrsValue(),
      filterValue: newChosenLabels,
    });
  };

  return (
    <div className="select-dropdown-container">
      <SelectDropdownButton
        disableDropdown={false}
        itemStyleClass={''}
        label={'Choose labels'}
        openDropdown={() => setOpenDropdown(!openDropdown)}
      />
      {openDropdown && (
        <LabelsChooser
          handleLabelChoose={handleLabelChoose}
          inFilters={true}
          initialChosenLabels={filterHandler
            .toAttrsValue()
            .filterValue.map((label) => ({title: label}))}
          node={filterHandler.table}
          onClose={() => setOpenDropdown(false)}
          pos={tablePos.pos + 1}
          view={filterHandler.view}
        />
      )}
    </div>
  );
};

const getInputElement = (filterHandler) => {
  const inputType = filterHandler.getInputType();

  switch (inputType) {
    default:
      return () => <></>;
    case 'input':
      return FiltersTextInput;
    case 'date-picker':
      return FiltersDatePicker;
    case 'dropdown':
      return FiltersInputDropdown;
    case 'labels-dropdown':
      return FiltersLabelsDropdown;
  }
};

const FilterRule = ({
  onFilterChange,
  filterHandler,
  colsDropdownOptions,
  onFilterRemove,
  index,
  isFirstGroup,
}) => {
  const FilterInput = getInputElement(filterHandler);

  return (
    <div className="filter-row">
      <span className="concatenation-rule">
        {index !== 0 ? 'And' : isFirstGroup ? 'Where' : 'Or where'}
      </span>
      <div className="column-chooser" data-test="filter-column-chooser">
        <SelectDropdown
          className="filter-columns-dropdown"
          initialValue={filterHandler.headerId}
          items={colsDropdownOptions}
          onValueChange={(headerId) =>
            onFilterChange({...filterHandler.toAttrsValue(), headerId})
          }
        />
      </div>
      <div className="rule-chooser" data-test="filter-role-chooser">
        <SelectDropdown
          className="filter-logics-dropdown"
          initialValue={filterHandler.getLogicId()}
          items={filterHandler.getLogicOptions()}
          onValueChange={(filterId) =>
            onFilterChange({...filterHandler.toAttrsValue(), filterId})
          }
        />
      </div>

      <div className="value-chooser" data-test="filter-value-chooser">
        <FilterInput
          filterHandler={filterHandler}
          onFilterChange={onFilterChange}
        />
      </div>

      <button className="remove-rule-button" onClick={onFilterRemove}>
        <span className="remove-rule-icon"></span>
      </button>
    </div>
  );
};

const FiltersGroup = ({
  filters,
  onGroupChange,
  isLastGroup,
  isFirstGroup,
  table,
  addNewGroup,
  view,
  index,
}) => {
  const createFilterRemover = (filterIndex) => () => {
    const newFilters = filters.map((filter) => filter.toAttrsValue());
    newFilters.splice(filterIndex, 1);

    onGroupChange(newFilters);
  };

  const createFilterSetter = (filterIndex) => (newFilter) => {
    const newFilters = filters.map((filter) => filter.toAttrsValue());
    newFilters[filterIndex] = newFilter;

    onGroupChange(newFilters);
  };

  const addFilterToGroup = () => {
    const colDefaultFilter = createDefaultFilter(view.state, table);
    onGroupChange([
      ...filters.map((filter) => filter.toAttrsValue()),
      colDefaultFilter,
    ]);
  };

  return (
    <div className="filters-group-container">
      {!isFirstGroup && <hr className="filters-group-separator"></hr>}
      <span className="filter-index">Filter {index + 1}</span>
      {filters.length ? (
        filters.map((filterHandler, i) => {
          return (
            <FilterRule
              colsDropdownOptions={getColsOptions(table)}
              filterHandler={filterHandler}
              index={i}
              isFirstGroup={isFirstGroup}
              key={`${index}${i}`}
              onFilterChange={createFilterSetter(index)}
              onFilterRemove={createFilterRemover(index)}
            />
          );
        })
      ) : (
        <></>
      )}
      {filters.length ? (
        <div className="group-actions-container">
          <button
            className="group-action-button"
            data-test="filter-and-button"
            onClick={addFilterToGroup}
          >
            + And
          </button>
          <button
            className="group-action-button"
            data-test="filter-or-button"
            onClick={() => addNewGroup()}
          >
            + Or
          </button>
          {filters.length > 1 && (
            <button
              className="group-action-button remove"
              onClick={() => onGroupChange([])}
            >
              <span className="group-action-remove-icon"></span>
            </button>
          )}
        </div>
      ) : (
        <button className="group-action-button" onClick={addFilterToGroup}>
          + Add filter
        </button>
      )}
    </div>
  );
};

const closeFiltersPopup = (view, tr) => {
  tr = tr || view.state.tr;
  tr.setMeta(tableFiltersMenuKey, {
    action: 'close',
    id: window.id,
  });

  return tr;
};

export const TableFiltersComponent = ({table, pos, view, headerPos}) => {
  const [filtersGroups, setFiltersGroups] = useState(table.attrs.filters || []);

  // ad filter to selected column
  useEffect(() => {
    if (!headerPos) {
      if (!filtersGroups.length) addNewGroup();
      return;
    }
    const colDefaultFilter = createDefaultFilter(view.state, table, headerPos);
    setFiltersGroups((oldGroups) => [...oldGroups, [colDefaultFilter]]);
  }, []);

  const addNewGroup = () => {
    const defaultFilter = createDefaultFilter(view.state, table);
    setFiltersGroups((oldFilters) => [...oldFilters, [defaultFilter]]);
  };

  const createFiltersGroupSetter = (groupIndex) => (newGroup) => {
    let newFilters = filtersGroups.slice();
    newFilters[groupIndex] = newGroup;
    newFilters = newFilters.filter((filtersGroup) => !!filtersGroup.length);

    // apply all filters
    const tr = executeFilters(table, pos, view.state, newFilters);

    if (!newFilters.length) {
      // Close filter popup when no filters rule left
      closeFiltersPopup(view, tr);
    }
    view.dispatch(tr);

    setFiltersGroups(newFilters);
  };

  const ref = useClickOutside((e) => {
    if (view.dom.contains(e.target)) {
      const tr = closeFiltersPopup(view);
      view.dispatch(tr);
    }
  }, 'mousedown');

  return (
    <div className="table-filters-container" ref={ref}>
      <div className="active-filters-heading">
        <span className="active-filters-heading-icon"></span>
        <span className="active-filters-heading-label"> Filters </span>
      </div>
      <div className="active-filters">
        {filtersGroups.length ? (
          <>
            {filtersGroups.map((groupFilters, index) => {
              return (
                <FiltersGroup
                  addNewGroup={addNewGroup}
                  filters={groupFilters.map(
                    (filter) => new Filter(view, table, filter)
                  )}
                  index={index}
                  isFirstGroup={index === 0}
                  isLastGroup={index + 1 === filtersGroups.length}
                  key={`${index}`}
                  onGroupChange={createFiltersGroupSetter(index)}
                  table={table}
                  view={view}
                />
              );
            })}
          </>
        ) : (
          <>
            <button
              className="group-action-button"
              onClick={() => addNewGroup()}
            >
              + Add filter
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const FiltersActionsComponent = ({table, pos, view, manageFilters}) => {
  const enableFiltersBtnClicked = useCallback(() => {
    const {
      dispatch,
      state: {tr},
    } = view;

    table.attrs = {
      ...table.attrs,
      disableFilters: !table.attrs.disableFilters,
    };
    closeFiltersPopup(view, tr);
    tr.setNodeMarkup(pos, undefined, table.attrs);
    dispatch(tr);
    return false;
  }, [table, view]);

  const clearFilterBtnClicked = useCallback(() => {
    const {
      dispatch,
      state: {tr},
    } = view;

    table.attrs = {...table.attrs, disableFilters: false, filters: []};
    tr.setNodeMarkup(pos, undefined, table.attrs);
    closeFiltersPopup(view, tr);
    dispatch(tr);
    return false;
  }, [table, view]);

  const manageFiltersBtnClicked = useCallback(() => {
    const {
      dispatch,
      state: {tr},
    } = view;

    table.attrs = {...table.attrs, disableFilters: false};
    tr.setNodeMarkup(pos, undefined, table.attrs);
    dispatch(tr);
    manageFilters();
    return false;
  }, [table, view]);

  const ref = useClickOutside((e) => {
    if (view.dom.contains(e.target)) {
      const tr = closeFiltersPopup(view);
      view.dispatch(tr);
    }
  }, 'mousedown');

  return (
    <div className="actions-tooltip" ref={ref}>
      <button
        className="manage-filters-button"
        onClick={manageFiltersBtnClicked}
      >
        <span className="manage-filters-icon"></span>
        <span className="manage-filters-label"> Manage filters</span>
      </button>
      <button
        className={`${
          table.attrs.disableFilters ? 'disable' : ''
        } enable-filters-button`}
        onClick={enableFiltersBtnClicked}
      >
        <span className="enable-filters-icon"></span>
        <span className="enable-filters-label">
          {table.attrs.disableFilters ? 'Enable' : 'Disable'} filters
        </span>
      </button>
      <button className="clear-filters-button" onClick={clearFilterBtnClicked}>
        <span className="clear-filters-icon"></span>
        <span className="clear-filters-label"> Clear filters</span>
      </button>
    </div>
  );
};
