// Business Contact Form Handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('business-contact-form');
  const successMessage = document.getElementById('form-success');
  const errorMessage = document.getElementById('form-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = {
      company: document.getElementById('company').value,
      contactName: document.getElementById('contact-name').value,
      email: document.getElementById('email').value,
      useCase: document.getElementById('use-case').value,
      budget: document.getElementById('budget').value,
      timeline: document.getElementById('timeline').value
    };

    // Disable submit button during submission
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Envoi en cours...</span>';

    try {
      // Send to backend (similar to waitlist endpoint)
      const response = await fetch('/api/business-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';
        document.getElementById('submitted-email').textContent = formData.email;

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      errorMessage.style.display = 'block';
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });

  // Form field focus effects
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.style.borderColor = 'var(--primary)';
      this.style.boxShadow = '0 0 0 3px rgba(51, 51, 51, 0.1)';
    });

    input.addEventListener('blur', function() {
      this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      this.style.boxShadow = 'none';
    });
  });
});
