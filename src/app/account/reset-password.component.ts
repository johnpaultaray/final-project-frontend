import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { first, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AccountService } from '@app/_services/account.service';
import { AlertService } from '@app/_services/alert.service';
import { MustMatch } from '@app/_helpers/must-match.validator';

enum TokenStatus {
    Validating,
    Valid,
    Invalid
}

@Component({
    templateUrl: 'reset-password.component.html',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class ResetPasswordComponent implements OnInit {

    TokenStatus = TokenStatus;

    tokenStatus: TokenStatus = TokenStatus.Validating;

    token?: string;
    form!: FormGroup;

    loading = false;
    submitted = false;
    passwordReset = false;

    // ✅ FIX: ADD THESE (THIS SOLVES YOUR ERROR)
    successMessage: string = '';
    errorMessage: string = '';

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService,
        private cd: ChangeDetectorRef
    ) {}

    ngOnInit() {

        this.token =
            this.route.snapshot.queryParams['token'] ||
            new URLSearchParams(window.location.search).get('token') ||
            new URLSearchParams(window.location.hash.split('?')[1] || '').get('token') ||
            undefined;

        console.log('TOKEN FOUND:', this.token);

        if (!this.token) {
            this.tokenStatus = TokenStatus.Invalid;
            return;
        }

        this.form = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: MustMatch('password', 'confirmPassword')
        });

        this.accountService.validateResetToken(this.token)
            .pipe(
                first(),
                timeout(10000),
                catchError(err => {
                    console.error(err);
                    this.tokenStatus = TokenStatus.Invalid;
                    this.cd.detectChanges();
                    return of(null);
                })
            )
            .subscribe((res: any) => {

                console.log('API RESPONSE:', res);

                const message = (res?.message || '').toLowerCase();

                const isValid =
                    res === true ||
                    res?.valid === true ||
                    res?.success === true ||
                    message.includes('valid');

                this.tokenStatus = isValid
                    ? TokenStatus.Valid
                    : TokenStatus.Invalid;

                this.cd.detectChanges();
            });
    }

    get f() {
        return this.form.controls;
    }

    onSubmit() {
        this.submitted = true;

        this.alertService.clear();
        this.successMessage = '';
        this.errorMessage = '';

        if (this.form.invalid) return;

        this.loading = true;

        this.accountService.resetPassword(
            this.token!,
            this.f['password'].value,
            this.f['confirmPassword'].value
        )
        .pipe(first())
        .subscribe({
            next: () => {

                this.loading = false;
                this.passwordReset = true;

                this.successMessage = 'Password reset successful! Redirecting...';

                setTimeout(() => {
                    this.router.navigate(['/account/login']);
                }, 2000);
            },

            error: (err) => {

                this.loading = false;

                this.errorMessage =
                    err?.error?.message ||
                    err?.message ||
                    'Reset password failed. Please try again.';
            }
        });
    }
}