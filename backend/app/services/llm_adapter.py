"""
LLM Adapter Service - Model-agnostic interface for various LLM providers.

This module provides a unified interface for interacting with different LLM providers
(Claude, OpenAI, Ollama) with consistent API across all implementations.
"""

import os
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, TypedDict
import requests


# ============================================================================
# PROMPT CONSTANTS
# ============================================================================

DOCUMENT_PARSE_PROMPT = """You are an expert educational content analyzer. Your task is to extract structured information from study materials.

Analyze the following study material and extract:
1. Main topics and subtopics (hierarchical structure)
2. Key concepts for each topic
3. Important definitions, formulas, or principles
4. Difficulty level assessment for each topic (beginner, intermediate, advanced)

Return your response as a valid JSON object with this structure:
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "difficulty": "beginner|intermediate|advanced",
      "key_concepts": ["concept1", "concept2", ...],
      "subtopics": ["subtopic1", "subtopic2", ...]
    }
  ],
  "overall_summary": "Brief summary of the entire document"
}

Study Material:
{content}

Provide ONLY the JSON response, no additional text."""

PROBLEM_GENERATION_PROMPT = """You are an expert problem creator for educational practice. Generate practice problems that test understanding and application.

Topic: {topic}
Number of Problems: {num_problems}
Difficulty Level: {difficulty}

Create {num_problems} practice problems for this topic at {difficulty} difficulty level.

Requirements:
- Problems should test understanding, not just memorization
- Include a mix of problem types (multiple choice, short answer, problem-solving)
- For multiple choice, provide 4 options with only one correct answer
- Include detailed explanations for correct answers
- Problems should be progressively challenging
- IMPORTANT: Provide 2-3 progressive hints for each problem that guide students without giving away the answer
  * Hint 1: Gentle nudge (e.g., "Think about the key concept involved...")
  * Hint 2: More specific guidance (e.g., "Consider applying [formula/method]...")
  * Hint 3: Strong hint but not the full solution (e.g., "The first step is to...")

Return your response as a valid JSON object with this structure:
{{
  "problems": [
    {{
      "type": "multiple_choice|short_answer|problem_solving",
      "question": "The problem statement",
      "options": ["A", "B", "C", "D"],  // Only for multiple_choice
      "correct_answer": "The correct answer",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "hints": ["hint1", "hint2", "hint3"]  // 2-3 progressive hints
    }}
  ]
}}

Provide ONLY the JSON response, no additional text."""

ANSWER_EVALUATION_PROMPT = """You are an expert educational assessor. Evaluate the student's answer and provide constructive feedback.

Problem: {problem}
Correct Answer: {correct_answer}
Student's Answer: {user_answer}

Evaluate the student's answer and provide:
1. Whether the answer is correct, partially correct, or incorrect
2. Detailed feedback explaining what's right/wrong
3. Specific areas for improvement
4. Encouragement and guidance for learning
5. A score from 0-100

Be fair but thorough. For partial credit scenarios, recognize correct elements even if the full answer isn't perfect.

Return your response as a valid JSON object with this structure:
{{
  "is_correct": true/false,
  "score": 0-100,
  "feedback": "Detailed feedback message",
  "strengths": ["what they got right"],
  "areas_for_improvement": ["what needs work"],
  "explanation": "Why the correct answer is correct",
  "encouragement": "Positive, constructive message"
}}

Provide ONLY the JSON response, no additional text."""


