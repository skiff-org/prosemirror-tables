import React, {useEffect, useRef, useState} from 'react';
import Filter from './Filter';
import {
  createDefaultFilter,
  getColsOptions,
  executeFilters,
  tableFiltersMenuKey,
  getConcatenationItems,
} from './utils';
import SelectDropDown, {SelectDropDownButton} from './DropDown.jsx';
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

const FiltersInputDropDown = ({filterHandler, onFilterChange}) => {
  return (
    <SelectDropDown
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

const FiltersLabelsDropDown = ({filterHandler, onFilterChange}) => {
  const [openDropDown, setOpenDropDown] = useState(false);

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
    <div className="selectDropDownContainer">
      <SelectDropDownButton
        disableDropDown={false}
        itemStyleClass={''}
        label={'Choose Labels'}
        openDropDown={() => setOpenDropDown(!openDropDown)}
      />
      {openDropDown && (
        <LabelsChooser
          handleLabelChoose={handleLabelChoose}
          inFilters={true}
          initialChosenLabels={filterHandler
            .toAttrsValue()
            .filterValue.map((label) => ({title: label}))}
          node={filterHandler.table}
          onClose={() => setOpenDropDown(false)}
          pos={tablePos.pos + 1}
          view={filterHandler.view}
        />
      )}
    </div>
  );
};

const getInputElement = (filterHandler, onFilterChange) => {
  const inputType = filterHandler.getInputType();

  switch (inputType) {
    default:
      return () => <></>;
    case 'input':
      return FiltersTextInput;
    case 'date-picker':
      return FiltersDatePicker;
    case 'dropdown':
      return FiltersInputDropDown;
    case 'labels-dropdown':
      return FiltersLabelsDropDown;
  }
};

const FilterRule = ({
  onFilterChange,
  filterHandler,
  colsDropdownOptions,
  onFilterRemove,
  index,
}) => {
  const FilterInput = getInputElement(filterHandler, onFilterChange);

  return (
    <div className="filter-row">
      {index === 0 ? 'Where' : 'And'}
      <div className="column-chooser">
        <SelectDropDown
          className="filter-columns-dropdown"
          initialValue={filterHandler.headerId}
          items={colsDropdownOptions}
          onValueChange={(headerId) =>
            onFilterChange({...filterHandler.toAttrsValue(), headerId})
          }
        />
      </div>
      <div className="rule-chooser">
        <SelectDropDown
          className="filter-logics-dropdown"
          initialValue={filterHandler.getLogicId()}
          items={filterHandler.getLogicOptions()}
          onValueChange={(filterId) =>
            onFilterChange({...filterHandler.toAttrsValue(), filterId})
          }
        />
      </div>

      <div className="value-chooser">
        <FilterInput
          filterHandler={filterHandler}
          onFilterChange={onFilterChange}
        />
      </div>

      <span className="remove-rule-button" onClick={onFilterRemove}></span>
    </div>
  );
};

const FiltersGroup = ({
  filters,
  onGroupChange,
  onGroupRemove,
  isLastGroup,
  table,
  addNewGroup,
  view,
}) => {
  const createFilterRemover = (filterIndex) => () => {
    const newFilters = filters.slice();
    newFilters.splice(filterIndex, 1);

    onGroupRemove(newFilters);
  };

  const createFilterSetter = (filterIndex) => (newFilter) => {
    const newFilters = filters.slice();
    newFilters[filterIndex] = newFilter;

    onGroupChange(newFilters);
  };

  const addFilterToGroup = () => {
    const colDefaultFilter = createDefaultFilter(view.state, table);
    onGroupChange([...filters, colDefaultFilter]);
  };

  return (
    <div className="filters-group-container">
      {filters.length ? (
        <>
          {filters.map((filterHandler, index) => {
            return (
              <>
                <FilterRule
                  colsDropdownOptions={getColsOptions(table)}
                  filterHandler={filterHandler}
                  index={index}
                  key={`${index}${filterHandler.headerId}`}
                  onFilterChange={createFilterSetter(index)}
                  onFilterRemove={createFilterRemover(index)}
                />
              </>
            );
          })}
        </>
      ) : (
        <></>
      )}
      <button className="add-filter-to-group-button" onClick={addFilterToGroup}>
        + And
      </button>
      {isLastGroup && (
        <button className="add-new-group-button" onClick={() => addNewGroup()}>
          + Or
        </button>
      )}
    </div>
  );
};

export const TableFiltersComponent = ({table, pos, view, headerPos}) => {
  const [filtersGroups, setFiltersGroups] = useState(table.attrs.filters || []);

  // ad filter to selected column
  useEffect(() => {
    if (!headerPos) return;
    const colDefaultFilter = createDefaultFilter(view.state, table, headerPos);
    setFiltersGroups((oldGroups) => [...oldGroups, [colDefaultFilter]]);
  }, []);

  const addNewGroup = () => {
    const defaultFilter = createDefaultFilter(view.state, table);
    setFiltersGroups((oldFilters) => [...oldFilters, [defaultFilter]]);
  };

  const createFiltersGroupSetter = (groupIndex) => (newGroup) => {
    const newFilters = filtersGroups.slice();
    newFilters[groupIndex] = newGroup;

    // apply all filters
    const tr = executeFilters(table, pos, view.state, newFilters);
    view.dispatch(tr);

    setFiltersGroups(newFilters);
  };

  const createFiltersGroupRemover = (groupIndex) => () => {
    const newFilters = filtersGroups.slice();
    newFilters.splice(groupIndex, 1);

    // apply all filters
    const tr = executeFilters(table, pos, view.state, newFilters);
    view.dispatch(tr);

    setFiltersGroups(newFilters);
  };

  const ref = useClickOutside((e) => {
    if (view.dom.contains(e.target)) {
      const {tr} = view.state;
      tr.setMeta(tableFiltersMenuKey, {
        action: 'close',
        id: window.id,
      });

      view.dispatch(tr);
    }
  });

  return (
    <div className="table-filters-container" ref={ref}>
      <div className="active-filters">
        {filtersGroups.length ? (
          <>
            {filtersGroups.map((groupFilters, index) => {
              return (
                <>
                  <FiltersGroup
                    addNewGroup={addNewGroup}
                    filters={groupFilters.map(
                      (filter) => new Filter(view, table, filter)
                    )}
                    isLastGroup={index + 1 === filtersGroups.length}
                    key={`${index}`}
                    onGroupChange={createFiltersGroupSetter(index)}
                    onGroupRemove={createFiltersGroupRemover(index)}
                    table={table}
                    view={view}
                  />
                  {index + 1 !== filtersGroups.length ? (
                    <>
                      <hr className="filters-group-separator"></hr>
                      <span className="or-breaker">Or</span>
                    </>
                  ) : (
                    <></>
                  )}
                </>
              );
            })}
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
