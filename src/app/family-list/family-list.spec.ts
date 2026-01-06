import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FamilyList } from './family-list';

describe('FamilyList', () => {
  let component: FamilyList;
  let fixture: ComponentFixture<FamilyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FamilyList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
