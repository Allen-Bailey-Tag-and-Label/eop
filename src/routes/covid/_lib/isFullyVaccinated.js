import moment from 'moment';

export default ({ firstName= undefined, immunizationMethod, dateFirstShot, dateSecondShot, dateBooster }) => {
  // check if unvaccinated or unknown
  if (immunizationMethod === 'Unknown' || immunizationMethod === 'Unvaccinated') return false;

  // check if boosted
  if (dateBooster !== '' && dateBooster !== 'Invalid date') return true;

  // update dates
  let monthsSinceFirstShot = moment().diff(moment(dateFirstShot, 'x'), 'months');
  let monthsSinceSecondShot = moment().diff(moment(dateSecondShot, 'x'), 'months');
  let monthsSinceBooster = moment().diff(moment(dateBooster, 'x'), 'months');

  if (isNaN(monthsSinceFirstShot)) monthsSinceFirstShot = Infinity;
  if (isNaN(monthsSinceSecondShot)) monthsSinceSecondShot = Infinity;
  if (isNaN(monthsSinceBooster)) monthsSinceBooster = Infinity;

  // check if johnson and johnson
  if (immunizationMethod === 'Johnson & Johnson') {
    if (monthsSinceFirstShot >= 2 && monthsSinceBooster >= 6) return false;
  }

  // check if moderna or phizer
  if (immunizationMethod === 'Moderna' || immunizationMethod === 'Pfizer-BioNTech') {
    if (monthsSinceSecondShot >= 6 && monthsSinceBooster >= 6) return false;
  }

  return true;
}