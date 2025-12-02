"""
Tests for problem selector service with spaced repetition logic.
"""

import pytest
from datetime import datetime, timedelta
from app import create_app, db
from app.models import (
    User, StudyGuide, Topic, Problem, ProblemType,
    PracticeSession, ProblemAttempt, TopicProgress
)
from app.services.problem_selector import (
    get_next_problem,
    update_confidence,
    get_topic_weights,
    _select_topic_by_confidence,
    _get_new_problem,
    _get_review_problem,
    SpacedRepetitionConfig
)


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def sample_data(app):
    """Create sample data for testing"""
    with app.app_context():
        # Create user
        user = User(email='test@example.com', password_hash='hashed')
        db.session.add(user)
        db.session.flush()
        
        # Create study guide
        guide = StudyGuide(
            user_id=user.id,
            title='Test Guide',
            original_filename='test.pdf'
        )
        db.session.add(guide)
        db.session.flush()
        
        # Create topics
        topic1 = Topic(
            study_guide_id=guide.id,
            name='Topic 1',
            description='First topic',
            order_index=0
        )
        topic2 = Topic(
            study_guide_id=guide.id,
            name='Topic 2',
            description='Second topic',
            order_index=1
        )
        topic3 = Topic(
            study_guide_id=guide.id,
            name='Topic 3',
            description='Third topic',
            order_index=2
        )
        db.session.add_all([topic1, topic2, topic3])
        db.session.flush()
        
        # Create problems for each topic
        problems = []
        for topic in [topic1, topic2, topic3]:
            for i in range(5):
                problem = Problem(
                    topic_id=topic.id,
                    question_text=f'Question {i+1} for {topic.name}',
                    problem_type=ProblemType.MULTIPLE_CHOICE,
                    options=['A', 'B', 'C', 'D'],
                    correct_answer='A',
                    explanation='Explanation'
                )
                problems.append(problem)
                db.session.add(problem)
        
        db.session.flush()
        
        # Create practice session
        session = PracticeSession(
            user_id=user.id,
            study_guide_id=guide.id
        )
        db.session.add(session)
        db.session.flush()
        
        db.session.commit()
        
        return {
            'user': user,
            'guide': guide,
            'topics': [topic1, topic2, topic3],
            'problems': problems,
            'session': session
        }


class TestGetNextProblem:
    """Tests for get_next_problem function"""
    
    def test_returns_problem_from_requested_topics(self, app, sample_data):
        """Test that get_next_problem returns a problem from requested topics"""
        with app.app_context():
            user_id = sample_data['user'].id
            session_id = sample_data['session'].id
            topic_ids = [sample_data['topics'][0].id]
            
            problem, topic = get_next_problem(user_id, session_id, topic_ids)
            
            assert problem is not None
            assert topic is not None
            assert topic.id in topic_ids
            assert problem.topic_id == topic.id
    
    def test_excludes_problems_from_current_session(self, app, sample_data):
        """Test that problems already attempted in session are excluded"""
        with app.app_context():
            user_id = sample_data['user'].id
            session_id = sample_data['session'].id
            topic_ids = [t.id for t in sample_data['topics']]
            
            # Attempt all problems from topic 1
            topic1_problems = [p for p in sample_data['problems'] if p.topic_id == sample_data['topics'][0].id]
            for problem in topic1_problems:
                attempt = ProblemAttempt(
                    session_id=session_id,
                    problem_id=problem.id,
                    user_answer='A',
                    is_correct=True
                )
                db.session.add(attempt)
            db.session.commit()
            
            # Get next problem - should not be from attempted problems
            attempted_ids = [p.id for p in topic1_problems]
            problem, topic = get_next_problem(user_id, session_id, topic_ids)
            
            assert problem is not None
            assert problem.id not in attempted_ids
    
    def test_excludes_specified_problem_ids(self, app, sample_data):
        """Test that specified problem IDs are excluded"""
        with app.app_context():
            user_id = sample_data['user'].id
            session_id = sample_data['session'].id
            topic_ids = [sample_data['topics'][0].id]
            
            # Exclude first 3 problems
            exclude_ids = [sample_data['problems'][i].id for i in range(3)]
            
            problem, topic = get_next_problem(
                user_id, session_id, topic_ids, exclude_problem_ids=exclude_ids
            )
            
            assert problem is not None
            assert problem.id not in exclude_ids
    
    def test_returns_none_for_empty_topic_list(self, app, sample_data):
        """Test that None is returned when topic list is empty"""
        with app.app_context():
            user_id = sample_data['user'].id
            session_id = sample_data['session'].id
            
            result = get_next_problem(user_id, session_id, [])
            
            assert result is None
    
    def test_prioritizes_low_confidence_topics(self, app, sample_data):
        """Test that topics with lower confidence are more likely to be selected"""
        with app.app_context():
            user_id = sample_data['user'].id
            session_id = sample_data['session'].id
            topic_ids = [t.id for t in sample_data['topics']]
            
            # Set different confidence levels
            TopicProgress(
                user_id=user_id,
                topic_id=sample_data['topics'][0].id,
                current_confidence=0.9,  # High confidence
                problems_attempted=10,
                problems_correct=9,
                last_practiced=datetime.utcnow()
            )
            TopicProgress(
                user_id=user_id,
                topic_id=sample_data['topics'][1].id,
                current_confidence=0.2,  # Low confidence
                problems_attempted=10,
                problems_correct=2,
                last_practiced=datetime.utcnow()
            )
            db.session.commit()
            
            # Run multiple times and track topic selection
            selections = {}
            for _ in range(50):
                problem, topic = get_next_problem(user_id, session_id, topic_ids)
                selections[topic.id] = selections.get(topic.id, 0) + 1
            
            # Topic 1 (low confidence) should be selected more often than Topic 0 (high confidence)
            assert selections.get(sample_data['topics'][1].id, 0) > selections.get(sample_data['topics'][0].id, 0)


