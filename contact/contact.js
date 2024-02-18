import {WebHeader } from "../main.js";

// Call the function to initialize the header generation 
WebHeader("contact"); // need to move to html file.

function contactInfo(){

    var contactPage_html=`
    <div class="contact">
    <div class="contact-heading">Contact Me <span>&#128237;</span></div>
          
    <div class="contact-content">
      <p>Absolutely thrilled to have you here! &#127881; If you've got burning questions, cool feedback, or just wanna shoot the breeze, 
      I'm all ears and can't wait to hear from you. &#129312;</p>

      <p>Don't be shy – hit me up on any of the platforms below, and I'll get back to you in a jiffy! &#128640;</p>
    </div>

    <div class="social-media">
      <div class="social-media-heading">Social Media <span>&#128241;</span></div>
      <div class="social-media-content">
        <p>You can also connect with me on social media.</p>
        <div class="social-media-image">
          <a href="https://www.linkedin.com/in/om-vats-2021b/"><img class="linkedin" style="width:7%;height:7%" src="../assets/linkedin.svg"/></a>
          <a href="https://twitter.com/@vatsaum"><img class="twitter" style="width:7%;height:7%" src="../assets/twitter.svg"/></a>
        </div>
      </div>
    </div>

    <div class="email">
      <div class="email-heading">Email </div>
      <div class="email-content">
        <p>Prefer email ? <span>&#128231;</span> Drop me a line at  <span style="color: rebeccapurple;">vatsaum.kar@gmail.com </span>! Looking forward to hearing from you! &#127775;</p>
      </div>
    </div>
   </div>`

   function ContactPageContent(){

        document.getElementById('contactPage').innerHTML+=contactPage_html;

    }

    window.addEventListener('load', ContactPageContent);

}

contactInfo();

