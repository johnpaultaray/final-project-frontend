import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '@app/_services/account.service';

@Component({
    templateUrl: 'details.component.html',
    standalone: true,
    imports: [CommonModule]
})
export class DetailsComponent {
    account$ = this.accountService.account$;

    constructor(private accountService: AccountService) { }
}
