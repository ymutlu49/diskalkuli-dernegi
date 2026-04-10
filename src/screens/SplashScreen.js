import { BaseScreen } from '../core/BaseScreen.js';

/**
 * Splash screen — shown once at app start. Clicking/tapping or
 * pressing Enter / Space on the logo takes the user to login.
 */
export class SplashScreen extends BaseScreen {
  init() {
    const logo = document.getElementById('splash-logo');
    if (!logo) return;

    const advance = () => this.ctx.router.goTo('login');

    logo.addEventListener('click', advance);
    logo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    });
    logo.style.cursor = 'pointer';
  }
}