class TestUpdateConfidence:
    """Tests for update_confidence function"""
    
    def test_creates_new_progress_record(self, app, sample_data):
        """Test that new progress record is created if none exists"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            progress = update_confidence(user_id, topic_id, was_correct=True)
            
            assert progress is not None
            assert progress.user_id == user_id
            assert progress.topic_id == topic_id
            assert progress.problems_attempted == 1
            assert progress.problems_correct == 1
            assert progress.current_confidence > 0
    
    def test_updates_existing_progress(self, app, sample_data):
        """Test that existing progress is updated correctly"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Create initial progress
            initial_progress = TopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                problems_attempted=5,
                problems_correct=3,
                current_confidence=0.5
            )
            db.session.add(initial_progress)
            db.session.commit()
            
            # Update with correct answer
            progress = update_confidence(user_id, topic_id, was_correct=True)
            
            assert progress.problems_attempted == 6
            assert progress.problems_correct == 4
            assert progress.current_confidence > 0.5
    
    def test_increases_confidence_on_correct_answer(self, app, sample_data):
        """Test that confidence increases on correct answer"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Create initial progress
            initial_progress = TopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                problems_attempted=5,
                problems_correct=3,
                current_confidence=0.5
            )
            db.session.add(initial_progress)
            db.session.commit()
            
            initial_confidence = initial_progress.current_confidence
            
            # Update with correct answer
            progress = update_confidence(user_id, topic_id, was_correct=True)
            
            assert progress.current_confidence > initial_confidence
    
    def test_decreases_confidence_on_incorrect_answer(self, app, sample_data):
        """Test that confidence decreases on incorrect answer"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Create initial progress
            initial_progress = TopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                problems_attempted=5,
                problems_correct=3,
                current_confidence=0.5
            )
            db.session.add(initial_progress)
            db.session.commit()
            
            initial_confidence = initial_progress.current_confidence
            
            # Update with incorrect answer
            progress = update_confidence(user_id, topic_id, was_correct=False)
            
            assert progress.current_confidence < initial_confidence
    
    def test_confidence_clamped_between_0_and_1(self, app, sample_data):
        """Test that confidence stays between 0 and 1"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Test upper bound
            high_progress = TopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                problems_attempted=10,
                problems_correct=9,
                current_confidence=0.95
            )
            db.session.add(high_progress)
            db.session.commit()
            
            progress = update_confidence(user_id, topic_id, was_correct=True, user_confidence=3)
            assert progress.current_confidence <= 1.0
            
            # Test lower bound
            progress.current_confidence = 0.05
            db.session.commit()
            
            progress = update_confidence(user_id, topic_id, was_correct=False)
            assert progress.current_confidence >= 0.0
    
    def test_mastery_threshold_updates_mastered_flag(self, app, sample_data):
        """Test that mastered flag is set when confidence exceeds threshold"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Create progress just below mastery
            progress = TopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                problems_attempted=10,
                problems_correct=7,
                current_confidence=SpacedRepetitionConfig.MASTERY_THRESHOLD - 0.05,
                mastered=False
            )
            db.session.add(progress)
            db.session.commit()
            
            # Update with correct answer to push over threshold
            for _ in range(3):
                progress = update_confidence(user_id, topic_id, was_correct=True, user_confidence=3)
            
            assert progress.mastered is True
    
    def test_user_confidence_affects_update(self, app, sample_data):
        """Test that user confidence rating affects confidence change"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic1_id = sample_data['topics'][0].id
            topic2_id = sample_data['topics'][1].id
            
            # Create identical progress for two topics
            for topic_id in [topic1_id, topic2_id]:
                progress = TopicProgress(
                    user_id=user_id,
                    topic_id=topic_id,
                    problems_attempted=5,
                    problems_correct=3,
                    current_confidence=0.5
                )
                db.session.add(progress)
            db.session.commit()
            
            # Update with different user confidence levels
            progress_low = update_confidence(user_id, topic1_id, was_correct=True, user_confidence=1)
            progress_high = update_confidence(user_id, topic2_id, was_correct=True, user_confidence=3)
            
            # High confidence should result in larger confidence increase
            assert progress_high.current_confidence > progress_low.current_confidence
    
    def test_updates_last_practiced_time(self, app, sample_data):
        """Test that last_practiced timestamp is updated"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            old_time = datetime.utcnow() - timedelta(days=5)
            
            progress = TopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                problems_attempted=5,
                problems_correct=3,
                current_confidence=0.5,
                last_practiced=old_time
            )
            db.session.add(progress)
            db.session.commit()
            
            # Update confidence
            progress = update_confidence(user_id, topic_id, was_correct=True)
            
            assert progress.last_practiced > old_time
            assert (datetime.utcnow() - progress.last_practiced).seconds < 5


