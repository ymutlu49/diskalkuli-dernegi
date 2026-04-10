/**
 * Application orchestrator.
 *
 * `App` wires together the core singletons (Store, EventBus, Router),
 * instantiates all services and screens, and kicks off the initial
 * render. It's the only place in the codebase that knows about *every*
 * screen — everything else talks through the bus / store / router.
 *
 * Lifecycle:
 *   1. new App({ screens: [...], services: {...} })
 *   2. app.bootstrap()   ← called from main.js after DOMContentLoaded
 *   3. Router navigates to "splash"
 */
import { Store }    from './Store.js';
import { EventBus } from './EventBus.js';
import { Router }   from './Router.js';

export class App {
  /**
   * @param {object} opts
   * @param {Array<[string, typeof import('./BaseScreen.js').BaseScreen]>} opts.screenDefs
   *        Array of [id, ScreenClass] pairs.
   * @param {object} opts.services  Already-constructed service instances.
   */
  constructor({ screenDefs, services }) {
    this.store    = new Store({ currentUser: null, currentScreen: null });
    this.bus      = new EventBus();
    this.services = services;

    /** @type {Map<string, object>} */
    this.screens = new Map();

    this.router = new Router({
      screens: this.screens,
      store:   this.store,
      bus:     this.bus,
    });

    // Shared context passed to every screen
    this._ctx = {
      store:    this.store,
      bus:      this.bus,
      router:   this.router,
      services: this.services,
    };

    // Instantiate screens now so their `init` can run in bootstrap()
    for (const [id, ScreenClass] of screenDefs) {
      this.screens.set(id, new ScreenClass(id, this._ctx));
    }
  }

  /**
   * Run one-time setup and navigate to the initial screen.
   */
  bootstrap() {
    // Inject all services back-references so they can emit events /
    // read state without circular imports.
    for (const svc of Object.values(this.services)) {
      if (typeof svc.attach === 'function') {
        svc.attach({ store: this.store, bus: this.bus, router: this.router });
      }
    }

    // One-time setup per screen
    for (const screen of this.screens.values()) {
      try { screen.init(); } catch (err) { console.error(`[${screen.id}] init:`, err); }
    }

    // Auth events → wipe history, navigate home / auth
    this.bus.on('auth:login', (user) => {
      this.store.set({ currentUser: user });
      this.router.resetHistory();
      this.router.goTo('home');
    });

    this.bus.on('auth:logout', () => {
      this.store.set({ currentUser: null });
      this.router.resetHistory();
      this.router.goTo('auth');
    });

    // Start on the splash screen — the SplashScreen handles the auto-advance.
    this.router.goTo('splash', { pushHistory: false });
  }
}
