/* ========================================
   🌐 WebRTC Multiplayer System
   PeerJS-based P2P Connection
======================================== */

class MultiplayerSystem {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.roomId = null;
        this.isHost = false;
        this.connected = false;
        this.onStateReceived = null;
        this.onConnected = null;
        this.onDisconnected = null;
        this.statusElement = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            // Load PeerJS from CDN
            if (!window.Peer) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load PeerJS'));
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    generateRoomId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    async createRoom() {
        await this.init();

        this.roomId = this.generateRoomId();
        this.isHost = true;

        return new Promise((resolve, reject) => {
            this.peer = new Peer('snake-' + this.roomId);

            this.peer.on('open', (id) => {
                console.log('Room created:', this.roomId);
                this.updateStatus('waiting', 'Waiting for player...');

                // Update URL with room code
                const url = new URL(window.location.href);
                url.searchParams.set('room', this.roomId);
                window.history.pushState({}, '', url);

                resolve(this.roomId);
            });

            this.peer.on('connection', (conn) => {
                this.connection = conn;
                this.setupConnection();
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                this.updateStatus('disconnected', 'Connection error');
                reject(err);
            });
        });
    }

    async joinRoom(roomId) {
        await this.init();

        this.roomId = roomId.toUpperCase();
        this.isHost = false;

        return new Promise((resolve, reject) => {
            this.peer = new Peer();

            this.peer.on('open', () => {
                this.updateStatus('connecting', 'Connecting...');
                this.connection = this.peer.connect('snake-' + this.roomId);
                this.setupConnection();

                this.connection.on('open', () => {
                    resolve(this.roomId);
                });
            });

            this.peer.on('error', (err) => {
                console.error('Join error:', err);
                this.updateStatus('disconnected', 'Failed to join');
                reject(err);
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    setupConnection() {
        this.connection.on('open', () => {
            this.connected = true;
            this.updateStatus('connected', 'Connected!');

            if (typeof audio !== 'undefined') {
                audio.playConnect();
            }

            if (this.onConnected) {
                this.onConnected();
            }
        });

        this.connection.on('data', (data) => {
            if (this.onStateReceived) {
                this.onStateReceived(data);
            }
        });

        this.connection.on('close', () => {
            this.connected = false;
            this.updateStatus('disconnected', 'Disconnected');

            if (this.onDisconnected) {
                this.onDisconnected();
            }
        });

        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            this.updateStatus('disconnected', 'Error');
        });
    }

    sendState(state) {
        if (this.connection && this.connected) {
            this.connection.send(state);
        }
    }

    updateStatus(status, message) {
        if (!this.statusElement) {
            this.statusElement = document.createElement('div');
            this.statusElement.className = 'connection-status';
            document.body.appendChild(this.statusElement);
        }

        this.statusElement.className = `connection-status ${status}`;
        this.statusElement.textContent = message;
    }

    getShareableLink() {
        const url = new URL(window.location.href);
        url.searchParams.set('room', this.roomId);
        return url.toString();
    }

    getRoomFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room');
    }

    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
        this.connected = false;
        this.connection = null;
        this.peer = null;
        this.roomId = null;

        // Clear URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.pushState({}, '', url);

        if (this.statusElement) {
            this.statusElement.remove();
            this.statusElement = null;
        }
    }

    isConnected() {
        return this.connected;
    }
}

// Global multiplayer instance
const multiplayer = new MultiplayerSystem();

// Check for room code in URL on load
document.addEventListener('DOMContentLoaded', () => {
    const roomCode = multiplayer.getRoomFromURL();
    if (roomCode) {
        // Will be handled by game.js to auto-join
        console.log('Room code in URL:', roomCode);
    }
});
