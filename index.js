import express from 'express';

const app = express();

app.get('/', async (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>PCAP National Governance Dashboard</title>
    <meta charset="UTF-8" />
    <style>
      body {
        margin: 0;
        padding: 40px;
        background: #f1f5f9;
        font-family: Arial, sans-serif;
        color: #0f172a;
      }

      .header {
        background: white;
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }

      .title {
        font-size: 42px;
        font-weight: bold;
      }

      .subtitle {
        margin-top: 12px;
        color: #475569;
        font-size: 18px;
      }

      .grid {
        margin-top: 30px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 20px;
      }

      .card {
        background: white;
        border-radius: 24px;
        padding: 25px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }

      .card-title {
        color: #64748b;
        font-size: 14px;
        font-weight: bold;
      }

      .card-value {
        margin-top: 14px;
        font-size: 52px;
        font-weight: bold;
      }

      .green { color: #16a34a; }
      .blue { color: #2563eb; }
      .orange { color: #f97316; }
      .red { color: #dc2626; }

      .section {
        margin-top: 30px;
        background: white;
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }
    </style>
  </head>

  <body>
    <div class="header">
      <div class="title">
        PCAP National Governance Dashboard
      </div>

      <div class="subtitle">
        Recursive Governance Intelligence Renderer Initialized
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Governance Score</div>
        <div class="card-value green">78%</div>
      </div>

      <div class="card">
        <div class="card-title">Governance Drift</div>
        <div class="card-value orange">32%</div>
      </div>

      <div class="card">
        <div class="card-title">Monitoring Reliability</div>
        <div class="card-value blue">58%</div>
      </div>

      <div class="card">
        <div class="card-title">Escalation Readiness</div>
        <div class="card-value blue">71%</div>
      </div>

      <div class="card">
        <div class="card-title">Escalated Actions</div>
        <div class="card-value red">17</div>
      </div>
    </div>

    <div class="section">
      <h2>Governance Intelligence Summary</h2>

      <p>
        The national governance renderer has been initialized successfully.
        The next deployment phase will integrate Airtable recursive governance aggregation,
        linked sectoral strategy intelligence, governance drift analysis,
        escalation exposure synthesis and ScreenshotOne rendering support.
      </p>
    </div>
  </body>
  </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
