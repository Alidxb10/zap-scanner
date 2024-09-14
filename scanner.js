const axios = require('axios');

// OWASP ZAP API URLs and API Key
const ZAP_BASE_URL = 'http://localhost:8080'; // Default ZAP URL
const ZAP_API_KEY = 'hvj7vho03ini9quarkj37gsjcn'; // Your ZAP API key
const targetUrl = 'https://altoromutual.com/'; // Target website

// Function to spider (crawl) the target URL
async function spiderTarget() {
    try {
        const spiderResponse = await axios.get(`${ZAP_BASE_URL}/JSON/spider/action/scan/`, {
            params: {
                url: targetUrl,   // The target URL to spider
                apikey: ZAP_API_KEY,
                maxChildren: 2   // Set to spider up to 2 levels deep (lighter spidering)
            }
        });
        const spiderId = spiderResponse.data.scan;
        console.log(`Spider started successfully with ID: ${spiderId}`);
        return spiderId;
    } catch (error) {
        console.error('Error during spidering:', error.response?.data || error.message);
        throw error;
    }
}

// Function to check the progress of the spidering process
async function checkSpiderStatus(spiderId) {
    try {
        const spiderStatusResponse = await axios.get(`${ZAP_BASE_URL}/JSON/spider/view/status/`, {
            params: {
                scanId: spiderId,
                apikey: ZAP_API_KEY
            }
        });
        return spiderStatusResponse.data.status;
    } catch (error) {
        console.error('Error checking spider status:', error.response?.data || error.message);
        throw error;
    }
}

// Function to check passive scan status (optional, as passive scans happen automatically)
async function checkPassiveScanStatus() {
    try {
        const statusResponse = await axios.get(`${ZAP_BASE_URL}/JSON/pscan/view/recordsToScan/`, {
            params: {
                apikey: ZAP_API_KEY
            }
        });
        return statusResponse.data.recordsToScan;
    } catch (error) {
        console.error('Error checking passive scan status:', error.response?.data || error.message);
        throw error;
    }
}

// Function to print scan results (URLs with vulnerabilities)
async function printScanResults() {
    try {
        const alertsResponse = await axios.get(`${ZAP_BASE_URL}/JSON/core/view/alerts/`, {
            params: {
                baseurl: targetUrl,
                apikey: ZAP_API_KEY
            }
        });
        const alerts = alertsResponse.data.alerts;

        console.log("\n--- Vulnerabilities Found ---\n");
        alerts.forEach(alert => {
            console.log(`URL: ${alert.url}`);
            console.log(`Risk: ${alert.risk}`);
            console.log(`Description: ${alert.name}`);
            console.log(`Solution: ${alert.solution}`);
            console.log('-----------------------------\n');
        });

        if (alerts.length === 0) {
            console.log('No vulnerabilities found.');
        }
    } catch (error) {
        console.error('Error fetching scan results:', error.response?.data || error.message);
    }
}

// Main function to execute spidering and check passive scanning results
async function runLightScan() {
    try {
        // Start the spidering process
        const spiderId = await spiderTarget();

        // Check spidering progress every 3 seconds
        let spiderStatus = 0;
        while (spiderStatus < 100) {
            spiderStatus = await checkSpiderStatus(spiderId);
            console.log(`Spider progress: ${spiderStatus}%`);
            await new Promise(resolve => setTimeout(resolve, 3000));  // Wait 3 seconds before rechecking
        }

        console.log('Spidering complete! Checking passive scan status...');

        // Check passive scan status after spidering (if any records remain to scan)
        let recordsToScan = await checkPassiveScanStatus();
        while (recordsToScan > 0) {
            console.log(`Passive scan progress: ${recordsToScan} records left to scan`);
            await new Promise(resolve => setTimeout(resolve, 3000));  // Wait 3 seconds before rechecking
            recordsToScan = await checkPassiveScanStatus();
        }

        console.log('Passive scan complete!');
        console.log('Fetching scan results...');

        // Print scan results (vulnerabilities)
        await printScanResults();
        
    } catch (error) {
        console.error('Error during the light scan process:', error.message);
    }
}

// Run the light scanning process
runLightScan();
