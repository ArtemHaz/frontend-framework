class Request {
  constructor(address) {
    this.address = address;
    this.mode = undefined;
  }

  setRequestsMode(mode) {
    if (mode === 'same-origin' || mode === 'no-cors' || mode === 'cors' || mode === 'navigate' || mode === undefined) {
      this.mode = mode;
    }
  }

  _customFetch(url, method, body = undefined, headers = undefined, mode = undefined) {
    return fetch(url, {
      method,
      mode: mode || this.mode,
      body,
      headers,
    }).then((response) => (response.json().then((json) => ({
      code: response.status,
      data: json,
    }))).catch((err) => ({
      error: err,
    })));
  }

  ajax(method, url, body = undefined, headers = undefined, mode = undefined) {
    let reqBody;

    if (body instanceof FormData) {
      reqBody = body;
    }

    if (body && !(body instanceof FormData)) {
      try {
        reqBody = JSON.stringify(body);
      } catch (err) {
        return Promise.reject(err).catch((e) => ({ error: e }));
      }
    }

    return this._customFetch(url, method, reqBody, headers, mode);
  }
}

export default Request;
