package com.example.pianoprofessor

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class LessonUIState {
    object Idle : LessonUIState()
    data class Playing(val stepIndex: Int, val segmentIndex: Int, val currentText: String = "", val isSpeaking: Boolean = false) : LessonUIState()
    data class Quiz(val quizData: QuizData) : LessonUIState()
    data class Complete(val message: String) : LessonUIState()
}

class LessonViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<LessonUIState>(LessonUIState.Idle)
    val uiState: StateFlow<LessonUIState> = _uiState

    private var currentLesson: Lesson? = null
    private var currentStepIndex = 0

    fun startLesson(lessonId: Int) {
        val lesson = LESSONS[lessonId] ?: return
        currentLesson = lesson
        currentStepIndex = 0
        runStep(0)
    }

    private fun runStep(index: Int) {
        val lesson = currentLesson ?: return
        if (index >= lesson.steps.size) {
            _uiState.value = LessonUIState.Complete(lesson.complete)
            return
        }

        currentStepIndex = index
        val step = lesson.steps[index]
        
        viewModelScope.launch {
            for (segIndex in step.segments.indices) {
                val segment = step.segments[segIndex]
                handleSegment(segment, index, segIndex)
            }
        }
    }

    private suspend fun handleSegment(segment: Segment, stepIdx: Int, segIdx: Int) {
        when (segment) {
            is Segment.Say -> {
                _uiState.value = LessonUIState.Playing(stepIdx, segIdx, segment.text, true)
                // Mock speech duration
                delay(segment.text.length * 50L) 
                _uiState.value = (uiState.value as? LessonUIState.Playing)?.copy(isSpeaking = false) ?: uiState.value
                delay(segment.gap)
            }
            is Segment.Pause -> {
                delay(segment.ms)
            }
            is Segment.Chord -> {
                // Mock LED command
                println("LED: Light up ${segment.notes} in ${segment.color}")
                delay(segment.wait)
            }
            is Segment.Seq -> {
                segment.notes.forEach { note ->
                    println("LED: Light up $note in ${segment.color}")
                    delay(segment.delay)
                }
                delay(segment.wait)
            }
            is Segment.SeqAll -> {
                segment.notes.forEach { note ->
                    println("LED: Light up $note in ${segment.color}")
                    delay(segment.delay)
                }
                delay(segment.wait)
            }
            is Segment.Quiz -> {
                _uiState.value = LessonUIState.Quiz(segment.quiz)
            }
        }
    }

    fun onQuizAnswered(isCorrect: Boolean) {
        if (isCorrect) {
            // Proceed to next step or continue
            runStep(currentStepIndex + 1)
        } else {
            // Handle wrong answer
        }
    }

    fun nextStep() {
        runStep(currentStepIndex + 1)
    }
}
