export const proxyFetch = async (url: string, init?: RequestInit) => {
    return fetch('https://reverse-proxy-ebon.vercel.app', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-PROXY-SECRET': 'Ennis01+'
        },
        body: JSON.stringify({
            url,
            ...init
        })
    })
}