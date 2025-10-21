require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*', credentials: true })); // có thể siết chặt sau
app.use(express.json());

app.get('/', (_, res) => res.json({ ok: true }));
app.use('/auth', require('./routes/auth.routes'));
app.use('/activities', require('./routes/activities.routes'));
app.use('/registrations', require('./routes/registrations.routes'));
app.use('/attendances', require('./routes/attendances.routes'));
app.use('/users', require('./routes/users.routes'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
