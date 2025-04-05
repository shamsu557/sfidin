/**
 * SFIDIN - Sarauniya Fanna Initiative for Development in Nigeria
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavbarCollapse();
    initReadMoreToggle();
    initDonationForm();
    initPaystackIntegration();
    initAnimations();
});

/**
 * Navbar collapse functionality
 * Collapses the navbar when a nav item is clicked (for mobile view)
 * Excludes dropdown toggles to allow dropdown menus to appear on mobile
 */
function initNavbarCollapse() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link:not(.dropdown-toggle)');
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    // Handle regular nav links (non-dropdown)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                navbarCollapse.classList.remove('show');
                navbarToggler.setAttribute('aria-expanded', 'false');
            }
        });
    });
    
    // Handle dropdown items separately
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                navbarCollapse.classList.remove('show');
                navbarToggler.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

/**
 * Read More/Less toggle for founder's section
 * Changes the button text and icon when expanded/collapsed
 */
function initReadMoreToggle() {
    const readMoreBtn = document.querySelector('.read-more-btn');
    if (!readMoreBtn) return;

    readMoreBtn.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const icon = this.querySelector('i');
        
        if (isExpanded) {
            this.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
        } else {
            this.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
        }
    });
}

/**
 * Donation form functionality
 * Handles custom amount toggle and form validation
 */
function initDonationForm() {
    const donationForm = document.getElementById('donationForm');
    if (!donationForm) return;

    const customAmountRadio = document.getElementById('amountCustom');
    const customAmountContainer = document.querySelector('.custom-amount-container');
    const customAmountInput = document.getElementById('customAmount');
    const donationRadios = document.querySelectorAll('input[name="donationAmount"]');

    // Toggle custom amount input visibility
    donationRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.id === 'amountCustom') {
                customAmountContainer.classList.remove('d-none');
                customAmountInput.setAttribute('required', 'required');
                customAmountInput.focus();
            } else {
                customAmountContainer.classList.add('d-none');
                customAmountInput.removeAttribute('required');
            }
        });
    });

    // Form validation
    const donateBtn = document.getElementById('donateBtn');
    donateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (!validateDonationForm()) {
            return;
        }
        
        // If validation passes, proceed with payment
        processPayment();
    });
}

/**
 * Validate donation form fields
 * @returns {boolean} - Whether the form is valid
 */
function validateDonationForm() {
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const country = document.getElementById('country');
    const donationRadios = document.querySelectorAll('input[name="donationAmount"]');
    const customAmountInput = document.getElementById('customAmount');
    
    let isValid = true;
    let selectedAmount = false;
    
    // Validate name
    if (!fullName.value.trim()) {
        highlightInvalidField(fullName, 'Please enter your full name');
        isValid = false;
    } else {
        resetField(fullName);
    }
    
    // Validate email
    if (email && email.value.trim() && !isValidEmail(email.value)) {
        highlightInvalidField(email, 'Please enter a valid email address');
        isValid = false;
    } else {
        resetField(email);
    }
    
    // Validate country
    if (!country.value) {
        highlightInvalidField(country, 'Please select your country');
        isValid = false;
    } else {
        resetField(country);
    }
    
    // Validate donation amount
    donationRadios.forEach(radio => {
        if (radio.checked) {
            selectedAmount = true;
            if (radio.id === 'amountCustom' && (!customAmountInput.value || customAmountInput.value <= 0)) {
                highlightInvalidField(customAmountInput, 'Please enter a valid amount');
                isValid = false;
            } else if (radio.id === 'amountCustom') {
                resetField(customAmountInput);
            }
        }
    });
    
    if (!selectedAmount) {
        alert('Please select a donation amount');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Highlight invalid form field
 * @param {HTMLElement} field - The field to highlight
 * @param {string} message - Error message to display
 */
function highlightInvalidField(field, message) {
    field.classList.add('is-invalid');
    
    // Create or update error message
    let errorDiv = field.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
    errorDiv.textContent = message;
}

/**
 * Reset field validation state
 * @param {HTMLElement} field - The field to reset
 */
function resetField(field) {
    field.classList.remove('is-invalid');
    const errorDiv = field.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
        errorDiv.textContent = '';
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Paystack integration for donation processing
 */
function initPaystackIntegration() {
    // This function will be called when the donate button is clicked
    window.processPayment = function() {
        const fullName = document.getElementById('fullName').value;
        let email = document.getElementById('email').value.trim() || "info@sfidin.org.ng"; // Default email
        let phone = document.getElementById('phone').value.trim() || "08030909793"; // Default phone number
        const country = document.getElementById('country').value;
        const message = document.getElementById('message').value;
        
        // Get selected amount
        let amount = 0;
        const customAmountInput = document.getElementById('customAmount');
        const donationRadios = document.querySelectorAll('input[name="donationAmount"]');
        
        donationRadios.forEach(radio => {
            if (radio.checked) {
                if (radio.id === 'amountCustom') {
                    amount = parseFloat(customAmountInput.value) * 100; // Convert to kobo
                } else {
                    amount = parseFloat(radio.value) * 100; // Convert to kobo
                }
            }
        });
        
        // Initialize Paystack payment
        const handler = PaystackPop.setup({
            key: 'pk_live_e6942e61f70c87019cbeb64ffed04e10fbd2ee10', // Replace with your public key
            email: email,
            amount: amount,
            currency: 'NGN',
            ref: 'SFIDIN_' + Math.floor((Math.random() * 1000000000) + 1), // Generate a unique reference
            metadata: {
                custom_fields: [
                    {
                        display_name: "Full Name",
                        variable_name: "full_name",
                        value: fullName
                    },
                    {
                        display_name: "Phone Number",
                        variable_name: "phone",
                        value: phone
                    },
                    {
                        display_name: "Country",
                        variable_name: "country",
                        value: country
                    },
                    {
                        display_name: "Message",
                        variable_name: "message",
                        value: message
                    }
                ]
            },
            callback: function(response) {
                // Handle successful payment
                showPaymentSuccess(response);
            },
            onClose: function() {
                // Handle when the Paystack modal is closed
                console.log('Payment window closed');
            }
        });
        
        handler.openIframe();
    };
}

/**
 * Display payment success message
 * @param {Object} response - Paystack response object
 */
function showPaymentSuccess(response) {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const country = document.getElementById('country').value;
    const message = document.getElementById('message').value;
    let state = "N/A"; // You can update this if you have a state field.
    
    // Get selected amount
    let amount = 0;
    const customAmountInput = document.getElementById('customAmount');
    const donationRadios = document.querySelectorAll('input[name="donationAmount"]');

    donationRadios.forEach(radio => {
        if (radio.checked) {
            if (radio.id === 'amountCustom') {
                amount = parseFloat(customAmountInput.value);
            } else {
                amount = parseFloat(radio.value);
            }
        }
    });

    // Send to backend
    fetch("/donate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            donorName: fullName,
            donorEmail: email,
            donorPhone: phone,
            amount: amount,
            country: country,
            state: state,
            reference: response.reference
        })
    })
    .then(res => res.json())
    .then(data => {
        const donationForm = document.getElementById('donationForm');
        const successMessage = document.createElement('div');

        successMessage.className = 'alert alert-success mt-3';
        successMessage.innerHTML = `
            <h4 class="alert-heading">Thank You for Your Donation!</h4>
            <p>${data.message}</p>
            <p>Reference: ${response.reference}</p>
            <p class="mb-0">Your generosity will help us make a difference in the lives of those we serve.</p>
        `;

        donationForm.innerHTML = '';
        donationForm.appendChild(successMessage);
        successMessage.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => {
        console.error("Error sending donation to backend:", err);
        alert("Donation was successful but failed to store details. Please contact us.");
    });
}

    //contact form
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contactForm");

    // Handle form submission
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        // Extract form data
        const formData = {
            name: document.getElementById("name").value.trim(),
            contactEmail: document.getElementById("contactEmail").value.trim(),
            subject: document.getElementById("subject").value.trim(), // Added subject
            message: document.getElementById("message").value.trim(),
        };

        // Validate form fields
        if (!formData.name || !formData.contactEmail || !formData.message) {
            alert("Please fill out all fields before submitting the form.");
            return;
        }

        try {
            // Submit form data to the server using Fetch API
            const response = await fetch("/send-message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            // Process response
            const result = await response.json();
            if (response.ok) {
                alert(result.message || "Your message has been sent successfully!");
                contactForm.reset(); // Clear the form
            } else {
                alert(result.error || "Failed to send your message. Please try again later.");
            }
        } catch (error) {
            console.error("Error submitting the form:", error);
            alert("An error occurred while sending your message. Please try again later.");
        }
    });
});



