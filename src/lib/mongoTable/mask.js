export default {
  date: (v) => {
    const d = new Date(v);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  },
  datetime: (v) => `${new Date(v).toLocaleDateString()} ${new Date(v).toLocaleTimeString()}`,
  extension: (v) => (v === 0 ? '' : v),
  string: (v) => v
};
