import {
  BOOT_AND_GLOBAL_OVERLAYS_MARKUP,
  CONTRACTOR_VIEW_MARKUP,
  LOGIN_VIEW_MARKUP,
} from './markup/loginAndContractorMarkup';
import { STAFF_VIEW_MARKUP } from './markup/staffPortalMarkup';
import { MODALS_MARKUP } from './markup/modalsMarkup';

export const PLATFORM_MARKUP = `
${BOOT_AND_GLOBAL_OVERLAYS_MARKUP}
  <!-- ==================== MAIN APPLICATION ROOT ==================== -->
  <div id="appRoot" class="min-h-screen flex flex-col">
${LOGIN_VIEW_MARKUP}
${CONTRACTOR_VIEW_MARKUP}
${STAFF_VIEW_MARKUP}
  </div>
${MODALS_MARKUP}
`;
