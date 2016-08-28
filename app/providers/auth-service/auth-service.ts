import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the AuthService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class AuthService {
  data: any;
  authorization: string;
  props: Array<string> = ['access_token', 'refresh_token', 'token_type', 'expires_in'];
  propsPrefix: string = '$b2b$';

  constructor(private http: Http) {
    this.data = null;
    this.loadData();
  }

  authenticate(credentials, rememberMe) {
    let creds = "client_id=m6hgwkg3893tycmttefe7wsn&client_secret=m7qpUM3YrACgEZtcHx4RGVgw&grant_type=password&username=" + credentials.username + "&password=" + credentials.password;

    if (this.data) {
      // already loaded data
      return Promise.resolve(this.data);
    }

    this.clearStorage();

    // don't have the data yet
    return new Promise((resolve, reject) => {
      let headers = new Headers();
      headers.append('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      let options = new RequestOptions({
        headers: headers
      });
      this.http.post('https://cloudsso.cisco.com/as/token.oauth2', creds, options)
        .map(res => res.json())
        .subscribe(data => {
          // we've got back the raw data, now generate the core schedule data
          // and save the data for later reference
          this.data = data;
          this.saveData(this.data, rememberMe);
          this.loadData();
          resolve(this.data);
        }, err => {
          if (err._body.type == 'error') {
            reject({
              'error': 'error',
              'error_description': 'Something went wrong, please try again !'
            });
          } else {
            reject(JSON.parse(err._body));
          }
        });
    });
  }

  saveData(data, rememberMe) {
    if (data) {
      let storage = rememberMe ? localStorage : sessionStorage;
      for(let name in data) {
        this.save(storage, name, data[name]);
      }
    }
  }

  loadData() {
    if(this.load('access_token')) {
      this.authorization = this.load('token_type') + ' ' + this.load('access_token');
    } else {
      this.authorization = null;
    }
  }

  getAuthorization() {
    return this.authorization;
  }

  logout() {
    this.clearStorage();
  }

  clearStorage() {
    this.data = null;
    let self = this;
    this.props.forEach(function(name) {
      self.save(sessionStorage, name, null);
      self.save(localStorage, name, null);
    });
  }

  save(storage, name, value) {
    try {
      let key = this.propsPrefix + name;
      if (value == null) value = '';
      storage[key] = value;
    } catch (err) {
      console.log('Cannot access local/session storage: ', err);
    }
  }

  load(name) {
    let key = this.propsPrefix + name;
    return localStorage[key] || sessionStorage[key] || null;
  }
}