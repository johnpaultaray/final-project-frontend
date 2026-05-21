import { Component, OnInit } from '@angular/core';
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
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink
    ]
})
export class ResetPasswordComponent implements OnInit {
    TokenStatus = TokenStatus;
    tokenStatus = TokenStatus.Validating;
    token?: string;
    form!: FormGroup;
    loading = false;
    submitted = false;
    passwordReset = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        // 1st: Try Angular's ActivatedRoute queryParams
        this.token = this.route.snapshot.queryParams['token'];

        // 2nd: Parse from window.location.search
        // (handles when Ethereal/browser strips the # from the URL)
        if (!this.token) {
            const urlParams = new URLSearchParams(window.location.search);
            this.token = urlParams.get('token') || undefined;
        }

        // 3rd: Parse from the hash fragment
        // (handles /#/account/reset-password?token=xxx)
        if (!this.token) {
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const hashParams = new URLSearchParams(hash.split('?')[1]);
                this.token = hashParams.get('token') || undefined;
            }
        }

        console.log('Reset token found:', this.token ? 'YES' : 'NO', this.token?.substring(0, 10) + '...');

        if (!this.token) {
            this.tokenStatus = TokenStatus.Invalid;
            return;
        }

        this.form = this.formBuilder.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: MustMatch('password', 'confirmPassword')
        });

        // Validate token with 10 second timeout so spinner never hangs forever
        this.accountService.validateResetToken(this.token)
            .pipe(
                first(),
                timeout(10000),         // fail after 10 seconds if no response
                catchError(err => {
                    console.error('Token validation error:', err);
                    return of(null);    // treat any error as invalid
                })
            )
            .subscribe(result => {
                if (result === null) {
                    this.tokenStatus = TokenStatus.Invalid;
                } else {
                    this.tokenStatus = TokenStatus.Valid;
                }
            });
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

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
                this.passwordReset = true;
                this.loading = false;
                setTimeout(() => this.router.navigate(['/account/login']), 2000);
            },
            error: (error: any) => {
                this.alertService.error(error);
                this.loading = false;
            }
        });
    }
}