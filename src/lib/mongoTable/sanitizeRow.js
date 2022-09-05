export default (row) => {
  row._mongoTable = {
    selected: false
  };
  return row;
};
