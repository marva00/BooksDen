const getBaseUrl = () => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
        return configuredBaseUrl.trim();
    }
    return "http://localhost:8001";
}

export default getBaseUrl;