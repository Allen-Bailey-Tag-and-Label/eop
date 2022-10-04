export default {
  date: (v) => {
    const d = new Date(v);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  },
  extension: (v) => (v === 0 ? '' : v),
  string: (v) => v
};