/**
 * Initialize animations for various elements
 */
function initAnimations() {
    // Fade in mission & vision content
    const missionVisionContent = document.querySelector('.mission-vision-content');
    if (missionVisionContent) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(missionVisionContent);
    }
    
    // Add more animations as needed
}
    $(document).ready(function () {
        $("#verifyAdmin").click(function () {
            const username = $("#adminUsername").val();
            const password = $("#adminPassword").val();
    
            if (!username || !password) {
                alert("Please enter both username and password.");
                return;
            }
    
            $.ajax({
                url: "/verify-admin",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ username, password }),
                success: function (response) {
                    if (response.success) {
                        $("#adminLoginContainer").hide();
                        $("#signupContainer").show();
                    } else {
                        alert(response.message || "Invalid credentials. Access denied.");
                    }
                },
                error: function () {
                    alert("An error occurred while verifying credentials.");
                }
            });
        });
    
        $("#signupForm").submit(function (event) {
            event.preventDefault();
    
            const formData = $(this).serialize();
    
            $.ajax({
                url: "/admin-signup",
                method: "POST",
                data: formData,
                success: function (response) {
                    alert(response.success ? "Admin Creation successful!" : "An error occurred.");
                    if (response.success) {
                        window.location.href = "admin_login.html"; // Redirect to admin login page
                    }
                },
                error: function () {
                    alert("An unexpected error occurred. Please try again.");
                }
            });
        });
    });

    const founderImages = ["sarauniyaa.jpg", "sarauniya2.jpg", "saruniya3.jpg"];
let currentFounderIndex = 0;
const founderImageElement = document.getElementById("founder-image");

function changeFounderImage() {
    currentFounderIndex = (currentFounderIndex + 1) % founderImages.length;
    founderImageElement.style.opacity = "0"; // Fade out

    setTimeout(() => {
        founderImageElement.src = founderImages[currentFounderIndex]; // Change image
        founderImageElement.style.opacity = "1"; // Fade in
    }, 500);
}

// Change slide every 5 seconds
setInterval(changeFounderImage, 5000);
document.getElementById('toggle-news-btn').addEventListener('click', function () {
    const extraNews = document.querySelectorAll('.extra-news');
    const isHidden = extraNews[0].classList.contains('d-none');
    extraNews.forEach(item => item.classList.toggle('d-none'));
    this.textContent = isHidden ? 'View Less' : 'View All News';
});
function toggleMap() {
    const map = document.getElementById("googleMap");
    if (map.style.display === "none") {
        map.style.display = "block";  // Show the map
    } else {
        map.style.display = "none";  // Hide the map
    }
}