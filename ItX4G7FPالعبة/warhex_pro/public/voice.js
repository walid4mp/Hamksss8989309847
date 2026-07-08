const VoiceChat = {
  socket: null,
  localStream: null,
  peers: {},
  active: false,
  muted: false,
  speakerMuted: false,
  iceServers: [],
  audioContext: null,
  voiceTimer: null,
  boundSocketHandlers: null,
  currentRoomKey: null,

  async init(socket) {
    if (this.socket && this.socket !== socket) this.detachSocketHandlers();
    this.socket = socket;
    this.detachSocketHandlers();
    try {
      const r = await fetch('/api/ice-servers?userId=' + encodeURIComponent(socket.id || 'guest'));
      const data = await r.json();
      this.iceServers = data.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];
    } catch {
      this.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    }
    this.boundSocketHandlers = {
      signal: async ({ from, data }) => { await this.handleSignal(from, data); },
      joined: ({ socketId }) => {
        if (this.active && socketId && socketId !== this.socket?.id) this.ensurePeer(socketId, this.socket.id < socketId);
      },
      left: ({ socketId }) => this.removePeer(socketId),
      disconnect: () => this.fullCleanup({ detachSocket: false }),
    };
    socket.on('rtc:signal', this.boundSocketHandlers.signal);
    socket.on('rtc:user-joined', this.boundSocketHandlers.joined);
    socket.on('rtc:user-left', this.boundSocketHandlers.left);
    socket.on('disconnect', this.boundSocketHandlers.disconnect);
  },

  detachSocketHandlers() {
    if (!this.socket || !this.boundSocketHandlers) return;
    this.socket.off('rtc:signal', this.boundSocketHandlers.signal);
    this.socket.off('rtc:user-joined', this.boundSocketHandlers.joined);
    this.socket.off('rtc:user-left', this.boundSocketHandlers.left);
    this.socket.off('disconnect', this.boundSocketHandlers.disconnect);
    this.boundSocketHandlers = null;
  },

  ensureAudioContext() {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.audioContext = new Ctx();
    }
    if (this.audioContext?.state === 'suspended') this.audioContext.resume().catch(() => {});
  },

  async start(roomKey = 'default') {
    if (this.active && this.currentRoomKey === roomKey) return true;
    if (this.active && this.currentRoomKey !== roomKey) this.fullCleanup({ detachSocket: false });
    this.currentRoomKey = roomKey;
    this.ensureAudioContext();
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      video: false,
    });
    this.localStream.getTracks().forEach(track => { track.enabled = !this.muted; });
    this.active = true;
    this.startVoiceMonitor();
    this.socket?.emit('rtc:join');
    return true;
  },

  startVoiceMonitor() {
    clearInterval(this.voiceTimer);
    this.voiceTimer = setInterval(() => this.checkSpeaking(), 300);
  },

  stop() { this.fullCleanup({ detachSocket: false }); },

  fullCleanup({ detachSocket = true } = {}) {
    clearInterval(this.voiceTimer);
    this.voiceTimer = null;
    Object.keys(this.peers).forEach(id => this.removePeer(id));
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => { try { track.stop(); } catch {} });
      this.localStream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    document.querySelectorAll('audio[data-peer="true"]').forEach(a => {
      try { a.srcObject = null; } catch {}
      a.remove();
    });
    this.active = false;
    this.muted = false;
    this.currentRoomKey = null;
    if (detachSocket) this.detachSocketHandlers();
  },

  syncPeers(playerIds) {
    if (!this.active || !this.socket) return;
    const ids = [...new Set((playerIds || []).filter(Boolean))].filter(id => id !== this.socket.id);
    ids.forEach(id => { if (!this.peers[id]) this.ensurePeer(id, this.socket.id < id); });
    Object.keys(this.peers).forEach(id => { if (!ids.includes(id)) this.removePeer(id); });
  },

  ensurePeer(peerId, initiate) {
    if (this.peers[peerId]) return this.peers[peerId];
    const pc = new RTCPeerConnection({ iceServers: this.iceServers, iceTransportPolicy: 'all' });
    const peer = { pc, analyser: null, streamSource: null, remoteCtx: null, audioEl: null, speaking: false, reconnectTimer: null };
    this.peers[peerId] = peer;
    this.localStream?.getTracks().forEach(track => pc.addTrack(track, this.localStream));
    pc.onicecandidate = e => {
      if (e.candidate && this.socket) this.socket.emit('rtc:signal', { to: peerId, data: { candidate: e.candidate } });
    };
    pc.ontrack = e => {
      let audio = peer.audioEl || document.getElementById('audio-' + peerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'audio-' + peerId;
        audio.autoplay = true;
        audio.dataset.peer = 'true';
        document.body.appendChild(audio);
      }
      audio.srcObject = e.streams[0];
      audio.muted = this.speakerMuted;
      peer.audioEl = audio;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        peer.remoteCtx = new Ctx();
        peer.streamSource = peer.remoteCtx.createMediaStreamSource(e.streams[0]);
        peer.analyser = peer.remoteCtx.createAnalyser();
        peer.analyser.fftSize = 256;
        peer.streamSource.connect(peer.analyser);
      } catch {}
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') { try { pc.restartIce(); } catch {} }
      if (pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        clearTimeout(peer.reconnectTimer);
        peer.reconnectTimer = setTimeout(() => {
          if (this.active && this.peers[peerId] && pc.connectionState === 'disconnected') {
            try { pc.restartIce(); } catch {}
          }
        }, 1500);
      }
    };
    if (initiate) this.createOffer(peerId);
    return peer;
  },

  async createOffer(peerId) {
    const peer = this.ensurePeer(peerId, false);
    const offer = await peer.pc.createOffer({ offerToReceiveAudio: true });
    await peer.pc.setLocalDescription(offer);
    this.socket?.emit('rtc:signal', { to: peerId, data: { description: peer.pc.localDescription } });
  },

  async handleSignal(from, data) {
    if (!this.active || !from || !data) return;
    const peer = this.ensurePeer(from, false);
    try {
      if (data.description) {
        await peer.pc.setRemoteDescription(data.description);
        if (data.description.type === 'offer') {
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          this.socket?.emit('rtc:signal', { to: from, data: { description: peer.pc.localDescription } });
        }
      }
      if (data.candidate) await peer.pc.addIceCandidate(data.candidate).catch(() => {});
    } catch {}
  },

  removePeer(peerId) {
    const peer = this.peers[peerId];
    if (!peer) return;
    clearTimeout(peer.reconnectTimer);
    try { peer.pc.close(); } catch {}
    try { peer.streamSource?.disconnect(); } catch {}
    try { peer.remoteCtx?.close(); } catch {}
    if (peer.audioEl) {
      try { peer.audioEl.srcObject = null; } catch {}
      peer.audioEl.remove();
    }
    delete this.peers[peerId];
  },

  toggleMute() {
    if (!this.localStream) return false;
    this.muted = !this.muted;
    this.localStream.getAudioTracks().forEach(track => { track.enabled = !this.muted; });
    return this.muted;
  },

  toggleSpeakerMute() {
    this.speakerMuted = !this.speakerMuted;
    document.querySelectorAll('audio[data-peer="true"]').forEach(a => { a.muted = this.speakerMuted; });
    return this.speakerMuted;
  },

  checkSpeaking() {
    let someone = false;
    Object.values(this.peers).forEach(peer => {
      if (!peer.analyser) return;
      const data = new Uint8Array(peer.analyser.frequencyBinCount);
      peer.analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / Math.max(1, data.length);
      peer.speaking = avg > 18;
      if (peer.speaking) someone = true;
    });
    return someone;
  },

  isActive() { return this.active; },
};
window.addEventListener('beforeunload', () => { try { VoiceChat.fullCleanup(); } catch {} });
if (typeof window !== 'undefined') window.VoiceChat = VoiceChat;
