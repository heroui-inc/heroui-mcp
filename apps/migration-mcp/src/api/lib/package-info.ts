/**
 * Package information loaded from package.json
 */

import packageJson from "../../../package.json";

export const packageInfo = {
  name: packageJson.name,
  version: packageJson.version,
};
