/**
 * Customer Dashboard Application
 *
 * This is your application code. The Userplane recorder
 * is automatically mounted when users visit with recording parameters.
 */

console.log('Customer Dashboard loaded');

// Access Userplane recorder if needed
if (window.Userplane && window.Userplane.recorder) {
  console.log('Userplane recorder available');

  // Check if recorder is mounted (when URL has recording parameters)
  const isRecording = window.Userplane.recorder.isRecorderMounted();
  if (isRecording) {
    console.log('Recorder is currently mounted - user is in recording mode');
  } else {
    console.log('Normal mode - no recording active');
  }
}

// Example: Add some interactivity to the dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Add click handlers to table rows
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      console.log('Row clicked:', row.querySelector('td').textContent);
    });
  });
});
