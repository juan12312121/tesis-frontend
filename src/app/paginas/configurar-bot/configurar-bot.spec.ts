import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurarBot } from './configurar-bot';

describe('ConfigurarBot', () => {
  let component: ConfigurarBot;
  let fixture: ComponentFixture<ConfigurarBot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurarBot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurarBot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
