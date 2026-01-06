import { Routes } from '@angular/router';
import { FamilyList } from './family-list/family-list';
import { MemberList } from './member-list/member-list';

export const routes: Routes = [
  { path: '', component: FamilyList },
  { path: 'members/:familyId', component: MemberList }
];
