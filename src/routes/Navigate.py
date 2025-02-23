# from flask import Flask, render_template, request, redirect, url_for
# from datetime import datetime
# import json

# app = Flask(__name__)

# # File to store questions
# QUESTIONS_FILE = 'questions.json'

# def load_questions():
#     try:
#         with open(QUESTIONS_FILE, 'r') as f:
#             return json.load(f)
#     except FileNotFoundError:
#         return []

# def save_questions(questions):
#     with open(QUESTIONS_FILE, 'w') as f:
#         json.dump(questions, f, indent=2)

# @app.route('/')
# def home():
#     return render_template('home.html')

# @app.route('/ask', methods=['GET', 'POST'])
# def ask_question():
#     if request.method == 'POST':
#         question = request.form.get('question')
#         if question:
#             questions = load_questions()
#             new_question = {
#                 'id': len(questions) + 1,
#                 'question': question,
#                 'created_at': datetime.now().isoformat()
#             }
#             questions.insert(0, new_question)  # Add new question at the beginning
#             questions = questions[:10]  # Keep only the latest 10 questions
#             save_questions(questions)
#             return redirect(url_for('recent_questions'))
#     return render_template('ask.html')

# @app.route('/recent-questions')
# def recent_questions():
#     questions = load_questions()
#     return render_template('recent_questions.html', questions=questions)

# if __name__ == '__main__':
#     app.run(debug=True)