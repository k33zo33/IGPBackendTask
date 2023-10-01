document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Extract form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Create an object with the form data
    const formData = {
        email,
        password,
    };

    // Send a POST request to the sign-in endpoint
    fetch('/user/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'SUCCESS') {
            // Sign-in successful, store the token in local storage
            localStorage.setItem('token', data.token);
            // Redirect to the dashboard or any other page as needed
            window.location.href = '/dashboard'; // Replace with your desired URL
        } else {
            // Handle failed sign-in, show an error message, etc.
            console.error(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});
