document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById('csvFile');
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('csv_file', file);

  document.getElementById('loader').style.display = 'block';
  document.getElementById('resultContainer').style.display = 'none';

  try {
    const response = await fetch('/predict', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No prediction data received.");
    }

    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = '';

    data.forEach((row, i) => {
      const dateDisplay = row.date || '-';
      const statusHTML = row.at_risk === 1
        ? '<span class="text-red-600 font-bold">🔴 At-Risk</span>'
        : '<span class="text-green-600 font-bold">🟢 Stable</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2 border">${dateDisplay}</td>
        <td class="p-2 border">${row.commits}</td>
        <td class="p-2 border">${row.messages}</td>
        <td class="p-2 border">${row.tickets_closed}</td>
        <td class="p-2 border">${statusHTML}</td>
      `;
      tableBody.appendChild(tr);
    });

    const labels = data.map(row => row.date || '-');
    const commits = data.map(row => Number(row.commits));
    const messages = data.map(row => Number(row.messages));

    if (window.activityChart instanceof Chart) {
      window.activityChart.destroy();
    }

    const ctx = document.getElementById('activityChart').getContext('2d');
    window.activityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Commits',
            data: commits,
            backgroundColor: '#3B82F6'
          },
          {
            label: 'Messages',
            data: messages,
            backgroundColor: '#10B981'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: '📊 Team Activity Chart'
          }
        }
      }
    });

    document.getElementById('resultContainer').style.display = 'block';

  } catch (error) {
    console.error("❌ JS Error:", error);
    alert("Something went wrong: " + error.message);
  } finally {
    document.getElementById('loader').style.display = 'none';
  }
});
