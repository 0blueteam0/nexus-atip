/**
 * Sprites - Pixel Art Sprite Definitions (ESM Module)
 *
 * All sprites are 2D arrays of hex color values.
 * 0 = transparent, other values = RGBA hex (0xRRGGBBAA).
 *
 * Agent sprites: 16x16
 * MCP building sprites: 16x16
 * Sub-agent sprites: 10x10
 */

import { Texture } from 'pixi.js';

// Color palette - retro terminal theme
export const PALETTE = {
  transparent: 0,
  black: 0x000000FF,
  darkBg: 0x0F0F1AFF,
  panelBg: 0x16162AFF,
  border: 0x2A2A4AFF,

  // Greens (active, success)
  greenBright: 0x00FF88FF,
  greenMid: 0x00CC66FF,
  greenDim: 0x00AA55FF,
  greenDark: 0x006633FF,

  // Blues (infrastructure)
  blueBright: 0x4488FFFF,
  blueMid: 0x3366CCFF,
  blueDim: 0x224488FF,
  blueDark: 0x112244FF,

  // Purples (thinking)
  purpleBright: 0xCC88FFFF,
  purpleMid: 0x9966CCFF,
  purpleDim: 0x664488FF,

  // Yellows (searching, warning)
  yellowBright: 0xFFCC44FF,
  yellowMid: 0xCCAA33FF,
  yellowDim: 0x887722FF,

  // Reds (error)
  redBright: 0xFF4444FF,
  redMid: 0xCC3333FF,
  redDim: 0x882222FF,

  // Cyans (testing)
  cyanBright: 0x44CCCCFF,
  cyanMid: 0x339999FF,
  cyanDim: 0x226666FF,
  cyanDark: 0x114444FF,

  // Oranges (recovering, warning accent)
  orangeBright: 0xFFAA44FF,
  orangeMid: 0xCC8833FF,
  orangeDim: 0x886622FF,

  // Grays (expanded for HeartGold shading)
  white: 0xCCCCEEFF,
  whiteBright: 0xEEEEFFFF,
  grayLight: 0x8888AAFF,
  grayMid: 0x555577FF,
  grayDark: 0x333355FF,
  grayVDark: 0x222244FF,

  // Highlight tones (specular/rim light)
  greenHL: 0x66FFBBFF,
  blueHL: 0x88BBFFFF,
  purpleHL: 0xDDBBFFFF,
  yellowHL: 0xFFDD88FF,
  redHL: 0xFF8888FF,
  cyanHL: 0x88EEEEFF,

  // Skin/body
  skin: 0xFFCC99FF,
  skinDark: 0xDD9966FF,

  // Docker blue
  dockerBlue: 0x0DB7EDFF,
  dockerDark: 0x0A8ABAFF
};

const P = PALETTE;

// ========== AGENT SPRITES (16x16) ==========

