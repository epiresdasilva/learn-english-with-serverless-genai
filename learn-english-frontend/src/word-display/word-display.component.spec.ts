import { TestBed } from '@angular/core/testing';
import { WordDisplayComponent } from './word-display.component';

describe('WordDisplayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordDisplayComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(WordDisplayComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // it(`should have the 'learn-english-frontend-app' title`, () => {
  //   const fixture = TestBed.createComponent(WordDisplayComponent);
  //   const app = fixture.componentInstance;
  //   expect(app.title).toEqual('learn-english-frontend-app');
  // });

  it('should render title', () => {
    const fixture = TestBed.createComponent(WordDisplayComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, learn-english-frontend-app');
  });
});
