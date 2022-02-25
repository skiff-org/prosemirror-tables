export const parseTextToCurrency = (text, currency) => {
  const numbersInStringRegex = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g;
  const matches = text.match(numbersInStringRegex);

  return matches
    ? `${currency} ` +
        parseFloat(matches.join(''), 2)
          .toFixed(2)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : `${currency} 0.00`;
};

export const parseTextToNumber = (text) => {
  const numbersInText = text.match(/(^[+-])?([0-9]+\.?[0-9]*|\.[0-9]+)/g);
  if (!numbersInText) return '';

  const combined = [...numbersInText.join('')]
    .map((char, index, array) => {
      return char === '.' ? (index === array.indexOf('.') ? '.' : '') : char;
    })
    .join('');
  const leftNumber = combined
    .split('.')[0]
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rightNumber = combined.split('.')[1]
    ? `.${combined.split('.')[1]}`
    : '';
  return leftNumber + rightNumber;
};

export const isCellInFirstRow = (state, cellPos) => {
  const resolvePos = state.doc.resolve(cellPos);
  const rowStart = cellPos - resolvePos.parentOffset - 1;
  const rowResolvedPos = state.doc.resolve(rowStart);
  return rowResolvedPos.parentOffset === 0;
};