const AGENT_IDLE = [
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.black,P.greenBright,P.black,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueBright,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,P.greenDim,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.greenDim,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_THINKING = [
  [0,0,0,0,0,0,P.purpleDim,P.purpleDim,P.purpleDim,P.purpleDim,0,0,0,P.purpleBright,0,0],
  [0,0,0,0,0,P.purpleDim,P.purpleMid,P.purpleMid,P.purpleMid,P.purpleMid,P.purpleDim,0,P.purpleBright,0,P.purpleBright,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,0,P.purpleBright,0,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.black,P.purpleBright,P.black,P.purpleMid,P.purpleDim,0,0,0,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0,0],
  [0,0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.purpleDim,P.purpleDim,P.purpleDim,P.purpleDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueBright,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,P.purpleDim,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.purpleDim,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_CODING = [
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.black,P.greenBright,P.black,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,P.greenDim,P.blueDim,P.blueMid,P.blueMid,P.blueBright,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,P.greenDim,P.greenMid,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.greenMid,P.greenDim,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,P.greenDim,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_SEARCHING = [
  [0,0,0,0,0,0,P.yellowDim,P.yellowDim,P.yellowDim,P.yellowDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.yellowDim,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowDim,0,0,0,0,0],
  [0,0,0,0,P.yellowDim,P.yellowMid,P.yellowBright,P.yellowBright,P.yellowBright,P.yellowBright,P.yellowMid,P.yellowDim,0,0,0,0],
  [0,0,0,0,P.yellowDim,P.yellowMid,P.yellowBright,P.black,P.yellowBright,P.black,P.yellowMid,P.yellowDim,0,0,0,0],
  [0,0,0,0,P.yellowDim,P.yellowMid,P.yellowBright,P.yellowBright,P.yellowBright,P.yellowBright,P.yellowMid,P.yellowDim,0,0,0,0],
  [0,0,0,0,0,P.yellowDim,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.yellowDim,P.yellowDim,P.yellowDim,P.yellowDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueBright,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,P.yellowBright,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.yellowMid,P.yellowBright,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,P.yellowDim,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_ERROR = [
  [0,0,0,0,0,0,P.redDim,P.redDim,P.redDim,P.redDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.redDim,P.redMid,P.redMid,P.redMid,P.redMid,P.redDim,0,0,0,0,0],
  [0,0,0,0,P.redDim,P.redMid,P.redBright,P.redBright,P.redBright,P.redBright,P.redMid,P.redDim,0,0,0,0],
  [0,0,0,0,P.redDim,P.redMid,P.redBright,P.black,P.redBright,P.black,P.redMid,P.redDim,0,0,0,0],
  [0,0,0,0,P.redDim,P.redMid,P.redBright,P.redBright,P.redBright,P.redBright,P.redMid,P.redDim,0,0,0,0],
  [0,0,0,0,0,P.redDim,P.redMid,P.redBright,P.redBright,P.redMid,P.redDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.redDim,P.redDim,P.redDim,P.redDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueBright,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== AGENT TESTING (16x16) - Cyan with terminal screen ==========

const AGENT_TESTING = [
  [0,0,0,0,0,0,P.cyanDim,P.cyanDim,P.cyanDim,P.cyanDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanDim,0,0,0,0,0],
  [0,0,0,0,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanBright,P.cyanBright,P.cyanBright,P.cyanMid,P.cyanDim,0,0,0,0],
  [0,0,0,0,P.cyanDim,P.cyanMid,P.cyanBright,P.black,P.cyanBright,P.black,P.cyanMid,P.cyanDim,0,0,0,0],
  [0,0,0,0,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanHL,P.cyanHL,P.cyanBright,P.cyanMid,P.cyanDim,0,0,0,0],
  [0,0,0,0,0,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.cyanDim,P.cyanDim,P.cyanDim,P.cyanDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueHL,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.cyanBright,P.cyanMid,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.cyanMid,P.greenBright,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,P.cyanDim,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== ANIMATION FRAME VARIANTS ==========

const AGENT_IDLE_F2 = [
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenHL,P.greenBright,P.greenBright,P.greenHL,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.black,P.greenBright,P.black,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueHL,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,P.greenDim,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,P.greenDim,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_THINKING_F2 = [
  [0,0,0,0,0,0,P.purpleDim,P.purpleDim,P.purpleDim,P.purpleDim,0,0,P.purpleBright,0,0,0],
  [0,0,0,0,0,P.purpleDim,P.purpleMid,P.purpleMid,P.purpleMid,P.purpleMid,P.purpleDim,0,0,P.purpleBright,0,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleHL,P.purpleBright,P.purpleBright,P.purpleHL,P.purpleMid,P.purpleDim,0,0,P.purpleBright,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.black,P.purpleBright,P.black,P.purpleMid,P.purpleDim,0,0,0,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0,0],
  [0,0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.purpleDim,P.purpleDim,P.purpleDim,P.purpleDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueHL,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,P.purpleDim,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.purpleDim,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_CODING_F2 = [
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenHL,P.greenBright,P.greenBright,P.greenHL,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.black,P.greenBright,P.black,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,P.greenDim,P.greenMid,P.greenBright,P.greenBright,P.greenBright,P.greenBright,P.greenMid,P.greenDim,0,0,0,0],
  [0,0,0,0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueHL,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.greenDim,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.greenMid,P.greenDim,0,0],
  [0,0,P.greenDim,P.greenMid,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,P.greenDim,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_TESTING_F2 = [
  [0,0,0,0,0,0,P.cyanDim,P.cyanDim,P.cyanDim,P.cyanDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanDim,0,0,0,0,0],
  [0,0,0,0,P.cyanDim,P.cyanMid,P.cyanHL,P.cyanBright,P.cyanBright,P.cyanHL,P.cyanMid,P.cyanDim,0,0,0,0],
  [0,0,0,0,P.cyanDim,P.cyanMid,P.cyanBright,P.black,P.cyanBright,P.black,P.cyanMid,P.cyanDim,0,0,0,0],
  [0,0,0,0,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanBright,P.cyanBright,P.cyanBright,P.cyanMid,P.cyanDim,0,0,0,0],
  [0,0,0,0,0,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanMid,P.cyanDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.cyanDim,P.cyanDim,P.cyanDim,P.cyanDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueHL,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,P.cyanBright,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.cyanMid,P.cyanBright,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,P.cyanDim,0,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const AGENT_SEARCHING_F2 = [
  [0,0,0,0,0,0,P.yellowDim,P.yellowDim,P.yellowDim,P.yellowDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.yellowDim,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowDim,0,0,0,0,0],
  [0,0,0,0,P.yellowDim,P.yellowMid,P.yellowHL,P.yellowBright,P.yellowBright,P.yellowHL,P.yellowMid,P.yellowDim,0,0,0,0],
  [0,0,0,0,P.yellowDim,P.yellowMid,P.yellowBright,P.black,P.yellowBright,P.black,P.yellowMid,P.yellowDim,0,0,0,0],
  [0,0,0,0,P.yellowDim,P.yellowMid,P.yellowBright,P.yellowBright,P.yellowBright,P.yellowBright,P.yellowMid,P.yellowDim,0,0,0,0],
  [0,0,0,0,0,P.yellowDim,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowMid,P.yellowDim,0,0,0,0,0],
  [0,0,0,0,0,0,P.yellowDim,P.yellowDim,P.yellowDim,P.yellowDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueHL,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,P.yellowBright,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,P.yellowMid,P.yellowBright,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0,0,P.yellowDim,0],
  [0,0,0,0,0,0,P.blueDim,0,0,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,0,0,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== ANIMATION SYSTEM ==========

export const ANIM_FRAMES = {
  idle:      [AGENT_IDLE, AGENT_IDLE_F2],
  thinking:  [AGENT_THINKING, AGENT_THINKING_F2],
  coding:    [AGENT_CODING, AGENT_CODING_F2],
  searching: [AGENT_SEARCHING, AGENT_SEARCHING_F2],
  testing:   [AGENT_TESTING, AGENT_TESTING_F2],
  waiting:   [AGENT_IDLE, AGENT_IDLE_F2],
  error:     [AGENT_ERROR, AGENT_ERROR]
};

export const ANIM_SPEEDS = {
  idle: 40,
  thinking: 25,
  coding: 12,
  searching: 20,
  testing: 18,
  waiting: 50,
  error: 30
};

let animFrameCounter = 0;

export function tickAnimation() {
  animFrameCounter++;
}

export function getAnimFrame(state) {
  const frames = ANIM_FRAMES[state] || ANIM_FRAMES.idle;
  const speed = ANIM_SPEEDS[state] || 30;
  const idx = Math.floor(animFrameCounter / speed) % frames.length;
  return frames[idx];
}

// ========== MCP BUILDING SPRITES (16x16) ==========

const MCP_BUILDING_ACTIVE = [
  [0,0,0,0,0,P.greenBright,P.greenHL,P.greenBright,P.greenBright,P.greenHL,P.greenBright,0,0,0,0,0],
  [0,0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayMid,P.grayMid,P.grayLight,P.grayMid,P.grayDark,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayLight,P.grayLight,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.greenMid,P.greenDim,P.greenDark,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.greenDark,P.greenDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.greenDim,P.greenDim,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const MCP_BUILDING_INACTIVE = [
  // Row 0: roof peak (dim ridge line)
  [0,0,0,0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0,0,0,0],
  // Row 1: roof slope
  [0,0,0,0,P.grayVDark,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayMid,P.grayDark,P.grayVDark,0,0,0,0],
  // Row 2: roof base with eave highlight
  [0,0,0,P.grayVDark,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayMid,P.grayDark,P.grayVDark,0,0,0],
  // Row 3: upper windows (dim, powered off)
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.blueDark,P.blueDim,P.grayDark,P.grayDark,P.blueDark,P.blueDim,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 4: upper windows bottom
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.blueDim,P.blueDark,P.grayDark,P.grayDark,P.blueDim,P.blueDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 5: wall detail
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 6: vent / horizontal trim
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayVDark,P.grayMid,P.grayVDark,P.grayVDark,P.grayMid,P.grayVDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 7: mid wall
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 8: lower windows (dim)
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.blueDark,P.blueDim,P.grayDark,P.grayDark,P.blueDark,P.blueDim,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 9: lower windows bottom
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.blueDim,P.blueDark,P.grayDark,P.grayDark,P.blueDim,P.blueDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 10: wall
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 11: door frame
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 12: door
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 13: foundation (darkest)
  [0,0,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,0,0],
  // Row 14: ground shadow
  [0,0,0,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== INACTIVE VARIANT GENERATOR ==========

function createInactiveVariant(sprite) {
  const dimMap = new Map([
    [P.greenBright, P.blueDim], [P.greenHL, P.blueDim], [P.greenMid, P.blueDark],
    [P.greenDim, P.grayVDark], [P.greenDark, P.grayVDark],
    [P.blueBright, P.blueDim], [P.blueHL, P.blueDim], [P.blueMid, P.blueDark],
    [P.blueDim, P.grayVDark], [P.blueDark, P.grayVDark],
    [P.purpleBright, P.blueDim], [P.purpleHL, P.blueDim], [P.purpleMid, P.blueDark],
    [P.purpleDim, P.grayVDark],
    [P.cyanBright, P.blueDim], [P.cyanHL, P.blueDim], [P.cyanMid, P.blueDark],
    [P.cyanDim, P.grayVDark], [P.cyanDark, P.grayVDark],
    [P.yellowBright, P.grayMid], [P.yellowHL, P.grayMid], [P.yellowMid, P.grayDark],
    [P.yellowDim, P.grayVDark],
    [P.orangeBright, P.grayMid], [P.orangeMid, P.grayDark], [P.orangeDim, P.grayVDark],
    [P.redBright, P.grayMid], [P.redHL, P.grayMid], [P.redMid, P.grayDark],
    [P.redDim, P.grayVDark],
    [P.white, P.grayMid], [P.whiteBright, P.grayLight],
    [P.grayLight, P.grayMid], [P.grayMid, P.grayDark],
    [P.dockerBlue, P.blueDim], [P.dockerDark, P.blueDark],
    [P.black, P.black],
  ]);
  return sprite.map(row => row.map(px => px === 0 ? 0 : (dimMap.get(px) || P.grayVDark)));
}

// ========== CATEGORY MCP BUILDING SPRITES (16x16) ==========
// Each category gets a unique building shape + color theme (HeartGold NDS style)

// --- FILE/CODE: Green server rack with blinking LEDs ---
const MCP_FILE_ACTIVE = [
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDim,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.greenBright,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDark,P.greenDim,P.greenHL,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenHL,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDim,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.greenBright,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDim,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.greenBright,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDark,P.greenDim,P.greenHL,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenHL,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- WEB: Blue radio/antenna tower ---
const MCP_WEB_ACTIVE = [
  [0,0,0,0,0,0,0,P.blueHL,P.blueBright,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueBright,P.blueHL,P.blueBright,P.blueBright,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,P.blueMid,P.blueMid,0,0,0,0,0,0,0],
  [0,0,0,0,0,P.blueDim,P.blueMid,P.blueBright,P.blueMid,P.blueDim,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.blueMid,P.grayMid,P.blueMid,0,0,0,0,0,0,0],
  [0,0,0,0,P.blueDim,P.blueMid,P.grayDark,P.grayMid,P.grayDark,P.blueMid,P.blueDim,0,0,0,0,0],
  [0,0,0,0,0,P.blueMid,P.grayDark,P.grayMid,P.grayDark,P.blueMid,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,P.grayMid,P.grayDark,0,0,0,0,0,0,0],
  [0,0,0,P.blueDim,P.blueMid,P.blueBright,P.grayDark,P.grayLight,P.grayDark,P.blueBright,P.blueMid,P.blueDim,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,P.grayMid,P.grayDark,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.grayDark,P.grayMid,P.grayDark,0,0,0,0,0,0,0],
  [0,0,0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayMid,P.grayDark,0,0,0,0,0,0],
  [0,0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- RESEARCH: Purple observatory dome ---
const MCP_RESEARCH_ACTIVE = [
  [0,0,0,0,0,0,P.purpleDim,P.purpleMid,P.purpleMid,P.purpleDim,0,0,0,0,0,0],
  [0,0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0,0,0],
  [0,0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleHL,P.purpleHL,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0,0],
  [0,0,0,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleHL,P.whiteBright,P.white,P.purpleHL,P.purpleBright,P.purpleMid,P.purpleDim,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayLight,P.grayLight,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.purpleDim,P.purpleMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.purpleDim,P.purpleMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.purpleDim,P.purpleMid,P.purpleBright,P.purpleBright,P.purpleMid,P.purpleDim,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.purpleDim,P.purpleMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.purpleDim,P.purpleMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.grayMid,P.purpleDim,P.purpleDim,P.grayMid,P.grayDark,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- AI/LLM: Cyan crystal tower with energy core ---
const MCP_AI_ACTIVE = [
  [0,0,0,0,0,0,0,P.cyanHL,P.cyanHL,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,P.cyanBright,P.cyanHL,P.cyanHL,P.cyanBright,0,0,0,0,0,0],
  [0,0,0,0,0,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanBright,P.cyanMid,P.cyanDim,0,0,0,0,0],
  [0,0,0,0,P.grayDark,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanBright,P.cyanMid,P.cyanDim,P.grayDark,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanDim,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.cyanDark,P.cyanDim,P.cyanHL,P.cyanHL,P.cyanDim,P.cyanDark,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanBright,P.cyanMid,P.cyanDim,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.cyanDim,P.whiteBright,P.whiteBright,P.cyanDim,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.cyanDim,P.cyanMid,P.cyanBright,P.cyanBright,P.cyanMid,P.cyanDim,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.cyanDark,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanDim,P.cyanDark,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.cyanDim,P.cyanMid,P.cyanMid,P.cyanDim,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.cyanDim,P.cyanDim,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- DB: Orange data vault with heavy door ---
const MCP_DB_ACTIVE = [
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.orangeDim,P.orangeMid,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeMid,P.orangeDim,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.orangeMid,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.orangeDim,P.orangeMid,P.grayMid,P.grayMid,P.orangeDim,P.orangeMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.orangeDim,P.orangeMid,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeBright,P.orangeMid,P.orangeDim,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.orangeDim,P.orangeDim,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.orangeDim,P.orangeMid,P.orangeMid,P.orangeDim,P.grayDark,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.orangeDim,P.orangeBright,P.orangeBright,P.orangeDim,P.grayDark,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.orangeDim,P.orangeMid,P.orangeMid,P.orangeDim,P.grayDark,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- TASK: Yellow clipboard/task board ---
const MCP_TASK_ACTIVE = [
  [0,0,0,0,0,P.yellowDim,P.yellowMid,P.yellowBright,P.yellowBright,P.yellowMid,P.yellowDim,0,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.yellowDim,P.yellowMid,P.yellowBright,P.yellowBright,P.yellowMid,P.yellowDim,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.yellowDim,P.yellowMid,P.yellowHL,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.yellowDim,P.yellowMid,P.yellowBright,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.yellowDim,P.yellowMid,P.yellowHL,P.yellowHL,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.yellowDim,P.yellowMid,P.yellowBright,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- MEDIA: Red studio monitor/camera ---
const MCP_MEDIA_ACTIVE = [
  [0,0,0,0,0,P.redDim,P.redMid,P.redBright,P.redBright,P.redMid,P.redDim,0,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.redDim,P.redMid,P.redBright,P.redBright,P.redMid,P.redDim,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.redMid,P.redBright,P.redHL,P.redHL,P.redBright,P.redMid,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.redDim,P.redMid,P.redBright,P.redBright,P.redMid,P.redDim,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayLight,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.redDim,P.redMid,P.grayMid,P.grayMid,P.redDim,P.redMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,0,0,P.grayDark,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,P.grayDark,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- MISC: Gray-green generic utility building ---
const MCP_MISC_ACTIVE = [
  [0,0,0,0,0,P.greenBright,P.greenHL,P.greenBright,P.greenBright,P.greenHL,P.greenBright,0,0,0,0,0],
  [0,0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayMid,P.grayMid,P.grayLight,P.grayMid,P.grayDark,0,0,0,0],
  [0,0,0,P.grayDark,P.grayMid,P.grayLight,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayLight,P.grayMid,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.greenMid,P.greenBright,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayLight,P.grayLight,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.greenMid,P.greenDim,P.greenDark,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.grayMid,P.grayMid,P.greenDark,P.greenDim,P.greenMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.greenDark,P.greenDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayDark,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.greenDim,P.greenDim,P.grayMid,P.grayMid,P.grayMid,P.grayMid,P.grayDark,0,0],
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- Generate inactive variants for all categories ---
const MCP_FILE_INACTIVE = createInactiveVariant(MCP_FILE_ACTIVE);
const MCP_WEB_INACTIVE = createInactiveVariant(MCP_WEB_ACTIVE);
const MCP_RESEARCH_INACTIVE = createInactiveVariant(MCP_RESEARCH_ACTIVE);
const MCP_AI_INACTIVE = createInactiveVariant(MCP_AI_ACTIVE);
const MCP_DB_INACTIVE = createInactiveVariant(MCP_DB_ACTIVE);
const MCP_TASK_INACTIVE = createInactiveVariant(MCP_TASK_ACTIVE);
const MCP_MEDIA_INACTIVE = createInactiveVariant(MCP_MEDIA_ACTIVE);
const MCP_MISC_INACTIVE = createInactiveVariant(MCP_MISC_ACTIVE);

// ========== DOCKER CONTAINER SPRITE (16x16) ==========

const DOCKER_RUNNING = [
  // Row 0: crane arm / stack vent
  [0,0,0,0,0,0,0,P.grayDark,P.grayMid,0,0,0,0,0,0,0],
  // Row 1: container top edge with highlight
  [0,0,0,0,P.dockerDark,P.dockerBlue,P.blueHL,P.dockerBlue,P.dockerBlue,P.blueHL,P.dockerBlue,P.dockerDark,0,0,0,0],
  // Row 2: container top
  [0,0,0,P.dockerDark,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerDark,0,0,0],
  // Row 3: cargo row 1 (white blocks = containers)
  [0,0,P.dockerDark,P.dockerBlue,P.dockerBlue,P.white,P.white,P.dockerBlue,P.white,P.white,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerDark,0,0],
  // Row 4: cargo row 1 bottom
  [0,0,P.dockerDark,P.dockerBlue,P.dockerBlue,P.white,P.whiteBright,P.dockerBlue,P.white,P.whiteBright,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerDark,0,0],
  // Row 5: divider
  [0,0,P.dockerDark,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerDark,0,0],
  // Row 6: cargo row 2
  [0,0,P.dockerDark,P.dockerBlue,P.white,P.white,P.dockerBlue,P.white,P.white,P.dockerBlue,P.white,P.white,P.dockerBlue,P.dockerDark,0,0],
  // Row 7: cargo row 2 bottom
  [0,0,P.dockerDark,P.dockerBlue,P.white,P.whiteBright,P.dockerBlue,P.white,P.whiteBright,P.dockerBlue,P.white,P.whiteBright,P.dockerBlue,P.dockerDark,0,0],
  // Row 8: status bar with green LEDs
  [0,0,P.dockerDark,P.dockerBlue,P.dockerBlue,P.greenBright,P.dockerBlue,P.greenBright,P.dockerBlue,P.greenBright,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerDark,0,0],
  // Row 9: container bottom
  [0,0,P.dockerDark,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerBlue,P.dockerDark,0,0],
  // Row 10: container base frame
  [0,0,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,P.dockerDark,0,0],
  // Row 11: support legs
  [0,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0,0],
  // Row 12: ground plate
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayVDark,P.grayVDark,P.grayDark,P.grayDark,P.grayVDark,P.grayVDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 13: ground shadow
  [0,0,0,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== DOCKER STOPPED SPRITE (16x16) ==========

const DOCKER_STOPPED = [
  // Row 0: no crane activity
  [0,0,0,0,0,0,0,P.grayVDark,P.grayDark,0,0,0,0,0,0,0],
  // Row 1: container top edge (desaturated)
  [0,0,0,0,P.grayVDark,P.grayDark,P.grayMid,P.grayDark,P.grayDark,P.grayMid,P.grayDark,P.grayVDark,0,0,0,0],
  // Row 2: container top
  [0,0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0,0],
  // Row 3: cargo row 1 (dim blocks)
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 4: cargo row 1 bottom
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayMid,P.grayLight,P.grayDark,P.grayMid,P.grayLight,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 5: divider
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 6: cargo row 2 (dim blocks)
  [0,0,P.grayVDark,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.grayMid,P.grayMid,P.grayDark,P.grayVDark,0,0],
  // Row 7: cargo row 2 bottom
  [0,0,P.grayVDark,P.grayDark,P.grayMid,P.grayLight,P.grayDark,P.grayMid,P.grayLight,P.grayDark,P.grayMid,P.grayLight,P.grayDark,P.grayVDark,0,0],
  // Row 8: status bar with red LEDs (stopped)
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.redDim,P.grayDark,P.redDim,P.grayDark,P.redDim,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 9: container bottom
  [0,0,P.grayVDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayDark,P.grayVDark,0,0],
  // Row 10: container base frame
  [0,0,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,0,0],
  // Row 11: support legs
  [0,0,0,P.grayVDark,P.grayVDark,0,0,P.grayVDark,P.grayVDark,0,0,P.grayVDark,P.grayVDark,0,0,0],
  // Row 12: ground plate
  [0,0,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,0,0],
  // Row 13: ground shadow
  [0,0,0,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,P.grayVDark,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== SUB-AGENT SPRITES (10x10) ==========

const SUBAGENT_ACTIVE = [
  [0,0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0,0],
  [0,0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0,0],
  [0,P.greenDim,P.greenMid,P.black,P.greenMid,P.greenMid,P.black,P.greenMid,P.greenDim,0],
  [0,P.greenDim,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenMid,P.greenDim,0],
  [0,0,P.greenDim,P.greenDim,P.greenDim,P.greenDim,P.greenDim,P.greenDim,0,0],
  [0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0],
  [0,P.greenDim,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,P.greenDim,0],
  [0,0,P.blueDim,P.blueMid,P.blueMid,P.blueMid,P.blueMid,P.blueDim,0,0],
  [0,0,0,P.grayDark,0,0,P.grayDark,0,0,0],
  [0,0,P.grayDark,P.grayDark,0,0,P.grayDark,P.grayDark,0,0]
];

// ========== SPRITE REGISTRY ==========

export const SPRITES = {
  agent: {
    idle: AGENT_IDLE,
    thinking: AGENT_THINKING,
    coding: AGENT_CODING,
    searching: AGENT_SEARCHING,
    testing: AGENT_TESTING,
    waiting: AGENT_IDLE,
    error: AGENT_ERROR
  },
  mcp: {
    file:     { active: MCP_FILE_ACTIVE,     inactive: MCP_FILE_INACTIVE },
    web:      { active: MCP_WEB_ACTIVE,      inactive: MCP_WEB_INACTIVE },
    research: { active: MCP_RESEARCH_ACTIVE, inactive: MCP_RESEARCH_INACTIVE },
    ai:       { active: MCP_AI_ACTIVE,       inactive: MCP_AI_INACTIVE },
    db:       { active: MCP_DB_ACTIVE,       inactive: MCP_DB_INACTIVE },
    task:     { active: MCP_TASK_ACTIVE,      inactive: MCP_TASK_INACTIVE },
    media:    { active: MCP_MEDIA_ACTIVE,    inactive: MCP_MEDIA_INACTIVE },
    misc:     { active: MCP_MISC_ACTIVE,     inactive: MCP_MISC_INACTIVE }
  },
  docker: {
    running: DOCKER_RUNNING,
    stopped: DOCKER_STOPPED
  },
  subagent: {
    active: SUBAGENT_ACTIVE
  }
};

// ========== PIXI.JS TEXTURE FACTORY ==========

/**
 * Convert a 2D pixel array to a PixiJS Texture.
 * Color format: 0xRRGGBBAA
 */
export function pixelArrayToTexture(pixelArray, scale = 1) {
  const h = pixelArray.length;
  const w = pixelArray[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const color = pixelArray[row][col];
      if (color === 0) continue;

      const r = (color >> 24) & 0xFF;
      const g = (color >> 16) & 0xFF;
      const b = (color >> 8) & 0xFF;
      const a = (color & 0xFF) / 255;

      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(col * scale, row * scale, scale, scale);
    }
  }

  const texture = Texture.from(canvas);
  texture.source.scaleMode = 'nearest';
  return texture;
}

/**
 * Create all sprite textures at the given scale.
 * Returns a nested object matching SPRITES structure but with Textures.
 */
export function createAllTextures(scale = 2) {
  const textures = {
    agent: {},
    mcp: {},
    docker: {},
    subagent: {}
  };

  // Agent state textures (frame 1 only - animation handled by getAnimTexture)
  for (const [state, sprite] of Object.entries(SPRITES.agent)) {
    textures.agent[state] = pixelArrayToTexture(sprite, scale);
  }

  // Animation frame textures
  textures.animFrames = {};
  for (const [state, frames] of Object.entries(ANIM_FRAMES)) {
    textures.animFrames[state] = frames.map(f => pixelArrayToTexture(f, scale));
  }

  // MCP building textures (per-category)
  for (const [cat, sprites] of Object.entries(SPRITES.mcp)) {
    textures.mcp[cat] = {
      active: pixelArrayToTexture(sprites.active, scale),
      inactive: pixelArrayToTexture(sprites.inactive, scale)
    };
  }

  // Docker textures
  textures.docker.running = pixelArrayToTexture(SPRITES.docker.running, scale);
  textures.docker.stopped = pixelArrayToTexture(SPRITES.docker.stopped, scale);

  // Sub-agent textures
  textures.subagent.active = pixelArrayToTexture(SPRITES.subagent.active, scale);

  return textures;
}

/**
 * Get the current animation texture for a given state and frame count.
 */
export function getAnimTexture(textures, state, frameCount) {
  const frames = textures.animFrames[state] || textures.animFrames.idle;
  const speed = ANIM_SPEEDS[state] || 30;
  const idx = Math.floor(frameCount / speed) % frames.length;
  return frames[idx];
}
