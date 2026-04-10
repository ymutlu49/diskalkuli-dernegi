/**
 * Permission checks for the current session.
 *
 * Wraps the role → permission mapping from data/permissions.js so that
 * screens don't have to know how roles map to modules.
 */
import { PERM_SETS, PERM_LABELS, ALL_PERMS } from '../data/permissions.js';

export class PermissionService {
  constructor() {
    this._store = null;
  }

  attach({ store }) {
    this._store = store;
  }

  /**
   * Does the current user have access to a given module/screen?
   * @param {string} permKey — one of ALL_PERMS
   */
  can(permKey) {
    const user = this._store && this._store.get('currentUser');
    if (!user) return false;
    return Array.isArray(user.perms) && user.perms.includes(permKey);
  }

  /** True when current user is a super-admin (YK / Denetleme). */
  isSuperadmin() {
    const user = this._store && this._store.get('currentUser');
    return !!(user && user.superadmin);
  }

  /** Returns the permission set for a given role key. */
  permsFor(role) {
    return PERM_SETS[role] || [];
  }

  labelFor(permKey) {
    return PERM_LABELS[permKey] || permKey;
  }

  allPerms() {
    return ALL_PERMS.slice();
  }
}
