package com.example.pianoprofessor.ui.lessons

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.pianoprofessor.LessonUIState
import com.example.pianoprofessor.LessonViewModel
import com.example.pianoprofessor.QuizData
import com.example.pianoprofessor.R

@Composable
fun LessonScreen(viewModel: LessonViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F1117))
            .padding(16.dp)
    ) {
        LessonHeader(uiState)

        Spacer(modifier = Modifier.height(24.dp))

        TeacherSection(uiState)

        Spacer(modifier = Modifier.weight(1f))

        ActionArea(uiState, viewModel)
    }
}

@Composable
fun LessonHeader(uiState: LessonUIState) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        IconButton(onClick = { /* TODO: Close lesson */ }) {
            Text("✕", color = Color.Gray, fontSize = 24.sp)
        }
        
        LinearProgressIndicator(
            progress = { 
                when(uiState) {
                    is LessonUIState.Playing -> (uiState.stepIndex.toFloat() / 12f) // Assuming 12 steps
                    else -> 1f
                }
            },
            modifier = Modifier
                .weight(1f)
                .height(12.dp)
                .clip(RoundedCornerShape(6.dp)),
            color = Color(0xFF58CC02),
            trackColor = Color(0xFF232840)
        )
    }
}

@Composable
fun TeacherSection(uiState: LessonUIState) {
    Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Mascot(isSpeaking = (uiState as? LessonUIState.Playing)?.isSpeaking == true)

        SpeechBubble(
            text = when (uiState) {
                is LessonUIState.Playing -> uiState.currentText
                is LessonUIState.Quiz -> uiState.quizData.-question
                is LessonUIState.Complete -> uiState.message
                else -> "Welcome to Piano Professor!"
            }
        )
    }
}

@Composable
fun Mascot(isSpeaking: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "mascot")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isSpeaking) 1.05f else 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (isSpeaking) 250 else 1800, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = Modifier
            .size(80.dp)
            .clip(CircleShape)
            .background(Color(0xFF58CC02))
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        // Placeholder for the actual SVG/Image
        Image(
            painter = painterResource(id = R.drawable.ic_launcher_foreground), // Using default for now
            contentDescription = "Mascot",
            modifier = Modifier.size(60.dp)
        )
    }
}

@Composable
fun SpeechBubble(text: String) {
    Surface(
        color = Color(0xFF1A1F2E),
        shape = RoundedCornerShape(18.dp, 18.dp, 18.dp, 4.dp),
        border = AssistChipDefaults.assistChipBorder(enabled = true, borderColor = Color(0xFF232840)),
        modifier = Modifier.padding(bottom = 8.dp)
    ) {
        Text(
            text = text,
            color = Color.White,
            modifier = Modifier.padding(16.dp),
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun ActionArea(uiState: LessonUIState, viewModel: LessonViewModel) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when (uiState) {
            is LessonUIState.Quiz -> {
                QuizOptions(uiState.quizData) { isCorrect ->
                    viewModel.onQuizAnswered(isCorrect)
                }
            }
            is LessonUIState.Complete -> {
                Button(
                    onClick = { /* TODO: Finish */ },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF58CC02)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Finish Lesson", fontWeight = FontWeight.Bold)
                }
            }
            else -> {
                Button(
                    onClick = { viewModel.nextStep() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF58CC02)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text("Continue →", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun QuizOptions(quizData: QuizData, onAnswer: (Boolean) -> Unit) {
    when (quizData) {
        is QuizData.MCQ -> {
            quizData.options.forEach { option ->
                OutlinedButton(
                    onClick = { onAnswer(option == quizData.answer) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                ) {
                    Text(option)
                }
            }
        }
        is QuizData.Key -> {
            Text("Find ${quizData.target} on the keyboard", color = Color.Cyan, fontWeight = FontWeight.Bold)
            // Keyboard would go here
        }
    }
}
