export default (row) => {
  if (row?._mongoTable === undefined)
    row._mongoTable = {
      selected: false
    };
  return row;
};
