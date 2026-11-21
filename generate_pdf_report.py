import json
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages after cover)
        if self._pageNumber > 1:
            self.drawString(36, 810, "ACCURACY - PINTU SAHOO PHYSICS ACADEMY | CLASS 12 GUARDIAN ANALYSIS REPORT")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, 804, 559, 804)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 38, 559, 38)
        self.setFont("Helvetica", 8)
        self.drawString(36, 26, "Confidential - Parent-Teacher Counseling Document")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 26, page_str)
        self.restoreState()


def build_pdf_report():
    with open("class12_analyzed_students.json", "r", encoding="utf-8") as f:
        students = json.load(f)

    pdf_path = "CLASS_12_STUDENTS_GUARDIAN_ANALYSIS_REPORT.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=1, # Center
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=8,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    
    body_bold = ParagraphStyle(
        'BodyBoldCustom',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    tag_style = ParagraphStyle(
        'TagStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#ea580c')
    )

    story = []

    # ================= COVER / ROSTER DASHBOARD =================
    story.append(Spacer(1, 15))
    story.append(Paragraph("ACCURACY - PINTU SAHOO", ParagraphStyle('Brand', parent=title_style, fontSize=12, textColor=colors.HexColor('#ea580c'), spaceAfter=4)))
    story.append(Paragraph("CLASS 12 & REPEATERS - COMPREHENSIVE GUARDIAN REPORT", title_style))
    story.append(Paragraph("Complete Name-Wise Diagnostic Analysis: Appeared Exams, Pending DPP Quizzes & Performance Metrics", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#ea580c"), spaceAfter=12))

    # Executive Summary Card
    total_students = len(students)
    active_students = len([s for s in students if s['total_appeared'] > 0])
    inactive_students = total_students - active_students
    total_attempts = sum(s['total_appeared'] for s in students)
    avg_batch_acc = round(sum(s['accuracy'] for s in students if s['total_appeared'] > 0) / (active_students or 1), 1)

    summary_data = [
        [
            Paragraph(f"<b>Total Enrolled (Class 12)</b><br/><font size=14 color='#0f172a'><b>{total_students}</b></font>", body_style),
            Paragraph(f"<b>Actively Appearing</b><br/><font size=14 color='#16a34a'><b>{active_students}</b></font>", body_style),
            Paragraph(f"<b>Zero Attempts (Inactive)</b><br/><font size=14 color='#dc2626'><b>{inactive_students}</b></font>", body_style),
            Paragraph(f"<b>Total Exam Attempts</b><br/><font size=14 color='#0284c7'><b>{total_attempts}</b></font>", body_style),
            Paragraph(f"<b>Batch Avg Accuracy</b><br/><font size=14 color='#ea580c'><b>{avg_batch_acc}%</b></font>", body_style),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[104, 104, 104, 104, 104])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>Student Master Directory & Performance Quick-Index</b>", h1_style))
    story.append(Paragraph("<font size=7.5 color='#64748b'>Summary of all Class 12 students. Detailed individual counseling sheets follow on succeeding pages.</font>", body_style))
    story.append(Spacer(1, 6))

    # Master Table Header
    master_table_data = [[
        Paragraph("<b>#</b>", body_bold),
        Paragraph("<b>Student Name</b>", body_bold),
        Paragraph("<b>Class / Board</b>", body_bold),
        Paragraph("<b>Aspiration</b>", body_bold),
        Paragraph("<b>Appeared</b>", body_bold),
        Paragraph("<b>Pending</b>", body_bold),
        Paragraph("<b>Avg Score</b>", body_bold),
        Paragraph("<b>Accuracy</b>", body_bold),
        Paragraph("<b>Guardian Alert</b>", body_bold),
    ]]

    for idx, s in enumerate(students, 1):
        appeared = s['total_appeared']
        pending = s['total_pending']
        acc = s['accuracy']
        
        if appeared == 0:
            status_text = "<font color='#dc2626'><b>CRITICAL (0 Taken)</b></font>"
        elif pending >= 8:
            status_text = "<font color='#ea580c'><b>High Backlog</b></font>"
        elif acc >= 50:
            status_text = "<font color='#16a34a'><b>Consistent</b></font>"
        else:
            status_text = "<font color='#d97706'><b>Needs Practice</b></font>"

        asp_str = str(s.get('aspiration') or 'N/A')
        board_str = str(s.get('board') or 'N/A')
        cls_str = str(s.get('class') or '12')
        name_str = str(s.get('name') or 'Unnamed')
        school_str = str(s.get('school') or 'Not Provided')
        phone_str = str(s.get('phone') or 'Not Provided')
        email_str = str(s.get('email') or 'Not Provided')
        batch_str = str(s.get('batch') or 'Not Set')

        master_table_data.append([
            Paragraph(str(idx), body_style),
            Paragraph(f"<b>{name_str[:22]}</b>", body_style),
            Paragraph(f"{cls_str} / {board_str}", body_style),
            Paragraph(asp_str, body_style),
            Paragraph(f"<b>{appeared}</b>", body_style),
            Paragraph(f"<b>{pending}</b>", body_style),
            Paragraph(str(s['avg_score']), body_style),
            Paragraph(f"{acc}%", body_style),
            Paragraph(status_text, body_style),
        ])

    master_table = Table(master_table_data, colWidths=[20, 130, 65, 55, 45, 45, 45, 50, 75])
    master_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (4, 0), (7, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    
    # Fix header text colors in master table
    for c in range(9):
        master_table_data[0][c].style.textColor = colors.white

    story.append(master_table)
    story.append(PageBreak())

    # ================= INDIVIDUAL STUDENT COUNSELING SHEETS =================
    for idx, s in enumerate(students, 1):
        student_flow = []

        # Header Box with Student Bio
        appeared = s['total_appeared']
        pending = s['total_pending']
        acc = s['accuracy']
        
        if appeared == 0:
            status_badge = "<font color='#dc2626'><b>STATUS: CRITICAL - NO TESTS ATTEMPTED</b></font>"
            status_bg = '#fef2f2'
        elif pending >= 8:
            status_badge = "<font color='#ea580c'><b>STATUS: ATTENTION REQUIRED - HIGH BACKLOG OF DPPs</b></font>"
            status_bg = '#fff7ed'
        elif acc >= 50:
            status_badge = "<font color='#16a34a'><b>STATUS: CONSISTENT ACTIVE LEARNER</b></font>"
            status_bg = '#f0fdf4'
        else:
            status_badge = "<font color='#d97706'><b>STATUS: MODERATE - NEEDS ACCURACY BOOST & REGULAR PRACTICE</b></font>"
            status_bg = '#fffbeb'

        asp_str = str(s.get('aspiration') or 'N/A')
        board_str = str(s.get('board') or 'N/A')
        cls_str = str(s.get('class') or '12')
        name_str = str(s.get('name') or 'Unnamed')
        school_str = str(s.get('school') or 'Not Provided')
        phone_str = str(s.get('phone') or 'Not Provided')
        email_str = str(s.get('email') or 'Not Provided')
        batch_str = str(s.get('batch') or 'Not Set')

        header_content = [
            [
                Paragraph(f"<font size=13 color='#0f172a'><b>{idx}. {name_str}</b></font><br/>"
                          f"<font size=8 color='#64748b'>Student ID: {s['profile']['id'][:8]} | Roll / Class: {cls_str} | Target: <b>{asp_str}</b> | Board: <b>{board_str}</b></font>", body_style),
                Paragraph(f"<div align='right'>{status_badge}<br/><font size=7.5 color='#64748b'>Batch: {batch_str}</font></div>", body_style)
            ]
        ]
        h_table = Table(header_content, colWidths=[330, 190])
        h_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(status_bg)),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        student_flow.append(h_table)
        student_flow.append(Spacer(1, 6))

        # Personal Contact & School Line
        info_data = [[
            Paragraph(f"<b>School / College:</b> {school_str}", body_style),
            Paragraph(f"<b>Contact Phone:</b> {phone_str}", body_style),
            Paragraph(f"<b>Registered Email:</b> {email_str}", body_style),
        ]]
        info_table = Table(info_data, colWidths=[180, 160, 180])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        student_flow.append(info_table)
        student_flow.append(Spacer(1, 6))

        # 4 Core Guardian Counseling Metrics
        metrics_data = [[
            Paragraph(f"<b>Tests Appeared</b><br/><font size=13 color='#0284c7'><b>{s['total_appeared']}</b></font> <font size=7 color='#64748b'>Attempts ({s['unique_appeared']} Unique)</font>", body_style),
            Paragraph(f"<b>Tests / DPPs Pending</b><br/><font size=13 color='#dc2626'><b>{s['total_pending']}</b></font> <font size=7 color='#64748b'>Unattempted</font>", body_style),
            Paragraph(f"<b>Average Score</b><br/><font size=13 color='#ea580c'><b>{s['avg_score']}</b></font> <font size=7 color='#64748b'>Highest: {s['max_score']}</font>", body_style),
            Paragraph(f"<b>Overall Accuracy</b><br/><font size=13 color='#16a34a'><b>{s['accuracy']}%</b></font> <font size=7 color='#64748b'>Correctness Ratio</font>", body_style),
        ]]
        metrics_table = Table(metrics_data, colWidths=[130, 130, 130, 130])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ffffff')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        student_flow.append(metrics_table)
        student_flow.append(Spacer(1, 8))

        # --- SECTION 1: APPEARED TESTS TABLE ---
        student_flow.append(Paragraph(f"<b>1. Appeared Exams & DPP Quizzes ({s['total_appeared']} Attempts)</b>", h1_style))
        if s['total_appeared'] == 0:
            student_flow.append(Paragraph(
                "<font color='#dc2626'><b>ALERT FOR GUARDIAN:</b> The student has not logged in to attempt any scheduled test or DPP quiz through the app. Immediate counseling and intervention are required to establish an exam routine.</font>",
                body_style
            ))
            student_flow.append(Spacer(1, 6))
        else:
            app_table_data = [[
                Paragraph("<font color='white'><b>Date</b></font>", body_bold),
                Paragraph("<font color='white'><b>Exam / Quiz Title</b></font>", body_bold),
                Paragraph("<font color='white'><b>Type</b></font>", body_bold),
                Paragraph("<font color='white'><b>Score</b></font>", body_bold),
                Paragraph("<font color='white'><b>Correct</b></font>", body_bold),
                Paragraph("<font color='white'><b>Wrong</b></font>", body_bold),
                Paragraph("<font color='white'><b>Left</b></font>", body_bold),
                Paragraph("<font color='white'><b>Accuracy</b></font>", body_bold),
                Paragraph("<font color='white'><b>Status</b></font>", body_bold),
            ]]
            
            for res in s['results']:
                date_str = str(res.get('created_at', ''))[:10]
                title = res.get('title') or res.get('exam_type') or 'Test'
                etype = res.get('exam_type') or 'Quiz'
                score = str(res.get('score', 0))
                c_cnt = res.get('correct_count', 0)
                tot_q = res.get('total_questions', 0)
                # Calculate wrong and left
                ans_data = res.get('answers') or {}
                if isinstance(ans_data, dict):
                    att_q = len(ans_data)
                else:
                    att_q = c_cnt
                w_cnt = max(0, att_q - c_cnt)
                l_cnt = max(0, tot_q - att_q)
                
                acc = round((c_cnt / tot_q) * 100, 1) if tot_q > 0 else 0
                graded = "Graded" if res.get('is_graded') else "Submitted"
                
                app_table_data.append([
                    Paragraph(date_str, body_style),
                    Paragraph(f"<b>{title[:32]}</b>", body_style),
                    Paragraph(etype, body_style),
                    Paragraph(f"<b>{score}</b>", body_style),
                    Paragraph(f"<font color='#16a34a'><b>{c_cnt}</b></font>", body_style),
                    Paragraph(f"<font color='#dc2626'><b>{w_cnt}</b></font>", body_style),
                    Paragraph(f"<font color='#d97706'>{l_cnt}</font>", body_style),
                    Paragraph(f"<b>{acc}%</b>", body_style),
                    Paragraph(f"<font size=7 color='#64748b'>{graded}</font>", body_style),
                ])

            app_table = Table(app_table_data, colWidths=[55, 175, 55, 40, 40, 38, 38, 45, 42])
            app_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
            ]))
            student_flow.append(app_table)
            student_flow.append(Spacer(1, 8))

        # --- SECTION 2: PENDING TESTS & DPP QUIZZES TABLE ---
        student_flow.append(Paragraph(f"<b>2. Pending Tests & DPP Quizzes ({s['total_pending']} Incomplete / Backlog)</b>", h1_style))
        if s['total_pending'] == 0:
            student_flow.append(Paragraph(
                "<font color='#16a34a'><b>EXCELLENT COMPLIANCE:</b> The student has completed 100% of all assigned tests and DPP quizzes. No pending tests!</font>",
                body_style
            ))
            student_flow.append(Spacer(1, 6))
        else:
            student_flow.append(Paragraph(
                "<font size=7.5 color='#64748b'>These assessments have been assigned to Class 12 / Repeaters but have NOT yet been attempted by the student:</font>",
                body_style
            ))
            student_flow.append(Spacer(1, 3))
            
            pend_table_data = [[
                Paragraph("<font color='white'><b>#</b></font>", body_bold),
                Paragraph("<font color='white'><b>Pending Assessment Title</b></font>", body_bold),
                Paragraph("<font color='white'><b>Assessment Category</b></font>", body_bold),
                Paragraph("<font color='white'><b>Batch / Class</b></font>", body_bold),
                Paragraph("<font color='white'><b>Guardian Counseling Action</b></font>", body_bold),
            ]]
            
            for p_idx, pt in enumerate(s['pending'], 1):
                p_title = pt.get('title', 'Test')
                p_type = pt.get('exam_type', 'Quiz')
                p_batch = pt.get('target_batch', 'All Students')
                
                pend_table_data.append([
                    Paragraph(str(p_idx), body_style),
                    Paragraph(f"<font color='#0f172a'><b>{p_title}</b></font>", body_style),
                    Paragraph(f"<font color='#ea580c'><b>{p_type}</b></font>", body_style),
                    Paragraph(p_batch, body_style),
                    Paragraph("<font color='#dc2626'><b>Must Attempt Immediately</b></font>", body_style),
                ])

            pend_table = Table(pend_table_data, colWidths=[20, 230, 85, 85, 100])
            pend_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#b91c1c')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fca5a5')),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff5f5')])
            ]))
            student_flow.append(pend_table)
            student_flow.append(Spacer(1, 8))

        # --- SECTION 3: GUARDIAN COUNSELING ASSESSMENT & REMARKS ---
        # Generate specific, constructive remarks
        if appeared == 0:
            counseling_remark = "CRITICAL: The student is enrolled but has not attempted any online exam or DPP quiz. Guardian is requested to check if the student faces technical login difficulty or lacks disciplined self-study scheduling. Please mandate daily app test participation."
        elif s['accuracy'] >= 60:
            counseling_remark = f"EXCELLENT: Strong accuracy of {s['accuracy']}% across {appeared} exams. The student demonstrates good conceptual clarity in Physics. Focus should now be on clearing the remaining {pending} pending DPPs to ensure 100% syllabus coverage."
        elif s['accuracy'] >= 35:
            counseling_remark = f"GOOD EFFORT: Student is actively appearing ({appeared} attempts, {s['avg_score']} avg marks). Needs to reduce negative marking / incorrect attempts and systematically solve the {pending} pending DPP quizzes."
        else:
            counseling_remark = f"NEEDS IMPROVEMENT: Accuracy is low ({s['accuracy']}%) with {pending} pending DPPs. Guardian should supervise chapter revision and formula memorization before the student attempts the remaining tests."

        remark_box = [
            [
                Paragraph("<b>TEACHER'S ASSESSMENT & GUARDIAN GUIDANCE</b>", body_bold),
            ],
            [
                Paragraph(f"<font size=8 color='#1e293b'>{counseling_remark}</font>", body_style)
            ]
        ]
        r_table = Table(remark_box, colWidths=[520])
        r_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        student_flow.append(r_table)
        
        # Add PageBreak between students (except after the last one)
        if idx < len(students):
            student_flow.append(PageBreak())

        story.extend(student_flow)

    print("Building PDF document...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {os.path.abspath(pdf_path)}")

if __name__ == "__main__":
    build_pdf_report()
