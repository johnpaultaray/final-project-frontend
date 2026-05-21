import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';  // ← change to RouterLink
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services/account.service';
import { AlertService } from '@app/_services/alert.service';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink]  // ← RouterLink not RouterModule
})
export class ForgotPasswordComponent implements OnInit {
    form!: FormGroup;
    loading: boolean = false;
    submitted: boolean = false;
    emailSent: boolean = false;
    sentToEmail: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private accountService: AccountService,
        private alertService: AlertService,
        private router: Router
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    get f() { return this.form.controls; }

    goToLogin() {
        this.router.navigate(['/account/login']);
    }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) return;

        this.loading = true;
        const targetEmail = this.f['email'].value;

        this.accountService.forgotPassword(targetEmail)
            .pipe(first())
            .subscribe({
                next: (response: any) => {
                    this.sentToEmail = targetEmail;
                    this.emailSent = true;
                    this.form.reset();
                    this.submitted = false;
                    this.loading = false;
                    this.alertService.success(response?.message || 'Please check your email for password reset instructions.', { keepAfterRouteChange: true });
                },
                error: (error: any) => {
                    this.alertService.error(error);
                    this.loading = false;
                    this.emailSent = false;
                    this.sentToEmail = '';
                }
            });
    }
}