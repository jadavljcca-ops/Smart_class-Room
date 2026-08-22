import Swal from 'sweetalert2';

export const confirmDelete = async ({ entityName = 'item', customTitle, customText }) => {
  const titleText = customTitle || `Confirm ${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Deletion`;
  const bodyText = customText || `Are you sure you want to delete this ${entityName}? This action will permanently remove it from the system.`;
  
  const result = await Swal.fire({
    html: `
      <div style="display: flex; align-items: flex-start; gap: 1rem; text-align: left; margin-bottom: 1.5rem;">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.8rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <div>
          <h2 style="margin: 0 0 0.25rem 0; font-size: 1.25rem; font-weight: 700; color: #ffffff;">${titleText}</h2>
          <div style="color: #ef4444; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Permanent System Action
          </div>
        </div>
      </div>
      <div style="text-align: left; color: #94a3b8; font-size: 0.95rem; line-height: 1.6;">
        ${bodyText}
      </div>
    `,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete Now',
    cancelButtonText: 'Cancel',
    focusCancel: true,
    background: '#0b1320', 
    customClass: {
      popup: 'swal-custom-delete-popup',
      confirmButton: 'swal-custom-delete-confirm',
      cancelButton: 'swal-custom-delete-cancel',
      actions: 'swal-custom-delete-actions'
    },
    buttonsStyling: false,
    reverseButtons: true,
    backdrop: `rgba(255,255,255,0.4)`,
  });
  
  return result.isConfirmed;
};
