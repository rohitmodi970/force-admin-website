// components/BetaUserActionButton.tsx
'use client';

import React, { useState } from 'react';

interface BetaUserActionButtonProps {
  email: string;
  userId: string;
  onSuccess: () => void;
  isProcessing: boolean;
  actionType: 'add' | 'remove';
  className?: string;
}

const BetaUserActionButton: React.FC<BetaUserActionButtonProps> = ({
  email,
  userId,
  onSuccess,
  isProcessing,
  actionType,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const showAddDialog = (): Promise<'send_email' | 'add_only' | 'cancel'> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 backdrop-filter backdrop-blur-lg  bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Add to Beta Program</h3>
            <p class="text-gray-600 mb-4">How would you like to add <strong>${email}</strong> to the beta program?</p>
          </div>
          <div class="space-y-3">
            <button id="send-email-btn" class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Add to Beta & Send Welcome Email</span>
            </button>
            <button id="add-only-btn" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Add to Beta Only</span>
            </button>
            <button id="cancel-btn" class="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium">
              Cancel
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const sendEmailBtn = dialog.querySelector('#send-email-btn');
      const addOnlyBtn = dialog.querySelector('#add-only-btn');
      const cancelBtn = dialog.querySelector('#cancel-btn');

      sendEmailBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('send_email');
      });

      addOnlyBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('add_only');
      });

      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('cancel');
      });

      // Close on backdrop click
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
          resolve('cancel');
        }
      });
    });
  };

  const showRemoveDialog = (): Promise<'waitlist' | 'remove' | 'cancel'> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 backdrop-filter backdrop-blur-lg  bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Remove Beta User</h3>
            <p class="text-gray-600 mb-4">What would you like to do with <strong>${email}</strong>?</p>
          </div>
          <div class="space-y-3">
            <button id="waitlist-btn" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>Remove from Beta & Keep in Waitlist</span>
            </button>
            <button id="remove-btn" class="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Remove Completely</span>
            </button>
            <button id="cancel-btn" class="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium">
              Cancel
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const waitlistBtn = dialog.querySelector('#waitlist-btn');
      const removeBtn = dialog.querySelector('#remove-btn');
      const cancelBtn = dialog.querySelector('#cancel-btn');

      waitlistBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('waitlist');
      });

      removeBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('remove');
      });

      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('cancel');
      });

      // Close on backdrop click
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
          resolve('cancel');
        }
      });
    });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  };

  const handleAddToBeta = async () => {
    try {
      const action = await showAddDialog();
      
      if (action === 'cancel') {
        return;
      }

      setIsLoading(true);
      
      const response = await fetch('/api/admin/beta-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          userWaitlistId: userId, 
          sendEmail: action === 'send_email' 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user to beta');
      }

      const result = await response.json();
      
      if (action === 'send_email') {
        if (result.emailSent) {
          showToast('User added to beta and welcome email sent successfully!', 'success');
        } else {
          showToast('User added to beta but email sending failed. Please check email configuration.', 'error');
        }
      } else {
        showToast('User added to beta successfully!', 'success');
      }

      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add user to beta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromBeta = async () => {
    try {
      const action = await showRemoveDialog();
      
      if (action === 'cancel') {
        return;
      }

      setIsLoading(true);
      
      const keepInWaitlist = action === 'waitlist';
      const response = await fetch(`/api/admin/beta-users/${userId}?keepInWaitlist=${keepInWaitlist}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user from beta');
      }

      const result = await response.json();
      
      if (result.restoredToWaitlist) {
        showToast('User removed from beta and restored to waitlist!', 'success');
      } else {
        showToast('User removed from beta completely!', 'success');
      }

      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove user from beta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (actionType === 'add') {
      handleAddToBeta();
    } else {
      handleRemoveFromBeta();
    }
  };

  const isButtonDisabled = isProcessing || isLoading;

  if (actionType === 'add') {
    return (
      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${className}`}
      >
        {isButtonDisabled ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            <span>Adding...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add to Beta</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={`bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${className}`}
    >
      {isButtonDisabled ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          <span>Removing...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Remove</span>
        </>
      )}
    </button>
  );
};

export default BetaUserActionButton;