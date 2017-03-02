import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { LoginService } from '../login.service';
import { UserInfo } from '../oauth2/user-info';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  userInfo: UserInfo;
  sub: Subscription;

  constructor(private loginService: LoginService) { }

  ngOnInit() {
    if (this.loginService.userInfo) {
      this.sub = this.loginService.userInfo.subscribe(res => this.userInfo = res);
    }

    window.location.hash = '';
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

}
