import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { timeout, catchError, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-family-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './family-list.html',
  styleUrl: './family-list.scss'
})
export class FamilyList implements OnInit {
  families:any[] = [];
  loading = true;
  error: string | null = null;
  private platformId = inject(PLATFORM_ID);

  // For inline member display
  selectedFamily: any | null = null;
  members: any[] = [];
  membersLoading = false;
  membersError: string | null = null;
  selectedMember: any | null = null;

  constructor(private http:HttpClient, private cdr: ChangeDetectorRef){}

  ngOnInit(){
    // Only fetch data in browser, not during SSR
    if (!isPlatformBrowser(this.platformId)) {
      console.log('Skipping HTTP call during SSR');
      this.loading = false;
      return;
    }
    
    const url = 'http://localhost:8080/api/families';
    console.log('Fetching families from:', url);
    this.loading = true;
    this.error = null;
    
    // Manual timeout fallback (6 seconds)
    const timeoutId = setTimeout(() => {
      if (this.loading) {
        console.error('Manual timeout triggered - request took too long');
        this.loading = false;
        this.error = 'Request timed out. The backend may not be running or is not responding. Please ensure the backend server is running on http://localhost:8080';
        this.cdr.detectChanges(); // Force change detection
      }
    }, 6000);
    
    this.http.get<any[]>(url)
      .pipe(
        timeout(5000), // 5 second timeout
        catchError((err) => {
          clearTimeout(timeoutId);
          console.error('Error fetching families:', err);
          let errorMessage = 'Unknown error';
          
          if (err.name === 'TimeoutError' || err.error?.name === 'TimeoutError') {
            errorMessage = 'Request timed out. The backend may not be running or is not responding.';
          } else if (err.status === 0 || !err.status) {
            errorMessage = 'Cannot connect to backend. Please ensure the backend server is running on http://localhost:8080';
          } else if (err.status) {
            errorMessage = `Backend returned error: Status ${err.status} - ${err.statusText || err.message}`;
          } else {
            errorMessage = err.message || 'Unknown error occurred';
          }
          
          console.error('Error details:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            name: err.name,
            error: err.error,
            url: err.url
          });
          
          this.loading = false;
          this.error = `Failed to load families: ${errorMessage}`;
          this.cdr.detectChanges(); // Force change detection
          return of([]);
        })
      )
      .subscribe({
        next: (r) => {
          clearTimeout(timeoutId);
          console.log('Families fetched successfully:', r);
          console.log('Setting families to:', r);
          console.log('Current loading state:', this.loading);
          this.families = r || [];
          this.loading = false;
          this.cdr.detectChanges(); // Force change detection
          console.log('After update - loading:', this.loading, 'families length:', this.families.length);
        },
        error: (err) => {
          clearTimeout(timeoutId);
          // This should be caught by catchError, but just in case
          console.error('Unexpected error in subscribe:', err);
          this.loading = false;
          this.error = 'An unexpected error occurred while loading families.';
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  onFamilyClick(family: any) {
    this.selectedFamily = family;
    this.selectedMember = null;
    this.loadMembersForFamily(family.id);
  }

  clearSelection() {
    this.selectedFamily = null;
    this.members = [];
    this.membersError = null;
    this.selectedMember = null;
  }

  onMemberClick(member: any) {
    this.selectedMember = member;
  }

  private loadMembersForFamily(familyId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const url = `http://localhost:8080/api/families/${familyId}/members`;
    console.log('Loading members for family from:', url);

    this.membersLoading = true;
    this.membersError = null;

    this.http.get<any[]>(url)
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.error('Error fetching members for family:', err);
          let errorMessage = 'Unknown error';

          if (err.name === 'TimeoutError' || err.error?.name === 'TimeoutError') {
            errorMessage = 'Request timed out. The backend may not be running or is not responding.';
          } else if (err.status === 0 || !err.status) {
            errorMessage = 'Cannot connect to backend. Please ensure the backend server is running on http://localhost:8080';
          } else if (err.status) {
            errorMessage = `Backend returned error: Status ${err.status} - ${err.statusText || err.message}`;
          } else {
            errorMessage = err.message || 'Unknown error occurred';
          }

          this.membersLoading = false;
          this.membersError = `Failed to load members: ${errorMessage}`;
          this.members = [];
          this.cdr.detectChanges();
          return of([]);
        })
      )
      .subscribe({
        next: (r) => {
          console.log('Members for family fetched successfully:', r);
          this.members = r || [];
          this.membersLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Unexpected error loading members for family:', err);
          this.membersLoading = false;
          this.membersError = 'An unexpected error occurred while loading members.';
          this.members = [];
          this.cdr.detectChanges();
        }
      });
  }
}
