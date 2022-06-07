class Router {
  constructor() {
    this.currComponent = () => {};
    this.errorComponent = () => {};
    this.urlPrevious = '';
    this.urlCurrent = '';
    this.routes = {};
  }

  append(path, component) {
    this.routes[path] = component;
  }

  start() {
    window.addEventListener('popstate', this.route.bind(this));
    window.addEventListener('load', this.route.bind(this));
    window.addEventListener('click', (evt) => {
      let target = evt.target;
      while (target.parentNode) {
        if (target instanceof HTMLAnchorElement) {
          evt.preventDefault();
          this.pushState(target.href);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  canBack() {
    return this.urlPrevious !== undefined;
  }

  goBack() {
    if (!this.canBack()) {
      return;
    }
    this.pushState(this.urlPrevious);
  }

  pushState(url = '/', state = undefined) {
    if (url !== window.location.pathname) {
      window.history.pushState(state, document.title, url);
    } else {
      window.history.replaceState(state, document.title, url);
    }
    this.route();
  }

  getSearchParams() {
    const url = new URL(window.location.href);
    return url.search;
  }

  setErrorComponent(component) {
    this.errorComponent = component;
  }

  route(evt) {
    if (evt instanceof Event) {
      evt.preventDefault();
    }

    if (this.urlCurrent) {
      this.urlPrevious = this.urlCurrent;
    }
    this.urlCurrent = window.location.href;

    const path = window.location.pathname;

    this.currComponent = this.routes[path] || this.errorComponent;
    this.currComponent();
  }

  redirectTo(path, state = undefined) {
      this.pushState(path, state);
  }

  redirectBack(failBackUrl = '/') {
    if (this.canBack()) {
      this.goBack();
    } else {
      this.redirectTo(failBackUrl);
    }
  }

  redirectError(err, url = '/error') {
    this.pushState(url, err);
  }
}

export default new Router();
