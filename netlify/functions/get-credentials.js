exports.handler = async function(event, context) {
    try {
        // Lấy credentials từ environment variable
        const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
        
        return {
            statusCode: 200,
            body: credentials
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not retrieve credentials' })
        };
    }
};
