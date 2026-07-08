const { io } = require('socket.io-client');
const base = 'http://127.0.0.1:3000';
const rand = () => Math.random().toString(36).slice(2, 8);
async function http(path, body, method = body ? 'POST' : 'GET', token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path}: ${json.error}`);
  return json;
}
function connect(token) {
  const s = io(base, { transports: ['websocket'] });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('socket timeout')), 5000);
    s.on('connect', () => s.emit('session:auth', token));
    s.on('session:auth:ok', () => { clearTimeout(t); resolve(s); });
    s.on('session:auth:error', err => { clearTimeout(t); reject(new Error(err)); });
  });
}
function onceEvent(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), timeout);
    socket.once(event, (...args) => { clearTimeout(t); resolve(args); });
  });
}
(async () => {
  const users = ['alice', 'bob', 'carl', 'dina'].map(x => `${x}_${rand()}`);
  const pass = 'pass1234';
  const sessions = {};
  for (const u of users) {
    const reg = await http('/api/register', { username: u, password: pass });
    sessions[u] = reg;
  }
  const alice = users[0], bob = users[1], carl = users[2], dina = users[3];

  await http('/api/friends/request', { friendName: bob }, 'POST', sessions[alice].token);
  const bootBob = await http('/api/bootstrap', null, 'GET', sessions[bob].token);
  const fr = bootBob.friendRequests[0];
  await http('/api/friends/respond', { id: fr.id, action: 'accept' }, 'POST', sessions[bob].token);
  await http('/api/store/purchase', { sku: 'coins_5k', provider: 'stripe' }, 'POST', sessions[alice].token);
  await http('/api/gifts/send', { recipient: bob, giftType: 'match', rewards: { coins: 100 } }, 'POST', sessions[alice].token);

  const sa = await connect(sessions[alice].token);
  const sb = await connect(sessions[bob].token);
  const sc = await connect(sessions[carl].token);
  const sd = await connect(sessions[dina].token);

  sa.emit('room:create', { gameType: 'chess', name: 'Smoke Room' });
  const [created] = await onceEvent(sa, 'room:created');
  sb.emit('room:join', { code: created.code });
  await onceEvent(sb, 'room:joined');
  sa.emit('game:start');
  const [startPayload] = await onceEvent(sa, 'game:start');
  if (!startPayload.gameType) throw new Error('game:start missing payload');

  const foundCP = onceEvent(sc, 'matchmaking:found');
  const foundDP = onceEvent(sd, 'matchmaking:found');
  sc.emit('matchmaking:join', 'chess');
  sd.emit('matchmaking:join', 'chess');
  const [foundC] = await foundCP;
  const [foundD] = await foundDP;
  if (foundC.code !== foundD.code) throw new Error('matchmaking codes mismatch');
  const readyCP = onceEvent(sc, 'matchmaking:ready', 7000);
  const [readyC] = await readyCP;
  if (!readyC.room?.code) throw new Error('ready payload missing room');

  sa.emit('private:message', { toUser: bob, kind: 'text', content: 'hello from smoke' });
  const [pm] = await onceEvent(sb, 'private:message:new');
  if (pm.content !== 'hello from smoke') throw new Error('private message mismatch');

  sa.emit('invite:friend', { toUsername: bob, gameType: 'chess', roomCode: created.code });
  const [invite] = await onceEvent(sb, 'invite:received');
  sb.emit('invite:respond', { inviteId: invite.id, action: 'accept' });
  await onceEvent(sb, 'invite:auto-join');

  console.log(JSON.stringify({ ok: true, createdRoom: created.code, randomRoom: foundC.code, users }, null, 2));
  [sa, sb, sc, sd].forEach(s => s.disconnect());
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });