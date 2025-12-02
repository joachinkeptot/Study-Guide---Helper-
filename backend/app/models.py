from app import db
from datetime import datetime, UTC
import enum


class ProblemType(enum.Enum):
    """Enum for problem types"""
    MULTIPLE_CHOICE = 'multiple_choice'
    SHORT_ANSWER = 'short_answer'
    FREE_RESPONSE = 'free_response'


class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), nullable=False)
    
    # Relationships
    study_guides = db.relationship('StudyGuide', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    practice_sessions = db.relationship('PracticeSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    topic_progress = db.relationship('TopicProgress', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class StudyGuide(db.Model):
    """Study guide model"""
    __tablename__ = 'study_guides'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=True)
    parsed_content = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), nullable=False)
    
    # Relationships
    topics = db.relationship('Topic', backref='study_guide', lazy='dynamic', cascade='all, delete-orphan', order_by='Topic.order_index')
    practice_sessions = db.relationship('PracticeSession', backref='study_guide', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_topics=False):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'original_filename': self.original_filename,
            'parsed_content': self.parsed_content,
            'created_at': self.created_at.isoformat(),
            'topic_count': self.topics.count()
        }
        if include_topics:
            result['topics'] = [topic.to_dict() for topic in self.topics]
        return result


class Topic(db.Model):
    """Topic model"""
    __tablename__ = 'topics'
    
    id = db.Column(db.Integer, primary_key=True)
    study_guide_id = db.Column(db.Integer, db.ForeignKey('study_guides.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    
    # Relationships
    problems = db.relationship('Problem', backref='topic', lazy='dynamic', cascade='all, delete-orphan')
    topic_progress = db.relationship('TopicProgress', backref='topic', lazy='dynamic', cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        db.Index('ix_topics_study_guide_order', 'study_guide_id', 'order_index'),
    )
    
    def to_dict(self, include_problems=False):
        result = {
            'id': self.id,
            'study_guide_id': self.study_guide_id,
            'name': self.name,
            'description': self.description,
            'order_index': self.order_index,
            'problem_count': self.problems.count()
        }
        if include_problems:
            result['problems'] = [problem.to_dict() for problem in self.problems]
        return result


class Problem(db.Model):
    """Problem model"""
    __tablename__ = 'problems'
    
    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    question_text = db.Column(db.Text, nullable=False)
    problem_type = db.Column(db.Enum(ProblemType), nullable=False)
    options = db.Column(db.JSON, nullable=True)  # For multiple choice questions
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)
    hints = db.Column(db.JSON, nullable=True)  # Array of progressive hints
    hint_penalty = db.Column(db.Float, default=0.1, nullable=False)  # Reduces score credit per hint
    
    # Relationships
    attempts = db.relationship('ProblemAttempt', backref='problem', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_answer=False, include_hints=False):
        result = {
            'id': self.id,
            'topic_id': self.topic_id,
            'question_text': self.question_text,
            'problem_type': self.problem_type.value,
            'options': self.options,
            'explanation': self.explanation,
            'hint_count': len(self.hints) if self.hints else 0
        }
        if include_answer:
            result['correct_answer'] = self.correct_answer
        if include_hints:
            result['hints'] = self.hints
            result['hint_penalty'] = self.hint_penalty
        return result


class PracticeSession(db.Model):
    """Practice session model"""
    __tablename__ = 'practice_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    study_guide_id = db.Column(db.Integer, db.ForeignKey('study_guides.id', ondelete='CASCADE'), nullable=False, index=True)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), nullable=False)
    ended_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    problem_attempts = db.relationship('ProblemAttempt', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        db.Index('ix_practice_sessions_user_started', 'user_id', 'started_at'),
    )
    
    def to_dict(self, include_attempts=False):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'study_guide_id': self.study_guide_id,
            'started_at': self.started_at.isoformat(),
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'attempt_count': self.problem_attempts.count()
        }
        if include_attempts:
            result['attempts'] = [attempt.to_dict() for attempt in self.problem_attempts]
        return result


class ProblemAttempt(db.Model):
    """Problem attempt model"""
    __tablename__ = 'problem_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('practice_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id', ondelete='CASCADE'), nullable=False, index=True)
    user_answer = db.Column(db.Text, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)
    confidence_rating = db.Column(db.Integer, nullable=True)  # 1-3 scale
    feedback = db.Column(db.Text, nullable=True)
    attempted_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), nullable=False)
    hints_used = db.Column(db.JSON, nullable=True)  # Array of hint indices that were revealed
    
    # Indexes
    __table_args__ = (
        db.Index('ix_problem_attempts_session_attempted', 'session_id', 'attempted_at'),
        db.Index('ix_problem_attempts_problem_attempted', 'problem_id', 'attempted_at'),
        db.CheckConstraint('confidence_rating >= 1 AND confidence_rating <= 3', name='check_confidence_rating'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'problem_id': self.problem_id,
            'user_answer': self.user_answer,
            'is_correct': self.is_correct,
            'confidence_rating': self.confidence_rating,
            'feedback': self.feedback,
            'attempted_at': self.attempted_at.isoformat(),
            'hints_used': self.hints_used or []
        }


class TopicProgress(db.Model):
    """Topic progress tracking model"""
    __tablename__ = 'topic_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    problems_attempted = db.Column(db.Integer, default=0, nullable=False)
    problems_correct = db.Column(db.Integer, default=0, nullable=False)
    current_confidence = db.Column(db.Float, default=0.0, nullable=False)  # 0.0 - 1.0
    mastered = db.Column(db.Boolean, default=False, nullable=False)
    last_practiced = db.Column(db.DateTime, nullable=True)
    
    # Unique constraint: one progress record per user per topic
    __table_args__ = (
        db.UniqueConstraint('user_id', 'topic_id', name='uq_user_topic_progress'),
        db.Index('ix_topic_progress_user_mastered', 'user_id', 'mastered'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic_id': self.topic_id,
            'problems_attempted': self.problems_attempted,
            'problems_correct': self.problems_correct,
            'current_confidence': self.current_confidence,
            'mastered': self.mastered,
            'last_practiced': self.last_practiced.isoformat() if self.last_practiced else None,
            'accuracy': round(self.problems_correct / self.problems_attempted * 100, 2) if self.problems_attempted > 0 else 0
        }
