import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `<section class="card"><ng-content></ng-content></section>`
})
export class CardComponent {}
