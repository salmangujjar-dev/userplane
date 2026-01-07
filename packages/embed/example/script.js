/**
 * Customer Dashboard Application
 * Demonstrates Userplane recorder auto-initialization
 */

console.log('[Dashboard] Customer Dashboard loaded');

// Add interactivity to table rows
document.addEventListener('DOMContentLoaded', () => {
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      const customerId = row.querySelector('td').textContent;
      console.log('[Dashboard] Customer selected:', customerId);
    });
  });

  // Log recorder status if available
  if (window.userplane) {
    const isRecording = window.userplane.isRecorderMounted();
    console.log('[Dashboard] Recorder mounted:', isRecording);
  }
});
