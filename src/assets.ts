// Static assets served for local development
// In production, these would be served from R2

import slidesCSS from '../public/slides.css?raw';
import audienceCSS from '../public/audience.css?raw';
import slidesJS from '../public/slides.js?raw';
import audienceJS from '../public/audience.js?raw';
import adventureJSON from '../public/adventure.json?raw';

export const assets: Record<string, { content: string; contentType: string }> = {
  'slides.css': { content: slidesCSS, contentType: 'text/css' },
  'audience.css': { content: audienceCSS, contentType: 'text/css' },
  'slides.js': { content: slidesJS, contentType: 'application/javascript' },
  'audience.js': { content: audienceJS, contentType: 'application/javascript' },
  'adventure.json': { content: adventureJSON, contentType: 'application/json' },
};