class TestGetNewProblem:
    """Tests for _get_new_problem function"""
    
    def test_returns_unattempted_problem(self, app, sample_data):
        """Test that only unattempted problems are returned"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Attempt first 3 problems
            attempted_problems = [p for p in sample_data['problems'] if p.topic_id == topic_id][:3]
            session = sample_data['session']
            
            for problem in attempted_problems:
                attempt = ProblemAttempt(
                    session_id=session.id,
                    problem_id=problem.id,
                    user_answer='A',
                    is_correct=True
                )
                db.session.add(attempt)
            db.session.commit()
            
            # Get new problem
            problem = _get_new_problem(user_id, topic_id, [])
            
            assert problem is not None
            assert problem.id not in [p.id for p in attempted_problems]
    
    def test_returns_none_when_all_attempted(self, app, sample_data):
        """Test that None is returned when all problems have been attempted"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            
            # Attempt all problems from topic
            all_problems = [p for p in sample_data['problems'] if p.topic_id == topic_id]
            session = sample_data['session']
            
            for problem in all_problems:
                attempt = ProblemAttempt(
                    session_id=session.id,
                    problem_id=problem.id,
                    user_answer='A',
                    is_correct=True
                )
                db.session.add(attempt)
            db.session.commit()
            
            # Try to get new problem
            problem = _get_new_problem(user_id, topic_id, [])
            
            assert problem is None


