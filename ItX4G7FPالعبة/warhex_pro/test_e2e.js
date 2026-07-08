const { io } = require('socket.io-client');
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const rand = () => Math.random().toString(36).slice(2, 8);

async function http(path, body, method = body ? 'POST' : 'GET', token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${json.error || res.statusText}`);
  return json;
}

function connect(token) {
  const s = io(base, { transports: ['websocket'] });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('socket timeout')), 6000);
    s.on('connect', () => s.emit('session:auth', token));
    s.on('session:auth:ok', () => { clearTimeout(t); resolve(s); });
    s.on('session:auth:error', err => { clearTimeout(t); reject(new Error(err)); });
  });
}

function onceEvent(socket, event, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), timeout);
    socket.once(event, (...args) => {
      clearTimeout(t);
      resolve(args);
    });
  });
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

function hasTxn(rows, category, currency, amount) {
  return (rows || []).some(t => t.category === category && (!currency || t.currency === currency) && (amount == null || Number(t.amountDelta) === Number(amount)));
}

(async () => {
  const users = ['alice', 'bob'].map(x => `${x}_${rand()}`);
  const pass = 'pass1234';
  const sessions = {};
  for (const u of users) sessions[u] = await http('/api/register', { username: u, password: pass });
  const [alice, bob] = users;

  let bootAlice = await http('/api/bootstrap', null, 'GET', sessions[alice].token);
  let bootBob = await http('/api/bootstrap', null, 'GET', sessions[bob].token);
  expect(bootAlice.user.wallet.coins === 2500, 'initial alice coins mismatch');
  expect((bootAlice.giftCatalog || []).length >= 3, 'gift catalog missing');
  expect((bootAlice.roomFeePresets || []).length >= 1, 'room fee presets missing');
  expect(bootAlice.contactLinks?.whatsapp, 'contact links missing');

  await http('/api/store/purchase', { sku: 'coins_5k', provider: 'stripe' }, 'POST', sessions[alice].token);
  bootAlice = await http('/api/bootstrap', null, 'GET', sessions[alice].token);
  expect(bootAlice.user.wallet.coins >= 7500, 'store purchase did not add coins');
  expect(hasTxn(bootAlice.transactions, 'purchase:coins_5k', 'coins', 5000), 'purchase coins transaction missing');
  expect(hasTxn(bootAlice.transactions, 'purchase:coins_5k', 'gems', 0) || true, 'noop');

  const sa = await connect(sessions[alice].token);
  const sb = await connect(sessions[bob].token);

  sa.emit('room:create', { gameType: 'chess', name: 'Premium Room', entryFee: { currency: 'coins', amount: 200, winnerPayout: 350, systemFee: 50, feePercent: 10 } });
  const [created] = await onceEvent(sa, 'room:created');
  expect(created.economy?.entryFee?.amount === 200, 'room economy missing');
  sb.emit('room:join', { code: created.code });
  await onceEvent(sb, 'room:joined');
  sa.emit('game:start');
  await onceEvent(sa, 'game:start');

  const winningState = {
    type: 'chess',
    winner: 'white',
    winnerUsername: alice,
    playerColors: { [alice]: 'white', [bob]: 'black' },
    logs: ['فوز تجريبي'],
    capturedWhite: [],
    capturedBlack: [],
  };
  sa.emit('game:state', winningState);
  await onceEvent(sa, 'game:ended');

  bootAlice = await http('/api/bootstrap', null, 'GET', sessions[alice].token);
  bootBob = await http('/api/bootstrap', null, 'GET', sessions[bob].token);
  expect(hasTxn(bootAlice.transactions, 'room_entry_fee', 'coins', -200), 'alice room entry fee txn missing');
  expect(hasTxn(bootBob.transactions, 'room_entry_fee', 'coins', -200), 'bob room entry fee txn missing');
  expect(hasTxn(bootAlice.transactions, 'room_prize', 'coins', 350), 'alice room prize txn missing');
  expect(hasTxn(bootAlice.transactions, 'match_win', 'coins', 50), 'alice match win coins txn missing');
  expect(bootAlice.user.wallet.coins === 7700, `alice final coins unexpected: ${bootAlice.user.wallet.coins}`);
  expect(bootBob.user.wallet.coins === 2300, `bob final coins unexpected: ${bootBob.user.wallet.coins}`);

  await http('/api/missions/claim', { code: 'daily_play_1' }, 'POST', sessions[alice].token);
  await http('/api/missions/claim', { code: 'daily_win_1' }, 'POST', sessions[alice].token);
  bootAlice = await http('/api/bootstrap', null, 'GET', sessions[alice].token);
  expect(hasTxn(bootAlice.transactions, 'mission:daily_play_1', 'coins', 250), 'daily_play mission txn missing');
  expect(hasTxn(bootAlice.transactions, 'mission:daily_win_1', 'gems', 10), 'daily_win mission txn missing');

  await http('/api/rewards/daily-login', {}, 'POST', sessions[alice].token);
  await http('/api/rewards/calendar/1/claim', {}, 'POST', sessions[alice].token);
  bootAlice = await http('/api/bootstrap', null, 'GET', sessions[alice].token);
  expect(hasTxn(bootAlice.transactions, 'daily_login', 'coins', 200), 'daily login transaction missing');
  expect(hasTxn(bootAlice.transactions, 'daily_streak', 'coins', 150), 'daily streak transaction missing');
  expect(hasTxn(bootAlice.transactions, 'calendar:1', 'coins', 100), 'calendar coins transaction missing');
  expect(hasTxn(bootAlice.transactions, 'calendar:1', 'gems', 5), 'calendar gems transaction missing');

  await http('/api/gifts/send', { recipient: bob, giftType: 'rose' }, 'POST', sessions[alice].token);
  bootAlice = await http('/api/bootstrap', null, 'GET', sessions[alice].token);
  bootBob = await http('/api/bootstrap', null, 'GET', sessions[bob].token);
  expect(hasTxn(bootAlice.transactions, 'gift_send', 'coins', -10), 'gift send transaction missing');
  expect(hasTxn(bootBob.transactions, 'gift_receive', 'coins', 8), 'gift receive transaction missing');

  console.log(JSON.stringify({
    ok: true,
    users,
    room: created.code,
    aliceCoins: bootAlice.user.wallet.coins,
    bobCoins: bootBob.user.wallet.coins,
    aliceTxnCount: bootAlice.transactions.length,
    bobTxnCount: bootBob.transactions.length,
  }, null, 2));

  sa.disconnect();
  sb.disconnect();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
