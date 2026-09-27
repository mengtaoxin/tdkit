import { defineConfig } from 'oxlint';
import react from '@mengtaoxin/oxc-config/react';

export default defineConfig({
  extends: [react],
  // Empty array = do not re-add default plugins on top of the preset.
  plugins: [],
});
