
import { Directive, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[appAdminOnly]',
  standalone: true,
})
export class AdminOnlyDirective implements OnInit {
  constructor(
    private tpl:  TemplateRef<any>,
    private vcr:  ViewContainerRef,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}