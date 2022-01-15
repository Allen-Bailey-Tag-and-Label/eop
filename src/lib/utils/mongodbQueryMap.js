// imports
import { ObjectId } from 'mongodb';
import { isArray, isObject, isObjectId } from './index.js';

const mongodbQueryMap = (input, updateValue = false) => {
  // determine if input is object
  if (isObject(input)) return Object.keys(input).reduce((obj, key) => {
    // get value
    let value = input[key];
    
    // determine if is ObjectId
    const updateValue = isObjectId(key);
    if (updateValue) key = key.replace(/\[ObjectId\]/g, '')
    
    obj[key] = mongodbQueryMap(value, updateValue);
    
    return obj;
  }, {});
  
  // determine if input is array
  if (isArray(input)) return input.map(value => mongodbQueryMap(value, updateValue));
  
  // otherwise return input
  return updateValue ? ObjectId(input) : input;
}

export default mongodbQueryMap;