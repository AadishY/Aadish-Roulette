import * as THREE from 'three';

export function updateChatBubbles(scene: THREE.Scene, messages: any[]) {
    if (!messages || messages.length === 0) return;

    scene.children.forEach(child => {
        if (child.name.startsWith("PLAYER_")) {
            const playerName = child.name.replace("PLAYER_", "").toUpperCase();
            const lastMsg = messages.filter(m => {
                const senderName = (m.sender || '').toUpperCase();
                const isRecent = Date.now() - (m.timestamp || 0) < 6000;
                return senderName === playerName && isRecent;
            }).pop();

            const chatGroup = child.userData.chatGroup as THREE.Group;
            if (chatGroup) {
                if (lastMsg) {
                    chatGroup.visible = true;
                    const msgId = lastMsg.id || lastMsg.timestamp;
                    if (chatGroup.userData.lastMsgId !== msgId) {
                        chatGroup.clear();

                        const canvas = document.createElement('canvas');
                        canvas.width = 512; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                            ctx.beginPath();
                            ctx.roundRect(10, 10, 492, 100, 20);
                            ctx.fill();
                            ctx.fillStyle = '#000000';
                            ctx.font = 'bold 36px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const text = lastMsg.text.length > 25 ? lastMsg.text.substring(0, 25) + '...' : lastMsg.text;
                            ctx.fillText(text, 256, 60, 480);
                        }

                        const tex = new THREE.CanvasTexture(canvas);
                        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
                        sprite.scale.set(6, 1.5, 1);
                        chatGroup.add(sprite);

                        chatGroup.userData.lastMsgId = msgId;
                    }
                } else {
                    chatGroup.visible = false;
                }
            }
        }
    });
}

export function updatePlayerHealthBars(scene: THREE.Scene, players: any[]) {
    const avatars = scene.userData.playerAvatars as THREE.Group[] || [];

    avatars.forEach(avatar => {
        const playerId = avatar.userData.playerId;
        const player = players.find(p => p.id === playerId || p.name === avatar.userData.playerName);

        if (player && avatar.userData.hpFill) {
            const hpFill = avatar.userData.hpFill as THREE.Mesh;
            const maxHp = avatar.userData.maxHp || 4;
            const hp = player.hp !== undefined ? player.hp : maxHp;

            // Update health bar width
            const ratio = Math.max(0, hp / maxHp);
            hpFill.scale.x = ratio || 0.01;

            // Change color based on health
            const mat = hpFill.material as THREE.MeshBasicMaterial;
            if (ratio > 0.5) mat.color.setHex(0xff3333);
            else if (ratio > 0.25) mat.color.setHex(0xff9900);
            else mat.color.setHex(0xcc0000);

            // Fade out avatar if eliminated
            if (hp <= 0) {
                avatar.visible = false;
            }
        }
    });
}
