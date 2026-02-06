import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappStatus } from './whatsapp-status';

describe('WhatsappStatus', () => {
  let component: WhatsappStatus;
  let fixture: ComponentFixture<WhatsappStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
