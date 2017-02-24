import { Oauth2appPage } from './app.po';

describe('oauth2app App', () => {
  let page: Oauth2appPage;

  beforeEach(() => {
    page = new Oauth2appPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
