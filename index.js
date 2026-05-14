const {
    default: makeWASocket,
    useMultiFileAuthState
} = require('@whiskeysockets/baileys');

const P = require('pino');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection }) => {
        console.log('Status:', connection);

        if (connection === 'open') {
            console.log('Bot siap!');
        }

        if (connection === 'close') {
            console.log('Reconnect ulang...');
            startBot();
        }
    });

    if (!sock.authState.creds.registered) {
        rl.question('Masukkan nomor WA (628xxxx): ', async (number) => {
            const code = await sock.requestPairingCode(number);
            console.log('Pairing code:', code);
        });
    }

    sock.ev.on('group-participants.update', async (anu) => {
        if (anu.action === 'add') {
            for (let participant of anu.participants) {
                const userId = participant.id || participant;

                await sock.sendMessage(anu.id, {
                    text: `Halo @${userId.split('@')[0]} 👋

Selamat datang member baru di grup ini.
Semoga betah dan nyaman berada di sini.

Jangan lupa join saluran kami:

📢 𝗠𝗼𝗱𝘀𝗔𝗱𝗶𝗹
https://whatsapp.com/channel/0029Vb72Ig3HQbS40wrAiR0i

📢 𝗔𝗽𝗽𝗔𝗱𝗶𝗹.𝗜𝗗
https://whatsapp.com/channel/0029Vb7vTBRKmCPPXlGTj23g`,
                    mentions: [userId]
                });
            }
        }
    });
}

startBot();