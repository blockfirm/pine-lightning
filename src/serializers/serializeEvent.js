const serializeEvent = (event) => {
  return JSON.stringify({
    event: event.event,
    data: event.data
  });
};

export default serializeEvent;
