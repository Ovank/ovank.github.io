import {WebHeader } from "../main.js";

// Call the function to initialize the header generation 
WebHeader("aboutMe"); // need to move to html file.


function AboutmeContent(){
    var aboutme_html=`
    <div class="aboutme">
    <div class="intro">
      Hello &#128075; , I'm Om Vats, I am a Software Development Engineer based in the vibrant city of Bengaluru, India. 🚀
    </div>
    <div class="list-view">
      <p class="list-view-heading"><b>Quick Bio:</b></p>
      <p>
        <ul>
          <li>💼 Designation: Software Development Engineer</li>
          <li>🎓 Education: Bachelor's Degree in Computer Science</li>
          <li>📍 Location: Bengaluru, India</li>
        </ul>
      </p>
    </div>

    <div class="about-me">
      <p class="about-me-heading"><b>What's My Deal ?</b></p>
I'm all about creating things from scratch and despise those repetitive tasks. To tackle the mundane, I dive into the world of automation, using Python, Kubernetes, Git, AWX, Angular, C/C++, and Ansible. My playground includes maintaining robust server clusters, troubleshooting server issues, and crafting end-to-end tools like a wizard.
    </div>

    <div class="intrest">
      <p class="intrest-heading"><b>Life Beyond the Code :</b></p>
      When I'm not in front of a screen, you'll likely find me jogging through the concrete jungle or swimming my way to serenity. 🏃‍♂️🏊 These activities not only keep me fit but also bring a perfect balance to my life.
    </div>

    <div class="work">
      <p class="work-heading"><b>What's happening over at Juniper Network ?</b></p>
      Right now, I'm part of the cool crew at Juniper Network, cooking up some serious software mojo. I'm constantly leveling up my skills in the process. And this website? It's like my digital diary, where I spill the beans on my learning adventures, projects, and all the rad stuff going on in the software world. 🚀🌐
    </div>
    
    <div class="end-note">
      Feel free to roam around, explore the bits and bytes, and hit me up if you want to chat about anything tech or life-related. Let's connect and navigate the exciting world of software development together! 🚀✨
    </div>

   </div>
    `

    function AboutmePageContent(){

        document.getElementById('aboutmepage').innerHTML+=aboutme_html;

    }

    window.addEventListener('load', AboutmePageContent);
}

AboutmeContent();

