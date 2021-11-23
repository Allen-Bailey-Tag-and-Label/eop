import auth from "$lib/auth";
import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers';
import deepmerge from 'deepmerge';
import { get } from 'svelte/store';

export const getDirectReportIds = async ( _id = undefined, directReports = {}, array = [] ) => {
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
export const getDirectReportUsers = async ( params = {} ) => {
  // initialize defaults
  const defaults = {
    _id : undefined,
    self : true,
    sort: {
      firstName: 1,
      lastName: 1
    }
  }

  // merge defaults
  params = deepmerge( defaults, params );

  // destructure params
  let { _id } = params;
  const { self } = params;
  
  // check if _id is current user ( undefined )
  if ( _id === undefined ) {
    const user = await serverFetch(`/api/auth/get/user?auth=${get(auth)}`);
    _id = user._id;
  }

  // get users and directUser Ids
  let [users, directUserIds] = await Promise.all([getUsers({sort: params.sort}), getDirectReportIds( _id )]);

  // filter users
  users = users.filter(({_id : userId}) => {
    let include = true;

    // verify user is in direct user list
    if ( !directUserIds.includes(userId) ) include=  false

    // remove self if necessary
    if ( !self && userId === _id) include = false
    
    return include
  });

  return users;
}
export const getSelf = async () => {
  // find user
  const user = await serverFetch(`/api/auth/get/user?auth=${get(auth)}`);

  return user;
}
export const getUsers = async (params = {}) => {
  // initialize defaults
  const defaults = {
    sort: {
      firstName: 1,
      lastName: 1
    }
  }

  // merge defaults
  params = deepmerge(defaults, params)

  // destructure params
  const { sort } = params;

  // fetch data from server
  const { rows } = await serverFetch(`/api/datatable/users?sort=${JSON.stringify(sort)}`)

  return rows;
}