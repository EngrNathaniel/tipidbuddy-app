import https from 'https';

const projectId = "cchayicghnuxlkiipgxv";
const url = `https://${projectId}.supabase.co/rest/v1/`;

console.log(`\nTesting connection to Supabase: ${url}`);
console.log('Please wait...\n');

const req = https.get(url, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log(`Response Message: ${res.statusMessage}`);

    if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
        console.log('\n✅ SUCCESS: Connection to Supabase is working!');
        console.log('The issue might be in the Browser (Extensions, CORS, etc).');
    } else {
        console.log('\n❌ FAILURE: Received unexpected status code.');
    }
});

req.on('error', (e) => {
    console.error(`\n❌ ERROR: Could not connect to Supabase.`);
    console.error(`Reason: ${e.message}`);
    console.error('\nPOSSIBLE CAUSES:');
    console.error('1. No Internet Connection');
    console.error('2. Firewall or Antivirus blocking the connection');
    console.error('3. VPN or Proxy issues');
    console.error('4. DNS resolution failure');
});

req.end();
