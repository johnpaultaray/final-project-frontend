import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AccountService } from '@app/_services/account.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private accountService: AccountService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const account = this.accountService.accountValue;

        if (account) {
            // Check role if data.roles is set on the route
            if (route.data['roles'] && !route.data['roles'].includes(account.role)) {
                this.router.navigate(['/']);
                return false;
            }
            return true;
        }

        // Not logged in — redirect to login, preserving the attempted URL
        // IMPORTANT: only redirect to login, never to a page that triggers AuthGuard again
        this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}