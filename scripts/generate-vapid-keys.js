import webPush from 'web-push';

const { privateKey, publicKey } = webPush.generateVAPIDKeys();

console.log('VAPID_PRIVATE_KEY=', privateKey);
console.log('VAPID_PUBLIC_KEY=', publicKey);
