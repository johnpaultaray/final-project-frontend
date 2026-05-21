import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services/account.service';
import { AlertService } from '@app/_services/alert.service';

@Component({
    templateUrl: 'login.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink
    ]
})
export class LoginComponent implements OnInit {

    form!: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) {

        // 🔴 redirect if already logged in
        if (this.accountService.accountValue) {
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {

        // ✅ FORM INIT
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    // shortcut getter
    get f() {
        return this.form.controls;
    }

    onSubmit() {

        this.submitted = true;
        this.alertService.clear();

        // ❌ stop if invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;

        this.accountService.login(
            this.f['email'].value,
            this.f['password'].value
        )
        .pipe(first())
        .subscribe({
            next: (res) => {

                console.log('LOGIN SUCCESS:', res);

                const returnUrl =
                    this.route.snapshot.queryParams['returnUrl'] || '/';

                this.router.navigateByUrl(returnUrl);
            },

            error: (err) => {

                console.error('LOGIN ERROR:', err);

                // 🔥 FIX: always stop loading even on error
                this.loading = false;

                // show backend message if exists
                const message =
                    err?.error?.message ||
                    err?.error ||
                    'Login failed';

                this.alertService.error(message);
            },

            complete: () => {
                // safety fallback
                this.loading = false;
            }
        });
    }
}