class TestGetReviewProblem:
    """Tests for _get_review_problem function"""
    
    def test_prioritizes_incorrect_answers(self, app, sample_data):
        """Test that problems with incorrect answers are prioritized"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            topic_problems = [p for p in sample_data['problems'] if p.topic_id == topic_id]
            
            # Create attempts - some correct, some incorrect
            session = sample_data['session']
            old_time = datetime.utcnow() - timedelta(hours=2)
            
            # Problem 1: answered incorrectly multiple times
            for _ in range(3):
                attempt = ProblemAttempt(
                    session_id=session.id,
                    problem_id=topic_problems[0].id,
                    user_answer='B',
                    is_correct=False,
                    attempted_at=old_time
                )
                db.session.add(attempt)
            
            # Problem 2: answered correctly
            attempt = ProblemAttempt(
                session_id=session.id,
                problem_id=topic_problems[1].id,
                user_answer='A',
                is_correct=True,
                attempted_at=old_time
            )
            db.session.add(attempt)
            
            db.session.commit()
            
            # Get review problem multiple times
            selections = {}
            for _ in range(20):
                problem = _get_review_problem(user_id, topic_id, [])
                if problem:
                    selections[problem.id] = selections.get(problem.id, 0) + 1
            
            # Problem 1 (incorrect) should be selected more often
            assert selections.get(topic_problems[0].id, 0) > selections.get(topic_problems[1].id, 0)
    
    def test_respects_minimum_repeat_interval(self, app, sample_data):
        """Test that problems attempted recently are not returned"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_id = sample_data['topics'][0].id
            topic_problems = [p for p in sample_data['problems'] if p.topic_id == topic_id]
            
            # Attempt problem very recently
            recent_attempt = ProblemAttempt(
                session_id=sample_data['session'].id,
                problem_id=topic_problems[0].id,
                user_answer='A',
                is_correct=False,
                attempted_at=datetime.utcnow()
            )
            db.session.add(recent_attempt)
            
            # Attempt another problem long ago
            old_attempt = ProblemAttempt(
                session_id=sample_data['session'].id,
                problem_id=topic_problems[1].id,
                user_answer='A',
                is_correct=False,
                attempted_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.session.add(old_attempt)
            db.session.commit()
            
            # Get review problem
            problem = _get_review_problem(user_id, topic_id, [])
            
            # Should return the old problem, not the recent one
            assert problem.id != topic_problems[0].id


class TestGetTopicWeights:
    """Tests for get_topic_weights function"""
    
    def test_returns_weights_for_all_topics(self, app, sample_data):
        """Test that weights are returned for all requested topics"""
        with app.app_context():
            user_id = sample_data['user'].id
            topic_ids = [t.id for t in sample_data['topics']]
            
            weights = get_topic_weights(user_id, topic_ids)
            
            assert len(weights) == len(topic_ids)
            for topic_id in topic_ids:
                assert topic_id in weights
                assert weights[topic_id] > 0
    
    def test_higher_weight_for_low_confidence(self, app, sample_data):
        """Test that lower confidence results in higher weight"""
        with app.app_context():
            user_id = sample_data['user'].id
            
            # Create progress with different confidence levels
            low_conf_progress = TopicProgress(
                user_id=user_id,
                topic_id=sample_data['topics'][0].id,
                current_confidence=0.2,
                problems_attempted=10,
                problems_correct=2,
                last_practiced=datetime.utcnow()
            )
            high_conf_progress = TopicProgress(
                user_id=user_id,
                topic_id=sample_data['topics'][1].id,
                current_confidence=0.8,
                problems_attempted=10,
                problems_correct=8,
                last_practiced=datetime.utcnow()
            )
            db.session.add_all([low_conf_progress, high_conf_progress])
            db.session.commit()
            
            topic_ids = [sample_data['topics'][0].id, sample_data['topics'][1].id]
            weights = get_topic_weights(user_id, topic_ids)
            
            # Low confidence topic should have higher weight
            assert weights[sample_data['topics'][0].id] > weights[sample_data['topics'][1].id]
    
    def test_time_boost_for_old_practice(self, app, sample_data):
        """Test that topics not practiced recently get weight boost"""
        with app.app_context():
            user_id = sample_data['user'].id
            
            # Create progress with different last practice times
            recent_progress = TopicProgress(
                user_id=user_id,
                topic_id=sample_data['topics'][0].id,
                current_confidence=0.5,
                problems_attempted=10,
                problems_correct=5,
                last_practiced=datetime.utcnow()
            )
            old_progress = TopicProgress(
                user_id=user_id,
                topic_id=sample_data['topics'][1].id,
                current_confidence=0.5,
                problems_attempted=10,
                problems_correct=5,
                last_practiced=datetime.utcnow() - timedelta(days=10)
            )
            db.session.add_all([recent_progress, old_progress])
            db.session.commit()
            
            topic_ids = [sample_data['topics'][0].id, sample_data['topics'][1].id]
            weights = get_topic_weights(user_id, topic_ids)
            
            # Old practice topic should have higher weight
            assert weights[sample_data['topics'][1].id] > weights[sample_data['topics'][0].id]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
