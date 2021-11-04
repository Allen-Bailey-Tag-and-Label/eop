import { get, set } from '$lib/_helpers';
import { connect } from '$lib/db';
import moment from 'moment';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

// utilities
const format = {
  column: (obj, column) => {
    obj[column] = '';
    return obj;
  },
  row: (string, column) => {
    const replacements = [
      { re: '^\\[ObjectId\\]', flag: 'g', fn: (row, key) => ObjectId(get(row, key).replace(/\[ObjectId\]/g, '')) },
      { re: '^\\[M\/D\/YYYY\\]', flag: 'g', fn: (row, key) => +moment(get(row, key).replace(/\[M\/D\/YYYY\]/g, ''), 'M/D/YYYY').format('x') },
      { re: '^(false|true)$', flag: 'gi', fn: (row, key) => get(row, key).toLowerCase() === 'true' },
      { re: '^\\[int\\]', flag: 'gi', fn: (row, key) => parseInt(get(row, key).replace(/^\[int\]/gi, '')) },
      { re: '^\\[float\\]', flag: 'gi', fn: (row, key) => parseFloat(get(row, key).replace(/^\[float\]/gi, '')) },
    ]
    const row = {};
    string = string.split('\t');
    Object.keys(column).forEach((key, i) => {
      set(row, key, string[i]);
      replacements.forEach(({re, flag, fn}) => {
        if (new RegExp(re, flag).test(get(row, key))) set(row, key, fn(row, key))
      })
    })
    return row
  }
}

export async function post({ body, params }) {
  // connect to db
  const client = await connect();

  // get collection (slug)
  const { slug: collection } = params;

  // destructure body
  let [columns, ...rows] = body.split('\n');

  // format columns
  columns = columns.split('\t').reduce(format.column, {})

  // format rows
  rows = rows.map(row => format.row(row, Object.assign({}, columns)));

  // insert into database
  const docs = await client.db().collection(collection).insertMany(rows);

  return {
    status: 200,
    body: docs.ops
  }
}