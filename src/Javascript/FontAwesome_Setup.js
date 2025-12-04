// fontAwesomeSetup.js
import { library } from '@fortawesome/fontawesome-svg-core';

// Import icons from Font Awesome Pro styles
import {
  faArrowsRotate as faSolidArrowsRotate,
  faLocationMinus as faSolidLocationMinus,
  faCrosshairs as faSolidCrosshairs,
  faWaveTriangle as faSolidWaveTriangle,
  faXmark as faSolidXmark,
  faCalendarDays as faSolidCalendarDays,
  faFileExcel as faSolidFileExcel,
  faFileCsv as faSolidFileCsv,
  faPencil as faSolidPencil,
} from '@fortawesome/pro-solid-svg-icons';

import {
    faCopy as faRegCopy,
} from '@fortawesome/pro-regular-svg-icons';

import {
 faSquarePlus as faLightSquarePlus,
 faSquareMinus as faLightSquareMinus,
 } from '@fortawesome/pro-light-svg-icons';

import {} from '@fortawesome/pro-thin-svg-icons';

import {
faSearch as faSearchDuoTone,
faShip as faShipDuoTone,
faListUl as faListUlDuoTone,
faLayerGroup as faLayerGroupDuoTone,
faCloud as faCloudDuoTone,
faShieldAlt as faShieldAltDuoTone,
faRoute as faRouteDuoTone,
faPencilAlt as faPencilAltDuoTone,
faExclamationTriangle as faExclamationTriangleDuoTone,
faEnvelopeOpenText as faEnvelopeOpenTextDuoTone,
faCalendar as faCalendarDuoTone,
faAnchor as faAnchorDuoTone,
faRuler as faRulerDuoTone,
faCrosshairs as faCrosshairsDuoTone,
faBorderAll as faBorderAllDuoTone,
faCube as faCubeDuoTone,
faDatabase as faDatabaseDuoTone,
faCogs as faCogsDuoTone,
faInfoCircle as faInfoCircleDuoTone,
faSignOutAlt as faSignOutAltDuoTone,
faToolbox as faToolboxDuoTone,
} from '@fortawesome/pro-duotone-svg-icons';

import {
  faArrowsRotate as faSharpSolidArrowsRotate,
  faLocationMinus as faSharpSolidLocationMinus,
  faCrosshairs as faSharpSolidCrosshairs,
  faWaveTriangle as faSharpSolidWaveTriangle,
  faXmark as faSharpSolidXmark,
} from '@fortawesome/sharp-solid-svg-icons';
import {} from '@fortawesome/sharp-regular-svg-icons';
import {} from '@fortawesome/sharp-light-svg-icons';
import {} from '@fortawesome/sharp-thin-svg-icons';

library.add(
  faRegCopy,
  faSolidArrowsRotate,
  faSolidLocationMinus,
  faSolidWaveTriangle,
  faSolidCalendarDays,
  faSolidCrosshairs,
  faSolidFileExcel,
  faSolidFileCsv,
  faSolidXmark,
  faSolidPencil,
  faSharpSolidArrowsRotate,
  faSharpSolidLocationMinus,
  faSharpSolidCrosshairs,
  faSharpSolidWaveTriangle,
  faSharpSolidXmark,
  faLightSquarePlus,
  faLightSquareMinus,
);

export default library;
