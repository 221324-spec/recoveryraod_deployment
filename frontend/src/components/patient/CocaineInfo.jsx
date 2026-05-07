// CocaineInfo.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { FaPlus, FaMinus } from "react-icons/fa";

import "./CocaineInfo.css"; 

function CocaineInfo({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is cocaine addiction a disease?",
      answer:
        "Yes. Cocaine addiction is recognized as a chronic brain disorder that affects reward, motivation, memory, and related circuitry¹.",
    },
    {
      question: "Is cocaine addiction treatment effective?",
      answer:
        "Yes. Treatments like behavioral therapy, counseling, support groups, and sometimes medication can help individuals recover successfully².",
    },
    {
      question: "How much does cocaine addiction treatment cost?",
      answer:
        "Costs vary depending on treatment type (inpatient, outpatient, therapy). Some clinics offer financial aid or insurance coverage³.",
    },
    {
      question: "Is cocaine rehab covered by insurance?",
      answer:
        "Some insurance plans cover part or all of cocaine rehab treatment depending on the provider and policy⁴.",
    },
  ];

  return (
    <div className="alcohol-info-layout">
      <main className="main-container">
        {/* Hero Section */}
        <section className="hero">
          <img src="/cbg.jpg" alt="Cocaine Addiction" className="hero-img" />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>Understanding Cocaine Addiction</h1>
            <p>
              Cocaine addiction is a serious condition affecting brain function, relationships, and overall health. Early intervention can prevent long-term damage¹⁵.
            </p>
          </div>
        </section>

        <div className="content">
          {/* Section 1 */}
          <div className="info-section">
           <div className="info-text">
  <h2>What Is Cocaine Addiction?</h2>
  <p>
    Cocaine addiction, also called cocaine use disorder, is a chronic disease
    where individuals struggle to control cocaine use despite harmful
    consequences¹. Cocaine is a powerful stimulant that directly affects the
    brain’s dopamine system, creating intense euphoria and energy. Over time,
    repeated use alters brain chemistry, leading to compulsive drug seeking
    behaviors and a loss of control over use².
  </p>
  <p>
    Cocaine can be ingested in different forms, including snorting powder,
    smoking crack cocaine, or injecting it. Each method delivers rapid effects
    that reinforce cravings and increase the risk of addiction³. The drug’s
    short lived high often drives people to use it repeatedly within a short
    period, known as “binging,” which significantly raises the risk of overdose
    and long term health complications⁴.
  </p>
  <p>
    Addiction to cocaine not only affects the individual physically and
    mentally but also disrupts relationships, finances, and professional life.
    Chronic use is linked to severe cardiovascular problems, neurological
    damage, mood disorders, and increased risk taking behaviors⁵. Family members
    and communities also experience the consequences of cocaine misuse,
    including emotional distress and social instability⁶.
  </p>
  
</div>

          {/*  <div className="info-image">
              <img src={Cocaine} alt="What is Cocaine Addiction" />
            </div>*/}
          </div><br></br><br></br>

          {/* Section - Dangers of Mixing Cocaine with Alcohol */}
          <div className="alcohol-danger-section">
            <h2>Dangers of Mixing Cocaine with Alcohol</h2>
            <p>
              People commonly drink alcohol while using cocaine. Some may use alcohol to blunt unpleasant side effects or to cope with the crash following a binge⁶.
            </p>
            <p>
              Combining cocaine and alcohol produces a dangerous byproduct called <strong>cocaethylene</strong>, formed in the liver when both substances are present⁶.
            </p>
            <p>
              Cocaethylene significantly increases cardiovascular risks due to its cardiotoxic effects, in addition to the elevated heart rate and blood pressure caused by cocaine and alcohol individually⁶⁷.
            </p>
          </div><br></br><br></br><br></br><br></br>
          
          {/* Learn More Section */}
<section className="learn-more-section">
  <h2>Learn More About Cocaine Addiction and Recovery</h2>
  <span className="reviewed-badge">✅ Medically Reviewed</span>

  <div className="learn-more-grid">
    <div className="learn-more-card">
      <h3>Cocaine Addiction</h3>
      <ul>
        <li>Disrupts dopamine levels, leading to intense cravings</li>
        <li>Severe cardiovascular risks (heart attack, stroke)</li>
        <li>Increased anxiety, paranoia, and mood instability</li>
        <li>High potential for dependence and relapse</li>
      </ul>
    </div>

    <div className="learn-more-card">
      <h3>Treatment and Recovery</h3>
      <ul>
        <li>Behavioral therapies such as Cognitive Behavioral Therapy (CBT)</li>
        <li>Medication-assisted approaches under clinical supervision</li>
        <li>Structured rehabilitation programs and peer support</li>
        <li>Ongoing relapse prevention and lifestyle changes</li>
      </ul>
    </div>
  </div>
</section>
<br></br><br></br><br></br><br></br>



          {/* Section 2 */}
          <div className="info-section reverse">
            <div className="info-text">
              <h2>Signs and Symptoms</h2>
              <ul>
                <li>Strong cravings for cocaine¹</li>
                <li>Inability to limit use²</li>
                <li>Withdrawal symptoms when not using (fatigue, depression, sleep problems)³</li>
                <li>Neglecting responsibilities and relationships⁴</li>
              </ul>
            </div>
            <div className="info-image">
              <img src="/sc.jpg" alt="Signs and Symptoms" />
            </div>
          </div><br></br><br></br>

          {/* Section 3 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Dangers of Cocaine Addiction</h2>
              <p>
                Cocaine misuse can have severe effects on health and social life. Adverse effects include¹⁵⁷:
              </p>
              <ul>
                <li>Cardiovascular problems (heart attack, irregular heartbeat)</li>
                <li>Respiratory issues (chest pain, difficulty breathing)</li>
                <li>Neurological effects (seizures, strokes)</li>
                <li>Gastrointestinal complications (abdominal pain, nausea)</li>
                <li>Psychological issues (anxiety, paranoia, depression)</li>
                <li>Risk of overdose and death</li>
              </ul>
            </div>
            <div className="info-image">
              <img src="/cbg.jpg" alt="Dangers of Cocaine Addiction" />
            </div>
          </div>
        </div><br></br><br></br>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Get Help for Cocaine Addiction</h2>
          <p>
            Seeking professional help for cocaine addiction is crucial. Treatment programs, counseling, and support groups provide strategies to manage cravings, rebuild health, and restore relationships²⁴.
          </p>
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${activeIndex === index ? "active" : ""}`}>
                <div className="faq-question" onClick={() => toggleFAQ(index)}>
                  <span>{faq.question}</span>
                  <span className="faq-icon">{activeIndex === index ? <FaMinus /> : <FaPlus />}</span>
                </div>
                {activeIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* References Section (hidden for professionalism) */}
        <section className="references hidden-section">
          <h2>References</h2>
          <ol>
            <li>National Institute on Drug Abuse (NIDA). Cocaine Research Report. 2023.</li>
            <li>Substance Abuse and Mental Health Services Administration (SAMHSA). Treatment for Stimulant Use Disorders. 2022.</li>
            <li>Mayo Clinic. Cocaine withdrawal: Symptoms and treatment. 2023.</li>
            <li>American Addiction Centers. Cocaine Addiction Treatment & Rehab Programs. 2024.</li>
            <li>World Health Organization (WHO). Health Risks of Cocaine Use. 2022.</li>
            <li>National Institutes of Health (NIH). Dangers of Mixing Cocaine and Alcohol. 2023.</li>
            <li>Centers for Disease Control and Prevention (CDC). Cocaine and Health Effects. 2023.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default CocaineInfo;
