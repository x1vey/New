const SERVER_URL = 'revenue-node-server.vercel.app';

// Function to get a cookie by name
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to set a cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; // Ensure SameSite policy allows cross-page cookies
}

// Function to get a meta tag content by name
function getMetaContentByName(name) {
    const metaTag = document.querySelector(`meta[name="${name}"]`);
    return metaTag ? metaTag.getAttribute('content') : null;
}

// Function to get the "video" or "email" parameter from the URL and return the resourceClicked object
function getResourceClicked() {
    const params = new URLSearchParams(window.location.search);

    // Check if the 'video' or 'email' parameter exists
    if (params.has('video')) {
        return { type: 'video', name: params.get('video') };
    } else if (params.has('email')) {
        return { type: 'email', name: params.get('email') };
    } else if (params.has('community')) {
        return { type: 'community', name: params.get('community') };
    } else if (params.has('channel')) {
        return { type: 'channel', name: params.get('channel') };
    } else if (params.has('twitter')) {
        return { type: 'twitter', name: params.get('twitter') };
    } else if (params.has('instagram')) {
        return { type: 'instagram', name: params.get('instagram') };
    } else if (params.has('linkedin')) {
        return { type: 'linkedin', name: params.get('linkedin') };
    } else if (params.has('podcast')) {
        return { type: 'podcast', name: params.get('podcast') };
    } else if (params.has('blog')) {
        return { type: 'blog', name: params.get('blog') };
    } else if (params.has('website')) {
        return { type: 'website', name: params.get('website') };
    } else if (params.has('tiktok')) {
        return { type: 'tiktok', name: params.get('tiktok') };
    } else if (params.has('ad')) {
        return { type: 'ad', name: params.get('ad') };
    } else if (params.has('telegram')) {
        return { type: 'telegram', name: params.get('telegram') };
    } else if (params.has('facebook')) {
        return { type: 'facebook', name: params.get('facebook') };
    } else if (params.has('discord')) {
        return { type: 'discord', name: params.get('discord') };
    } else {
        console.log("No resource parameter found in URL");
        return { type: 'NA', name: 'NA' };
    }
}

// Function to send resource click event to the server
function sendResourceClickToServer(resourceClicked) {
    // Only send if the resource is not NA
    if (resourceClicked.name === 'NA' || resourceClicked.type === 'NA') {
        console.log("Resource is NA, not sending to server");
        return;
    }

    const userInfoCookie = getCookie('userInfo');
    if (!userInfoCookie) {
        console.log("No userInfo cookie found, cannot send resource click");
        return;
    }

    const userInfo = JSON.parse(userInfoCookie);
    const offerName = getMetaContentByName('offer'); // Get the offer name from the meta tag

    // Create the payload to send to the server
    const payload = {
        username: userInfo.username,
        resourceClicked: resourceClicked,
        lead_id: userInfo.lead_id,
        offer: offerName // Include the offer name in the payload
    };
    console.log("Sending resource click payload:", payload);

    // Send the POST request to the server to track the resource click
    fetch(`https://${SERVER_URL}/api/resource-click/${userInfo.username}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),  // Send the payload with the resource click and user info
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);
        // Mark the resource click as sent for this session
        sessionStorage.setItem(`resourceClick_${resourceClicked.name}`, 'true');
        console.log(`Resource click for ${resourceClicked.name} marked as tracked in session storage`);
    })
    .catch(error => {
        console.error('Error sending resource click info:', error);
    });
}

// Check if the resource click has already been sent
function isResourceClickAlreadyTracked(resourceClicked) {
    return sessionStorage.getItem(`resourceClick_${resourceClicked.name}`) === 'true';
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to send email to server and update cookie
function sendEmailToServer(email) {
    console.log('Sending email to server:', email);
    const userInfoCookie = getCookie('userInfo');
    if (!userInfoCookie) {
        console.log("No userInfo cookie found, cannot send email");
        return;
    }

    const userInfo = JSON.parse(userInfoCookie);

    // Update the userInfo object with the email in an array
    if (!userInfo.emails) {
        userInfo.emails = [email]; // Initialize emails array if it doesn't exist
    } else if (!userInfo.emails.includes(email)) {
        userInfo.emails.push(email); // Add email to array if not already present
    } else {
        console.log(`Email ${email} already in userInfo.emails array, not adding again`);
        return; // Skip if email already exists in the array
    }
    
    // Update the cookie immediately
    setCookie('userInfo', JSON.stringify(userInfo), 30);

    const payload = {
        email: email,
        lead_id: userInfo.lead_id,
    };
    console.log("Email capture payload:", payload);

    fetch(`https://${SERVER_URL}/api/email-capture/${userInfo.username}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Email capture response from server:', data);
    })
    .catch(error => {
        console.error('Error sending email info:', error);
    });
}

