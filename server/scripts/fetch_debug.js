
async function fetchRun() {
    try {
        const res = await fetch('http://localhost:5000/api/products/debug');
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
fetchRun();
