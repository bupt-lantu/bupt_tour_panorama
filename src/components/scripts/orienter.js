export default class orientHandler {
  constructor() {
    this.lon = 0;
    this.lat = 0;
    this.direction = window.orientation || 0;
    switch (this.direction) {
      case 0:
        this.fix = 0;
        break;
      case 90:
        this.fix = -270;
        break;
      case -90:
        this.fix = -90;
        break;
    }
    if (!!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
      this.os = "ios";
    } else {
      this.os =
        navigator.userAgent.indexOf("Android") > -1 ||
        navigator.userAgent.indexOf("Linux")
          ? "android"
          : "";
    }
  }
  handleOrient(direction, event) {
    switch (this.os) {
      case "ios":
        switch (direction) {
          case 0:
            this.lon = event.alpha + event.gamma;
            if (event.beta > 0) this.lat = event.beta - 90;
            break;
          case 90:
            if (event.gamma < 0) {
              this.lon = event.alpha - 90;
            } else {
              this.lon = event.alpha - 270;
            }
            if (event.gamma > 0) {
              this.lat = 90 - event.gamma;
            } else {
              this.lat = -90 - event.gamma;
            }
            break;
          case -90:
            if (event.gamma < 0) {
              this.lon = event.alpha - 90;
            } else {
              this.lon = event.alpha - 270;
            }
            if (event.gamma < 0) {
              this.lat = 90 + event.gamma;
            } else {
              this.lat = -90 + event.gamma;
            }
            break;
        }
        break;
      case "android":
        switch (direction) {
          case 0:
            this.lon = event.alpha + event.gamma + 30;
            if (event.gamma > 90) {
              this.lat = 90 - event.beta;
            } else {
              this.lat = event.beta - 90;
            }
            break;
          case 90:
            this.lon = event.alpha - 230;
            if (event.gamma > 0) {
              this.lat = 270 - event.gamma;
            } else {
              this.lat = -90 - event.gamma;
            }
            break;
          case -90:
            this.lon = event.alpha - 180;
            this.lat = -90 + event.gamma;
            break;
        }
        break;
    }

    this.lon += this.fix;
    this.lon %= 360;
    if (this.lon < 0) this.lon += 360;

    //this.lon = Math.round(this.lon);
    //this.lat = Math.round(this.lat);
    return { lon: this.lon, lat: this.lat };
  }
}