// Function to handle email input changes
function handleEmailInput(email) {
    if (isValidEmail(email)) {
        // Get current userInfo from cookie
        const userInfoCookie = getCookie('userInfo');
        if (!userInfoCookie) return;

        const userInfo = JSON.parse(userInfoCookie);
        
        // Check if this is a new email not already in the emails array
        const isNewEmail = !userInfo.emails || !userInfo.emails.includes(email);
        
        if (isNewEmail) {
            console.log(`New email detected: ${email}, not in current emails array:`, userInfo.emails || []);
            sendEmailToServer(email);
            console.log('Email captured and stored:', email);
        } else {
            console.log(`Email ${email} already stored in emails array, no update needed`);
        }
    } else {
        console.log(`Invalid email format: ${email}`);
    }
}

// Function to set up email tracking
function setupEmailTracking() {
    // Function to set up tracking for a single input
    function setupInputTracking(input) {
        const isEmailField = 
            input.type === 'email' || 
            input.id.toLowerCase().includes('email') ||
            input.name.toLowerCase().includes('email') ||
            input.placeholder.toLowerCase().includes('email');

        if (isEmailField && !input.hasAttribute('data-email-tracking-setup')) {
            console.log(`Setting up email tracking for input: ${input.id || input.name}`);
            
            // Mark this input as already set up
            input.setAttribute('data-email-tracking-setup', 'true');

            // Listen for blur event (when user leaves the field)
            input.addEventListener('blur', (event) => {
                console.log('Email input blur event triggered');
                const email = event.target.value.trim();
                handleEmailInput(email);
            });

            // Listen for form submission if input is within a form
            const form = input.closest('form');
            if (form && !form.hasAttribute('data-email-tracking-setup')) {
                form.setAttribute('data-email-tracking-setup', 'true');
                form.addEventListener('submit', (event) => {
                    const email = input.value.trim();
                    handleEmailInput(email);
                });
            }
        }
    }

    // Initial setup for existing inputs
    document.querySelectorAll('input').forEach(setupInputTracking);

    // Create an observer instance to watch for new inputs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check for added nodes
            mutation.addedNodes.forEach((node) => {
                // Check if the node is an element
                if (node.nodeType === 1) {
                    // If it's an input element, check it directly
                    if (node.tagName === 'INPUT') {
                        setupInputTracking(node);
                    }
                    // If it's another element, check its children for inputs
                    else {
                        node.querySelectorAll('input').forEach(setupInputTracking);
                    }
                }
            });
        });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Function to generate a unique lead ID
function generateLeadId() {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Function to initialize or get userInfo cookie
function initializeUserInfo(customerUsername) {
    let userInfoCookie = getCookie('userInfo');
    
    if (userInfoCookie) {
        let userInfo = JSON.parse(userInfoCookie);
        // Add lead_id if it doesn't exist in existing cookie
        if (!userInfo.lead_id) {
            userInfo.lead_id = generateLeadId();
            setCookie('userInfo', JSON.stringify(userInfo), 30);
        }
        // Ensure emails is an array
        if (userInfo.email && !userInfo.emails) {
            // Migrate from old format (single email) to new format (emails array)
            userInfo.emails = [userInfo.email];
            delete userInfo.email; // Remove the old single email property
            setCookie('userInfo', JSON.stringify(userInfo), 30);
        } else if (!userInfo.emails) {
            userInfo.emails = [];
            setCookie('userInfo', JSON.stringify(userInfo), 30);
        }
        return userInfo;
    } else {
        // Create new userInfo with lead_id and empty emails array
        const userInfo = {
            username: customerUsername,
            lead_id: generateLeadId(),
            emails: [],
            purchases: {}
        };
        setCookie('userInfo', JSON.stringify(userInfo), 30);
        return userInfo;
    }
}

// Add email tracking setup to the DOMContentLoaded event
window.addEventListener('DOMContentLoaded', () => {
    const customerUsername = getMetaContentByName('username');
    if (!customerUsername) {
        return;
    }

    // Initialize userInfo with lead_id
    const userInfo = initializeUserInfo(customerUsername);

    // Set up email tracking
    setupEmailTracking();

    const resourceClicked = getResourceClicked();
    console.log("Resource clicked:", resourceClicked);

    // Check if the resource click should be tracked
    if (resourceClicked.name === 'NA' || resourceClicked.type === 'NA') {
        return;
    }

    // Check if the click has already been tracked for this resource
    if (isResourceClickAlreadyTracked(resourceClicked)) {
        console.log(`Resource click for ${resourceClicked.name} already tracked, skipping`);
        return;
    }

    // Add the resourceClicked to the userInfo
    userInfo.resourceClicked = resourceClicked;

    // Store the updated userInfo cookie
    setCookie('userInfo', JSON.stringify(userInfo), 30);

    // Send the resource click event to the server
    sendResourceClickToServer(resourceClicked);
});
