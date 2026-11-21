import json

with open("class12_analyzed_students.json", "r", encoding="utf-8") as f:
    students = json.load(f)

md = []
md.append("# ACCURACY - PINTU SAHOO PHYSICS ACADEMY")
md.append("## Class 12 & Droppers: Comprehensive Guardian Diagnostic & Pending DPP Report")
md.append(f"**Total Students Analyzed:** {len(students)} | **Active Test Takers:** {len([s for s in students if s['total_appeared'] > 0])} | **Zero Attempts (Critical):** {len([s for s in students if s['total_appeared'] == 0])}\n")
md.append("---\n")

md.append("### Master Roster & Quick Directory\n")
md.append("| # | Student Name | Class / Board | Target | Appeared | Pending | Avg Score | Accuracy | Guardian Status |")
md.append("|---|--------------|---------------|--------|----------|---------|-----------|----------|-----------------|")

for idx, s in enumerate(students, 1):
    app = s['total_appeared']
    pend = s['total_pending']
    acc = s['accuracy']
    if app == 0:
        st = "CRITICAL (0 Taken)"
    elif pend >= 8:
        st = "High Backlog"
    elif acc >= 50:
        st = "Consistent"
    else:
        st = "Needs Practice"
    
    md.append(f"| {idx} | **{s['name']}** | {s['class']} / {s['board']} | {s['aspiration']} | {app} | {pend} | {s['avg_score']} | {acc}% | {st} |")

md.append("\n---\n")
md.append("## Detailed Student-by-Student Guardian Counseling Profiles\n")

for idx, s in enumerate(students, 1):
    app = s['total_appeared']
    pend = s['total_pending']
    acc = s['accuracy']
    
    md.append(f"### {idx}. {s['name']}")
    md.append(f"- **Student ID:** `{s['profile']['id'][:8]}` | **Class:** {s['class']} | **Board:** {s['board']} | **Target:** {s['aspiration']} | **Batch:** {s['batch']}")
    md.append(f"- **School:** {s['school']} | **Phone:** {s['phone']} | **Email:** {s['email']}")
    md.append(f"- **Core Metrics:** Appeared: **{app}** ({s['unique_appeared']} Unique) | Pending: **{pend}** | Avg Marks: **{s['avg_score']}** (Highest: {s['max_score']}) | Accuracy: **{acc}%**\n")
    
    md.append("#### Appeared Exams & DPP Quizzes:")
    if app == 0:
        md.append("> ⚠️ **ALERT FOR GUARDIAN:** Student has not attempted any exam or DPP quiz on the app. Immediate counseling required.\n")
    else:
        md.append("| Date | Test Title | Type | Score | Correct / Wrong / Left | Accuracy | Status |")
        md.append("|------|------------|------|-------|------------------------|----------|--------|")
        for r in s['results']:
            d_str = str(r.get('created_at', ''))[:10]
            t_title = r.get('title') or r.get('exam_type') or 'Test'
            t_type = r.get('exam_type') or 'Quiz'
            score = r.get('score', 0)
            c_cnt = r.get('correct_count', 0)
            tot_q = r.get('total_questions', 0)
            ans = r.get('answers') or {}
            att_q = len(ans) if isinstance(ans, dict) else c_cnt
            w_cnt = max(0, att_q - c_cnt)
            l_cnt = max(0, tot_q - att_q)
            t_acc = round((c_cnt / tot_q) * 100, 1) if tot_q > 0 else 0
            gr = "Graded" if r.get('is_graded') else "Submitted"
            md.append(f"| {d_str} | {t_title} | {t_type} | {score} | {c_cnt} / {w_cnt} / {l_cnt} | {t_acc}% | {gr} |")
        md.append("")

    md.append("#### Pending Tests & DPP Quizzes (Backlog):")
    if pend == 0:
        md.append("> ✅ **EXCELLENT COMPLIANCE:** 100% of all assigned tests and DPP quizzes completed!\n")
    else:
        md.append("| # | Assessment Title | Category | Target Batch | Action Required |")
        md.append("|---|------------------|----------|--------------|-----------------|")
        for p_idx, pt in enumerate(s['pending'], 1):
            md.append(f"| {p_idx} | {pt.get('title')} | {pt.get('exam_type')} | {pt.get('target_batch')} | **Must Attempt Immediately** |")
        md.append("")

    md.append("#### Teacher's Guidance for Guardian:")
    if app == 0:
        md.append("> 🛑 **CRITICAL ACTION:** Guardian must verify app installation, check login credentials, and enforce daily quiz participation.\n")
    elif acc >= 60:
        md.append(f"> 🌟 **STRONG PROGRESS:** Student has {acc}% accuracy across {app} tests. Encourage them to finish the {pend} pending DPPs to master all topics.\n")
    elif acc >= 35:
        md.append(f"> 📈 **STEADY EFFORT:** Regular attempts recorded. Focus on reducing negative marking and clearing the {pend} pending DPP quizzes.\n")
    else:
        md.append(f"> ⚠️ **REVISION NEEDED:** Accuracy is {acc}%. Supervise formula revision and ensure pending DPPs are practiced.\n")

    md.append("---\n")

with open("CLASS_12_GUARDIAN_ANALYSIS_REPORT.md", "w", encoding="utf-8") as f:
    f.write("\n".join(md))

print("Markdown report generated at CLASS_12_GUARDIAN_ANALYSIS_REPORT.md")
