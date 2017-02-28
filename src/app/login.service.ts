import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { AuthResponse } from './oauth2/auth-response';
import { Observable } from 'rxjs/Observable';
import { UserInfo } from './oauth2/user-info';
import { OpenIDConfiguration } from './oauth2/openid-configuration';

const STATE_STORAGE_KEY = 'oauth2state';
const SESSION_STORAGE_KEY = 'oauth2session';

@Injectable()
export class LoginService {
  private storage = sessionStorage;
  session: AuthResponse;
  userInfo: Observable<UserInfo>;
  openIDConfiguration: Observable<OpenIDConfiguration>;
  baseUrl = 'http://openam.example.com/openam';
  clientId = 'demoapp';

  constructor(private http: Http) {
    const session = this.storage.getItem(SESSION_STORAGE_KEY);

    this.openIDConfiguration = this.getOpenIDConfiguration();

    if (session) {
      this.session = <AuthResponse>JSON.parse(session);
      this.userInfo = this.getUserInfo();

      this.getUserInfo().toPromise().catch(err => {
        console.error(err);
        // the access_token is most likely invalid
        this.destroySession();
      });
    }
  }

  /**
   * Generates a random number used as the state
   * @return {string}
   */
  private generateNonce(): string {
    const arr = new Uint32Array(3);
    crypto.getRandomValues(arr);
    return arr.join('');
  }

  /**
   * Parses the params from the URL that were set by the auth server
   * @param path
   * @return {AuthResponse}
   */
  private parseParams(path: string): AuthResponse {
    return <AuthResponse> path.split('&').map(param => param.split('=')).reduce((params, param) => {
      params[param[0]] = decodeURIComponent(decodeURIComponent(param[1]));
      return params;
    }, {});
  }

  /**
   * Gets the OpenID config from the well known URL
   * @return {Observable<R>}
   */
  private getOpenIDConfiguration(): Observable<OpenIDConfiguration> {
    return this.http.get(`${this.baseUrl}/oauth2/.well-known/openid-configuration`)
      .mergeMap(res => Observable.of(res.json()));
  }

  /**
   * Composes the redirect URL for authorization
   * @param state
   * @return {string}
   */
  private getAuthorizationRequestUrl(state: string): Observable<string> {
    return this.openIDConfiguration.mergeMap(config => Observable.of(config.authorization_endpoint +
      '?response_type=' + encodeURI('id_token token') +
      '&client_id=' + this.clientId +
      '&scope=' + encodeURI('openid profile email address phone') +
      '&redirect_uri=' + window.location.origin +
      '&state=' + state +
      '&nonce=' + this.generateNonce()));
  }

  /**
   * Sends the browser to a new URL
   * @param url
   */
  private redirect(url: string) {
    window.location.href = url;
  }

  /**
   * Removes the session from memory & session storage
   */
  private destroySession() {
    this.storage.removeItem(SESSION_STORAGE_KEY);
    this.storage.removeItem(STATE_STORAGE_KEY);
    this.session = null;
  }

  /**
   * Stores the state and redirects to authorize
   */
  authorize() {
    const state = this.generateNonce();
    this.storage.setItem(STATE_STORAGE_KEY, state);
    this.getAuthorizationRequestUrl(state).subscribe(url => this.redirect(url));
  }

  /**
   * Parses the response params and sets the session if there was no error
   */
  processHash() {
    const hash = window.location.hash.substr(1);

    if (!hash) {
      return;
    }

    const state = this.storage.getItem(STATE_STORAGE_KEY);
    const parsedResponse: AuthResponse = this.parseParams(hash);

    if (parsedResponse.error) {
      throw new Error(parsedResponse.error_description);
    }

    if (parsedResponse.state !== state) {
      throw new Error('Invalid state: ' + parsedResponse.state);
    }

    this.session = parsedResponse;
    this.userInfo = this.getUserInfo();

    this.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsedResponse));
  }

  /**
   * Gets the OpenID user info
   * @return {Observable<R>}
   */
  getUserInfo(): Observable<UserInfo> {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.session.access_token}`);
    return this.openIDConfiguration
      .mergeMap(config => this.http.get(config.userinfo_endpoint, { headers: headers }))
      .mergeMap(res => Observable.of(res.json()));
  }

  /**
   * Performs OIDC single logout and destroys the local session
   */
  logout() {
    const id_token = this.session.id_token;
    this.destroySession();
    this.openIDConfiguration.subscribe(config => {
      this.redirect(
        config.end_session_endpoint +
        '?redirect_uri=' + window.location.origin +
        '&id_token_hint=' + id_token
      );
    });
  }

}
