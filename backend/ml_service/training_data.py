"""
Training Data for Recovery Road ML Models
==========================================
Synthetic dataset for training text classifiers and risk prediction models.

Text data: patient chat/journal messages labeled with risk level + emotion
Risk data: normalized numeric feature vectors labeled with risk level
"""

import pandas as pd
import numpy as np

# ═══════════════════════════════════════════════════════════════════════
#  TEXT TRAINING DATA — for risk classification & emotion detection
# ═══════════════════════════════════════════════════════════════════════

TEXT_TRAINING_DATA = [
    # ── HIGH risk ──
    {"text": "I want to kill myself I can't take this anymore", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I'm going to end it all tonight goodbye everyone", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I took too many pills I don't care what happens", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I've been cutting myself again the pain is the only thing I feel", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I want to die there's no reason to live anymore", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I'm planning to jump off the bridge tonight", "risk": "HIGH", "emotion": "sadness"},
    {"text": "nobody would care if I was gone I'm going to do it", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I overdosed last night and I'd do it again", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I can't go on like this I'm going to hurt myself", "risk": "HIGH", "emotion": "sadness"},
    {"text": "goodbye world I've made my decision to end it", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I relapsed hard and now I want to end everything", "risk": "HIGH", "emotion": "sadness"},
    {"text": "nothing matters anymore I want to slit my wrists", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I've been suicidal all week and I have a plan", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I can't take it anymore please just let me die", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I'm going to hang myself tonight when everyone is asleep", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I feel so hopeless that death seems like the only way out", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I've written my goodbye letter and I'm ready to end it all", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I took a whole bottle of pills I just want the pain to stop", "risk": "HIGH", "emotion": "sadness"},
    {"text": "there's no point in living anymore I want to kill myself now", "risk": "HIGH", "emotion": "sadness"},
    {"text": "I've been thinking about suicide every single day this week", "risk": "HIGH", "emotion": "sadness"},

    # ── MED risk ──
    {"text": "I relapsed last night I feel terrible about it", "risk": "MED", "emotion": "sadness"},
    {"text": "my cravings are so strong right now I'm about to give in", "risk": "MED", "emotion": "anxiety"},
    {"text": "I've been using again I can't stop the cycle", "risk": "MED", "emotion": "sadness"},
    {"text": "I'm spiraling out of control and I can't cope with anything", "risk": "MED", "emotion": "anxiety"},
    {"text": "the temptation is unbearable I need help immediately", "risk": "MED", "emotion": "anxiety"},
    {"text": "I had a panic attack today and almost used", "risk": "MED", "emotion": "anxiety"},
    {"text": "I've been drinking again after 30 days clean", "risk": "MED", "emotion": "sadness"},
    {"text": "I feel desperate and falling apart I'm going to relapse", "risk": "MED", "emotion": "anxiety"},
    {"text": "everything is breaking down I want to use so badly", "risk": "MED", "emotion": "anxiety"},
    {"text": "I can't cope with the stress the craving is overwhelming", "risk": "MED", "emotion": "anxiety"},
    {"text": "I'm giving up on recovery I just want to use again", "risk": "MED", "emotion": "sadness"},
    {"text": "my cravings are getting worse every day I feel hopeless", "risk": "MED", "emotion": "sadness"},
    {"text": "I almost relapsed today the urge was so strong", "risk": "MED", "emotion": "anxiety"},
    {"text": "I've been smoking again I feel so ashamed and weak", "risk": "MED", "emotion": "sadness"},
    {"text": "I'm panicking and I don't know what to do about these cravings", "risk": "MED", "emotion": "anxiety"},
    {"text": "I feel like I'm about to break my sobriety I need help now", "risk": "MED", "emotion": "anxiety"},
    {"text": "the withdrawal symptoms are unbearable I feel desperate", "risk": "MED", "emotion": "anxiety"},
    {"text": "I had a terrible day and the only thing I want is to use", "risk": "MED", "emotion": "sadness"},
    {"text": "I've been hiding my relapse from everyone I'm so scared", "risk": "MED", "emotion": "anxiety"},
    {"text": "temptation is everywhere I feel like giving up on being clean", "risk": "MED", "emotion": "sadness"},

    # ── LOW risk (positive / neutral) ──
    {"text": "I'm feeling better today went for a long walk this morning", "risk": "LOW", "emotion": "hope"},
    {"text": "90 days sober and counting I'm so proud of my progress", "risk": "LOW", "emotion": "hope"},
    {"text": "therapy session was great today I learned new coping strategies", "risk": "LOW", "emotion": "hope"},
    {"text": "I talked to my sponsor and feel much more supported now", "risk": "LOW", "emotion": "hope"},
    {"text": "had a good day at work feeling positive about the future", "risk": "LOW", "emotion": "hope"},
    {"text": "my family visited and it was really nice to see them", "risk": "LOW", "emotion": "hope"},
    {"text": "I completed my daily meditation and journaling feeling centered", "risk": "LOW", "emotion": "hope"},
    {"text": "one year clean today this is the biggest accomplishment of my life", "risk": "LOW", "emotion": "hope"},
    {"text": "I've been exercising regularly and my mood has improved so much", "risk": "LOW", "emotion": "hope"},
    {"text": "feeling motivated and strong in my recovery journey today", "risk": "LOW", "emotion": "hope"},
    {"text": "I went to the support group meeting and shared my story", "risk": "LOW", "emotion": "hope"},
    {"text": "had a productive day feeling grateful for my sobriety", "risk": "LOW", "emotion": "hope"},
    {"text": "I'm sleeping better and eating healthier recovery is going well", "risk": "LOW", "emotion": "hope"},
    {"text": "celebrated 6 months clean with my family so grateful", "risk": "LOW", "emotion": "hope"},
    {"text": "today was okay nothing special just a normal routine day", "risk": "LOW", "emotion": "neutral"},
    {"text": "went to the store and cooked dinner nothing much happened", "risk": "LOW", "emotion": "neutral"},
    {"text": "had a quiet day at home watched some TV and rested", "risk": "LOW", "emotion": "neutral"},
    {"text": "just checking in to say everything is fine today", "risk": "LOW", "emotion": "neutral"},
    {"text": "feeling stronger every day my recovery plan is working", "risk": "LOW", "emotion": "hope"},
    {"text": "made amends with an old friend today it felt healing", "risk": "LOW", "emotion": "hope"},

    # ── Additional emotion diversity (anxiety) ──
    {"text": "I'm so anxious I can't stop shaking and worrying about everything", "risk": "MED", "emotion": "anxiety"},
    {"text": "heart racing can't breathe feeling like something terrible will happen", "risk": "MED", "emotion": "anxiety"},
    {"text": "I'm scared of going outside the anxiety is paralyzing me", "risk": "MED", "emotion": "anxiety"},
    {"text": "panic attacks every night I'm terrified and can't sleep", "risk": "MED", "emotion": "anxiety"},
    {"text": "I'm restless and on edge all the time nervous about everything", "risk": "MED", "emotion": "anxiety"},
    {"text": "constant worry and fear I feel like I'm losing control", "risk": "MED", "emotion": "anxiety"},
    {"text": "my hands are trembling and I can't focus the anxiety is overwhelming", "risk": "MED", "emotion": "anxiety"},
    {"text": "I feel nervous about my appointment tomorrow so much anxiety", "risk": "LOW", "emotion": "anxiety"},

    # ── Additional emotion diversity (anger) ──
    {"text": "I'm so angry at everyone nothing is fair and nobody understands", "risk": "MED", "emotion": "anger"},
    {"text": "I hate everything about my life I'm furious at the world", "risk": "MED", "emotion": "anger"},
    {"text": "I want to break things I'm full of rage and resentment", "risk": "MED", "emotion": "anger"},
    {"text": "everyone is against me I'm so frustrated and bitter", "risk": "MED", "emotion": "anger"},
    {"text": "I'm livid at my family they don't care about my recovery", "risk": "MED", "emotion": "anger"},
    {"text": "this program is useless I'm irritated and pissed off", "risk": "MED", "emotion": "anger"},
    {"text": "I feel enraged when people tell me to calm down it makes it worse", "risk": "MED", "emotion": "anger"},
    {"text": "I snapped at my coworker today I need to manage my anger better", "risk": "LOW", "emotion": "anger"},

    # ── Additional emotion diversity (sadness without high risk) ──
    {"text": "I feel empty inside like nothing brings joy anymore just numb", "risk": "MED", "emotion": "sadness"},
    {"text": "I'm crying all the time and I feel so lonely and depressed", "risk": "MED", "emotion": "sadness"},
    {"text": "the grief is overwhelming I miss my old life before addiction", "risk": "MED", "emotion": "sadness"},
    {"text": "I feel worthless and broken like I'll never be normal again", "risk": "MED", "emotion": "sadness"},
    {"text": "everything feels hopeless today I'm just devastated and lost", "risk": "MED", "emotion": "sadness"},
    {"text": "I'm miserable and lonely nobody calls or visits anymore", "risk": "MED", "emotion": "sadness"},
    {"text": "I had a sad day thinking about all the damage my addiction caused", "risk": "LOW", "emotion": "sadness"},
    {"text": "feeling a bit down today but I know it will pass eventually", "risk": "LOW", "emotion": "sadness"},

    # ── Additional neutral ──
    {"text": "woke up had breakfast walked the dog same as usual", "risk": "LOW", "emotion": "neutral"},
    {"text": "nothing interesting today just doing my regular routine", "risk": "LOW", "emotion": "neutral"},
    {"text": "went to class came home did homework regular day", "risk": "LOW", "emotion": "neutral"},
    {"text": "laundry day cleaned the house made some food", "risk": "LOW", "emotion": "neutral"},
    {"text": "watched a movie with friends it was alright nothing special", "risk": "LOW", "emotion": "neutral"},
    {"text": "took my medication on time did my breathing exercises", "risk": "LOW", "emotion": "neutral"},
]


# ═══════════════════════════════════════════════════════════════════════
#  RISK FEATURE DATA — for numeric risk prediction model
# ═══════════════════════════════════════════════════════════════════════
# Features: avgCraving, maxCraving, avgMood, moodDecline, triggers, activity, missed, relapses
# All normalized 0-1

RISK_FEATURE_DATA = [
    # ── HIGH risk profiles ──
    {"avgCraving": 0.9, "maxCraving": 1.0, "avgMood": 0.1, "moodDecline": 0.8, "triggers": 0.9, "activity": 0.0, "missed": 1.0, "relapses": 0.8, "label": "HIGH"},
    {"avgCraving": 0.85, "maxCraving": 0.9, "avgMood": 0.2, "moodDecline": 0.7, "triggers": 0.7, "activity": 0.1, "missed": 0.7, "relapses": 0.6, "label": "HIGH"},
    {"avgCraving": 0.8, "maxCraving": 1.0, "avgMood": 0.15, "moodDecline": 0.9, "triggers": 0.8, "activity": 0.0, "missed": 1.0, "relapses": 1.0, "label": "HIGH"},
    {"avgCraving": 0.75, "maxCraving": 0.9, "avgMood": 0.25, "moodDecline": 0.6, "triggers": 0.6, "activity": 0.05, "missed": 0.7, "relapses": 0.4, "label": "HIGH"},
    {"avgCraving": 0.95, "maxCraving": 1.0, "avgMood": 0.1, "moodDecline": 1.0, "triggers": 1.0, "activity": 0.0, "missed": 1.0, "relapses": 0.6, "label": "HIGH"},
    {"avgCraving": 0.7, "maxCraving": 0.85, "avgMood": 0.2, "moodDecline": 0.75, "triggers": 0.8, "activity": 0.1, "missed": 0.7, "relapses": 0.5, "label": "HIGH"},
    {"avgCraving": 0.8, "maxCraving": 0.95, "avgMood": 0.3, "moodDecline": 0.65, "triggers": 0.5, "activity": 0.05, "missed": 1.0, "relapses": 0.7, "label": "HIGH"},
    {"avgCraving": 0.88, "maxCraving": 1.0, "avgMood": 0.15, "moodDecline": 0.85, "triggers": 0.7, "activity": 0.0, "missed": 0.7, "relapses": 0.9, "label": "HIGH"},
    {"avgCraving": 0.7, "maxCraving": 0.8, "avgMood": 0.2, "moodDecline": 0.9, "triggers": 0.9, "activity": 0.15, "missed": 0.7, "relapses": 0.3, "label": "HIGH"},
    {"avgCraving": 0.82, "maxCraving": 0.9, "avgMood": 0.1, "moodDecline": 0.7, "triggers": 0.6, "activity": 0.0, "missed": 1.0, "relapses": 0.8, "label": "HIGH"},
    {"avgCraving": 0.65, "maxCraving": 0.9, "avgMood": 0.25, "moodDecline": 0.8, "triggers": 0.75, "activity": 0.1, "missed": 0.7, "relapses": 0.6, "label": "HIGH"},
    {"avgCraving": 0.92, "maxCraving": 1.0, "avgMood": 0.05, "moodDecline": 1.0, "triggers": 0.85, "activity": 0.0, "missed": 1.0, "relapses": 1.0, "label": "HIGH"},
    {"avgCraving": 0.78, "maxCraving": 0.88, "avgMood": 0.18, "moodDecline": 0.82, "triggers": 0.65, "activity": 0.05, "missed": 0.7, "relapses": 0.55, "label": "HIGH"},
    {"avgCraving": 0.72, "maxCraving": 0.85, "avgMood": 0.22, "moodDecline": 0.78, "triggers": 0.72, "activity": 0.08, "missed": 1.0, "relapses": 0.45, "label": "HIGH"},
    {"avgCraving": 0.84, "maxCraving": 0.95, "avgMood": 0.12, "moodDecline": 0.88, "triggers": 0.78, "activity": 0.02, "missed": 0.7, "relapses": 0.75, "label": "HIGH"},
    {"avgCraving": 0.68, "maxCraving": 0.82, "avgMood": 0.28, "moodDecline": 0.72, "triggers": 0.85, "activity": 0.12, "missed": 1.0, "relapses": 0.35, "label": "HIGH"},

    # ── MED risk profiles ──
    {"avgCraving": 0.55, "maxCraving": 0.7, "avgMood": 0.35, "moodDecline": 0.5, "triggers": 0.5, "activity": 0.3, "missed": 0.35, "relapses": 0.2, "label": "MED"},
    {"avgCraving": 0.5, "maxCraving": 0.6, "avgMood": 0.4, "moodDecline": 0.4, "triggers": 0.4, "activity": 0.25, "missed": 0.35, "relapses": 0.1, "label": "MED"},
    {"avgCraving": 0.6, "maxCraving": 0.75, "avgMood": 0.3, "moodDecline": 0.55, "triggers": 0.55, "activity": 0.2, "missed": 0.35, "relapses": 0.3, "label": "MED"},
    {"avgCraving": 0.45, "maxCraving": 0.65, "avgMood": 0.45, "moodDecline": 0.35, "triggers": 0.35, "activity": 0.35, "missed": 0.0, "relapses": 0.1, "label": "MED"},
    {"avgCraving": 0.65, "maxCraving": 0.8, "avgMood": 0.3, "moodDecline": 0.6, "triggers": 0.45, "activity": 0.15, "missed": 0.7, "relapses": 0.2, "label": "MED"},
    {"avgCraving": 0.5, "maxCraving": 0.7, "avgMood": 0.35, "moodDecline": 0.5, "triggers": 0.6, "activity": 0.3, "missed": 0.35, "relapses": 0.0, "label": "MED"},
    {"avgCraving": 0.4, "maxCraving": 0.6, "avgMood": 0.4, "moodDecline": 0.45, "triggers": 0.5, "activity": 0.25, "missed": 0.35, "relapses": 0.2, "label": "MED"},
    {"avgCraving": 0.58, "maxCraving": 0.70, "avgMood": 0.38, "moodDecline": 0.48, "triggers": 0.42, "activity": 0.2, "missed": 0.35, "relapses": 0.15, "label": "MED"},
    {"avgCraving": 0.52, "maxCraving": 0.65, "avgMood": 0.32, "moodDecline": 0.55, "triggers": 0.55, "activity": 0.22, "missed": 0.7, "relapses": 0.1, "label": "MED"},
    {"avgCraving": 0.48, "maxCraving": 0.58, "avgMood": 0.42, "moodDecline": 0.38, "triggers": 0.38, "activity": 0.3, "missed": 0.0, "relapses": 0.25, "label": "MED"},
    {"avgCraving": 0.6, "maxCraving": 0.75, "avgMood": 0.28, "moodDecline": 0.6, "triggers": 0.5, "activity": 0.18, "missed": 0.7, "relapses": 0.3, "label": "MED"},
    {"avgCraving": 0.42, "maxCraving": 0.55, "avgMood": 0.48, "moodDecline": 0.3, "triggers": 0.3, "activity": 0.35, "missed": 0.35, "relapses": 0.05, "label": "MED"},
    {"avgCraving": 0.47, "maxCraving": 0.62, "avgMood": 0.43, "moodDecline": 0.42, "triggers": 0.48, "activity": 0.28, "missed": 0.35, "relapses": 0.12, "label": "MED"},
    {"avgCraving": 0.53, "maxCraving": 0.68, "avgMood": 0.36, "moodDecline": 0.52, "triggers": 0.44, "activity": 0.22, "missed": 0.0, "relapses": 0.18, "label": "MED"},
    {"avgCraving": 0.62, "maxCraving": 0.72, "avgMood": 0.34, "moodDecline": 0.58, "triggers": 0.52, "activity": 0.16, "missed": 0.7, "relapses": 0.22, "label": "MED"},
    {"avgCraving": 0.44, "maxCraving": 0.56, "avgMood": 0.46, "moodDecline": 0.36, "triggers": 0.32, "activity": 0.32, "missed": 0.0, "relapses": 0.08, "label": "MED"},

    # ── LOW risk profiles ──
    {"avgCraving": 0.1, "maxCraving": 0.2, "avgMood": 0.8, "moodDecline": 0.1, "triggers": 0.1, "activity": 0.9, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.15, "maxCraving": 0.3, "avgMood": 0.7, "moodDecline": 0.15, "triggers": 0.15, "activity": 0.8, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.2, "maxCraving": 0.35, "avgMood": 0.65, "moodDecline": 0.2, "triggers": 0.2, "activity": 0.7, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.05, "maxCraving": 0.1, "avgMood": 0.9, "moodDecline": 0.0, "triggers": 0.05, "activity": 0.95, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.25, "maxCraving": 0.4, "avgMood": 0.6, "moodDecline": 0.25, "triggers": 0.25, "activity": 0.6, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.3, "maxCraving": 0.4, "avgMood": 0.55, "moodDecline": 0.3, "triggers": 0.3, "activity": 0.5, "missed": 0.35, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.1, "maxCraving": 0.15, "avgMood": 0.85, "moodDecline": 0.05, "triggers": 0.1, "activity": 0.85, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.2, "maxCraving": 0.25, "avgMood": 0.75, "moodDecline": 0.1, "triggers": 0.15, "activity": 0.75, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.35, "maxCraving": 0.45, "avgMood": 0.55, "moodDecline": 0.3, "triggers": 0.25, "activity": 0.45, "missed": 0.0, "relapses": 0.1, "label": "LOW"},
    {"avgCraving": 0.0, "maxCraving": 0.05, "avgMood": 0.95, "moodDecline": 0.0, "triggers": 0.0, "activity": 1.0, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.18, "maxCraving": 0.3, "avgMood": 0.7, "moodDecline": 0.12, "triggers": 0.2, "activity": 0.65, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.28, "maxCraving": 0.38, "avgMood": 0.62, "moodDecline": 0.22, "triggers": 0.18, "activity": 0.58, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.08, "maxCraving": 0.12, "avgMood": 0.88, "moodDecline": 0.02, "triggers": 0.08, "activity": 0.92, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.22, "maxCraving": 0.32, "avgMood": 0.72, "moodDecline": 0.18, "triggers": 0.12, "activity": 0.72, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.12, "maxCraving": 0.22, "avgMood": 0.82, "moodDecline": 0.08, "triggers": 0.05, "activity": 0.88, "missed": 0.0, "relapses": 0.0, "label": "LOW"},
    {"avgCraving": 0.32, "maxCraving": 0.42, "avgMood": 0.58, "moodDecline": 0.28, "triggers": 0.22, "activity": 0.52, "missed": 0.0, "relapses": 0.05, "label": "LOW"},
]


def get_text_dataframe():
    """Return text training data as a pandas DataFrame."""
    return pd.DataFrame(TEXT_TRAINING_DATA)


def get_risk_dataframe():
    """Return risk feature training data as a pandas DataFrame."""
    return pd.DataFrame(RISK_FEATURE_DATA)
