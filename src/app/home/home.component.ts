import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoginService } from '../login.service';
import { UserInfo } from '../oauth2/user-info';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  error: string;
  userInfo: UserInfo;
  sub: Subscription;

  constructor(private loginService: LoginService) {
  }

  login() {
    this.loginService.authorize();
  }

  logout() {
    this.userInfo = null;
    this.loginService.logout();
  }

  ngOnInit() {
    try {
      this.loginService.processHash();
    } catch (err) {
      this.error = err;
    }

    if (this.loginService.userInfo) {
      this.sub = this.loginService.userInfo.subscribe(res => this.userInfo = res);
    }

    window.location.hash = '';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}
