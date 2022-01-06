import moment from 'moment';

export default ({ immunizationMethod, dateFirstShot, dateSecondShot, dateBooster }) => {
  // check if unvaccinated or unknown
  if (immunizationMethod === 'Unknown' || immunizationMethod === 'Unvaccinated') return false;

  // check if boosted
  if (dateBooster !== '' && dateBooster !== 'Invalid date') return true;

  // update dates
  let weeksSinceFirstShot = moment().diff(moment(dateFirstShot, 'x'), 'weeks');
  let weeksSinceSecondShot = moment().diff(moment(dateSecondShot, 'x'), 'weeks');
  let weeksSinceBooster = moment().diff(moment(dateBooster, 'x'), 'weeks');

  if (isNaN(weeksSinceFirstShot)) weeksSinceFirstShot = Infinity;
  if (isNaN(weeksSinceSecondShot)) weeksSinceSecondShot = Infinity;
  if (isNaN(weeksSinceBooster)) weeksSinceBooster = Infinity;

  // check if johnson and johnson
  if (immunizationMethod === 'Johnson & Johnson') {
    if (weeksSinceFirstShot < 2) return false;
  }

  // check if moderna or phizer
  if (immunizationMethod === 'Moderna' || immunizationMethod === 'Pfizer-BioNTech') {
    if (weeksSinceSecondShot < 2) return false;
  }

  return true;
}