const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

let output = {
  id_phien: null,
  ket_qua: null,
  id_phien_ke_tiep: null,
  md5_ke_tiep: null
};

const FIREBASE_URL = 'https://gambai-e4406-default-rtdb.asia-southeast1.firebasedatabase.app/taixiu_sessions.json';

async function fetchAndUpdate() {
  try {
    const res = await axios.get(FIREBASE_URL);
    const data = res.data;

    let endSessions = [];
    let startSessions = [];

    for (const key in data) {
      const item = data[key];
      if (!item.rawData) continue;

      const raw = item.rawData;
      if (raw.includes("mnmdsbgameend")) {
        const match = raw.match(/#(\d+).*?{(\d-\d-\d)}/);
        if (match) {
          endSessions.push({
            id_phien: parseInt(match[1]),
            ket_qua: match[2],
            time: item.time
          });
        }
      }

      if (raw.includes("mnmdsbgamestart")) {
        const match = raw.match(/ ([a-f0-9]{32})$/);
        if (match) {
          startSessions.push({
            md5: match[1],
            time: item.time
          });
        }
      }
    }

    // Sắp xếp theo thời gian gần nhất
    endSessions.sort((a, b) => new Date(b.time) - new Date(a.time));
    startSessions.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (endSessions.length > 0) {
      output.id_phien = endSessions[0].id_phien;
      output.ket_qua = endSessions[0].ket_qua;
      output.id_phien_ke_tiep = endSessions[0].id_phien + 1;
    }

    if (startSessions.length > 0) {
      output.md5_ke_tiep = startSessions[0].md5;
    }
  } catch (err) {
    console.error('Lỗi lấy dữ liệu:', err.message);
  }
}

// Cập nhật mỗi 3 giây
setInterval(fetchAndUpdate, 3000);
fetchAndUpdate();

app.get('/data', (req, res) => {
  res.json(output);
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
