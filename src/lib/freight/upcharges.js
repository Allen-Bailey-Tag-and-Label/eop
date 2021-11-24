export const ltl = [
  { max: 250, percent: .40 },
  { max: 500, percent: .35 },
  { max: 750, percent: .30 },
  { max: 1000, percent: .25 },
  { max: Infinity, percent: .20 },
]

export const calculate = (amount, grid) => {
  // get matching percent
  const { percent } = grid.filter(({ max }) => amount <= max)[0]

  // calculate amount upcharge
  let upcharge = amount * percent;

  // round upcharge to nearest penny
  upcharge = Math.floor(upcharge * 100) / 100;

  return upcharge
}