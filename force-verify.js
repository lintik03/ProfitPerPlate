// Force AdSense Verification
(function forceAdSenseVerification() {
    console.log('Forcing AdSense verification...');
    
    // Method 1: Direct API call (when on AdSense verification page)
    if (window.location.href.includes('adsense.google.com')) {
        setTimeout(function() {
            // Try to trigger verification via iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = 'https://www.profitperplate.com/?adsense_verify=' + Date.now();
            document.body.appendChild(iframe);
            
            // Remove after 5 seconds
            setTimeout(() => iframe.remove(), 5000);
        }, 2000);
    }
    
    // Method 2: Ping Google verification endpoints
    const endpoints = [
        'https://www.google.com/adsense/verification',
        'https://www.google.com/webmasters/verification',
        'https://pagead2.googlesyndication.com/pagead/verification'
    ];
    
    endpoints.forEach(url => {
        fetch(url, { mode: 'no-cors' })
            .then(() => console.log('Pinged:', url))
            .catch(() => {});
    });
})();