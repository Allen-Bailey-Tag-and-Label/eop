import auth from "$lib/auth";
import { serverFetch } from '$lib/_helpers';
import { get } from 'svelte/store';

export const getDirectReportIds = async ( _id = undefined, directReports = {}, array = [] ) => {
  // check if _id is current user ( undefined )
  if ( _id === undefined ) {
    const user = await serverFetch(`/api/auth/get/user?auth=${get(auth)}`);
    _id = user._id;
  }

  // check if directReports not initialized
  if ( Object.keys(directReports).length === 0 ) {
    const { rows } = await serverFetch ('/api/datatable/direct-reports');
    rows.forEach(user => {
      directReports[user.userId] = user.userIds;
    });
  }

  // check if current _id is in array
  if ( !array.includes(_id)) array.push(_id);

  // check if _id is in directReports
  if ( _id in directReports ) {
    directReports[_id].forEach(async directReportId => {
      if ( !array.includes(directReportId)) {
        array = await getDirectReportIds(directReportId, directReports, array);
      }
    })
  }

  return array;
}