# ============================================================================
# ABSTRACT BASE CLASS
# ============================================================================

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize the LLM provider.
        
        Args:
            api_key: API key for the provider (if required)
            **kwargs: Additional provider-specific configuration
        """
        self.api_key = api_key
        self.config = kwargs
    
    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: The user prompt/question
            system_message: Optional system message to set context
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated text response
        """
        pass
    
    def parse_document(self, content: str) -> Dict[str, Any]:
        """
        Parse a study document and extract structured information.
        
        Args:
            content: The document content to parse
            
        Returns:
            Dictionary containing topics, concepts, and metadata
        """
        prompt = DOCUMENT_PARSE_PROMPT.format(content=content)
        response = self.generate(
            prompt=prompt,
            system_message="You are an expert educational content analyzer. Always respond with valid JSON.",
            temperature=0.3,  # Lower temperature for more consistent parsing
            max_tokens=3000
        )
        
        try:
            # Extract JSON from response (in case there's extra text)
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}\nResponse: {response}")

    # Contracts used by pipeline
    def extract_topics(self, raw_text: str) -> List[Dict[str, Any]]:
        """Alias to parse_document returning topics list.

        Returns a list of topic dicts with keys: name/title, description, key_concepts, subtopics.
        """
        data = self.parse_document(raw_text)
        return data.get("topics", [])
    
    def generate_problems(
        self,
        topic: str,
        num_problems: int = 5,
        difficulty: str = "intermediate"
    ) -> List[Dict[str, Any]]:
        """
        Generate practice problems for a given topic.
        
        Args:
            topic: The topic to generate problems for
            num_problems: Number of problems to generate
            difficulty: Difficulty level (beginner, intermediate, advanced)
            
        Returns:
            List of problem dictionaries
        """
        prompt = PROBLEM_GENERATION_PROMPT.format(
            topic=topic,
            num_problems=num_problems,
            difficulty=difficulty
        )
        
        response = self.generate(
            prompt=prompt,
            system_message="You are an expert problem creator. Always respond with valid JSON.",
            temperature=0.8,  # Higher temperature for creativity
            max_tokens=3000
        )
        
        try:
            # Extract JSON from response
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            data = json.loads(response)
            return data.get("problems", [])
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}\nResponse: {response}")
    
    def evaluate_answer(
        self,
        problem: str,
        user_answer: str,
        correct_answer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a user's answer to a problem.
        
        Args:
            problem: The problem statement
            user_answer: The user's submitted answer
            correct_answer: The correct answer (if available)
            
        Returns:
            Dictionary containing evaluation results and feedback
        """
        prompt = ANSWER_EVALUATION_PROMPT.format(
            problem=problem,
            correct_answer=correct_answer or "Not provided - evaluate based on problem requirements",
            user_answer=user_answer
        )
        
        response = self.generate(
            prompt=prompt,
            system_message="You are an expert educational assessor. Always respond with valid JSON.",
            temperature=0.5,  # Moderate temperature for consistent but nuanced evaluation
            max_tokens=2000
        )
        
        try:
            # Extract JSON from response
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}\nResponse: {response}")

    def evaluate_response(self, problem: Dict[str, Any], user_answer: str) -> Dict[str, Any]:
        """Evaluate based on problem object.

        Returns dict with keys: correct(bool), score(float 0-1), feedback(str), concept_ids(list[int]), confidence_delta(float).
        """
        eval_data = self.evaluate_answer(
            problem=json.dumps(problem),
            user_answer=user_answer,
            correct_answer=problem.get("correct_answer")
        )

        # Normalize to pipeline schema
        correct = bool(eval_data.get("is_correct", False))
        score_raw = eval_data.get("score", 0)
        score = (score_raw / 100.0) if isinstance(score_raw, (int, float)) else 0.0
        feedback = eval_data.get("feedback") or eval_data.get("explanation") or ""
        concept_ids = problem.get("metadata", {}).get("concept_ids", [])
        # Simple confidence delta heuristic; can be replaced by selector service
        confidence_delta = 0.1 * score if correct else -0.05

        return {
            "correct": correct,
            "score": score,
            "feedback": feedback,
            "concept_ids": concept_ids,
            "confidence_delta": confidence_delta,
        }


# ============================================================================
# CONCRETE IMPLEMENTATIONS
# ============================================================================

class ClaudeProvider(LLMProvider):
    """Claude/Anthropic API provider implementation."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-sonnet-20241022", **kwargs):
        """
        Initialize Claude provider.
        
        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
            model: Claude model to use
        """
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.")
        
        super().__init__(api_key=api_key, **kwargs)
        self.model = model
        
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.api_key)
        except ImportError:
            raise ImportError("anthropic package is required. Install with: pip install anthropic")
    
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Generate response using Claude API."""
        messages = [{"role": "user", "content": prompt}]
        
        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        }
        
        if system_message:
            kwargs["system"] = system_message
        
        response = self.client.messages.create(**kwargs)
        return response.content[0].text


class OpenAIProvider(LLMProvider):
    """OpenAI API provider implementation."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o", **kwargs):
        """
        Initialize OpenAI provider.
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            model: OpenAI model to use
        """
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
        
        super().__init__(api_key=api_key, **kwargs)
        self.model = model
        
        try:
            import openai
            self.client = openai.OpenAI(api_key=self.api_key)
        except ImportError:
            raise ImportError("openai package is required. Install with: pip install openai")
    
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Generate response using OpenAI API."""
        messages = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content


class OllamaProvider(LLMProvider):
    """Ollama local model provider implementation."""
    
    def __init__(
        self,
        model: str = "llama3.1",
        base_url: str = "http://localhost:11434",
        **kwargs
    ):
        """
        Initialize Ollama provider.
        
        Args:
            model: Ollama model name (e.g., llama3.1, mistral, etc.)
            base_url: Ollama server URL
        """
        super().__init__(api_key=None, **kwargs)  # Ollama doesn't need API key
        self.model = model
        self.base_url = base_url.rstrip('/')
    
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Generate response using Ollama API."""
        url = f"{self.base_url}/api/generate"
        
        # Combine system message and prompt if system message exists
        full_prompt = prompt
        if system_message:
            full_prompt = f"{system_message}\n\n{prompt}"
        
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to connect to Ollama server at {self.base_url}: {e}")
        except Exception as e:
            raise RuntimeError(f"Error generating response from Ollama: {e}")


