const TelegramBot = require('node-telegram-bot-api');
const token = '6525308122:AAFKbYAxhSoHhl4ikWAfYYIInrQHQkrRs6w';
const bot = new TelegramBot(token, { polling: true });
const rooms = {};
const userRooms = {};
const lastStickerTime = {};

bot.onText(/\/leave/, (msg) => {
    const chatId = msg.chat.id;
    const roomId = userRooms[chatId];
    if (rooms[roomId]) {
        const roomName = `Комната с ID: ${roomId}`;
        const userIndex = rooms[roomId].findIndex((participant) => participant.id === chatId);
        if (userIndex !== -1) {
            rooms[roomId].splice(userIndex, 1);
            delete userRooms[chatId];
            bot.sendMessage(chatId, `Вы покинули комнату. 👋`, {
                reply_markup: { keyboard: [[{ text: '/create' }], [{ text: '/join' }]], resize_keyboard: true },
            });
            rooms[roomId].forEach((participant) => {
                bot.sendMessage(participant.id, `@${msg.from.username} покинул комнату. 😔`);
            });
        } else {
            bot.sendMessage(chatId, 'Вы не находитесь в какой-либо комнате. Вам необходимо присоединиться к комнате с помощью команды /join.', {
                reply_markup: { keyboard: [[{ text: '/create' }], [{ text: '/join' }]], resize_keyboard: true },
            });
        }
    }
});

bot.onText(/\/create/, (msg) => {
    const chatId = msg.chat.id;
    if (userRooms[chatId]) {
        bot.sendMessage(chatId, 'Вы уже создали комнату и не можете создать другую. 😊', {
            reply_markup: { keyboard: [[{ text: '/delete' }], [{ text: '/members' }]], resize_keyboard: true },
        });
    } else {
        const roomId = Math.random().toString().substr(2, 4);
        rooms[roomId] = [{ id: chatId, name: msg.from.username }];
        userRooms[chatId] = roomId;
        bot.sendDocument(chatId, 'https://media.giphy.com/media/26FPJGjhefSJuaRhu/giphy.gif', {
            caption: `Вы создали комнату с ID: ${roomId} 🌟`,
            reply_markup: { keyboard: [[{ text: '/delete' }], [{ text: '/members' }]], resize_keyboard: true },
        });
    }
});

bot.onText(/\/join (\d{4})/, (msg, match) => {
    const chatId = msg.chat.id;
    const roomId = match[1];
    if (rooms[roomId]) {
        if (userRooms[chatId]) {
            bot.sendMessage(chatId, 'Вы уже находитесь в комнате. Нельзя присоединиться к другой комнате. 😊', {
                reply_markup: { keyboard: [[{ text: '/members' }], [{ text: '/delete' }]], resize_keyboard: true },
            });
        } else {
            const participant = { id: chatId, name: msg.from.username };
            rooms[roomId].push(participant);
            userRooms[chatId] = roomId;
            let members = 'Участники комнаты:\n';
            rooms[roomId].forEach((member, index) => {
                members += `${index + 1}. @${member.name}\n`;
            });
            bot.sendDocument(chatId, 'https://media.giphy.com/media/26FPJGjhefSJuaRhu/giphy.gif', {
                caption: `Вы присоединились к комнате с ID: ${roomId} 🎉\n\n${members}`,
            });
            rooms[roomId].forEach((participant) => {
                if (participant.id !== chatId) {
                    bot.sendMessage(participant.id, `@${msg.from.username} присоединился к комнате. 🎉`);
                }
            });
        }
    } else {
        bot.sendMessage(chatId, 'Комната с указанным ID не найдена. 😞', {
            reply_markup: { keyboard: [[{ text: '/create' }]], resize_keyboard: true },
        });
    }
});

bot.onText(/\/members/, (msg) => {
    const chatId = msg.chat.id;
    const roomId = userRooms[chatId];
    if (rooms[roomId]) {
        let members = 'Участники комнаты:\n';
        rooms[roomId].forEach((member, index) => {
            members += `${index + 1}. @${member.name}\n`;
        });
        bot.sendMessage(chatId, members, { reply_markup: { keyboard: [[{ text: '/delete' }]], resize_keyboard: true } });
    } else {
        bot.sendMessage(chatId, 'Вы не присоединились ни к одной комнате. Создайте комнату с помощью /create или присоединитесь к существующей комнате с помощью /join <room_id>. 🌟', {
            reply_markup: { keyboard: [[{ text: '/create' }]], resize_keyboard: true },
        });
    }
});

bot.onText(/\/delete/, (msg) => {
    const chatId = msg.chat.id;
    const roomId = userRooms[chatId];
    if (rooms[roomId]) {
        const roomCreatorId = rooms[roomId][0].id;
        const roomName = `Комната с ID: ${roomId}`;
        if (roomCreatorId === chatId) {
            const roomParticipants = rooms[roomId].filter((participant) => participant.id !== chatId);
            delete rooms[roomId];
            delete userRooms[chatId];
            bot.sendMessage(chatId, 'Комната успешно удалена. 🗑️', {
                reply_markup: { keyboard: [[{ text: '/create' }]], resize_keyboard: true },
            });
            roomParticipants.forEach((participant) => {
                bot.sendMessage(participant.id, `${roomName} была удалена владельцем комнаты. 😔`);
            });
        } else {
            bot.sendMessage(chatId, 'Вы не можете удалить комнату, так как вы не являетесь ее создателем. 😔', {
                reply_markup: { keyboard: [[{ text: '/create' }]], resize_keyboard: true },
            });
        }
    } else {
        bot.sendMessage(chatId, 'Вы не присоединились ни к одной комнате. Создайте комнату с помощью /create или присоединитесь к существующей комнате с помощью /join <room_id>. 🌟', {
            reply_markup: { keyboard: [[{ text: '/create' }]], resize_keyboard: true },
        });
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const chatUsername = msg.from.username;
    let sent = false;
    for (const roomId in rooms) {
        if (rooms[roomId].some((participant) => participant.id === chatId)) {
            if (msg.text) {
                rooms[roomId].forEach((participant) => {
                    if (participant.id !== chatId) {
                        bot.sendMessage(participant.id, `@${chatUsername}: ${msg.text} 🙂`);
                        sent = true;
                    }
                });
            } else if (msg.sticker) {
                const currentTime = Date.now();
                if (!lastStickerTime[chatId] || currentTime - lastStickerTime[chatId] >= 10000) {
                    const stickerId = msg.sticker.file_id;
                    rooms[roomId].forEach((participant) => {
                        if (participant.id !== chatId) {
                            bot.sendSticker(participant.id, stickerId);
                            sent = true;
                        }
                    });
                    lastStickerTime[chatId] = currentTime;
                } else {
                    bot.sendMessage(chatId, 'Вы можете отправлять стикеры раз в 10 секунд. 🕒');
                }
            }
        }
    }
    if (!sent && !msg.text.startsWith('/create') && !msg.text.startsWith('/members') && !msg.text.startsWith('/join') && !msg.text.startsWith('/delete')) {
        if (!userRooms[chatId]) {
            bot.sendMessage(
                chatId,
                'Вы не присоединились ни к одной комнате. Создайте комнату с помощью /create или присоединитесь к существующей комнате с помощью /join <room_id>. 🌟',
                { reply_markup: { keyboard: [[{ text: '/create' }]], resize_keyboard: true } }
            );
        }
    }
});
