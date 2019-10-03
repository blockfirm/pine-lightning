const serializeError = (error) => {
  return JSON.stringify({
    error: {
      name: error.name,
      message: error.message
    }
  });
};

export default serializeError;
