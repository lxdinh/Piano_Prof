package com.example.pianoprofessor.ui.transform

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.pianoprofessor.LESSONS

class TransformViewModel : ViewModel() {

    private val _texts = MutableLiveData<List<String>>().apply {
        value = LESSONS.values.map { it.title }
    }

    val texts: LiveData<List<String>> = _texts
}