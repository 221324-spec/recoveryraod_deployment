// AlcoholInfo.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { FaPlus, FaMinus } from "react-icons/fa";

import "./AlcoholInfo.css";

function AlcoholInfo({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is alcohol addiction a disease?",
      answer:
        "Yes. Alcohol addiction (alcohol use disorder) is recognized as a chronic brain disease that alters the brain’s structure and function, making it difficult to control drinking habits¹.",
    },
    {
      question: "Is alcohol addiction treatment effective?",
      answer:
        "Yes. Treatments such as behavioral therapies, counseling, medication-assisted treatment, and support groups can be very effective when tailored to the individual².",
    },
    {
      question: "How much does alcohol addiction treatment cost?",
      answer:
        "The cost varies depending on treatment type (inpatient, outpatient, detox, therapy). Some facilities offer sliding-scale fees, financial aid, or insurance coverage³.",
    },
    {
      question: "Is alcohol rehab covered by insurance?",
      answer:
        "Many insurance plans cover part or all of alcohol rehab treatment. Coverage depends on the provider and the specific policy⁴.",
    },
  ];

  return (
    <div className="alcohol-info-layout">
      <main className="main-container">
        {/* Hero Section */}
        <section className="hero">
          <img src="/softbg.jpg" alt="Alcohol Addiction" className="hero-img" />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>Understanding Alcohol Addiction</h1>
            <p>
              Alcohol addiction is a serious condition that affects millions of
              people worldwide. It can lead to severe health problems and
              disrupt personal and professional lives¹.
            </p>
          </div>
        </section><br></br><br></br>

        <div className="content">
          {/* Section 1 */}
          <div className="info-section">
           <div className="info-text">
  <h2>What Is Alcohol Addiction?</h2>
  <p>
    Alcohol addiction, also known as alcoholism or alcohol use disorder, is a chronic
    disease characterized by an inability to control alcohol consumption despite
    negative consequences¹. It affects the brain’s reward, motivation, and memory
    systems, leading individuals to prioritize drinking over other responsibilities
    and relationships².
  </p>
  <p>
    In 2023, 61.4 million people ages 12 and older engaged in past-month binge
    drinking, while nearly 30 million had an alcohol use disorder⁵. Alcohol
    addiction develops gradually, often beginning with social drinking that escalates
    into frequent or heavy use³. Over time, tolerance builds, requiring larger
    amounts of alcohol to feel the same effects, while dependence causes withdrawal
    symptoms when alcohol use stops⁶.
  </p>
  <p>
    Alcohol addiction is not just a behavioral issue but a medical condition with
    physical, psychological, and social dimensions. It increases the risk of liver
    disease, heart disease, neurological damage, and mental health disorders such as
    depression and anxiety⁷. Families and communities are also deeply affected, as
    addiction often leads to strained relationships, financial problems, and
    workplace difficulties⁸.
  </p>
  <p>
    Understanding alcohol addiction is the first step toward addressing it. This page
    will explore how to recognize its signs, the dangers it poses, and the treatment
    options available to support recovery and long-term wellness.
  </p>
</div>

            <div className="info-image">
              <img src="/alc.png" alt="What is Alcohol Addiction" />
            </div>
          </div><br></br><br></br><br></br><br></br>

          {/* NEW Two-Column Section */}
          <section className="two-column-section">
            <h2 className="text-center mb-4">Learn More About Alcohol Addiction and Recovery</h2>
            <div className="verified-badge">✔ Medically Reviewed</div>
            <div className="cards-grid">
              <div className="info-card">
                <h3>Alcohol Addiction</h3>
                <ul>
                  <li>Impact on Brain Chemistry and Function</li>
                  <li>Physical Dependence and Tolerance</li>
                  <li>Severe Health Risks (liver disease, cancer)</li>
                  <li>Increased Risk of Relapse</li>
                </ul>
              </div>
              <div className="info-card">
                <h3>Treatment and Recovery</h3>
                <ul>
                  <li>Behavioral Therapy and Counseling</li>
                  <li>Medication-Assisted Treatment</li>
                  <li>Support Groups and Peer Recovery</li>
                  <li>Relapse Prevention Strategies</li>
                </ul>
              </div>
            </div>
          </section><br></br><br></br><br></br><br></br>

          {/* Section 2 */}
          <div className="info-section reverse">
            <div className="info-text">
              <h2>Signs and Symptoms</h2>
              <ul>
                <li>Inability to limit alcohol consumption¹</li>
                <li>Strong cravings for alcohol¹</li>
                <li>Withdrawal symptoms when not drinking (e.g., irritability, insomnia)⁶</li>
                <li>Neglecting responsibilities and relationships¹</li>
              </ul>
            </div>
            <div className="info-image">
              <img src="/substance.jpeg" alt="Signs and Symptoms" />
            </div>
          </div><br></br><br></br>

          {/* Section 3 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Dangers of Alcohol Addiction</h2>
              <p>
                Alcohol misuse can have serious effects on the person drinking as well as those around them. Adverse effects from alcohol can include⁷⁸:
              </p>
              <ul>
                <li>Cardiovascular issues (irregular heartbeat, chronic high blood pressure)</li>
                <li>Alcoholic cardiomyopathy</li>
                <li>Increased risk of heart attack and stroke</li>
                <li>Weakened immune system, increasing risk of pneumonia</li>
                <li>Liver damage (fatty liver, fibrosis, cirrhosis, hepatitis)</li>
                <li>Pancreatitis and chronic gastrointestinal inflammation</li>
                <li>Increased risk of cancers (head and neck, liver, breast, colorectal)</li>
                <li>Alcohol poisoning and overdose toxicity</li>
              </ul>
            </div>
            <div className="info-image">
              <img src="/softbg.jpg" alt="Dangers of Alcohol Addiction" />
            </div>
          </div>
        </div><br></br><br></br>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Get Help for Alcohol Addiction</h2>
          <p>
            Finding the right support for alcohol addiction can change lives. Professional treatment programs, counseling, and support groups provide the tools needed to overcome dependency, restore health, and rebuild relationships². Taking the first step toward help is the most important step toward recovery.
          </p>
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${activeIndex === index ? "active" : ""}`}
              >
                <div
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {activeIndex === index ? <FaMinus /> : <FaPlus />}
                  </span>
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

        {/* References Section */}
        <section className="references hidden-section">
          <h2>References</h2>
          <ol>
            <li>National Institute on Alcohol Abuse and Alcoholism (NIAAA). Alcohol Use Disorder. NIH.</li>
            <li>Substance Abuse and Mental Health Services Administration (SAMHSA). Treatment for Alcohol Problems.</li>
            <li>American Addiction Centers. Alcohol Rehab Costs & Insurance Coverage.</li>
            <li>U.S. Department of Health & Human Services. Insurance Coverage for Addiction Treatment.</li>
            <li>National Survey on Drug Use and Health (NSDUH), 2023.</li>
            <li>Mayo Clinic. Alcohol Use Disorder – Symptoms and Causes.</li>
            <li>Centers for Disease Control and Prevention (CDC). Alcohol and Your Health.</li>
            <li>World Health Organization (WHO). Global Status Report on Alcohol and Health.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default AlcoholInfo;
