import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender   // Home page prerenders
  },
  {
    path: 'members/:familyId',
    renderMode: RenderMode.Server      // Dynamic route = live render
  }
];
