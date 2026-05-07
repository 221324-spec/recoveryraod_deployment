#!/usr/bin/env node
/**
 * ML Model Training Script
 *
 * Run:   node ml/trainModels.js
 *
 * Trains all ML models (text + risk classifiers) using the synthetic
 * training dataset and saves them to backend/ml/models/.
 * The server will auto-load these trained models on startup.
 */

const { trainAll } = require('./mlService');

(async () => {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Recovery Road — ML Model Training');
    console.log('═══════════════════════════════════════════════════\n');

    const meta = await trainAll();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Training Summary');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Text Risk Classifier   : ${meta.textClassifier.accuracy}% accuracy (${meta.textClassifier.samplesUsed} samples)`);
    console.log(`  Emotion Classifier     : ${meta.emotionClassifier.accuracy}% accuracy (${meta.emotionClassifier.samplesUsed} samples)`);
    console.log(`  Risk Feature Classifier: ${meta.riskClassifier.accuracy}% accuracy (${meta.riskClassifier.samplesUsed} samples)`);
    console.log('═══════════════════════════════════════════════════\n');

    // Quick test predictions
    console.log('Quick test predictions:');
    const { classifyText, predictRisk } = require('./mlService');

    console.log('\n  Text: "I want to kill myself"');
    console.log('  →', classifyText('I want to kill myself'));

    console.log('\n  Text: "cravings are really strong today I want to use"');
    console.log('  →', classifyText('cravings are really strong today I want to use'));

    console.log('\n  Text: "had a great day 90 days sober feeling proud"');
    console.log('  →', classifyText('had a great day 90 days sober feeling proud'));

    console.log('\n  Risk features (high risk profile):');
    console.log('  →', predictRisk({ avgCraving: 0.9, maxCraving: 1.0, avgMood: 0.1, moodDecline: 0.9, triggers: 0.8, activity: 0.0, missed: 1.0, relapses: 0.7 }));

    console.log('\n  Risk features (low risk profile):');
    console.log('  →', predictRisk({ avgCraving: 0.1, maxCraving: 0.2, avgMood: 0.8, moodDecline: 0.1, triggers: 0.1, activity: 0.9, missed: 0.0, relapses: 0.0 }));

    console.log('\n✅ All models trained and tested successfully!');
  } catch (error) {
    console.error('❌ Training failed:', error);
    process.exit(1);
  }
})();
