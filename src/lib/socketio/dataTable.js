export const destroy = ({ listeners, socket }) => Object.keys(listeners).forEach(event => {
  // get listener
  const listener = listeners[event];

  // remove listener
  socket.off(event, listener);
})
const find = async ({ collection, socket, token }) => {
  try {
    return await new Promise((res, rej) => {
      // initiate body
      const body = {
        collection,
        token
      }

      // emit to server
      socket.emit('find', body, ({ docs, error }) => {
        if (error) rej(error);
        if (docs) res(docs);
      })
    })
  } catch (error) {
    throw error
  }
}
export const onMount = async ({ collection, events = {}, socket, token }) => {
  // initiate listeners
  let listeners = [];

  // find event
  if ('find' in events) events.find(await find({ collection, socket, token }));

  // create event
  if ('create' in events) {
    // initiate listener
    const create = ({ collection: serverCollection, doc }) => {
      if (collection === serverCollection) events.create(doc);
    };

    // add listener
    socket.on('create', create);

    // register listener
    listeners.push({ create })
  }

  // remove event
  if ('remove' in events) {
    // initiate listener
    const remove = ({ collection: serverCollection, docs }) => {
      if (collection === serverCollection) events.remove(docs);
    };

    // add listener
    socket.on('remove', remove);

    // register listener
    listeners.push({ remove });
  }

  return { listeners }
}