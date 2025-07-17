document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById('csvFile');
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('csv_file', file);

  // Show loader, hide result
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

    // Validate data
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No prediction data received.");
    }

    // Update table
    const tableBody = document.querySelector('#resultsTable tbody');
    tableBody.innerHTML = '';

    data.forEach((row, i) => {
      const dateDisplay = row.date ? row.date : `Row ${i + 1}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateDisplay}</td>
        <td>${row.commits}</td>
        <td>${row.messages}</td>
        <td>${row.tickets_closed}</td>
        <td class="${row.at_risk === 1 ? 'at-risk' : 'stable'}">
          ${row.at_risk === 1 ? '🔴 At-Risk' : '🟢 Stable'}
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Setup chart
    const labels = data.map((row, i) => row.date || `Row ${i + 1}`);
    const commits = data.map(row => Number(row.commits));
    const messages = data.map(row => Number(row.messages));

    // Destroy previous chart if it exists
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
            backgroundColor: '#3498db'
          },
          {
            label: 'Messages',
            data: messages,
            backgroundColor: '#2ecc71'
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

    // Show result section
    document.getElementById('resultContainer').style.display = 'block';

  } catch (error) {
    console.error("❌ JS Error:", error);
    alert("Something went wrong: " + error.message);
  } finally {
    document.getElementById('loader').style.display = 'none';
  }
});