# ============================================================================
# FACTORY FUNCTION
# ============================================================================

def get_llm_provider(
    provider_name: str = "claude",
    **kwargs
) -> LLMProvider:
    """
    Factory function to get the appropriate LLM provider instance.
    
    Args:
        provider_name: Name of the provider ("claude", "openai", "ollama")
        **kwargs: Provider-specific configuration options
        
    Returns:
        Instance of the requested LLM provider
        
    Raises:
        ValueError: If provider_name is not supported
        
    Examples:
        >>> # Use Claude with default settings
        >>> provider = get_llm_provider("claude")
        
        >>> # Use OpenAI with custom model
        >>> provider = get_llm_provider("openai", model="gpt-4o-mini")
        
        >>> # Use Ollama with custom model and URL
        >>> provider = get_llm_provider("ollama", model="mistral", base_url="http://192.168.1.100:11434")
    """
    provider_name = provider_name.lower()
    
    providers = {
        "claude": ClaudeProvider,
        "anthropic": ClaudeProvider,
        "openai": OpenAIProvider,
        "gpt": OpenAIProvider,
        "ollama": OllamaProvider,
        "local": OllamaProvider
    }
    
    if provider_name not in providers:
        available = ", ".join(sorted(set(providers.keys())))
        raise ValueError(
            f"Unknown provider '{provider_name}'. "
            f"Available providers: {available}"
        )
    
    provider_class = providers[provider_name]
    
    # Get provider from environment variable if not specified
    if not kwargs.get("model"):
        if provider_name in ["claude", "anthropic"]:
            kwargs["model"] = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
        elif provider_name in ["openai", "gpt"]:
            kwargs["model"] = os.getenv("OPENAI_MODEL", "gpt-4o")
        elif provider_name in ["ollama", "local"]:
            kwargs["model"] = os.getenv("OLLAMA_MODEL", "llama3.1")
    
    return provider_class(**kwargs)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_default_provider() -> LLMProvider:
    """
    Get the default LLM provider based on environment configuration.
    
    Checks for LLM_PROVIDER environment variable, falls back to Claude.
    
    Returns:
        Configured LLM provider instance
    """
    provider_name = os.getenv("LLM_PROVIDER", "claude")
    return get_llm_provider(provider_name)


def list_available_providers() -> List[str]:
    """
    List all available LLM providers.
    
    Returns:
        List of provider names that can be used with get_llm_provider()
    """
    return ["claude", "openai", "ollama"]
