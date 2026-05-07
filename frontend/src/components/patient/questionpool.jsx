// QuestionPool.js (UPDATED - 20 new questions added per category, total 30 per category)
const questionPool = {
 "SHOWING SUPPORT": {
    category_ur: "حمایت کا اظہار",
    description: "Learn how to support individuals in recovery through empathy, encouragement, and healthy boundaries.",
    description_ur: "ہمدردی، حوصلہ افزائی، اور صحت مند حدود کے ذریعے صحت یابی میں لوگوں کی مدد کرنا سیکھیں۔",
    questions: [
      {
        prompt: "If someone in recovery shares they are craving drugs, the best response is:",
        prompt_ur: "اگر صحت یابی کے عمل سے گزرنے والا کوئی شخص یہ بتائے کہ اسے منشیات کی طلب ہو رہی ہے، تو بہترین ردعمل یہ ہے:",
        options: [
          "Listen calmly, validate their feelings, and remind them they are not alone.",
          "Tell them to ‘just be stronger’.",
          "Change the subject so they forget about it.",
          "Ignore what they said completely."
        ],
        options_ur: [
          "پرسکون ہو کر سنیں، ان کے احساسات کی توثیق کریں، اور انہیں یاد دلائیں کہ وہ اکیلے نہیں ہیں۔",
          "انہیں کہیں کہ 'بس ہمت سے کام لو'۔",
          "موضوع بدل دیں تاکہ وہ اس بارے میں بھول جائیں۔",
          "جو انہوں نے کہا اسے مکمل طور پر نظر انداز کر دیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "When showing support to a recovering person, it’s important to:",
        prompt_ur: "صحت یاب ہونے والے شخص کی حمایت کرتے وقت، یہ ضروری ہے کہ:",
        options: [
          "Offer help without judgment and respect their progress.",
          "Lecture them about their mistakes in detail.",
          "Avoid them so they ‘figure it out’ alone.",
          "Make jokes about their addiction."
        ],
        options_ur: [
          "بغیر کسی تنقید کے مدد کی پیشکش کریں اور ان کی ترقی کا احترام کریں۔",
          "انہیں ان کی غلطیوں کے بارے میں تفصیل سے لیکچر دیں۔",
          "ان سے گریز کریں تاکہ وہ اکیلے ہی 'سب کچھ سمجھ لیں'۔",
          "ان کی لت (ایڈکشن) کے بارے میں مذاق بنائیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A respectful way to check in with someone in counselling is to:",
        prompt_ur: "کونسلنگ کروانے والے کسی شخص سے حال احوال پوچھنے کا باوقار طریقہ یہ ہے:",
        options: [
          "Ask permission first and use open-ended questions.",
          "Constantly text them demanding updates.",
          "Interrogate them about past relapses.",
          "Give strict instructions and deadlines."
        ],
        options_ur: [
          "پہلے اجازت لیں اور ایسے سوالات پوچھیں جن کا جواب تفصیل سے دیا جا سکے۔",
          "اپ ڈیٹس مانگنے کے لیے انہیں مسلسل پیغامات بھیجیں یا ٹیکسٹ کریں۔",
          "ان سے ماضی میں دوبارہ نشہ شروع کرنے کے بارے میں پوچھ گچھ کریں۔",
          "سخت ہدایات اور ڈیڈ لائن دیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Why is setting your own boundaries important when supporting someone in recovery?",
        prompt_ur: "صحت یابی میں کسی کی مدد کرتے وقت اپنی حدود مقرر کرنا کیوں ضروری ہے؟",
        options: [
          "It helps you stay consistent and avoid emotional burnout.",
          "It lets you control their behavior.",
          "It shows you don’t really care.",
          "It gives you leverage to threaten them."
        ],
        options_ur: [
          "یہ آپ کو مستقل مزاج رہنے اور جذباتی تھکن سے بچنے میں مدد دیتا ہے۔",
          "یہ آپ کو ان کے رویے پر قابو پانے دیتا ہے۔",
          "یہ ظاہر کرتا ہے کہ آپ کو واقعی کوئی پرواہ نہیں ہے۔",
          "یہ آپ کو انہیں دھمکانے کا موقع فراہم کرتا ہے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which is an example of non-stigmatizing language?",
        prompt_ur: "کون سی مثال ایسی زبان کی ہے جو بدنامی (stigma) کا باعث نہیں بنتی؟",
        options: [
          "A person with a substance use disorder.",
          "Addict.",
          "Junkie.",
          "Abuser."
        ],
        options_ur: [
          "مادہ کے استعمال کے مرض میں مبتلا شخص۔",
          "نشئی (ایڈکٹ)۔",
          "چرسی۔",
          "غلط استعمال کرنے والا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A supportive encouragement statement would be:",
        prompt_ur: "حمایت اور حوصلہ افزائی کا جملہ کون سا ہو سکتا ہے؟",
        options: [
          "I appreciate the effort you’re putting into your recovery.",
          "You always mess up.",
          "Why can’t you just be normal?",
          "If you relapse, you’ve failed for good."
        ],
        options_ur: [
          "میں اس محنت کی قدر کرتا/کرتی ہوں جو آپ اپنی صحت یابی میں لگا رہے ہیں۔",
          "آپ ہمیشہ سب کچھ خراب کر دیتے ہیں۔",
          "آپ عام انسانوں کی طرح کیوں نہیں ہو سکتے؟",
          "اگر آپ نے دوبارہ نشہ کیا، تو آپ ہمیشہ کے لیے ناکام ہو جائیں گے۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "What is an empathetic way to respond to someone expressing frustration during recovery?",
        prompt_ur: "صحت یابی کے دوران مایوسی کا اظہار کرنے والے شخص کو ہمدردی سے جواب دینے کا طریقہ کیا ہے؟",
        options: [
          "Acknowledge their feelings and ask how you can support them.",
          "Tell them their feelings are exaggerated.",
          "Remind them others have it worse.",
          "Tell them to stop complaining."
        ],
        options_ur: [
          "ان کے جذبات کو تسلیم کریں اور پوچھیں کہ آپ ان کی مدد کیسے کر سکتے ہیں۔",
          "انہیں بتائیں کہ وہ بات کو بڑھا چڑھا کر پیش کر رہے ہیں۔",
          "انہیں یاد دلائیں کہ دوسرے لوگوں کے حالات اس سے بھی بدتر ہیں۔",
          "انہیں شکایتیں بند کرنے کا کہیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which action helps build trust with someone in recovery?",
        prompt_ur: "صحت یابی کے عمل میں کسی کا اعتماد جیتنے میں کون سا عمل مدد کرتا ہے؟",
        options: [
          "Keeping your promises and showing consistency.",
          "Frequently changing your mind.",
          "Telling others about their struggles.",
          "Giving them unsolicited advice."
        ],
        options_ur: [
          "اپنے وعدوں کو پورا کرنا اور مستقل مزاجی دکھانا۔",
          "بار بار اپنی رائے بدلنا۔",
          "دوسروں کو ان کی مشکلات کے بارے میں بتانا۔",
          "انہیں بن مانگے مشورے دینا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Healthy support includes:",
        prompt_ur: "صحت مند حمایت (support) میں شامل ہے:",
        options: [
          "Encouraging progress while respecting their pace.",
          "Forcing them into activities they don’t want.",
          "Assuming they cannot make their own decisions.",
          "Taking over all responsibilities for them."
        ],
        options_ur: [
          "ان کی رفتار کا احترام کرتے ہوئے ترقی کی حوصلہ افزائی کرنا۔",
          "انہیں ایسی سرگرمیوں پر مجبور کرنا جو وہ نہیں کرنا چاہتے۔",
          "یہ سمجھنا کہ وہ اپنے فیصلے خود نہیں کر سکتے۔",
          "ان کی تمام ذمہ داریاں خود سنبھال لینا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A supportive environment for recovery is one where:",
        prompt_ur: "صحت یابی کے لیے معاون ماحول وہ ہوتا ہے جہاں:",
        options: [
          "Communication is open, nonjudgmental, and consistent.",
          "Everyone ignores the person to avoid triggering them.",
          "People joke about addiction casually.",
          "Strict punishments are used to keep them in line."
        ],
        options_ur: [
          "بات چیت کھلی، غیر جانبدارانہ اور مستقل ہو۔",
          "ہر کوئی اس شخص کو نظر انداز کرے تاکہ وہ پریشان نہ ہو۔",
          "لوگ نشے کی لت کے بارے میں اتفاقاً مذاق کریں۔",
          "انہیں قابو میں رکھنے کے لیے سخت سزائیں استعمال کی جائیں۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "When offering practical help, it’s best to:",
        prompt_ur: "عملی مدد پیش کرتے وقت، بہترین طریقہ یہ ہے کہ:",
        options: [
          "Ask what they need and follow through on small promises.",
          "Do everything for them without asking.",
          "Offer large unsolicited favors right away.",
          "Compare their needs to others’ needs."
        ],
        options_ur: [
          "پوچھیں کہ انہیں کس چیز کی ضرورت ہے اور چھوٹے وعدوں کو پورا کریں۔",
          "پوچھے بغیر ان کے لیے سب کچھ خود کریں۔",
          "فوراً بڑے بڑے بن مانگے احسانات پیش کریں۔",
          "ان کی ضروریات کا دوسروں کی ضروریات سے موازنہ کریں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "If someone shares a setback, responding with which phrase is supportive?",
        prompt_ur: "اگر کوئی اپنی ناکامی یا دھچکے کے بارے میں بتائے، تو کون سا جملہ معاون ہے؟",
        options: [
          "That sounds really hard — what can I do to help?",
          "You should have avoided that place.",
          "That’s why I said you’d fail.",
          "You must not want it enough."
        ],
        options_ur: [
          "یہ واقعی مشکل لگتا ہے — میں مدد کے لیے کیا کر سکتا ہوں؟",
          "آپ کو اس جگہ سے بچنا چاہیے تھا۔",
          "اسی لیے میں نے کہا تھا کہ آپ ناکام ہو جائیں گے۔",
          "شاید آپ اسے دل سے نہیں چاہتے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which is NOT a helpful supportive behavior?",
        prompt_ur: "ان میں سے کون سا طرز عمل معاون یا مددگار نہیں ہے؟",
        options: [
          "Making them feel ashamed for slipping.",
          "Listening without judgment.",
          "Helping them find resources.",
          "Celebrating small successes."
        ],
        options_ur: [
          "غلطی ہونے پر انہیں شرمندہ محسوس کروانا۔",
          "بغیر کسی فیصلے کے بات سننا۔",
          "انہیں وسائل تلاش کرنے میں مدد دینا۔",
          "چھوٹی چھوٹی کامیابیوں کا جشن منانا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "How should you respond if a friend refuses help you offer?",
        prompt_ur: "اگر کوئی دوست آپ کی پیش کردہ مدد سے انکار کر دے تو آپ کو کیا ردعمل دینا چاہیے؟",
        options: [
          "Respect their choice and let them know you’re available when ready.",
          "Insist until they accept.",
          "Stop contacting them completely.",
          "Tell others they refused help."
        ],
        options_ur: [
          "ان کے فیصلے کا احترام کریں اور انہیں بتائیں کہ جب وہ تیار ہوں تو آپ دستیاب ہیں۔",
          "اصرار کریں جب تک وہ قبول نہ کر لیں۔",
          "ان سے رابطہ مکمل طور پر بند کر دیں۔",
          "دوسروں کو بتائیں کہ انہوں نے مدد لینے سے انکار کر دیا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "When supporting someone, self-care for you is important because:",
        prompt_ur: "کسی کی مدد کرتے وقت، آپ کی اپنی خود نگہداشت (self-care) ضروری ہے کیونکہ:",
        options: [
          "You’ll be better able to keep offering steady support.",
          "It proves you care more than others.",
          "It makes them dependent on you.",
          "It’s a sign of weakness."
        ],
        options_ur: [
          "آپ مستقل طور پر مدد فراہم کرنے کے قابل بہتر طریقے سے رہیں گے۔",
          "یہ ثابت کرتا ہے کہ آپ دوسروں سے زیادہ فکر کرتے ہیں۔",
          "یہ انہیں آپ پر منحصر بناتا ہے۔",
          "یہ کمزوری کی علامت ہے۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Which of the following is a boundary example?",
        prompt_ur: "مندرجہ ذیل میں سے حد (boundary) کی مثال کون سی ہے؟",
        options: [
          "I can listen every evening for 30 minutes but cannot give rides daily.",
          "I will always drop everything for you.",
          "I’ll handle all finances while you recover.",
          "I will tell everyone your story to get support."
        ],
        options_ur: [
          "میں ہر شام 30 منٹ تک آپ کی بات سن سکتا ہوں لیکن روزانہ سواری فراہم نہیں کر سکتا۔",
          "میں ہمیشہ آپ کے لیے سب کچھ چھوڑ دوں گا۔",
          "آپ کی صحت یابی کے دوران میں تمام مالی معاملات سنبھال لوں گا۔",
          "مدد حاصل کرنے کے لیے میں آپ کی کہانی سب کو سناؤں گا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "When someone in recovery seems triggered, you should first:",
        prompt_ur: "جب صحت یابی کے عمل میں کوئی شخص پریشان یا ٹرگر (triggered) لگے، تو آپ کو سب سے پہلے کیا کرنا چاہیے؟",
        options: [
          "Ask if they are okay and offer to help them use a coping skill.",
          "Bring up the last time they used drugs.",
          "Tell them to avoid triggers forever.",
          "Leave immediately without saying anything."
        ],
        options_ur: [
          "پوچھیں کہ کیا وہ ٹھیک ہیں اور انہیں مقابلہ کرنے کی مہارت استعمال کرنے میں مدد کی پیشکش کریں۔",
          "پچھلی بار جب انہوں نے نشہ کیا تھا، اس کا ذکر کریں۔",
          "انہیں کہیں کہ ہمیشہ کے لیے ٹرگرز سے بچیں۔",
          "بغیر کچھ کہے فوراً چلے جائیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A way to encourage autonomy in recovery is to:",
        prompt_ur: "صحت یابی میں خود مختاری کی حوصلہ افزائی کا ایک طریقہ یہ ہے کہ:",
        options: [
          "Ask how they’d like to solve a problem rather than telling them.",
          "Make decisions for them ‘for their own good’.",
          "Remove choices to keep them safe.",
          "Reward only perfect behavior."
        ],
        options_ur: [
          "انہیں بتانے کے بجائے یہ پوچھیں کہ وہ کسی مسئلے کو کیسے حل کرنا چاہیں گے۔",
          "ان کے 'بھلے' کے لیے فیصلے خود کریں۔",
          "انہیں محفوظ رکھنے کے لیے ان کے اختیارات ختم کر دیں۔",
          "صرف بہترین رویے پر انعام دیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "If a recovering person asks for honest feedback, you should:",
        prompt_ur: "اگر صحت یاب ہونے والا شخص دیانتدارانہ رائے (feedback) مانگے، تو آپ کو چاہیے کہ:",
        options: [
          "Be truthful but compassionate and specific.",
          "Bring up every past failure.",
          "Say only what pleases them.",
          "Refuse to discuss it."
        ],
        options_ur: [
          "سچ بولیں لیکن ہمدردانہ اور واضح رہیں۔",
          "ماضی کی ہر ناکامی کا ذکر کریں۔",
          "صرف وہی کہیں جس سے انہیں خوشی ہو۔",
          "اس پر بات کرنے سے انکار کر دیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "When supporting someone who relapsed, it’s helpful to:",
        prompt_ur: "دوبارہ نشہ شروع کرنے والے شخص کی مدد کرتے وقت، یہ مددگار ہے کہ:",
        options: [
          "Ask about what led to the relapse and how to reduce harm next time.",
          "Shame them to prevent another relapse.",
          "Pretend it didn’t happen.",
          "Cut them off permanently."
        ],
        options_ur: [
          "اس بارے میں پوچھیں کہ دوبارہ استعمال کی وجہ کیا بنی اور اگلی بار نقصان کو کیسے کم کیا جائے۔",
          "انہیں دوبارہ ایسا کرنے سے روکنے کے لیے شرمندہ کریں۔",
          "ایسا ظاہر کریں جیسے کچھ ہوا ہی نہیں۔",
          "ان سے مستقل تعلق توڑ لیں۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "How can you help a friend stick to their recovery routine?",
        prompt_ur: "آپ اپنے دوست کی صحت یابی کے معمول (routine) پر قائم رہنے میں کیسے مدد کر سکتے ہیں؟",
        options: [
          "Offer gentle reminders and celebrate completed steps together.",
          "Force them to follow the routine by threats.",
          "Tell them routines are unnecessary.",
          "Do the routine for them."
        ],
        options_ur: [
          "نرم یاد دہانیاں پیش کریں اور مکمل شدہ اقدامات کا مل کر جشن منائیں۔",
          "دھمکیوں کے ذریعے انہیں معمول پر عمل کرنے کے لیے مجبور کریں۔",
          "انہیں بتائیں کہ معمولات غیر ضروری ہیں۔",
          "ان کے لیے معمول کے کام خود کریں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Which phrase helps maintain hope during a hard moment?",
        prompt_ur: "مشکل لمحے میں کون سا جملہ امید برقرار رکھنے میں مدد دیتا ہے؟",
        options: [
          "Small steps count — you’ve made progress before, and you can again.",
          "You’re broken beyond repair.",
          "Stop being dramatic.",
          "You’ll never succeed."
        ],
        options_ur: [
          "چھوٹے اقدامات اہمیت رکھتے ہیں — آپ نے پہلے بھی ترقی کی ہے، اور آپ دوبارہ کر سکتے ہیں۔",
          "آپ اتنے ٹوٹ چکے ہیں کہ اب ٹھیک نہیں ہو سکتے۔",
          "ڈرامائی بننا بند کریں۔",
          "آپ کبھی کامیاب نہیں ہوں گے۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "If you’re unsure how to support someone, best practice is to:",
        prompt_ur: "اگر آپ کو یقین نہ ہو کہ کسی کی مدد کیسے کی جائے، تو بہترین طریقہ یہ ہے کہ:",
        options: [
          "Ask them what they find helpful and follow their preferences.",
          "Assume silence is the best support.",
          "Tell them what you think they should do.",
          "Ignore the situation until it resolves."
        ],
        options_ur: [
          "ان سے پوچھیں کہ انہیں کیا مددگار لگتا ہے اور ان کی ترجیحات پر عمل کریں۔",
          "فرض کریں کہ خاموشی بہترین مدد ہے۔",
          "انہیں بتائیں کہ آپ کے خیال میں انہیں کیا کرنا چاہیے۔",
          "صورتحال کو نظر انداز کریں جب تک کہ وہ خود حل نہ ہو جائے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "When providing practical support, confidentiality means:",
        prompt_ur: "عملی مدد فراہم کرتے وقت، رازداری کا مطلب ہے:",
        options: [
          "Respecting their privacy and not sharing details without permission.",
          "Posting about their recovery to inspire others.",
          "Telling the whole family without asking.",
          "Using their story for sympathy."
        ],
        options_ur: [
          "ان کی رازداری کا احترام کرنا اور اجازت کے بغیر تفصیلات شیئر نہ کرنا۔",
          "دوسروں کو متاثر کرنے کے لیے ان کی صحت یابی کے بارے میں پوسٹ کرنا۔",
          "بغیر پوچھے پورے خاندان کو بتا دینا۔",
          "ہمدردی حاصل کرنے کے لیے ان کی کہانی کا استعمال کرنا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Which behavior can unintentionally enable substance use?",
        prompt_ur: "کون سا رویہ نادانستہ طور پر منشیات کے استعمال کو فروغ دے سکتا ہے؟",
        options: [
          "Covering up for them or making excuses for risky behaviors.",
          "Helping them find counseling services.",
          "Encouraging accountability.",
          "Transporting them to support meetings."
        ],
        options_ur: [
          "ان کے لیے پردہ پوشی کرنا یا پرخطر رویوں کے لیے بہانے بنانا۔",
          "کونسلنگ سروسز تلاش کرنے میں ان کی مدد کرنا۔",
          "جوابدہی کی حوصلہ افزائی کرنا۔",
          "انہیں امدادی میٹنگز (support meetings) تک لے جانا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A helpful response to a panic during cravings is to:",
        prompt_ur: "نشے کی طلب کے دوران گھبراہٹ ہونے پر ایک مددگار جواب یہ ہے:",
        options: [
          "Guide them through a grounding exercise and stay calm.",
          "Tell them to snap out of it.",
          "Leave without explanation.",
          "Argue about their feelings."
        ],
        options_ur: [
          "انہیں گراؤنڈنگ کی مشق (grounding exercise) کے ذریعے رہنمائی دیں اور پرسکون رہیں۔",
          "انہیں کہیں کہ 'اس کیفیت سے باہر نکلو'۔",
          "وضاحت کیے بغیر چلے جائیں۔",
          "ان کے جذبات کے بارے میں بحث کریں۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "When discussing relapse, avoid language that:",
        prompt_ur: "دوبارہ نشہ شروع کرنے (relapse) کے بارے میں بات کرتے وقت ایسی زبان سے پرہیز کریں جو:",
        options: [
          "Blames the person and reduces hope.",
          "Acknowledges triggers and plans next steps.",
          "Seeks professional advice.",
          "Offers practical coping strategies."
        ],
        options_ur: [
          "شخص کو موردِ الزام ٹھہرائے اور امید کم کرے۔",
          "ٹرگرز کو تسلیم کرے اور اگلے اقدامات کی منصوبہ بندی کرے۔",
          "پیشہ ورانہ مشورہ تلاش کرے۔",
          "عملی طور پر نمٹنے کی حکمت عملی پیش کرے۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "To encourage responsibility and dignity in recovery, you should:",
        prompt_ur: "صحت یابی میں ذمہ داری اور وقار کی حوصلہ افزائی کے لیے، آپ کو چاہیے کہ:",
        options: [
          "Treat them as capable and involve them in decisions.",
          "Do everything 'for their own good' without consultation.",
          "Publicly announce their struggles.",
          "Constantly check and control them."
        ],
        options_ur: [
          "انہیں باصلاحیت سمجھیں اور فیصلوں میں شامل کریں۔",
          "بغیر کسی مشورے کے ان کے 'بھلے' کے لیے سب کچھ خود کریں۔",
          "ان کی جدوجہد کا عوامی سطح پر اعلان کریں۔",
          "مسلسل ان کی نگرانی اور کنٹرول کریں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which of these is a supportive check-in question?",
        prompt_ur: "ان میں سے کون سا حال احوال پوچھنے کا ایک معاون سوال ہے؟",
        options: [
          "What’s been most helpful for you this week?",
          "Why haven’t you improved more?",
          "Why would you even try?",
          "Did you expect this to be easy?"
        ],
        options_ur: [
          "اس ہفتے آپ کے لیے سب سے زیادہ مددگار کیا رہا؟",
          "آپ نے مزید بہتری کیوں نہیں دکھائی؟",
          "آپ نے کوشش ہی کیوں کی؟",
          "کیا آپ کو امید تھی کہ یہ آسان ہو گا؟"
        ],
        correct: 0,
        difficulty: "easy"
      }
    ],
  },
  "SIGNS AND SYMPTOMS": {
    category_ur: "علامات اور نشانیاں",
    description: "Recognize common signs of drug relapse and the emotional struggles during recovery.",
    description_ur: "دوبارہ نشہ شروع کرنے کی عام علامات اور صحت یابی کے دوران جذباتی مشکلات کو پہچانیں۔",
    questions: [
      {
        prompt: "Which of these could be an early warning sign of relapse?",
        prompt_ur: "ان میں سے کون سی علامت دوبارہ نشہ شروع کرنے کی ابتدائی وارننگ ہو سکتی ہے؟",
        options: [
          "Withdrawing from support groups or loved ones.",
          "Laughing during a comedy show.",
          "Taking a short afternoon nap.",
          "Enjoying a healthy meal."
        ],
        options_ur: [
          "سپورٹ گروپس یا پیاروں سے دوری اختیار کرنا۔",
          "کامیڈی شو کے دوران ہنسنا۔",
          "دوپہر کے وقت تھوڑی دیر سونا۔",
          "صحت بخش کھانے سے لطف اندوز ہونا۔",
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "In recovery, the acronym ‘HALT’ reminds people to check if they are:",
        prompt_ur: "صحت یابی کے دوران، لفظ 'HALT' لوگوں کو یہ چیک کرنے کی یاد دہانی کرواتا ہے کہ کیا وہ:",
        options: [
          "Hungry, Angry, Lonely, Tired.",
          "Happy, Active, Lucky, Tough.",
          "Healthy, Alert, Light, Trained.",
          "Hopeful, Aware, Loving, Trusting."
        ],
        options_ur: [
          "بھوکے، غصے میں، اکیلے، یا تھکے ہوئے (Hungry, Angry, Lonely, Tired) تو نہیں ہیں۔",
          "خوش، فعال، خوش قسمت، یا سخت جان تو نہیں ہیں۔",
          "صحت مند، چوکنا، ہلکا پھلکا، یا تربیت یافتہ تو نہیں ہیں۔",
          "امیدوار، باخبر، محبت کرنے والے، یا بااعتماد تو نہیں ہیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A pattern that may predict relapse is:",
        prompt_ur: "وہ کون سا طرز عمل ہے جو دوبارہ نشہ شروع کرنے کی پیش گوئی کر سکتا ہے؟",
        options: [
          "Skipping counselling sessions and ignoring triggers.",
          "Keeping a coping plan nearby.",
          "Scheduling regular time with a sponsor or peer.",
          "Practicing grounding exercises daily."
        ],
        options_ur: [
          "کونسلنگ سیشن چھوڑنا اور ٹرگرز (تکلیف دہ یادوں) کو نظر انداز کرنا۔",
          "حالات سے نمٹنے کا منصوبہ (coping plan) قریب رکھنا۔",
          "کسی سپانسر یا ساتھی کے ساتھ باقاعدہ وقت گزارنا۔",
          "روزانہ گراؤنڈنگ کی مشقیں کرنا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which persistent mood change may be concerning in recovery?",
        prompt_ur: "صحت یابی کے دوران مزاج میں کون سی مستقل تبدیلی تشویشناک ہو سکتی ہے؟",
        options: [
          "Ongoing irritability, sadness, or hopelessness.",
          "Laughing at a funny joke.",
          "Feeling nervous before an exam only.",
          "Being excited about a holiday."
        ],
        options_ur: [
          "مسلسل چڑچڑاپن، اداسی، یا ناامیدی۔",
          "کسی لطیفے پر ہنسنا۔",
          "صرف امتحان سے پہلے گھبراہٹ محسوس کرنا۔",
          "چھٹیوں کے بارے میں پرجوش ہونا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Reconnecting with old drug-using friends is best described as:",
        prompt_ur: "پرانے نشہ کرنے والے دوستوں سے دوبارہ رابطہ کرنے کو کس طرح بیان کیا جا سکتا ہے؟",
        options: [
          "A high-risk situation that may trigger relapse.",
          "A harmless coincidence.",
          "A guaranteed relapse every time.",
          "A healthy exposure strategy."
        ],
        options_ur: [
          "ایک انتہائی پرخطر صورتحال جو دوبارہ نشہ شروع کرنے کا باعث بن سکتی ہے۔",
          "ایک بے ضرر اتفاق۔",
          "ہر بار دوبارہ نشہ شروع ہونے کی ضمانت۔",
          "ایک صحت مند سامنا کرنے کی حکمت عملی۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A ‘craving trigger’ is:",
        prompt_ur: "'نشے کی طلب کا ٹرگر' (craving trigger) کیا ہے؟",
        options: [
          "An internal or external cue that increases urge to use.",
          "A doctor’s recovery prescription.",
          "A strict recovery rule.",
          "A breathing relaxation technique."
        ],
        options_ur: [
          "ایک اندرونی یا بیرونی اشارہ جو نشہ استعمال کرنے کی خواہش کو بڑھاتا ہے۔",
          "ڈاکٹر کا صحت یابی کے لیے نسخہ۔",
          "صحت یابی کا ایک سخت اصول۔",
          "سانس لینے کے ذریعے سکون حاصل کرنے کی تکنیک۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Sudden changes in sleep or appetite during recovery may indicate:",
        prompt_ur: "صحت یابی کے دوران نیند یا بھوک میں اچانک تبدیلی کس بات کی نشاندہی کر سکتی ہے؟",
        options: [
          "Emotional stress or potential relapse risk.",
          "A healthy adjustment.",
          "A normal reaction to recovery success.",
          "Nothing significant."
        ],
        options_ur: [
          "جذباتی تناؤ یا دوبارہ نشہ شروع کرنے کا ممکنہ خطرہ۔",
          "ایک صحت مند تبدیلی۔",
          "صحت یابی کی کامیابی پر ایک نارمل ردعمل۔",
          "کوئی خاص بات نہیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A behavioral shift such as lying or hiding activities may signal:",
        prompt_ur: "جھوٹ بولنا یا سرگرمیوں کو چھپانے جیسی رویے میں تبدیلی کیا ظاہر کر سکتی ہے؟",
        options: [
          "Possible relapse patterns forming.",
          "Improved honesty.",
          "Healthy independence.",
          "Better communication."
        ],
        options_ur: [
          "دوبارہ نشہ شروع کرنے کے ممکنہ آثار۔",
          "بہتر ہوتی ہوئی ایمانداری۔",
          "صحت مند خود مختاری۔",
          "بہتر بات چیت۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which physical sign might indicate someone is struggling in recovery?",
        prompt_ur: "کون سی جسمانی علامت ظاہر کر سکتی ہے کہ کوئی شخص صحت یابی میں مشکلات کا شکار ہے؟",
        options: [
          "Unexplained fatigue or restlessness.",
          "Exercise-related soreness.",
          "Energy after drinking coffee.",
          "Smiling at positive news."
        ],
        options_ur: [
          "بغیر کسی وجہ کے تھکن یا بے چینی۔",
          "ورزش کی وجہ سے جسم میں درد۔",
          "کافی پینے کے بعد توانائی محسوس کرنا۔",
          "مثبت خبر پر مسکرانا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "An emotional relapse often starts with:",
        prompt_ur: "جذباتی طور پر دوبارہ نشہ شروع کرنے کا عمل اکثر کس سے شروع ہوتا ہے؟",
        options: [
          "Bottling up feelings and avoiding coping strategies.",
          "Talking openly about emotions.",
          "Staying consistent with self-care.",
          "Attending support meetings regularly."
        ],
        options_ur: [
          "احساسات کو دبانا اور حالات سے نمٹنے کی حکمت عملیوں سے بچنا۔",
          "جذبات کے بارے میں کھل کر بات کرنا۔",
          "اپنی دیکھ بھال میں مستقل مزاج رہنا۔",
          "باقاعدگی سے امدادی اجلاسوں (support meetings) میں شرکت کرنا۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "Frequent mood swings combined with isolation may suggest:",
        prompt_ur: "بار بار مزاج کا بدلنا اور تنہائی پسندی کیا ظاہر کر سکتی ہے؟",
        options: [
          "Increased relapse risk and need for support.",
          "Normal social changes.",
          "Only physical illness unrelated to recovery.",
          "Improved coping skills."
        ],
        options_ur: [
          "دوبارہ نشہ شروع کرنے کا بڑھتا ہوا خطرہ اور مدد کی ضرورت۔",
          "نارمل سماجی تبدیلیاں۔",
          "صرف جسمانی بیماری جس کا صحت یابی سے کوئی تعلق نہیں۔",
          "بہتر ہوتی ہوئی مقابلہ کرنے کی مہارت۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "What does 'trigger' commonly refer to in recovery?",
        prompt_ur: "صحت یابی میں 'ٹرگر' (trigger) سے عام طور پر کیا مراد لی جاتی ہے؟",
        options: [
          "A stimulus that increases craving or urge to use.",
          "A legal consequence of drug use.",
          "A medical prescription.",
          "A recovery success milestone."
        ],
        options_ur: [
          "کوئی بھی ایسی چیز جو نشہ کرنے کی خواہش یا طلب کو بڑھا دے۔",
          "نشہ استعمال کرنے کا قانونی نتیجہ۔",
          "ڈاکٹری نسخہ۔",
          "صحت یابی کی کامیابی کا سنگ میل۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Persistent secrecy about whereabouts could be:",
        prompt_ur: "اپنی موجودگی کی جگہ کے بارے میں مسلسل رازداری برتنا کیا ہو سکتا ہے؟",
        options: [
          "A warning sign that the person may be hiding risky behavior.",
          "A healthy privacy practice.",
          "A sign of independence only.",
          "An indicator of social success."
        ],
        options_ur: [
          "ایک انتباہی علامت کہ شخص پرخطر رویے چھپا رہا ہو سکتا ہے۔",
          "رازداری کا ایک صحت مند طریقہ۔",
          "صرف خود مختاری کی علامت۔",
          "سماجی کامیابی کا اشارہ۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "If someone stops attending support meetings, this could mean:",
        prompt_ur: "اگر کوئی سپورٹ میٹنگز میں جانا چھوڑ دے، تو اس کا کیا مطلب ہو سکتا ہے؟",
        options: [
          "They are at increased risk and may need outreach.",
          "They have fully recovered.",
          "They prefer to isolate as a coping method.",
          "They no longer have cravings at all."
        ],
        options_ur: [
          "وہ بڑھتے ہوئے خطرے میں ہیں اور انہیں مدد کی ضرورت ہو سکتی ہے۔",
          "وہ مکمل طور پر صحت یاب ہو چکے ہیں۔",
          "وہ تنہائی کو ایک طریقے کے طور پر ترجیح دیتے ہیں۔",
          "انہیں اب بالکل بھی طلب نہیں ہوتی۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Increased irritability and relationship conflict can be signs of:",
        prompt_ur: "چڑچڑاپن میں اضافہ اور رشتوں میں تنازع کس چیز کی علامت ہو سکتے ہیں؟",
        options: [
          "Emotional struggle that may precede relapse.",
          "Improved communication.",
          "Stronger recovery commitment.",
          "Better stress management."
        ],
        options_ur: [
          "جذباتی کشمکش جو دوبارہ نشہ شروع کرنے سے پہلے ہو سکتی ہے۔",
          "بہتر ہوتی ہوئی بات چیت۔",
          "صحت یابی کے لیے مضبوط عزم۔",
          "بہتر ذہنی دباؤ کا انتظام۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "What role do physical withdrawal symptoms play in relapse risk?",
        prompt_ur: "دوبارہ نشہ شروع کرنے کے خطرے میں جسمانی دستبرداری (withdrawal) کی علامات کیا کردار ادا کرتی ہیں؟",
        options: [
          "They can increase risk if not managed with support and treatment.",
          "They always guarantee relapse.",
          "They are irrelevant to relapse.",
          "They disappear immediately after detox."
        ],
        options_ur: [
          "اگر مدد اور علاج کے ساتھ ان کا انتظام نہ کیا جائے تو وہ خطرہ بڑھا سکتی ہیں۔",
          "وہ ہمیشہ دوبارہ نشہ شروع ہونے کی ضمانت دیتے ہیں۔",
          "ان کا دوبارہ نشہ شروع کرنے سے کوئی تعلق نہیں۔",
          "وہ ڈی ٹاکس (detox) کے فوراً بعد ختم ہو جاتے ہیں۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "Sudden financial problems or secret spending could indicate:",
        prompt_ur: "اچانک مالی مسائل یا خفیہ اخراجات کس چیز کی نشاندہی کر سکتے ہیں؟",
        options: [
          "Relapse or resumed substance access.",
          "Good investment choices.",
          "Improved financial literacy.",
          "No cause for concern."
        ],
        options_ur: [
          "دوبارہ نشہ شروع کرنا یا منشیات تک دوبارہ رسائی حاصل کرنا۔",
          "اچھے سرمایہ کاری کے انتخاب۔",
          "مالی معلومات میں بہتری۔",
          "فکر کی کوئی وجہ نہیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A sudden drop in hygiene or self-care may be a sign of:",
        prompt_ur: "صفائی ستھرائی یا اپنی دیکھ بھال میں اچانک کمی کس چیز کی علامت ہو سکتی ہے؟",
        options: [
          "Struggling mental health or relapse risk.",
          "Healthy relaxation.",
          "A new fitness routine.",
          "Stable recovery progress."
        ],
        options_ur: [
          "دماغی صحت کی خرابی یا دوبارہ نشہ شروع کرنے کا خطرہ۔",
          "صحت مند آرام۔",
          "فٹنس کا نیا معمول۔",
          "مستحکم صحت یابی کی پیشرفت۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Repeatedly losing items or misplacing keys might point to:",
        prompt_ur: "بار بار چیزیں کھونا یا چابیاں غلط جگہ رکھنا کس طرف اشارہ کر سکتا ہے؟",
        options: [
          "Cognitive or concentration problems related to substance use.",
          "Normal absentmindedness only.",
          "Better multitasking.",
          "An unrelated issue always."
        ],
        options_ur: [
          "نشہ آور اشیاء کے استعمال سے متعلق ذہنی یا توجہ کے مسائل۔",
          "صرف عام بھول چپن۔",
          "بہتر ملٹی ٹاسکنگ۔",
          "ہمیشہ ایک غیر متعلقہ مسئلہ۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A marked change in social circle toward using peers is:",
        prompt_ur: "سماجی حلقے کا نشہ کرنے والے ساتھیوں کی طرف واضح جھکاؤ کیا ہے؟",
        options: [
          "A high-risk situation that can precipitate relapse.",
          "A sign of positive networking.",
          "Guaranteed relapse immediately.",
          "Irrelevant to recovery."
        ],
        options_ur: [
          "ایک انتہائی پرخطر صورتحال جو دوبارہ نشہ شروع کروا سکتی ہے۔",
          "مثبت نیٹ ورکنگ کی علامت۔",
          "فوراً دوبارہ نشہ شروع ہونے کی ضمانت۔",
          "صحت یابی کے لیے غیر متعلقہ۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Which is an early emotional sign of relapse?",
        prompt_ur: "دوبارہ نشہ شروع کرنے کی ابتدائی جذباتی علامت کون سی ہے؟",
        options: [
          "Feeling complacent and minimizing the risk of use.",
          "Being extremely cautious and seeking help.",
          "Intense gratitude and motivation.",
          "Continued active engagement in care."
        ],
        options_ur: [
          "مطمئن محسوس کرنا اور نشہ استعمال کرنے کے خطرے کو کم سمجھنا۔",
          "انتہائی محتاط رہنا اور مدد طلب کرنا۔",
          "شدید شکر گزاری اور ترغیب۔",
          "علاج میں مسلسل فعال رہنا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Frequent unexplained absences from work/school could indicate:",
        prompt_ur: "کام یا اسکول سے اکثر بغیر وجہ غیر حاضری کس چیز کی نشاندہی کر سکتی ہے؟",
        options: [
          "Increased relapse risk and need for assessment.",
          "Better time management.",
          "More leisure activities.",
          "Healthier routines."
        ],
        options_ur: [
          "دوبارہ نشہ شروع کرنے کا بڑھتا ہوا خطرہ اور معائنے کی ضرورت۔",
          "بہتر وقت کا انتظام۔",
          "زیادہ تفریحی سرگرمیاں۔",
          "صحت مند معمولات۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which combination often precedes an emotional relapse?",
        prompt_ur: "کون سا مجموعہ اکثر جذباتی طور پر دوبارہ نشہ شروع ہونے سے پہلے ہوتا ہے؟",
        options: [
          "Avoiding feelings, isolating, and skipping coping strategies.",
          "Increased therapy attendance and openness.",
          "Developing new hobbies and community ties.",
          "Having a stable support network."
        ],
        options_ur: [
          "احساسات سے بچنا، تنہائی اختیار کرنا، اور مقابلہ کرنے کی حکمت عملیوں کو چھوڑ دینا۔",
          "تھراپی میں حاضری اور کھلے پن میں اضافہ۔",
          "نئے مشاغل اور سماجی روابط پیدا کرنا۔",
          "ایک مستحکم سپورٹ نیٹ ورک ہونا۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "When cravings spike in certain places, you should:",
        prompt_ur: "جب خاص جگہوں پر نشے کی طلب بڑھ جائے، تو آپ کو چاہیے کہ:",
        options: [
          "Identify and plan for those high-risk places with coping strategies.",
          "Immediately return to those places to test yourself.",
          "Ignore them and hope they pass.",
          "Tell everyone about them publicly."
        ],
        options_ur: [
          "ان پرخطر مقامات کی نشاندہی کریں اور ان سے نمٹنے کے لیے حکمت عملی بنائیں۔",
          "خود کو آزمانے کے لیے فوراً ان جگہوں پر واپس جائیں۔",
          "انہیں نظر انداز کریں اور امید کریں کہ یہ خود ختم ہو جائیں گے۔",
          "ان کے بارے میں سب کو کھلم کھلا بتائیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Strong secrecy about phone activity may suggest:",
        prompt_ur: "فون کی سرگرمیوں کے بارے میں شدید رازداری کیا ظاہر کر سکتی ہے؟",
        options: [
          "Contact with past using networks or risky behavior.",
          "Healthy boundaries only.",
          "No connection to substance use.",
          "A sign of trustworthiness."
        ],
        options_ur: [
          "ماضی کے نشہ کرنے والے حلقوں سے رابطہ یا پرخطر رویہ۔",
          "صرف صحت مند حدود۔",
          "منشیات کے استعمال سے کوئی تعلق نہیں۔",
          "قابل اعتماد ہونے کی علامت۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "If someone downplays risks and says 'I can handle it', that may be:",
        prompt_ur: "اگر کوئی خطرات کو کم سمجھتا ہے اور کہتا ہے کہ 'میں اسے سنبھال سکتا ہوں'، تو یہ کیا ہو سکتا ہے؟",
        options: [
          "A risky mindset that could precede relapse.",
          "A sign they’re fully recovered.",
          "A clear sign they have no urges.",
          "An objective assessment only."
        ],
        options_ur: [
          "ایک پرخطر ذہنیت جو دوبارہ نشہ شروع کرنے سے پہلے ہو سکتی ہے۔",
          "ایک علامت کہ وہ مکمل طور پر صحت یاب ہو چکے ہیں۔",
          "ایک واضح علامت کہ انہیں اب کوئی خواہش نہیں ہوتی۔",
          "صرف ایک معروضی جائزہ۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A sudden return to using paraphernalia or smell of substances is:",
        prompt_ur: "نشہ آور اشیاء کے سامان کی اچانک واپسی یا منشیات کی بو آنا کیا ہے؟",
        options: [
          "An immediate red flag for recent use and relapse.",
          "A harmless memory cue.",
          "A sign of improved recovery.",
          "Unrelated to relapse."
        ],
        options_ur: [
          "حالیہ استعمال اور دوبارہ نشہ شروع ہونے کے لیے ایک فوری خطرے کی گھنٹی۔",
          "ایک بے ضرر یاد دہانی۔",
          "بہتر ہوتی صحت یابی کی علامت۔",
          "دوبارہ نشہ شروع کرنے سے غیر متعلقہ۔"
        ],
        correct: 0,
        difficulty: "hard"
      }
    ],
  },
"MENTAL HEALTH & SOCIETY": {
  category_ur: "ذہنی صحت اور معاشرہ",
  description: "Understand how stigma and societal attitudes affect addiction recovery and counselling.",
  description_ur: "سمجھیں کہ بدنامی اور معاشرتی رویے کس طرح نشے کی بحالی اور مشاورت پر اثر انداز ہوتے ہیں۔",
  questions: [
    {
      prompt: "Stigma around drug addiction often means:",
      prompt_ur: "منشیات کی لت کے گرد بدنامی (اسٹیگما) کا اکثر مطلب ہوتا ہے:",
      options: [
        "Judging, shaming, or isolating someone for their condition.",
        "Encouraging open, honest conversations.",
        "Providing equal support to all individuals.",
        "Celebrating recovery progress."
      ],
      options_ur: [
        "کسی کی حالت پر اسے پرکھنا، شرمندہ کرنا یا اسے الگ تھلگ کرنا۔",
        "کھلی اور ایماندارانہ گفتگو کی حوصلہ افزائی کرنا۔",
        "تمام افراد کو یکساں مدد فراہم کرنا۔",
        "صحتیابی کی پیشرفت کا جشن منانا۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "An effective way to reduce stigma around addicts is to:",
      prompt_ur: "نشے کے عادی افراد کے گرد بدنامی کو کم کرنے کا ایک مؤثر طریقہ ہے:",
      options: [
        "Use person-first language and share accurate information.",
        "Avoid the topic entirely.",
        "Label them so it’s ‘clear’.",
        "Assume recovery is only about willpower."
      ],
      options_ur: [
        "انسان اول زبان (person-first language) کا استعمال اور درست معلومات شیئر کرنا۔",
        "موضوع سے مکمل طور پر پرہیز کرنا۔",
        "ان پر لیبل لگانا تاکہ یہ 'واضح' ہو سکے۔",
        "یہ فرض کرنا کہ صحتیابی صرف قوت ارادی کے بارے میں ہے۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Culturally responsive counselling means:",
      prompt_ur: "ثقافتی طور پر ہم آہنگ مشاورت کا مطلب ہے:",
      options: [
        "Asking what traditions, values, or supports matter to the individual.",
        "Assuming one approach works for everyone.",
        "Discouraging family or cultural involvement.",
        "Ignoring preferences to ‘stay neutral’."
      ],
      options_ur: [
        "یہ پوچھنا کہ فرد کے لیے کون سی روایات، اقدار یا تعاون اہمیت رکھتے ہیں۔",
        "یہ فرض کرنا کہ ایک ہی طریقہ سب کے لیے کام کرتا ہے۔",
        "خاندانی یا ثقافتی شمولیت کی حوصلہ شکنی کرنا۔",
        "'غیر جانبدار رہنے' کے لیے ترجیحات کو نظر انداز کرنا۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Sharing someone’s recovery details without consent is:",
      prompt_ur: "رضامندی کے بغیر کسی کی صحتیابی کی تفصیلات شیئر کرنا ہے:",
      options: [
        "A violation of their privacy and harmful to trust.",
        "A good way to motivate them.",
        "Required for accountability.",
        "Fine if you don’t use their name."
      ],
      options_ur: [
        "ان کی رازداری کی خلاف ورزی اور اعتماد کے لیے نقصان دہ۔",
        "انہیں تحریک دینے کا ایک اچھا طریقہ۔",
        "احتساب کے لیے ضروری ہے۔",
        "اگر آپ ان کا نام استعمال نہیں کرتے تو ٹھیک ہے۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Which statement reflects modern understanding of addiction?",
      prompt_ur: "کون سا بیان نشے کی جدید سمجھ بوجھ کی عکاسی کرتا ہے؟",
      options: [
        "Substance use disorder is a treatable health condition.",
        "Addiction is a moral weakness.",
        "People can never change.",
        "Counselling doesn’t work long-term."
      ],
      options_ur: [
        "مادہ کے استعمال کی خرابی ایک قابل علاج صحت کی حالت ہے۔",
        "نشہ ایک اخلاقی کمزوری ہے۔",
        "لوگ کبھی نہیں بدل سکتے۔",
        "مشاورت طویل مدت میں کام نہیں کرتی۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "A community-level action that supports recovery is:",
      prompt_ur: "کمیونٹی کی سطح پر ایک عمل جو صحتیابی میں مدد دیتا ہے:",
      options: [
        "Supporting harm-reduction and accessible treatment services.",
        "Opposing rehab centers in neighborhoods.",
        "Mocking public health campaigns.",
        "Restricting support to only insured individuals."
      ],
      options_ur: [
        "نقصان میں کمی (harm-reduction) اور علاج کی قابل رسائی خدمات کی حمایت کرنا۔",
        "محلوں میں بحالی کے مراکز کی مخالفت کرنا۔",
        "عوامی صحت کی مہمات کا مذاق اڑانا۔",
        "صرف بیمہ شدہ افراد تک امداد کو محدود کرنا۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Media portrayals that show addiction as a choice only can:",
      prompt_ur: "میڈیا کی وہ پیشکشیں جو نشے کو صرف ایک انتخاب کے طور پر دکھاتی ہیں:",
      options: [
        "Increase stigma and reduce willingness to seek help.",
        "Improve public understanding.",
        "Encourage professional treatment.",
        "Promote empathy for recovery."
      ],
      options_ur: [
        "بدنامی میں اضافہ اور مدد حاصل کرنے کی خواہش میں کمی لاتی ہیں۔",
        "عوامی سمجھ بوجھ کو بہتر بناتی ہیں۔",
        "پیشہ ورانہ علاج کی حوصلہ افزائی کرتی ہیں۔",
        "صحتیابی کے لیے ہمدردی کو فروغ دیتی ہیں۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Why is person-first language important?",
      prompt_ur: "انسان اول (person-first) زبان کیوں ضروری ہے؟",
      options: [
        "It respects individuals and separates them from the disorder.",
        "It makes conversations more complicated.",
        "It hides the reality of addiction.",
        "It is only used in medical settings."
      ],
      options_ur: [
        "یہ افراد کا احترام کرتی ہے اور انہیں بیماری سے الگ رکھتی ہے۔",
        "یہ بات چیت کو مزید پیچیدہ بناتی ہے۔",
        "یہ نشے کی حقیقت کو چھپاتی ہے۔",
        "یہ صرف طبی ترتیبات میں استعمال ہوتی ہے۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Which societal factor can discourage people from seeking treatment?",
      prompt_ur: "کون سا معاشرتی عنصر لوگوں کو علاج حاصل کرنے سے روک سکتا ہے؟",
      options: [
        "Fear of being judged or discriminated against.",
        "Availability of confidential counseling.",
        "Supportive family environments.",
        "Access to open discussions about addiction."
      ],
      options_ur: [
        "پرکھے جانے یا امتیازی سلوک کا خوف۔",
        "خفیہ مشاورت کی دستیابی۔",
        "حمایتی خاندانی ماحول۔",
        "نشے کے بارے میں کھلی گفتگو تک رسائی۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "A mental-health-friendly community encourages:",
      prompt_ur: "ذہنی صحت کے لیے سازگار کمیونٹی کس چیز کی حوصلہ افزائی کرتی ہے؟",
      options: [
        "Education, empathy, and safe treatment access.",
        "Hiding addiction issues.",
        "Punishing those in recovery.",
        "Ignoring public awareness campaigns."
      ],
      options_ur: [
        "تعلیم، ہمدردی، اور علاج تک محفوظ رسائی۔",
        "نشے کے مسائل چھپانا۔",
        "صحتیاب ہونے والوں کو سزا دینا۔",
        "عوامی آگاہی مہمات کو نظر انداز کرنا۔"
      ],
      correct: 0,
      difficulty: "hard"
    },
    {
      prompt: "What is one effect of labeling someone as an 'addict'?",
      prompt_ur: "کسی کو 'نشئی' کے طور پر لیبل کرنے کا ایک اثر کیا ہے؟",
      options: [
        "It reduces empathy and increases barriers to seeking help.",
        "It always motivates them to recover.",
        "It clarifies their identity positively.",
        "It has no effect on treatment."
      ],
      options_ur: [
        "یہ ہمدردی کو کم کرتا ہے اور مدد حاصل کرنے میں رکاوٹیں بڑھاتا ہے۔",
        "یہ ہمیشہ انہیں صحتیاب ہونے کی تحریک دیتا ہے۔",
        "یہ ان کی شناخت کو مثبت طور پر واضح کرتا ہے۔",
        "اس کا علاج پر کوئی اثر نہیں ہوتا۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "A public health approach to addiction focuses on:",
      prompt_ur: "نشے کے بارے میں عوامی صحت کا نقطہ نظر کس چیز پر توجہ مرکوز کرتا ہے؟",
      options: [
        "Prevention, treatment access, and harm reduction.",
        "Only criminal punishment.",
        "Ignoring underlying causes.",
        "Shaming individuals publicly."
      ],
      options_ur: [
        "روک تھام، علاج تک رسائی، اور نقصان میں کمی۔",
        "صرف مجرمانہ سزا۔",
        "بنیادی وجوہات کو نظر انداز کرنا۔",
        "افراد کو عوامی سطح پر شرمندہ کرنا۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Which statement helps reduce stigma when speaking publicly?",
      prompt_ur: "عوامی سطح پر بات کرتے ہوئے کون سا بیان بدنامی کو کم کرنے میں مدد دیتا ہے؟",
      options: [
        "Talk about addiction as a health issue and share recovery stories respectfully.",
        "Use sensational language to attract attention.",
        "Blame individuals for poor choices.",
        "Avoid mentioning treatment options."
      ],
      options_ur: [
        "نشے کو صحت کے مسئلے کے طور پر بیان کریں اور صحتیابی کی کہانیاں احترام سے شیئر کریں۔",
        "توجہ حاصل کرنے کے لیے سنسنی خیز زبان استعمال کریں۔",
        "غلط انتخاب کے لیے افراد کو مورد الزام ٹھہرائیں۔",
        "علاج کے اختیارات کا ذکر کرنے سے گریز کریں۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Why is confidentiality important in counseling?",
      prompt_ur: "مشاورت میں رازداری کیوں ضروری ہے؟",
      options: [
        "It builds trust and protects the person’s privacy.",
        "It makes therapy less effective.",
        "It should be ignored for accountability.",
        "It encourages public discussion of private details."
      ],
      options_ur: [
        "یہ اعتماد پیدا کرتی ہے اور شخص کی رازداری کا تحفظ کرتی ہے۔",
        "یہ تھراپی کو کم مؤثر بناتی ہے۔",
        "اسے احتساب کے لیے نظر انداز کیا جانا چاہیے۔",
        "یہ نجی تفصیلات کی عوامی بحث کی حوصلہ افزائی کرتی ہے۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Which policy reduces harm at a societal level?",
      prompt_ur: "کون سی پالیسی معاشرتی سطح پر نقصان کو کم کرتی ہے؟",
      options: [
        "Needle exchange programs reduce disease transmission.",
        "Strict public shaming policies.",
        "Banning all discussions about addiction.",
        "Limiting treatment centers."
      ],
      options_ur: [
        "سوئیوں کے تبادلے کے پروگرام بیماریوں کی منتقلی کو کم کرتے ہیں۔",
        "عوامی طور پر شرمندہ کرنے کی سخت پالیسیاں۔",
        "نشے کے بارے میں تمام بحث پر پابندی۔",
        "علاج کے مراکز کو محدود کرنا۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Cultural competence in services means:",
      prompt_ur: "خدمات میں ثقافتی قابلیت کا مطلب ہے:",
      options: [
        "Adapting care to cultural norms and respecting traditions.",
        "Applying the same approach for everyone.",
        "Avoiding cultural topics altogether.",
        "Forcing cultural change on clients."
      ],
      options_ur: [
        "دیکھ بھال کو ثقافتی اصولوں کے مطابق ڈھالنا اور روایات کا احترام کرنا۔",
        "سب کے لیے ایک ہی طریقہ کار اپنانا۔",
        "ثقافتی موضوعات سے مکمل پرہیز کرنا۔",
        "کلائنٹس پر ثقافتی تبدیلی مسلط کرنا۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Which community action helps reduce stigma?",
      prompt_ur: "کمیونٹی کا کون سا عمل بدنامی کو کم کرنے میں مدد کرتا ہے؟",
      options: [
        "Public education campaigns and visible recovery support.",
        "Ignoring addiction issues publicly.",
        "Promoting punitive measures alone.",
        "Excluding people from services."
      ],
      options_ur: [
        "عوامی تعلیمی مہمات اور صحتیابی کے لیے نمایاں مدد۔",
        "عوامی سطح پر نشے کے مسائل کو نظر انداز کرنا۔",
        "صرف تادیبی اقدامات کو فروغ دینا۔",
        "لوگوں کو خدمات سے خارج کرنا۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "How do supportive workplaces help employees in recovery?",
      prompt_ur: "حمایتی کام کی جگہیں صحتیاب ہونے والے ملازمین کی کیسے مدد کرتی ہیں؟",
      options: [
        "By offering flexible schedules and confidential support options.",
        "By firing anyone who discloses past use.",
        "By forcing disclosure publicly.",
        "By refusing accommodations."
      ],
      options_ur: [
        "لچکدار نظام الاوقات اور خفیہ امدادی اختیارات پیش کر کے۔",
        "ماضی کے استعمال کو ظاہر کرنے والے کسی بھی شخص کو برخاست کر کے۔",
        "عوامی سطح پر انکشاف پر مجبور کر کے۔",
        "سہولیات دینے سے انکار کر کے۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Which media practice decreases stigma?",
      prompt_ur: "میڈیا کا کون سا عمل بدنامی کو کم کرتا ہے؟",
      options: [
        "Using respectful language and showing recovery paths.",
        "Dramatizing and sensationalizing stories for clicks.",
        "Using pejorative labels for headlines.",
        "Avoiding facts about treatment."
      ],
      options_ur: [
        "احترام پر مبنی زبان کا استعمال اور صحتیابی کے راستے دکھانا۔",
        "کلکس کے لیے کہانیوں کو ڈرامائی اور سنسنی خیز بنانا۔",
        "سرخیوں کے لیے توہین آمیز لیبلز کا استعمال۔",
        "علاج کے بارے میں حقائق سے گریز۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "How does criminalization sometimes hinder recovery?",
      prompt_ur: "مجرم قرار دینا (Criminalization) بعض اوقات صحتیابی میں کیسے رکاوٹ بنتا ہے؟",
      options: [
        "It can create barriers to treatment and increase social exclusion.",
        "It always prevents relapse.",
        "It simplifies access to care.",
        "It improves public health automatically."
      ],
      options_ur: [
        "یہ علاج میں رکاوٹیں پیدا کر سکتا ہے اور معاشرتی بائیکاٹ میں اضافہ کر سکتا ہے۔",
        "یہ ہمیشہ دوبارہ نشے کی طرف جانے (relapse) کو روکتا ہے۔",
        "یہ دیکھ بھال تک رسائی کو آسان بناتا ہے۔",
        "یہ عوامی صحت کو خود بخود بہتر بناتا ہے۔"
      ],
      correct: 0,
      difficulty: "hard"
    },
    {
      prompt: "Why include families in recovery planning when appropriate?",
      prompt_ur: "مناسب ہونے پر صحتیابی کی منصوبہ بندی میں خاندانوں کو کیوں شامل کیا جائے؟",
      options: [
        "Families can provide support and help sustain changes.",
        "Families always cause relapse.",
        "Family involvement should be mandatory in every case.",
        "Family input is irrelevant to recovery."
      ],
      options_ur: [
        "خاندان مدد فراہم کر سکتے ہیں اور تبدیلیوں کو برقرار رکھنے میں مدد دے سکتے ہیں۔",
        "خاندان ہمیشہ دوبارہ نشے کا سبب بنتے ہیں۔",
        "ہر معاملے میں خاندانی شمولیت لازمی ہونی چاہیے۔",
        "خاندانی رائے صحتیابی کے لیے غیر متعلقہ ہے۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Which of the following reduces barriers to care?",
      prompt_ur: "درج ذیل میں سے کون سا دیکھ بھال میں رکاوٹوں کو کم کرتا ہے؟",
      options: [
        "Offering low-cost or sliding-scale treatment options.",
        "Requiring high fees with no exceptions.",
        "Limiting services to urban centers only.",
        "Only accepting private insurance."
      ],
      options_ur: [
        "کم لاگت یا آمدنی کے لحاظ سے علاج کے اختیارات فراہم کرنا۔",
        "بغیر کسی استثنیٰ کے زیادہ فیس کا مطالبہ کرنا۔",
        "خدمات کو صرف شہروں تک محدود کرنا۔",
        "صرف نجی انشورنس قبول کرنا۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "A community service that promotes recovery is:",
      prompt_ur: "کمیونٹی سروس جو صحتیابی کو فروغ دیتی ہے:",
      options: [
        "Peer-led support groups and drop-in centers.",
        "Public shaming sessions.",
        "Cutting funding for treatment.",
        "Restricting access to counseling."
      ],
      options_ur: [
        "ساتھیوں کی زیر قیادت امدادی گروپ (peer support) اور مراکز۔",
        "عوامی سطح پر شرمندہ کرنے کے سیشن۔",
        "علاج کے لیے فنڈنگ بند کرنا۔",
        "مشاورت تک رسائی کو محدود کرنا۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Which action best addresses structural stigma?",
      prompt_ur: "ساختی بدنامی (Structural stigma) کو حل کرنے کا بہترین عمل کیا ہے؟",
      options: [
        "Change policies that limit access to treatment and employment.",
        "Encourage more stereotypes in the media.",
        "Close harm-reduction services.",
        "Increase legal penalties only."
      ],
      options_ur: [
        "ایسی پالیسیاں بدلیں جو علاج اور روزگار تک رسائی کو محدود کرتی ہیں۔",
        "میڈیا میں مزید منفی تصورات کی حوصلہ افزائی کریں۔",
        "نقصان کم کرنے والی خدمات کو بند کریں۔",
        "صرف قانونی سزاؤں میں اضافہ کریں۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "Why is language important in healthcare settings?",
      prompt_ur: "صحت کی دیکھ بھال کے ماحول میں زبان کیوں اہم ہے؟",
      options: [
        "It shapes attitudes and encourages people to seek help.",
        "Language has no effect on treatment outcomes.",
        "Using labels speeds up diagnosis.",
        "Technical terms alone build trust."
      ],
      options_ur: [
        "یہ رویوں کو تشکیل دیتی ہے اور لوگوں کو مدد حاصل کرنے پر مائل کرتی ہے۔",
        "زبان کا علاج کے نتائج پر کوئی اثر نہیں ہوتا۔",
        "لیبل کا استعمال تشخیص کو تیز کرتا ہے۔",
        "صرف تکنیکی الفاظ اعتماد پیدا کرتے ہیں۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Which misunderstanding about addiction is common?",
      prompt_ur: "نشے کے بارے میں کون سی غلط فہمی عام ہے؟",
      options: [
        "Thinking it is purely a moral failing rather than a health condition.",
        "Understanding it as a health issue requiring care.",
        "Recognizing social factors that influence use.",
        "Accepting evidence-based treatments."
      ],
      options_ur: [
        "اسے صحت کی حالت کے بجائے محض ایک اخلاقی برائی سمجھنا۔",
        "اسے دیکھ بھال کی ضرورت والا صحت کا مسئلہ سمجھنا۔",
        "استعمال پر اثر انداز ہونے والے معاشرتی عوامل کو پہچاننا۔",
        "شواہد پر مبنی علاج کو قبول کرنا۔"
      ],
      correct: 0,
      difficulty: "medium"
    },
    {
      prompt: "How can allies reduce stigma in their networks?",
      prompt_ur: "مددگار (Allies) اپنے نیٹ ورکس میں بدنامی کو کیسے کم کر سکتے ہیں؟",
      options: [
        "Speak respectfully, correct myths, and share resources.",
        "Spread scaremongering stories.",
        "Ignore people asking for help.",
        "Make jokes about recovery publicly."
      ],
      options_ur: [
        "احترام سے بات کریں، غلط فہمیوں کی تصحیح کریں اور وسائل شیئر کریں۔",
        "خوف پھیلانے والی کہانیاں پھیلائیں۔",
        "مدد مانگنے والوں کو نظر انداز کریں۔",
        "عوامی سطح پر صحتیابی کا مذاق اڑائیں۔"
      ],
      correct: 0,
      difficulty: "easy"
    },
    {
      prompt: "Which outcome indicates successful stigma reduction?",
      prompt_ur: "کون سا نتیجہ بدنامی میں کامیاب کمی کی نشاندہی کرتا ہے؟",
      options: [
        "People feel safe to seek treatment and participate in community life.",
        "Public mockery increases.",
        "Treatment services close due to lack of interest.",
        "Disclosure is punished."
      ],
      options_ur: [
        "لوگ علاج حاصل کرنے اور کمیونٹی کی زندگی میں حصہ لینے میں محفوظ محسوس کرتے ہیں۔",
        "عوامی مذاق میں اضافہ ہوتا ہے۔",
        "دلچسپی نہ ہونے کی وجہ سے علاج کی خدمات بند ہو جاتی ہیں۔",
        "انکشاف کرنے پر سزا دی جاتی ہے۔"
      ],
      correct: 0,
      difficulty: "hard"
    }
  ],
},
"GETTING HELP": {
    category_ur: "مدد حاصل کرنا",
    description: "Find healthy resources, counselling strategies, and coping mechanisms for recovery.",
    description_ur: "بحالی کے لیے صحت مند وسائل، مشاورت کی حکمت عملی، اور مقابلہ کرنے کے طریقہ کار تلاش کریں۔",
    questions: [
      {
        prompt: "If cravings become overwhelming, a healthy step is:",
        prompt_ur: "اگر نشے کی طلب (cravings) حد سے بڑھ جائے، تو ایک صحت مند قدم یہ ہے:",
        options: [
          "Call a counselor, sponsor, or support group for guidance.",
          "Isolate and avoid everyone.",
          "Pretend nothing is wrong.",
          "Use drugs to reduce the stress."
        ],
        options_ur: [
          "رہنمائی کے لیے کسی کونسلر، اسپانسر، یا امدادی گروپ کو کال کریں۔",
          "خود کو تنہا کر لیں اور سب سے پرہیز کریں۔",
          "یہ ظاہر کریں کہ کچھ غلط نہیں ہے۔",
          "تناؤ کم کرنے کے لیے منشیات کا استعمال کریں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A practical first step when experiencing strong urges is:",
        prompt_ur: "شدید خواہشات کا تجربہ کرتے وقت پہلا عملی قدم یہ ہے:",
        options: [
          "Practice coping skills like urge-surfing and call a support person.",
          "Test your willpower alone.",
          "Visit old high-risk places.",
          "Hide it so no one knows."
        ],
        options_ur: [
          "مقابلہ کرنے کی مہارتیں جیسے 'urge-surfing' کی مشق کریں اور کسی امدادی شخص کو کال کریں۔",
          "اکیلے اپنی قوت ارادی کا امتحان لیں۔",
          "پرانی ہائی رسک جگہوں پر جائیں۔",
          "اسے چھپائیں تاکہ کسی کو پتہ نہ چلے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "If someone is at immediate risk of overdose or self-harm, you should:",
        prompt_ur: "اگر کسی کو اوور ڈوز یا خود کو نقصان پہنچانے کا فوری خطرہ ہو، تو آپ کو چاہیے:",
        options: [
          "Call emergency services or a crisis helpline right away.",
          "Wait a few days to see if it passes.",
          "Tell them to sleep it off.",
          "Keep it secret."
        ],
        options_ur: [
          "فوراً ہنگامی خدمات یا کرائسز ہیلپ لائن پر کال کریں۔",
          "کچھ دن انتظار کریں کہ آیا یہ گزر جاتا ہے۔",
          "انہیں کہیں کہ سو کر اسے ختم کریں۔",
          "اسے راز رکھیں۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "Which is a helpful long-term recovery resource?",
        prompt_ur: "طویل مدتی بحالی کے لیے کون سا وسیلہ مددگار ہے؟",
        options: [
          "Peer support groups or qualified addiction counselors.",
          "Random advice from unverified websites.",
          "Old drug contacts for ‘tips’.",
          "Avoiding feedback altogether."
        ],
        options_ur: [
          "ساتھیوں کے امدادی گروپ یا مستند نشے کے کونسلرز۔",
          "غیر تصدیق شدہ ویب سائٹس سے بے ترتیب مشورہ۔",
          "مشوروں کے لیے پرانے منشیات کے رابطے۔",
          "فیڈ بیک سے مکمل پرہیز کرنا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "How can someone prepare for a counselling session?",
        prompt_ur: "کوئی مشاورت (counselling) کے سیشن کے لیے کیسے تیاری کر سکتا ہے؟",
        options: [
          "Write down questions, be honest, and share goals openly.",
          "Memorize perfect answers to impress.",
          "Let the counselor guess the issues.",
          "Only talk if directly asked."
        ],
        options_ur: [
          "سوالات لکھیں، ایماندار رہیں، اور اپنے مقاصد کھل کر بتائیں۔",
          "متاثر کرنے کے لیے بہترین جوابات یاد کریں۔",
          "کونسلر کو مسائل کا اندازہ لگانے دیں۔",
          "صرف تب بات کریں جب براہ راست پوچھا جائے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "After a relapse, the healthiest mindset is:",
        prompt_ur: "دوبارہ نشہ کرنے (relapse) کے بعد، صحت مند ترین ذہنیت یہ ہے:",
        options: [
          "Treat it as part of the learning process, recommit, and seek support.",
          "Hide it and give up recovery.",
          "Blame others and quit counselling.",
          "Assume sobriety is impossible."
        ],
        options_ur: [
          "اسے سیکھنے کے عمل کا حصہ سمجھیں، دوبارہ عزم کریں، اور مدد حاصل کریں۔",
          "اسے چھپائیں اور بحالی کی کوشش چھوڑ دیں۔",
          "دوسروں کو مورد الزام ٹھہرائیں اور مشاورت چھوڑ دیں۔",
          "فرض کر لیں کہ نشہ چھوڑنا ناممکن ہے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A helpful coping technique during cravings is:",
        prompt_ur: "نشے کی طلب کے دوران ایک مفید مقابلہ کرنے کی تکنیک ہے:",
        options: [
          "Deep breathing, grounding, or distraction activities.",
          "Visiting old drug contacts.",
          "Keeping cravings secret.",
          "Testing self-control alone."
        ],
        options_ur: [
          "گہری سانس لینا، گراؤنڈنگ (grounding)، یا دھیان بٹانے والی سرگرمیاں۔",
          "پرانے منشیات کے رابطوں سے ملنا۔",
          "طلب کو راز رکھنا۔",
          "اکیلے اپنے ضبط کا امتحان لینا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Why is having a relapse prevention plan important?",
        prompt_ur: "دوبارہ نشے سے بچاؤ کا منصوبہ (relapse prevention plan) رکھنا کیوں ضروری ہے؟",
        options: [
          "It helps identify triggers and strategies before problems arise.",
          "It guarantees relapse will never happen.",
          "It replaces professional counseling.",
          "It is only useful in early recovery."
        ],
        options_ur: [
          "یہ مسائل پیدا ہونے سے پہلے محرکات (triggers) اور حکمت عملیوں کی شناخت میں مدد کرتا ہے۔",
          "یہ ضمانت دیتا ہے کہ دوبارہ نشہ کبھی نہیں ہوگا۔",
          "یہ پیشہ ورانہ مشاورت کی جگہ لے لیتا ہے۔",
          "یہ صرف ابتدائی بحالی میں مفید ہے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "When seeking professional help, an important factor is:",
        prompt_ur: "پیشہ ورانہ مدد حاصل کرتے وقت، ایک اہم عنصر یہ ہے:",
        options: [
          "Finding a qualified counselor who specializes in addiction.",
          "Choosing the first random person available.",
          "Relying only on friends for advice.",
          "Avoiding professional help entirely."
        ],
        options_ur: [
          "ایک قابل کونسلر تلاش کرنا جو نشے کے علاج میں مہارت رکھتا ہو۔",
          "کسی بھی دستیاب پہلے بے ترتیب شخص کا انتخاب کرنا۔",
          "مشورے کے لیے صرف دوستوں پر بھروسہ کرنا۔",
          "پیشہ ورانہ مدد سے مکمل پرہیز کرنا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A good way to stay motivated in recovery is to:",
        prompt_ur: "بحالی کے عمل میں متحرک رہنے کا ایک اچھا طریقہ ہے:",
        options: [
          "Set small, realistic goals and celebrate progress.",
          "Expect perfection immediately.",
          "Avoid tracking your progress.",
          "Compare yourself negatively to others."
        ],
        options_ur: [
          "چھوٹے، حقیقت پسندانہ اہداف مقرر کریں اور پیشرفت کا جشن منائیں۔",
          "فوری طور پر مکمل کمال کی توقع کریں۔",
          "اپنی پیشرفت پر نظر رکھنے سے گریز کریں۔",
          "دوسروں کے ساتھ اپنا منفی موازنہ کریں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Which resource can help with immediate crisis support?",
        prompt_ur: "کون سا وسیلہ فوری بحران کی صورت میں مدد فراہم کر سکتا ہے؟",
        options: [
          "Crisis hotlines or emergency services.",
          "Waiting for a friend to notice.",
          "Ignoring warning signs.",
          "Posting on social media only."
        ],
        options_ur: [
          "کرائسز ہاٹ لائنز یا ہنگامی خدمات۔",
          "کسی دوست کے نوٹس لینے کا انتظار کرنا۔",
          "انتباہی علامات کو نظر انداز کرنا۔",
          "صرف سوشل میڈیا پر پوسٹ کرنا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Why is writing a list of triggers useful?",
        prompt_ur: "محرکات (triggers) کی فہرست لکھنا کیوں مفید ہے؟",
        options: [
          "It helps build a relapse prevention plan and prepare coping strategies.",
          "It guarantees triggers will stop existing.",
          "It is only useful for clinicians.",
          "It replaces therapy completely."
        ],
        options_ur: [
          "یہ دوبارہ نشے سے بچاؤ کا منصوبہ بنانے اور مقابلہ کرنے کی حکمت عملی تیار کرنے میں مدد کرتا ہے۔",
          "یہ اس بات کی ضمانت دیتا ہے کہ محرکات ختم ہو جائیں گے۔",
          "یہ صرف معالجین (clinicians) کے لیے مفید ہے۔",
          "یہ تھراپی کی مکمل جگہ لے لیتا ہے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A therapist specializing in addiction commonly provides:",
        prompt_ur: "نشے میں مہارت رکھنے والا معالج عام طور پر فراہم کرتا ہے:",
        options: [
          "Structured strategies, relapse prevention, and evidence-based therapy.",
          "Immediate cures without follow-up.",
          "Only medication without support.",
          "General advice without tailoring."
        ],
        options_ur: [
          "منظم حکمت عملی، دوبارہ نشے سے بچاؤ، اور شواہد پر مبنی تھراپی۔",
          "بغیر کسی فالو اپ کے فوری علاج۔",
          "بغیر کسی مدد کے صرف ادویات۔",
          "بغیر کسی تخصیص کے عام مشورہ۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which is a low-barrier help option for many people?",
        prompt_ur: "بہت سے لوگوں کے لیے مدد حاصل کرنے کا آسان ترین راستہ کون سا ہے؟",
        options: [
          "Peer support meetings and drop-in centers.",
          "Private inpatient only options.",
          "Costly exclusive programs only.",
          "No-contact policies."
        ],
        options_ur: [
          "ساتھیوں کے امدادی اجلاس اور ڈراپ ان مراکز۔",
          "صرف پرائیویٹ ان پیشنٹ (inpatient) کے اختیارات۔",
          "صرف مہنگے خصوصی پروگرام۔",
          "نو کنٹیکٹ (no-contact) پالیسیاں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "How does a sponsor or peer helper assist recovery?",
        prompt_ur: "ایک اسپانسر یا ساتھی مددگار بحالی میں کیسے مدد کرتا ہے؟",
        options: [
          "Offer lived-experience guidance, accountability, and encouragement.",
          "Diagnose medical conditions.",
          "Provide legal advice only.",
          "Replace professional care entirely."
        ],
        options_ur: [
          "اپنے تجربے کی بنیاد پر رہنمائی، جوابدہی اور حوصلہ افزائی فراہم کرنا۔",
          "طبی حالات کی تشخیص کرنا۔",
          "صرف قانونی مشورہ فراہم کرنا۔",
          "پیشہ ورانہ دیکھ بھال کی جگہ مکمل طور پر لینا پینا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "When creating a safety plan, include:",
        prompt_ur: "سیفٹی پلان بناتے وقت شامل کریں:",
        options: [
          "Contact numbers, coping steps, and safe places to go.",
          "Only vague statements about feeling better soon.",
          "A list of places to use drugs.",
          "No actionable items."
        ],
        options_ur: [
          "رابطہ نمبر، مقابلہ کرنے کے اقدامات، اور جانے کے لیے محفوظ مقامات۔",
          "جلد بہتر محسوس کرنے کے بارے میں صرف غیر واضح بیانات۔",
          "منشیات استعمال کرنے کی جگہوں کی فہرست۔",
          "کوئی قابل عمل اقدامات نہیں۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "If medication-assisted treatment is an option, it may:",
        prompt_ur: "اگر ادویات کی مدد سے علاج (MAT) ایک آپشن ہے، تو یہ:",
        options: [
          "Reduce withdrawal and cravings alongside counseling.",
          "Always cure addiction alone.",
          "Be a sign of failure.",
          "Be useless for all cases."
        ],
        options_ur: [
          "مشاورت کے ساتھ ساتھ واپسی کی علامات (withdrawal) اور طلب کو کم کر سکتا ہے۔",
          "ہمیشہ اکیلے ہی نشے کا علاج کر سکتا ہے۔",
          "ناکامی کی علامت ہو سکتا ہے۔",
          "تمام صورتوں میں بیکار ہو سکتا ہے۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "Which action helps someone follow through with appointments?",
        prompt_ur: "کون سا عمل کسی کو اپوائنٹمنٹس پر جانے میں مدد فراہم کرتا ہے؟",
        options: [
          "Offer to remind them or provide transportation if needed.",
          "Tell them to remember themselves without support.",
          "Punish missed appointments.",
          "Cancel appointments for them."
        ],
        options_ur: [
          "یاد دہانی کروانے یا ضرورت پڑنے پر سواری فراہم کرنے کی پیشکش کریں۔",
          "انہیں کہیں کہ بغیر کسی مدد کے خود یاد رکھیں۔",
          "مسیڈ اپوائنٹمنٹس پر سزا دیں۔",
          "ان کی جگہ اپوائنٹمنٹس کینسل کر دیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "A sign of appropriate professional help is:",
        prompt_ur: "مناسب پیشہ ورانہ مدد کی علامت ہے:",
        options: [
          "Use of evidence-based practices and collaborative goal-setting.",
          "Promises of instant cure without planning.",
          "Refusal to coordinate with other supports.",
          "Relying only on anecdote."
        ],
        options_ur: [
          "شواہد پر مبنی طریقوں اور مل کر اہداف طے کرنے کا استعمال۔",
          "منصوبہ بندی کے بغیر فوری علاج کے وعدے۔",
          "دیگر امدادی ذرائع کے ساتھ تعاون سے انکار۔",
          "صرف قصے کہانیوں پر بھروسہ کرنا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "Which self-help step can be done daily to support recovery?",
        prompt_ur: "بحالی کی مدد کے لیے روزانہ کون سا خود امدادی قدم اٹھایا جا سکتا ہے؟",
        options: [
          "Practicing a brief grounding or mindfulness exercise.",
          "Isolating from supportive people.",
          "Testing triggers intentionally.",
          "Ignoring self-care routines."
        ],
        options_ur: [
          "مختصر گراؤنڈنگ یا مائنڈفلنیس (mindfulness) کی مشق کرنا۔",
          "حمایتی لوگوں سے الگ تھلگ ہو جانا۔",
          "جان بوجھ کر محرکات (triggers) کا امتحان لینا۔",
          "ذاتی دیکھ بھال کے معمولات کو نظر انداز کرنا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "How can technology support recovery?",
        prompt_ur: "ٹیکنالوجی بحالی کے عمل میں کیسے مدد کر سکتی ہے؟",
        options: [
          "Apps for tracking triggers, reminders, and connection to peer groups.",
          "Only social media posting about every slip publicly.",
          "Banning phones from use entirely.",
          "Replacing in-person support only."
        ],
        options_ur: [
          "محرکات کو ٹریک کرنے والی ایپس، یاد دہانی، اور ساتھی گروپوں سے رابطہ۔",
          "صرف سوشل میڈیا پر ہر غلطی کے بارے میں عوامی طور پر پوسٹ کرنا۔",
          "فون کے استعمال پر مکمل پابندی لگانا۔",
          "صرف آمنے سامنے کی مدد کی جگہ لینا۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "If someone relapses, what is an important next step?",
        prompt_ur: "اگر کوئی دوبارہ نشہ کر لیتا ہے، تو اگلا اہم قدم کیا ہے؟",
        options: [
          "Connect them to care quickly and reassess the prevention plan.",
          "Ignore them until they stop.",
          "Make them leave treatment permanently.",
          "Shame them publicly."
        ],
        options_ur: [
          "انہیں جلدی سے دیکھ بھال کے نظام سے جوڑیں اور بچاؤ کے منصوبے کا دوبارہ جائزہ لیں۔",
          "انہیں تب تک نظر انداز کریں جب تک وہ خود نہ رک جائیں۔",
          "انہیں مستقل طور پر علاج چھوڑنے پر مجبور کریں۔",
          "انہیں عوامی طور پر شرمندہ کریں۔"
        ],
        correct: 0,
        difficulty: "hard"
      },
      {
        prompt: "Which behavior improves long-term recovery outcomes?",
        prompt_ur: "کون سا رویہ طویل مدتی بحالی کے نتائج کو بہتر بناتا ہے؟",
        options: [
          "Consistent follow-up, social support, and coping practice.",
          "One-time detox without aftercare.",
          "Avoiding all forms of help.",
          "Relying solely on willpower."
        ],
        options_ur: [
          "مسلسل فالو اپ، سماجی مدد، اور مقابلہ کرنے کی مشق۔",
          "بغیر کسی بعد کی دیکھ بھال کے ایک بار ڈیٹاکس۔",
          "مدد کی تمام اقسام سے پرہیز کرنا۔",
          "محض قوت ارادی پر بھروسہ کرنا۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "How do harm reduction services help people who use substances?",
        prompt_ur: "نقصان میں کمی کی خدمات (harm reduction) منشیات استعمال کرنے والوں کی کیسے مدد کرتی ہیں؟",
        options: [
          "They reduce immediate risks and connect to treatment when ready.",
          "They encourage use without support.",
          "They are only for chronic users.",
          "They have no role in public health."
        ],
        options_ur: [
          "وہ فوری خطرات کو کم کرتی ہیں اور تیار ہونے پر علاج سے جوڑتی ہیں۔",
          "وہ بغیر کسی مدد کے استعمال کی حوصلہ افزائی کرتی ہیں۔",
          "وہ صرف دائمی صارفین کے لیے ہیں۔",
          "عوامی صحت میں ان کا کوئی کردار نہیں ہے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "What should you prioritize when connecting someone with help?",
        prompt_ur: "کسی کو مدد سے جوڑتے وقت آپ کو کس چیز کو ترجیح دینی چاہیے؟",
        options: [
          "Their safety, preferences, and timely access to resources.",
          "What’s cheapest regardless of fit.",
          "Forcing a single treatment path.",
          "Delaying care until they ask repeatedly."
        ],
        options_ur: [
          "ان کی حفاظت، ترجیحات، اور وسائل تک بروقت رسائی۔",
          "بغیر کسی مطابقت کے جو سب سے سستا ہو۔",
          "علاج کے صرف ایک راستے پر مجبور کرنا۔",
          "دیکھ بھال میں تب تک تاخیر کرنا جب تک وہ بار بار نہ کہیں۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Why is relapse prevention planning collaborative?",
        prompt_ur: "دوبارہ نشے سے بچاؤ کی منصوبہ بندی مل کر کیوں کی جاتی ہے؟",
        options: [
          "Because the individual knows personal triggers and the team offers strategies.",
          "It should be done only by professionals without input.",
          "Family should always decide alone.",
          "Collaboration weakens the plan."
        ],
        options_ur: [
          "کیونکہ فرد اپنے ذاتی محرکات جانتا ہے اور ٹیم حکمت عملی پیش کرتی ہے۔",
          "یہ صرف پیشہ ور افراد کو بغیر کسی رائے کے کرنا چاہیے۔",
          "خاندان کو ہمیشہ اکیلے فیصلہ کرنا چاہیے۔",
          "باہمی تعاون منصوبے کو کمزور کرتا ہے۔"
        ],
        correct: 0,
        difficulty: "medium"
      },
      {
        prompt: "A realistic recovery goal often looks like:",
        prompt_ur: "بحالی کا ایک حقیقت پسندانہ ہدف اکثر ایسا ہوتا ہے:",
        options: [
          "Specific, achievable steps such as attending one meeting per week.",
          "Immediate lifetime perfect abstinence without support.",
          "Setting no measurable goals.",
          "Rigid rules with no flexibility."
        ],
        options_ur: [
          "مخصوص، قابل حصول اقدامات جیسے ہفتے میں ایک میٹنگ میں شرکت کرنا۔",
          "بغیر کسی مدد کے فوری تاحیات مکمل پرہیز۔",
          "کوئی پیمائش کے قابل اہداف مقرر نہ کرنا۔",
          "بغیر کسی لچک کے سخت اصول۔"
        ],
        correct: 0,
        difficulty: "easy"
      },
      {
        prompt: "Which practice helps maintain progress after treatment?",
        prompt_ur: "علاج کے بعد پیشرفت کو برقرار رکھنے میں کون سی مشق مدد کرتی ہے؟",
        options: [
          "Regular check-ins with supports and continuing skill practice.",
          "Avoiding any follow-up care.",
          "Assuming treatment alone is sufficient.",
          "Waiting for problems to appear first."
        ],
        options_ur: [
          "مددگاروں کے ساتھ باقاعدہ رابطہ اور مہارتوں کی مشق جاری رکھنا۔",
          "کسی بھی فالو اپ دیکھ بھال سے پرہیز کرنا۔",
          "یہ فرض کرنا کہ صرف علاج ہی کافی ہے۔",
          "پہلے مسائل پیدا ہونے کا انتظار کرنا۔"
        ],
        correct: 0,
        difficulty: "medium"
      }
    ],
  },
};

export default questionPool;

