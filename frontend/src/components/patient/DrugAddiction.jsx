import React from "react"; 
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

import "./DrugAddiction.css";
import AddictionHero from "../../assets/addiction.jpg";
import AddictionVideo from "../../assets/addictionrecovery.mp4";
import SignsImg from "../../assets/signs.jpg";
import HealthImg from "../../assets/smokerlungs.jpg";
import TreatmentImg from "../../assets/treatment.jpg";
import ProgramsImg from "../../assets/therapy.jpg";

function DrugAddiction({ onBack }) {
  const navigate = useNavigate();

  return (
    <div className="drug-page-layout">
      <main className="main-content flex flex-col min-h-screen">
        {/* ✅ Hero Image */}
        <section className="hero">
          <img
            src={AddictionHero}
            alt="Drug addiction awareness"
            className="hero-img"
            loading="eager"
          />
        </section><br></br><br></br><br></br>

        {/* ✅ Article Header */}
        <section className="article-header">
          <h1>Addiction: Signs, Symptoms, Effects, and Treatment</h1>
          
          <p className="intro-text">
            Addiction, also known as a substance use disorder (SUD), can have a
            range of signs, symptoms, and effects that may have a harmful impact
            on your health and well-being¹. Different SUDs can have different
            diagnostic signs and symptoms, as well as a range of associated,
            substance-specific health effects². Knowing these signs and symptoms
            can help you or a loved one recognize when substance use becomes a
            problem and when it’s time to seek help³.
          </p>
        </section><br></br><br></br><br></br><br></br>

  {/* ✅ New Unique Video Section */}
<section className="unique-video-section relative">
  
  <div className="unique-video-container relative">
    <video className="unique-video-player" width="100%" height="400" controls>
      <source src={AddictionVideo} type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    {/* ✅ Motivational Text (directly on video) */}
    <div className="unique-text-overlay absolute top-0 left-0 w-full h-full flex items-center justify-center text-center px-6">
      <div>
        <p className="unique-fade-text">Recovery is not about perfection,</p>
        <p className="unique-fade-text">it’s about progress.</p>
        <p className="unique-fade-text">Every small step you take today</p>
        <p className="unique-fade-text">is a victory that brings you closer</p>
        <p className="unique-fade-text">to a healthier, happier tomorrow.</p>
      </div>
    </div>
  </div>
</section>


        {/* ✅ Page Content */}
        <div className="content-wrapper">
          <main className="article-content">
            <section id="what-is">
              <h2>What is Drug Addiction?</h2>
              <p>
                Drug addiction, also known as substance use disorder, is a chronic
                disease characterized by compulsive drug seeking and use, despite
                harmful consequences¹,². Over time, drugs can alter the brain’s
                structure and functioning, making it difficult for individuals to
                quit on their own³.
              </p>
            </section>

            <section id="signs">
              <h2>Signs and Symptoms</h2>
              <ul>
                <li>Cravings or strong urges to use the substance¹</li>
                <li>Inability to control or reduce drug use²</li>
                <li>Neglecting responsibilities at work, school, or home³</li>
                <li>Changes in mood, behavior, or appearance¹,³</li>
                <li>Withdrawal symptoms when not using²</li>
              </ul>
            </section>

            <section id="causes">
              <h2>Causes of Drug Addiction</h2>
              <p>
                Addiction develops from a combination of biological, psychological,
                and environmental factors¹. Genetic predisposition, peer influence,
                mental health conditions, and exposure to drugs at an early age
                all increase the risk of developing substance use disorder²,³.
              </p>
            </section>

            <section className="highlight-box">
              <h2>Did You Know?</h2>
              <p>
                Studies show that early intervention and professional support can
                significantly improve recovery outcomes for people struggling with
                addiction¹,².
              </p>
            </section>

            <section id="treatment">
              <h2>Treatment Options</h2>
              <p>
                Treatment for drug addiction is most effective when it is
                comprehensive and tailored to the individual³. Common treatment
                methods include:
              </p>
              <ul>
                <li>Cognitive-behavioral therapy (CBT)¹</li>
                <li>Group and family counseling²</li>
                <li>Medication-assisted treatment (MAT)³</li>
                <li>Detoxification under medical supervision²</li>
                <li>Inpatient and outpatient rehabilitation programs¹,³</li>
              </ul>
            </section>

            <section id="recovery">
              <h2>Recovery and Support</h2>
              <p>
                Recovery is a lifelong process that involves building healthy
                habits, avoiding triggers, and maintaining strong support
                networks¹. Many people benefit from peer support groups, such as
                Narcotics Anonymous (NA), alongside professional treatment²,³.
              </p>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="sidebar">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#what-is">What is Drug Addiction?</a></li>
              <li><a href="#signs">Signs & Symptoms</a></li>
              <li><a href="#causes">Causes</a></li>
              <li><a href="#treatment">Treatment Options</a></li>
              <li><a href="#recovery">Recovery & Support</a></li>
            </ul>

            <div className="cta-box">
              <h4>Need Help?</h4>
              <p>
                Reach out to a healthcare professional or local support group
                to begin your recovery journey¹.
              </p>
            </div>
          </aside>
        </div><br></br><br></br>

        {/* ✅ New Detailed Sections with Images */}
        <section className="detailed-sections">
          {/* Signs */}
          <div className="detail-row">
            <img src={SignsImg} alt="Signs of addiction" className="detail-img"/>
            <div className="detail-text">
              <h2>Signs and Symptoms of Addiction</h2>
              <p>
                Addiction can manifest in different ways depending on the substance
                and the individual¹. Emotional changes often include irritability,
                mood swings, anxiety, or depression². Behavioral changes may involve
                lying, secrecy, or sudden shifts in social circles². Cognitive signs
                include poor focus, impaired memory, or risky decision-making³.
                Physical signs range from bloodshot eyes and weight changes to
                frequent illnesses due to a weakened immune system¹,². Early recognition
                of these symptoms allows family and friends to intervene before the
                problem worsens³.
              </p>
            </div>
          </div><br></br><br></br>

          {/* Health Dangers */}
          <div className="detail-row reverse">
            <img src={HealthImg} alt="Health dangers" className="detail-img"/>
            <div className="detail-text">
              <h2>Potential Health Dangers of Substance Use</h2>
              <p>
                Substance misuse takes a heavy toll on both body and mind¹. Prolonged
                alcohol or drug use may damage the heart, liver, lungs, kidneys, and
                brain². For example, opioids can slow breathing and lead to fatal
                overdoses, while stimulants like cocaine strain the cardiovascular
                system³. Mental health risks are equally serious, often leading to
                paranoia, hallucinations, depression, or suicidal thoughts¹,². Chronic
                substance use is also associated with malnutrition, infectious
                diseases (from shared needles), and shortened life expectancy³.
              </p>
            </div>
          </div><br></br><br></br>

          {/* Getting Treatment */}
          <div className="detail-row">
            <img src={TreatmentImg} alt="Addiction treatment" className="detail-img"/>
            <div className="detail-text">
              <h2>Getting Treatment and Starting Recovery</h2>
              <p>
                Entering treatment is a life-saving choice that restores health and
                hope¹. The process often begins with detox, where the body clears the
                substance under medical supervision². From there, therapy becomes central —
                cognitive-behavioral therapy helps identify triggers, while group sessions
                provide accountability and support³. Many individuals also benefit from
                family counseling¹, which heals broken relationships. Recovery is not linear,
                and setbacks are common, but ongoing support, healthy coping strategies, and a
                structured plan make lasting sobriety achievable²,³.
              </p>
            </div>
          </div><br></br><br></br>

          {/* Programs */}
          <div className="detail-row reverse">
            <img src={ProgramsImg} alt="Recovery programs" className="detail-img"/>
            <div className="detail-text">
              <h2>Types of Addiction Recovery Programs</h2>
              <p>
                Recovery programs are designed to meet different levels of need¹. 
                <strong> Inpatient rehabilitation</strong> offers intensive, 24-hour
                care in a structured environment². <strong>Outpatient programs</strong>
                provide flexibility, allowing individuals to attend treatment while
                continuing daily responsibilities³. <strong>Medication-assisted
                treatment (MAT)</strong> combines medications like methadone or
                buprenorphine with therapy to ease withdrawal and cravings¹,³.
                <strong> Residential sober living</strong> homes offer transitional
                support after rehab², while <strong>12-step and peer groups</strong>
                provide ongoing community and accountability¹,³. By combining these
                resources, recovery becomes more sustainable and personalized to
                each individual’s journey².
              </p>
            </div>
          </div>
        </section><br></br><br></br>

        {/* ✅ References Section */}
        <section className="references hidden">
          <h2>References</h2>
          <ul>
            <li>¹ National Institute on Drug Abuse (NIDA). Understanding Drug Use and Addiction.</li>
            <li>² American Psychiatric Association (APA). Diagnostic and Statistical Manual of Mental Disorders (DSM-5).</li>
            <li>³ World Health Organization (WHO). Substance Abuse and Mental Health.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default DrugAddiction;
