import Request from "./network.js";

class TimeRequest extends Request {
  getTime(pathName) {
    return this.ajax('GET', this.address + pathName).then((res) => {
      console.log('from request', res)
      if (res.code === 200) {
        return res.data;
      } else {
        return new Date();
      }
    })
  }
}

export default new TimeRequest('https://worldtimeapi.org/');
