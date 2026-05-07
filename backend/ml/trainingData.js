/**
 * ML Training Data — Synthetic Dataset for Recovery Road
 *
 * Two datasets:
 *   1. textTrainingData   — labeled chat/journal texts for sentiment + risk classification
 *   2. riskTrainingData   — labeled numerical feature vectors for relapse risk prediction
 *
 * These simulate realistic patient scenarios in a substance abuse recovery context.
 * The Naive Bayes classifier (text) and Logistic Regression classifier (risk)
 * learn from these examples instead of relying on hardcoded rules.
 */

// ══════════════════════════════════════════════════════════════════════════════
//  1. TEXT CLASSIFICATION TRAINING DATA
//     Labels:  risk   → HIGH | MED | LOW
//              emotion → anxiety | sadness | anger | hope | neutral
// ══════════════════════════════════════════════════════════════════════════════

const textTrainingData = [
  // ── HIGH risk texts ──
  { text: 'I want to kill myself I cant take this anymore', risk: 'HIGH', emotion: 'sadness' },
  { text: 'thinking about ending it all tonight', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I took too many pills I dont care anymore', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I want to die nobody cares about me', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I am going to hurt myself tonight I have a plan', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I overdosed last night and I dont regret it', risk: 'HIGH', emotion: 'sadness' },
  { text: 'cutting myself is the only thing that helps', risk: 'HIGH', emotion: 'sadness' },
  { text: 'goodbye everyone I cant go on living like this', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I have nothing to live for anymore suicide seems like the answer', risk: 'HIGH', emotion: 'sadness' },
  { text: 'self harm is the only way I feel anything', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I am going to jump off the bridge tonight', risk: 'HIGH', emotion: 'sadness' },
  { text: 'cant take this pain anymore I want it to end permanently', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I have been thinking about suicide every day this week', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I tried to hang myself but it didnt work', risk: 'HIGH', emotion: 'sadness' },
  { text: 'Slitting my wrists seems like the only option left', risk: 'HIGH', emotion: 'anger' },
  { text: 'nobody would even notice if I was gone forever', risk: 'HIGH', emotion: 'sadness' },
  { text: 'plan to end my life this weekend', risk: 'HIGH', emotion: 'sadness' },
  { text: 'can not go on any more want to die tonight please help', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I took a whole bottle of sleeping pills', risk: 'HIGH', emotion: 'sadness' },
  { text: 'I am going to do it this time no one can stop me', risk: 'HIGH', emotion: 'anger' },

  // ── MED risk texts (relapse / craving / distress) ──
  { text: 'I relapsed last night I feel terrible about it', risk: 'MED', emotion: 'sadness' },
  { text: 'the cravings are so strong right now I dont know if I can resist', risk: 'MED', emotion: 'anxiety' },
  { text: 'I have been drinking again and I cant stop', risk: 'MED', emotion: 'sadness' },
  { text: 'I used again after 30 days clean I feel so ashamed', risk: 'MED', emotion: 'sadness' },
  { text: 'having a panic attack right now cant breathe', risk: 'MED', emotion: 'anxiety' },
  { text: 'I am spiraling out of control and everything is falling apart', risk: 'MED', emotion: 'anxiety' },
  { text: 'desperate for a fix right now the temptation is unbearable', risk: 'MED', emotion: 'anxiety' },
  { text: 'I feel like giving up on recovery its too hard', risk: 'MED', emotion: 'sadness' },
  { text: 'I cant cope with the stress I want to use again', risk: 'MED', emotion: 'anxiety' },
  { text: 'my cravings are getting worse every day I am scared', risk: 'MED', emotion: 'anxiety' },
  { text: 'breaking down right now I need help immediately', risk: 'MED', emotion: 'anxiety' },
  { text: 'I smoked again after two months clean feels terrible', risk: 'MED', emotion: 'sadness' },
  { text: 'I was at a party and I drank I feel so guilty', risk: 'MED', emotion: 'sadness' },
  { text: 'cant stop thinking about using drugs again', risk: 'MED', emotion: 'anxiety' },
  { text: 'everything feels unbearable today I just want to escape', risk: 'MED', emotion: 'sadness' },
  { text: 'I had a severe craving episode and almost used', risk: 'MED', emotion: 'anxiety' },
  { text: 'tempted to drink after a fight with my family', risk: 'MED', emotion: 'anger' },
  { text: 'I am panicking and I dont know what to do', risk: 'MED', emotion: 'anxiety' },
  { text: 'the withdrawal symptoms are killing me I want relief', risk: 'MED', emotion: 'anxiety' },
  { text: 'I feel completely hopeless about recovery', risk: 'MED', emotion: 'sadness' },
  { text: 'lost my job today and all I want is to drink', risk: 'MED', emotion: 'sadness' },
  { text: 'I am shaking so bad I think I need to use to calm down', risk: 'MED', emotion: 'anxiety' },
  { text: 'relapsing feels inevitable at this point', risk: 'MED', emotion: 'sadness' },
  { text: 'I am so angry I could explode I want to numb the pain', risk: 'MED', emotion: 'anger' },
  { text: 'breaking point reached I cannot handle this anymore', risk: 'MED', emotion: 'anxiety' },

  // ── LOW risk texts (positive / neutral / mild concern) ──
  { text: 'I am doing really well today had a great therapy session', risk: 'LOW', emotion: 'hope' },
  { text: 'feeling grateful for my support system', risk: 'LOW', emotion: 'hope' },
  { text: 'had a good day stayed clean and went for a walk', risk: 'LOW', emotion: 'hope' },
  { text: 'I am proud of myself for reaching 60 days sober', risk: 'LOW', emotion: 'hope' },
  { text: 'things are getting better every day I feel stronger', risk: 'LOW', emotion: 'hope' },
  { text: 'just checking in feeling okay nothing special today', risk: 'LOW', emotion: 'neutral' },
  { text: 'had a normal day at work nothing happened', risk: 'LOW', emotion: 'neutral' },
  { text: 'went to my meeting today it was helpful', risk: 'LOW', emotion: 'hope' },
  { text: 'I ate healthy and exercised today feeling positive', risk: 'LOW', emotion: 'hope' },
  { text: 'my counselor said I am making good progress', risk: 'LOW', emotion: 'hope' },
  { text: 'just woke up feeling alright ready for the day', risk: 'LOW', emotion: 'neutral' },
  { text: 'nothing much to report today just a regular day', risk: 'LOW', emotion: 'neutral' },
  { text: 'I meditated for 20 minutes this morning felt peaceful', risk: 'LOW', emotion: 'hope' },
  { text: 'completed my recovery activities today all of them', risk: 'LOW', emotion: 'hope' },
  { text: 'feeling motivated and optimistic about the future', risk: 'LOW', emotion: 'hope' },
  { text: 'I talked to my sponsor and it really helped', risk: 'LOW', emotion: 'hope' },
  { text: 'had a minor moment of stress but passed through it', risk: 'LOW', emotion: 'neutral' },
  { text: 'feeling a bit tired but otherwise okay', risk: 'LOW', emotion: 'neutral' },
  { text: 'today was a milestone I am 90 days clean', risk: 'LOW', emotion: 'hope' },
  { text: 'making progress slowly but surely I believe in myself', risk: 'LOW', emotion: 'hope' },
  { text: 'slightly worried about tomorrow but managing it', risk: 'LOW', emotion: 'anxiety' },
  { text: 'had coffee with a friend from group therapy nice talk', risk: 'LOW', emotion: 'hope' },
  { text: 'working on my goals one step at a time', risk: 'LOW', emotion: 'hope' },
  { text: 'today was average nothing good or bad happened', risk: 'LOW', emotion: 'neutral' },
  { text: 'I feel okay maybe a little bored but safe', risk: 'LOW', emotion: 'neutral' },

  // ── Additional emotion-diverse samples for better emotion accuracy ──
  // Anxiety
  { text: 'I am so anxious right now my heart is racing fast', risk: 'LOW', emotion: 'anxiety' },
  { text: 'feeling really nervous about the job interview tomorrow scared', risk: 'LOW', emotion: 'anxiety' },
  { text: 'cant sleep because of worry and fear about everything', risk: 'MED', emotion: 'anxiety' },
  { text: 'my anxiety is through the roof I feel restless and on edge', risk: 'MED', emotion: 'anxiety' },
  { text: 'I keep trembling and shaking I dont know why so scared', risk: 'MED', emotion: 'anxiety' },
  { text: 'worried about relapsing getting very nervous and fearful', risk: 'MED', emotion: 'anxiety' },
  { text: 'I am terrified of failing at recovery anxiety is overwhelming', risk: 'MED', emotion: 'anxiety' },
  { text: 'panic set in when I saw the bottle started shaking', risk: 'MED', emotion: 'anxiety' },
  // Anger
  { text: 'I am so angry at everyone they dont understand anything', risk: 'LOW', emotion: 'anger' },
  { text: 'furious about what happened today want to punch a wall', risk: 'LOW', emotion: 'anger' },
  { text: 'I hate everything about this situation so frustrated', risk: 'MED', emotion: 'anger' },
  { text: 'rage is building up inside me I feel bitter and resentful', risk: 'MED', emotion: 'anger' },
  { text: 'my family makes me so livid I am pissed off right now', risk: 'LOW', emotion: 'anger' },
  { text: 'got into a fight with my partner I am furious and irritated', risk: 'MED', emotion: 'anger' },
  { text: 'everyone is against me I am enraged by this injustice', risk: 'MED', emotion: 'anger' },
  { text: 'so frustrated and angry at myself for making bad choices', risk: 'LOW', emotion: 'anger' },
  // Sadness (additional)
  { text: 'I feel so empty and lonely nobody remembers me at all', risk: 'LOW', emotion: 'sadness' },
  { text: 'crying all day today feel worthless and broken inside', risk: 'MED', emotion: 'sadness' },
  { text: 'depression is heavy today everything feels numb and gray', risk: 'MED', emotion: 'sadness' },
  { text: 'I miss my old life before addiction I am so sad', risk: 'LOW', emotion: 'sadness' },
  { text: 'grieving the loss of relationships that addiction destroyed', risk: 'LOW', emotion: 'sadness' },
  { text: 'feeling miserable and alone no one to talk to today', risk: 'MED', emotion: 'sadness' },
  { text: 'tears wont stop coming I feel devastated by everything', risk: 'MED', emotion: 'sadness' },
  { text: 'my heart hurts from all the losses I am deeply sad', risk: 'LOW', emotion: 'sadness' },
  // Neutral (additional)
  { text: 'went to store bought groceries cooked dinner was fine', risk: 'LOW', emotion: 'neutral' },
  { text: 'watched a movie tonight it was decent nothing special', risk: 'LOW', emotion: 'neutral' },
  { text: 'had breakfast then went to work came back nothing unusual', risk: 'LOW', emotion: 'neutral' },
  { text: 'browsed the internet for a while then read a book', risk: 'LOW', emotion: 'neutral' },
  { text: 'rainy day stayed inside did some cleaning and laundry', risk: 'LOW', emotion: 'neutral' },
  { text: 'went to bed early last night slept okay woke up fine', risk: 'LOW', emotion: 'neutral' },
];


// ══════════════════════════════════════════════════════════════════════════════
//  2. RELAPSE RISK PREDICTION TRAINING DATA
//     Features: [avgCraving, maxCraving, avgMood, moodWorseningRatio,
//                triggerCount, activityPoints, missedCheckins, relapses30d]
//     Label:    riskLevel → HIGH | MED | LOW
//
//     All features are normalized 0–1 for the classifier.
// ══════════════════════════════════════════════════════════════════════════════

const riskTrainingData = [
  // ── HIGH risk profiles ──
  { features: { avgCraving: 0.9, maxCraving: 1.0, avgMood: 0.1, moodDecline: 0.8, triggers: 0.9, activity: 0.0, missed: 1.0, relapses: 0.8 }, label: 'HIGH' },
  { features: { avgCraving: 0.85, maxCraving: 0.9, avgMood: 0.2, moodDecline: 0.7, triggers: 0.7, activity: 0.1, missed: 0.7, relapses: 0.6 }, label: 'HIGH' },
  { features: { avgCraving: 0.8, maxCraving: 1.0, avgMood: 0.15, moodDecline: 0.9, triggers: 0.8, activity: 0.0, missed: 1.0, relapses: 1.0 }, label: 'HIGH' },
  { features: { avgCraving: 0.75, maxCraving: 0.9, avgMood: 0.25, moodDecline: 0.6, triggers: 0.6, activity: 0.05, missed: 0.7, relapses: 0.4 }, label: 'HIGH' },
  { features: { avgCraving: 0.95, maxCraving: 1.0, avgMood: 0.1, moodDecline: 1.0, triggers: 1.0, activity: 0.0, missed: 1.0, relapses: 0.6 }, label: 'HIGH' },
  { features: { avgCraving: 0.7, maxCraving: 0.85, avgMood: 0.2, moodDecline: 0.75, triggers: 0.8, activity: 0.1, missed: 0.7, relapses: 0.5 }, label: 'HIGH' },
  { features: { avgCraving: 0.8, maxCraving: 0.95, avgMood: 0.3, moodDecline: 0.65, triggers: 0.5, activity: 0.05, missed: 1.0, relapses: 0.7 }, label: 'HIGH' },
  { features: { avgCraving: 0.88, maxCraving: 1.0, avgMood: 0.15, moodDecline: 0.85, triggers: 0.7, activity: 0.0, missed: 0.7, relapses: 0.9 }, label: 'HIGH' },
  { features: { avgCraving: 0.7, maxCraving: 0.8, avgMood: 0.2, moodDecline: 0.9, triggers: 0.9, activity: 0.15, missed: 0.7, relapses: 0.3 }, label: 'HIGH' },
  { features: { avgCraving: 0.82, maxCraving: 0.9, avgMood: 0.1, moodDecline: 0.7, triggers: 0.6, activity: 0.0, missed: 1.0, relapses: 0.8 }, label: 'HIGH' },
  { features: { avgCraving: 0.65, maxCraving: 0.9, avgMood: 0.25, moodDecline: 0.8, triggers: 0.75, activity: 0.1, missed: 0.7, relapses: 0.6 }, label: 'HIGH' },
  { features: { avgCraving: 0.92, maxCraving: 1.0, avgMood: 0.05, moodDecline: 1.0, triggers: 0.85, activity: 0.0, missed: 1.0, relapses: 1.0 }, label: 'HIGH' },
  { features: { avgCraving: 0.78, maxCraving: 0.88, avgMood: 0.18, moodDecline: 0.82, triggers: 0.65, activity: 0.05, missed: 0.7, relapses: 0.55 }, label: 'HIGH' },
  { features: { avgCraving: 0.72, maxCraving: 0.85, avgMood: 0.22, moodDecline: 0.78, triggers: 0.72, activity: 0.08, missed: 1.0, relapses: 0.45 }, label: 'HIGH' },
  { features: { avgCraving: 0.84, maxCraving: 0.95, avgMood: 0.12, moodDecline: 0.88, triggers: 0.78, activity: 0.02, missed: 0.7, relapses: 0.75 }, label: 'HIGH' },
  { features: { avgCraving: 0.68, maxCraving: 0.82, avgMood: 0.28, moodDecline: 0.72, triggers: 0.85, activity: 0.12, missed: 1.0, relapses: 0.35 }, label: 'HIGH' },

  // ── MED risk profiles ──
  { features: { avgCraving: 0.55, maxCraving: 0.7, avgMood: 0.35, moodDecline: 0.5, triggers: 0.5, activity: 0.3, missed: 0.35, relapses: 0.2 }, label: 'MED' },
  { features: { avgCraving: 0.5, maxCraving: 0.6, avgMood: 0.4, moodDecline: 0.4, triggers: 0.4, activity: 0.25, missed: 0.35, relapses: 0.1 }, label: 'MED' },
  { features: { avgCraving: 0.6, maxCraving: 0.75, avgMood: 0.3, moodDecline: 0.55, triggers: 0.55, activity: 0.2, missed: 0.35, relapses: 0.3 }, label: 'MED' },
  { features: { avgCraving: 0.45, maxCraving: 0.65, avgMood: 0.45, moodDecline: 0.35, triggers: 0.35, activity: 0.35, missed: 0.0, relapses: 0.1 }, label: 'MED' },
  { features: { avgCraving: 0.65, maxCraving: 0.8, avgMood: 0.3, moodDecline: 0.6, triggers: 0.45, activity: 0.15, missed: 0.7, relapses: 0.2 }, label: 'MED' },
  { features: { avgCraving: 0.5, maxCraving: 0.7, avgMood: 0.35, moodDecline: 0.5, triggers: 0.6, activity: 0.3, missed: 0.35, relapses: 0.0 }, label: 'MED' },
  { features: { avgCraving: 0.4, maxCraving: 0.6, avgMood: 0.4, moodDecline: 0.45, triggers: 0.5, activity: 0.25, missed: 0.35, relapses: 0.2 }, label: 'MED' },
  { features: { avgCraving: 0.58, maxCraving: 0.70, avgMood: 0.38, moodDecline: 0.48, triggers: 0.42, activity: 0.2, missed: 0.35, relapses: 0.15 }, label: 'MED' },
  { features: { avgCraving: 0.52, maxCraving: 0.65, avgMood: 0.32, moodDecline: 0.55, triggers: 0.55, activity: 0.22, missed: 0.7, relapses: 0.1 }, label: 'MED' },
  { features: { avgCraving: 0.48, maxCraving: 0.58, avgMood: 0.42, moodDecline: 0.38, triggers: 0.38, activity: 0.3, missed: 0.0, relapses: 0.25 }, label: 'MED' },
  { features: { avgCraving: 0.6, maxCraving: 0.75, avgMood: 0.28, moodDecline: 0.6, triggers: 0.5, activity: 0.18, missed: 0.7, relapses: 0.3 }, label: 'MED' },
  { features: { avgCraving: 0.42, maxCraving: 0.55, avgMood: 0.48, moodDecline: 0.3, triggers: 0.3, activity: 0.35, missed: 0.35, relapses: 0.05 }, label: 'MED' },
  { features: { avgCraving: 0.47, maxCraving: 0.62, avgMood: 0.43, moodDecline: 0.42, triggers: 0.48, activity: 0.28, missed: 0.35, relapses: 0.12 }, label: 'MED' },
  { features: { avgCraving: 0.53, maxCraving: 0.68, avgMood: 0.36, moodDecline: 0.52, triggers: 0.44, activity: 0.22, missed: 0.0, relapses: 0.18 }, label: 'MED' },
  { features: { avgCraving: 0.62, maxCraving: 0.72, avgMood: 0.34, moodDecline: 0.58, triggers: 0.52, activity: 0.16, missed: 0.7, relapses: 0.22 }, label: 'MED' },
  { features: { avgCraving: 0.44, maxCraving: 0.56, avgMood: 0.46, moodDecline: 0.36, triggers: 0.32, activity: 0.32, missed: 0.0, relapses: 0.08 }, label: 'MED' },

  // ── LOW risk profiles ──
  { features: { avgCraving: 0.1, maxCraving: 0.2, avgMood: 0.8, moodDecline: 0.1, triggers: 0.1, activity: 0.9, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.15, maxCraving: 0.3, avgMood: 0.7, moodDecline: 0.15, triggers: 0.15, activity: 0.8, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.2, maxCraving: 0.35, avgMood: 0.65, moodDecline: 0.2, triggers: 0.2, activity: 0.7, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.05, maxCraving: 0.1, avgMood: 0.9, moodDecline: 0.0, triggers: 0.05, activity: 0.95, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.25, maxCraving: 0.4, avgMood: 0.6, moodDecline: 0.25, triggers: 0.25, activity: 0.6, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.3, maxCraving: 0.4, avgMood: 0.55, moodDecline: 0.3, triggers: 0.3, activity: 0.5, missed: 0.35, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.1, maxCraving: 0.15, avgMood: 0.85, moodDecline: 0.05, triggers: 0.1, activity: 0.85, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.2, maxCraving: 0.25, avgMood: 0.75, moodDecline: 0.1, triggers: 0.15, activity: 0.75, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.35, maxCraving: 0.45, avgMood: 0.55, moodDecline: 0.3, triggers: 0.25, activity: 0.45, missed: 0.0, relapses: 0.1 }, label: 'LOW' },
  { features: { avgCraving: 0.0, maxCraving: 0.05, avgMood: 0.95, moodDecline: 0.0, triggers: 0.0, activity: 1.0, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.18, maxCraving: 0.3, avgMood: 0.7, moodDecline: 0.12, triggers: 0.2, activity: 0.65, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.28, maxCraving: 0.38, avgMood: 0.62, moodDecline: 0.22, triggers: 0.18, activity: 0.58, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.08, maxCraving: 0.12, avgMood: 0.88, moodDecline: 0.02, triggers: 0.08, activity: 0.92, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.22, maxCraving: 0.32, avgMood: 0.72, moodDecline: 0.18, triggers: 0.12, activity: 0.72, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.12, maxCraving: 0.22, avgMood: 0.82, moodDecline: 0.08, triggers: 0.05, activity: 0.88, missed: 0.0, relapses: 0.0 }, label: 'LOW' },
  { features: { avgCraving: 0.32, maxCraving: 0.42, avgMood: 0.58, moodDecline: 0.28, triggers: 0.22, activity: 0.52, missed: 0.0, relapses: 0.05 }, label: 'LOW' },
];


module.exports = { textTrainingData, riskTrainingData };
