const fetchWithTimeout = (resource, options) => {
  const { timeout, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout || 8000);

  return fetch(resource, {
    signal: controller.signal,
    ...fetchOptions,
  })
    .then((res) => {
      clearTimeout(id);
      return res;
    })
    .catch((err) => {
      return err;
    });
};

export default fetchWithTimeout;
