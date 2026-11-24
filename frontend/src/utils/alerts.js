import Swal from 'sweetalert2';

export const confirmDelete = async ({ entityName = 'item', customTitle, customText }) => {
  const titleText = customTitle;
  const bodyText = customText || `Are you sure you want to delete this ${entityName}? This action will permanently remove it from the system.`;
  
  const result = await Swal.fire({
    html: `
      <div style="display: flex; align-items: center; gap: 1rem; text-align: left; margin-bottom: 1.25rem;">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); padding: 0.8rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: center;">
          ${titleText ? `<h2 style="margin: 0 0 0.25rem 0; font-size: 1.25rem; font-weight: 700; color: #000000;">${titleText}</h2>` : ''}
          <div style="color: #ef4444; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Permanent System Action
          </div>
        </div>
      </div>
      <div style="text-align: left; color: #000000; font-size: 0.98rem; line-height: 1.6; font-weight: 500;">
        ${bodyText}
      </div>
    `,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete Now',
    cancelButtonText: 'Cancel',
    focusCancel: true,
    background: '#ffffff',
    color: '#000000',
    customClass: {
      popup: 'swal-custom-delete-popup',
      confirmButton: 'swal-custom-delete-confirm',
      cancelButton: 'swal-custom-delete-cancel',
      actions: 'swal-custom-delete-actions'
    },
    buttonsStyling: false,
    reverseButtons: true,
    backdrop: `rgba(0, 0, 0, 0.45)`,
  });
  
  return result.isConfirmed;
};

export const showProfileUpdatedAlert = async (customMessage = 'Your profail has been Updated.') => {
  return await Swal.fire({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0.75rem 0.5rem 0.25rem;">
        <div style="background: #dcfce7; border: 2px solid #86efac; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #16a34a; margin-bottom: 1.25rem; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.2);">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 style="margin: 0 0 0.5rem 0; font-size: 1.45rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Success!</h2>
        <div style="color: #334155; font-size: 1.05rem; line-height: 1.5; font-weight: 600;">
          ${customMessage}
        </div>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'OK',
    background: '#ffffff',
    customClass: {
      popup: 'swal-custom-white-popup',
      confirmButton: 'btn btn-primary',
    },
    buttonsStyling: false,
    allowOutsideClick: true,
    timer: 3500,
    timerProgressBar: true,
    backdrop: `rgba(15, 23, 42, 0.65)`,
  });
};

export const showPasswordIncorrectAlert = async () => {
  return await Swal.fire({
    icon: 'error',
    title: 'This Password is Incorrect.',
    showConfirmButton: false,
    timer: 1000,
    timerProgressBar: false,
    background: '#ffffff',
    color: '#000000',
    iconColor: '#dc2626',
    customClass: {
      popup: 'swal-custom-white-popup swal-custom-incorrect-popup',
      title: 'swal-incorrect-title'
    },
    backdrop: `rgba(0, 0, 0, 0.45)`,
    allowOutsideClick: true
  });
};




