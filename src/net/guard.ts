
import * as url from 'url';

export class NetworkGuard {
  constructor(private localOnly: boolean) {}

  ensureLocal(target: string) {
    if (!this.localOnly) return;
    const u = new url.URL(target);
    const host = u.hostname;
    if (!(host === '127.0.0.1' || host === 'localhost' || host === '::1')) {
      // Import ExtensionName from extension
      // (Import at top if not present)
      // Use ExtensionName in error message
      // Note: If import causes circular dependency, fallback to string
      throw new Error(`${require('../extension').ExtensionName} network guard: blocked non-localhost request to ${target}`);
    }
  }
}
