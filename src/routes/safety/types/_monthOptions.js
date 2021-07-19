export default [...Array(12).keys()].map((_,i)=>{
  const date = new Date(2012,i,1);
  return { label: `${date.toLocaleString('default', { month: 'long'})}`, value: i}
})