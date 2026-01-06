import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-member-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-list.html',
  styleUrl: './member-list.scss'
})
export class MemberList implements OnInit {
  members:any[] = [];
  loading = true;
  error: string | null = null;
  showAddForm = false;
  submitting = false;
  submitError: string | null = null;
  
  // Form model
  newMember = {
    name: '',
    dob: '',
    relationship: ''
  };
  
  private platformId = inject(PLATFORM_ID);
  private familyId: string | null = null;

  constructor(private route:ActivatedRoute, private http:HttpClient, private cdr: ChangeDetectorRef){}

  ngOnInit(){
    // Only fetch data in browser, not during SSR
    if (!isPlatformBrowser(this.platformId)) {
      console.log('Skipping HTTP call during SSR');
      this.loading = false;
      return;
    }
    
    this.familyId = this.route.snapshot.paramMap.get('familyId');
    const url = `http://localhost:8080/api/families/${this.familyId}/members`;
    console.log('Fetching members from:', url);
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
          console.error('Error fetching members:', err);
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
          this.error = `Failed to load members: ${errorMessage}`;
          this.cdr.detectChanges(); // Force change detection
          return of([]);
        })
      )
      .subscribe({
        next: (r) => {
          clearTimeout(timeoutId);
          console.log('Members fetched successfully:', r);
          console.log('Setting members to:', r);
          console.log('Current loading state:', this.loading);
          this.members = r || [];
          this.loading = false;
          this.cdr.detectChanges(); // Force change detection
          console.log('After update - loading:', this.loading, 'members length:', this.members.length);
        },
        error: (err) => {
          clearTimeout(timeoutId);
          // This should be caught by catchError, but just in case
          console.error('Unexpected error in subscribe:', err);
          this.loading = false;
          this.error = 'An unexpected error occurred while loading members.';
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.newMember = {
      name: '',
      dob: '',
      relationship: ''
    };
    this.submitError = null;
  }

  addMember() {
    if (!this.familyId) {
      this.submitError = 'Family ID is missing';
      return;
    }

    // Basic validation
    if (!this.newMember.name || !this.newMember.dob || !this.newMember.relationship) {
      this.submitError = 'Please fill in all fields';
      return;
    }

    this.submitting = true;
    this.submitError = null;

    const url = `http://localhost:8080/api/members/${this.familyId}`;
    const payload = {
      name: this.newMember.name,
      dob: this.newMember.dob,
      relationship: this.newMember.relationship
    };
    
    console.log('Adding member - URL:', url);
    console.log('Adding member - Payload:', payload);
    console.log('Adding member - Headers will be set automatically by HttpClient');

    this.http.post<any>(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.error('Error adding member - Full error object:', err);
          console.error('Error status:', err.status);
          console.error('Error statusText:', err.statusText);
          console.error('Error message:', err.message);
          console.error('Error error:', err.error);
          
          let errorMessage = 'Unknown error';
          
          if (err.name === 'TimeoutError' || err.error?.name === 'TimeoutError') {
            errorMessage = 'Request timed out. Please try again.';
          } else if (err.status === 0 || !err.status) {
            errorMessage = 'Cannot connect to backend. Please ensure the backend server is running on http://localhost:8080';
          } else if (err.status === 400) {
            errorMessage = `Bad Request: ${err.error?.message || 'Invalid data provided'}`;
            if (err.error && typeof err.error === 'object') {
              console.error('Backend validation errors:', err.error);
            }
          } else if (err.status === 404) {
            errorMessage = 'Family not found. Please refresh the page.';
          } else if (err.status === 500) {
            errorMessage = 'Server error. Please check the backend logs.';
          } else if (err.status) {
            errorMessage = `Backend returned error: Status ${err.status} - ${err.statusText || err.message}`;
            if (err.error && err.error.message) {
              errorMessage = err.error.message;
            }
          } else {
            errorMessage = err.message || 'Unknown error occurred';
          }
          
          this.submitting = false;
          this.submitError = errorMessage;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Member added successfully - Response:', response);
          console.log('Response type:', typeof response);
          console.log('Response keys:', response ? Object.keys(response) : 'null');
          
          this.submitting = false;
          
          if (response && response.id) {
            // If response contains the saved member, add it immediately
            console.log('Adding member from response to list');
            this.members.push(response);
            this.cdr.detectChanges();
          }
          
          // Reset form and hide it
          this.resetForm();
          this.showAddForm = false;
          
          // Refresh the entire list from server to ensure we have all saved data
          console.log('Refreshing members list from server...');
          this.loadMembers();
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          // This should be caught by catchError, but just in case
          console.error('Unexpected error in subscribe - adding member:', err);
          this.submitting = false;
          this.submitError = 'An unexpected error occurred while adding the member. Check console for details.';
          this.cdr.detectChanges();
        }
      });
  }

  loadMembers() {
    if (!this.familyId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const url = `http://localhost:8080/api/families/${this.familyId}/members`;
    console.log('Loading members from:', url);
    
    this.http.get<any[]>(url)
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.error('Error refreshing members:', err);
          console.error('Error details:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            error: err.error
          });
          return of([]);
        })
      )
      .subscribe({
        next: (r) => {
          console.log('Members refreshed from server:', r);
          this.members = r || [];
          this.cdr.detectChanges();
        }
      });
  }
}
