import json
import os

with open("class12_analyzed_students.json", "r", encoding="utf-8") as f:
    students = json.load(f)

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class 12 Guardian Performance & Pending DPP Analysis Report - Accuracy Pintu Sahoo</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #f97316;
      --primary-dark: #ea580c;
      --primary-light: #fff7ed;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
      --emerald-600: #16a34a;
      --emerald-50: #f0fdf4;
      --red-600: #dc2626;
      --red-50: #fef2f2;
      --amber-600: #d97706;
      --amber-50: #fffbeb;
      --blue-600: #0284c7;
      --blue-50: #f0f9ff;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090d16;
      color: #0f172a;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .no-print {
      display: block;
    }
    .app-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 24px 20px;
      border-bottom: 2px solid #f97316;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .logo-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      background: rgba(249, 115, 22, 0.2);
      color: #f97316;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(249, 115, 22, 0.4);
      margin-bottom: 6px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header-desc {
      font-size: 12px;
      color: #94a3b8;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .search-box {
      position: relative;
      min-width: 260px;
    }
    .search-input {
      width: 100%;
      background: #0f172a;
      color: white;
      border: 1px solid #334155;
      padding: 10px 14px 10px 36px;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.25);
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      font-size: 14px;
    }
    .filter-select {
      background: #0f172a;
      color: white;
      border: 1px solid #334155;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      cursor: pointer;
      outline: none;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #f97316;
      color: white;
    }
    .btn-primary:hover {
      background: #ea580c;
    }
    .btn-secondary {
      background: #334155;
      color: white;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .main-container {
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 16px;
    }
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 16px;
      color: white;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .stat-val {
      font-size: 26px;
      font-weight: 900;
    }
    
    /* Student Card Layout */
    .student-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      margin-bottom: 24px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      page-break-after: always;
      break-after: page;
    }
    .card-head {
      background: #0f172a;
      color: white;
      padding: 20px 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 3px solid #f97316;
    }
    .student-name-box h2 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .student-meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11px;
    }
    .pill {
      background: rgba(255,255,255,0.1);
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 600;
    }
    .pill-orange {
      background: rgba(249, 115, 22, 0.2);
      color: #fb923c;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }
    .pill-cyan {
      background: rgba(6, 182, 212, 0.2);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .status-badge {
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-critical {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }
    .status-backlog {
      background: #fff7ed;
      color: #ea580c;
      border: 1px solid #fdba74;
    }
    .status-active {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #86efac;
    }
    .status-moderate {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .card-contact {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      font-size: 12px;
    }
    .contact-item span {
      color: #64748b;
      font-weight: 600;
      margin-right: 4px;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 16px 24px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
    }
    @media (max-width: 640px) {
      .metrics-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .metric-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
      background: #f8fafc;
    }
    .metric-num {
      font-size: 24px;
      font-weight: 900;
      margin-top: 2px;
    }
    .metric-sub {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    .card-body {
      padding: 20px 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge-count {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 800;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: white;
    }
    .data-table {
      width: 100%;
      min-width: 550px;
      border-collapse: collapse;
      font-size: 12px;
      background: white;
    }
    .data-table th {
      background: #0f172a;
      color: white;
      padding: 8px 12px;
      font-weight: 700;
      text-align: left;
    }
    .data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .data-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .pending-table th {
      background: #991b1b;
    }
    .pending-table tr:nth-child(even) td {
      background: #fff5f5;
    }

    .remark-card {
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-radius: 12px;
      padding: 14px 18px;
      margin-top: 12px;
    }
    .remark-title {
      font-size: 11px;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .remark-text {
      font-size: 12.5px;
      color: #7c2d12;
      font-weight: 500;
      line-height: 1.5;
    }

    /* Print Specific Rules */
    @media print {
      body {
        background: white !important;
        color: black !important;
      }
      .no-print {
        display: none !important;
      }
      .main-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .student-card {
        box-shadow: none !important;
        border: 1px solid #94a3b8 !important;
        margin-bottom: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .card-head {
        background: #0f172a !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .data-table th {
        background: #0f172a !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .pending-table th {
        background: #991b1b !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .remark-card {
        background: #fff7ed !important;
        border: 1px solid #ea580c !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- App Header (Screen Only) -->
  <header class="app-header no-print">
    <div class="header-inner">
      <div>
        <span class="logo-badge">Accuracy Physics Academy</span>
        <h1 class="header-title">Class 12 Guardian Performance & DPP Dossier</h1>
        <p class="header-desc">Detailed Name-Wise Analysis: Appeared Exams, Pending DPP Quizzes & Guardian Counseling Remarks</p>
      </div>

      <div class="controls">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="Search student by name, phone, school..." oninput="filterCards()">
        </div>

        <select id="statusFilter" class="filter-select" onchange="filterCards()">
          <option value="all">All Statuses</option>
          <option value="active">Actively Appearing</option>
          <option value="backlog">High Backlog (Pending ≥ 8)</option>
          <option value="critical">Zero Attempts (Critical)</option>
        </select>

        <select id="aspirationFilter" class="filter-select" onchange="filterCards()">
          <option value="all">All Aspirations</option>
          <option value="NEET">NEET</option>
          <option value="JEE">JEE</option>
          <option value="WB">WB Board</option>
          <option value="CBSE">CBSE / ISC</option>
        </select>

        <button class="btn btn-primary" onclick="window.print()">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  </header>

  <main class="main-container">
    <!-- Top Summary Strip (Screen Only) -->
    <div class="stats-strip no-print">
      <div class="stat-card">
        <div class="stat-label">Total Class 12 Students</div>
        <div class="stat-val" style="color: #f8fafc;">""" + str(len(students)) + """</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Actively Appearing</div>
        <div class="stat-val" style="color: #22c55e;">""" + str(len([s for s in students if s['total_appeared'] > 0])) + """</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Zero Attempts (Critical)</div>
        <div class="stat-val" style="color: #ef4444;">""" + str(len([s for s in students if s['total_appeared'] == 0])) + """</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Exam Attempts</div>
        <div class="stat-val" style="color: #38bdf8;">""" + str(sum(s['total_appeared'] for s in students)) + """</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Batch Avg Accuracy</div>
        <div class="stat-val" style="color: #fb923c;">""" + str(round(sum(s['accuracy'] for s in students if s['total_appeared'] > 0) / (len([s for s in students if s['total_appeared'] > 0]) or 1), 1)) + """%</div>
      </div>
    </div>

    <!-- Student Cards Loop -->
    <div id="studentsList">
"""

for idx, s in enumerate(students, 1):
    appeared = s['total_appeared']
    pending = s['total_pending']
    acc = s['accuracy']
    
    if appeared == 0:
        status_key = "critical"
        status_badge_html = '<span class="status-badge status-critical">Critical: 0 Attempts</span>'
    elif pending >= 8:
        status_key = "backlog"
        status_badge_html = '<span class="status-badge status-backlog">High Pending Backlog</span>'
    elif acc >= 50:
        status_key = "active"
        status_badge_html = '<span class="status-badge status-active">Consistent Learner</span>'
    else:
        status_key = "moderate"
        status_badge_html = '<span class="status-badge status-moderate">Needs Regular Practice</span>'

    # Appeared table HTML
    if appeared == 0:
        appeared_table_html = """
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; color: #991b1b; font-size: 13px; font-weight: 600; margin-bottom: 20px;">
          ⚠️ <b>GUARDIAN ATTENTION REQUIRED:</b> This student has not yet appeared for any tests or DPP quizzes via the app. Immediate checkup with the guardian is advised to ensure they install and attend scheduled tests.
        </div>
        """
    else:
        rows = ""
        for res in s['results']:
            d_str = str(res.get('created_at', ''))[:10]
            t_title = res.get('title') or res.get('exam_type') or 'Test'
            t_type = res.get('exam_type') or 'Quiz'
            score = str(res.get('score', 0))
            c_cnt = res.get('correct_count', 0)
            tot_q = res.get('total_questions', 0)
            ans_data = res.get('answers') or {}
            att_q = len(ans_data) if isinstance(ans_data, dict) else c_cnt
            w_cnt = max(0, att_q - c_cnt)
            l_cnt = max(0, tot_q - att_q)
            t_acc = round((c_cnt / tot_q) * 100, 1) if tot_q > 0 else 0
            is_gr = "Graded" if res.get('is_graded') else "Submitted"
            
            rows += f"""
            <tr>
              <td>{d_str}</td>
              <td><b>{t_title}</b></td>
              <td><span class="pill pill-cyan">{t_type}</span></td>
              <td style="font-weight: 800; color: #0284c7;">{score}</td>
              <td style="color: #16a34a; font-weight: 700;">{c_cnt}</td>
              <td style="color: #dc2626; font-weight: 700;">{w_cnt}</td>
              <td style="color: #d97706;">{l_cnt}</td>
              <td><b>{t_acc}%</b></td>
              <td style="font-size: 11px; color: #64748b;">{is_gr}</td>
            </tr>
            """
        appeared_table_html = f"""
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Test Title</th>
                <th>Type</th>
                <th>Score</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Left</th>
                <th>Accuracy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
        """

    # Pending table HTML
    if pending == 0:
        pending_table_html = """
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; color: #166534; font-size: 13px; font-weight: 600; margin-bottom: 20px;">
          ✅ <b>EXCELLENT COMPLIANCE:</b> All assigned tests and DPP quizzes have been completed. No pending backlog!
        </div>
        """
    else:
        p_rows = ""
        for p_idx, pt in enumerate(s['pending'], 1):
            pt_title = pt.get('title', 'Test')
            pt_type = pt.get('exam_type', 'Quiz')
            pt_batch = pt.get('target_batch', 'All Students')
            p_rows += f"""
            <tr>
              <td style="text-align: center;">{p_idx}</td>
              <td><b>{pt_title}</b></td>
              <td><span class="pill pill-orange">{pt_type}</span></td>
              <td>{pt_batch}</td>
              <td style="color: #dc2626; font-weight: 800;">Pending - Must Attempt</td>
            </tr>
            """
        pending_table_html = f"""
        <div class="table-responsive">
          <table class="data-table pending-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Assessment Title</th>
                <th>Category</th>
                <th>Target Batch</th>
                <th>Action Required</th>
              </tr>
            </thead>
            <tbody>
              {p_rows}
            </tbody>
          </table>
        </div>
        """

    # Counseling remarks
    if appeared == 0:
        remark_text = "CRITICAL: Student has zero test attempts recorded on the portal. Guardian should ensure regular app attendance, check for technical or login issues, and schedule daily practice sessions."
    elif acc >= 60:
        remark_text = f"EXCELLENT: Student demonstrates solid subject grasp with {acc}% accuracy across {appeared} tests. Immediate focus should be on clearing the remaining {pending} pending DPP quizzes to maintain rank."
    elif acc >= 35:
        remark_text = f"CONSISTENT: Student is showing steady effort ({appeared} exams taken, {s['avg_score']} avg score). Needs to decrease negative marking and complete the {pending} pending DPP quizzes for complete coverage."
    else:
        remark_text = f"NEEDS IMPROVEMENT: Accuracy is currently {acc}% with {pending} pending tests. Guardian is advised to supervise formula revision and ensure all chapter DPPs are thoroughly practiced."

    s_name = str(s.get('name') or 'Unnamed')
    s_email = str(s.get('email') or 'N/A')
    s_phone = str(s.get('phone') or 'N/A')
    s_school = str(s.get('school') or 'N/A')
    s_asp = str(s.get('aspiration') or 'N/A')
    s_board = str(s.get('board') or 'N/A')
    s_batch = str(s.get('batch') or 'N/A')
    s_class = str(s.get('class') or '12')

    html_content += f"""
    <div class="student-card" data-name="{s_name.lower()}" data-email="{s_email.lower()}" data-phone="{s_phone.lower()}" data-school="{s_school.lower()}" data-status="{status_key}" data-aspiration="{s_asp}" data-board="{s_board}">
      <div class="card-head">
        <div class="student-name-box">
          <h2>{idx}. {s_name}</h2>
          <div class="student-meta-pills">
            <span class="pill">ID: {s['profile']['id'][:8]}</span>
            <span class="pill">Class {s_class}</span>
            <span class="pill pill-cyan">Target: {s_asp}</span>
            <span class="pill">Board: {s_board}</span>
            <span class="pill pill-orange">Batch: {s_batch}</span>
          </div>
        </div>
        <div>
          {status_badge_html}
        </div>
      </div>

      <div class="card-contact">
        <div class="contact-item"><span>School:</span> <b>{s_school}</b></div>
        <div class="contact-item"><span>Phone:</span> <b>{s_phone}</b></div>
        <div class="contact-item"><span>Email:</span> <b>{s_email}</b></div>
      </div>

      <div class="metrics-row">
        <div class="metric-box">
          <div class="metric-sub">TESTS APPEARED</div>
          <div class="metric-num" style="color: #0284c7;">{s['total_appeared']}</div>
          <div class="metric-sub">{s['unique_appeared']} Unique Exams</div>
        </div>
        <div class="metric-box">
          <div class="metric-sub">TESTS & DPPS PENDING</div>
          <div class="metric-num" style="color: #dc2626;">{s['total_pending']}</div>
          <div class="metric-sub">Backlog Unattempted</div>
        </div>
        <div class="metric-box">
          <div class="metric-sub">AVERAGE MARKS</div>
          <div class="metric-num" style="color: #ea580c;">{s['avg_score']}</div>
          <div class="metric-sub">Highest: {s['max_score']}</div>
        </div>
        <div class="metric-box">
          <div class="metric-sub">OVERALL ACCURACY</div>
          <div class="metric-num" style="color: #16a34a;">{s['accuracy']}%</div>
          <div class="metric-sub">Correct Ratio</div>
        </div>
      </div>

      <div class="card-body">
        <div class="section-title">
          <span>1. Appeared Exams & DPP Quizzes</span>
          <span class="badge-count" style="background: #e0f2fe; color: #0369a1;">{s['total_appeared']} Attempts</span>
        </div>
        {appeared_table_html}

        <div class="section-title" style="color: #991b1b; margin-top: 24px;">
          <span>2. Pending Tests & DPP Quizzes</span>
          <span class="badge-count" style="background: #fee2e2; color: #991b1b;">{s['total_pending']} Pending</span>
        </div>
        {pending_table_html}

        <div class="remark-card">
          <div class="remark-title">Teacher's Diagnostic Remark for Guardian</div>
          <div class="remark-text">{remark_text}</div>
        </div>
      </div>
    </div>
    """

html_content += """
    </div>
  </main>

  <script>
    function filterCards() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const status = document.getElementById('statusFilter').value;
      const asp = document.getElementById('aspirationFilter').value;
      const cards = document.querySelectorAll('.student-card');

      cards.forEach(c => {
        const name = c.dataset.name || '';
        const email = c.dataset.email || '';
        const phone = c.dataset.phone || '';
        const school = c.dataset.school || '';
        const cardStatus = c.dataset.status || '';
        const cardAsp = c.dataset.aspiration || '';
        const cardBoard = c.dataset.board || '';

        const matchesQuery = !q || name.includes(q) || email.includes(q) || phone.includes(q) || school.includes(q);
        const matchesStatus = status === 'all' || cardStatus === status;
        const matchesAsp = asp === 'all' || cardAsp.includes(asp) || cardBoard.includes(asp);

        if (matchesQuery && matchesStatus && matchesAsp) {
          c.style.display = 'block';
        } else {
          c.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>
"""

with open("CLASS_12_GUARDIAN_ANALYSIS_REPORT.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML report generated at: {os.path.abspath('CLASS_12_GUARDIAN_ANALYSIS_REPORT.html')}")
