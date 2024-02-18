import {WebHeader } from "../main.js";

// Call the function to initialize the header generation 
WebHeader("home"); // need to move to html file.

function homePageContain(){

    var homePage_html=`
    <div class="Home">
        <div class="hero">
            <span><img src="../assets/profile.png" style="width:400px;height:400px"></span>
            <h1>Hello <span>&#128075;</span>, I am Om Vats.<span>&#128522;</span></h1>
            <h2>I am a software Development Engineer <span>&#128640;</span></h2>
        </div>
        <div>
          <h4>
            <blockquote>
            Life is like riding a <span  style='font-size:50px;'>&#128690;</span>. 
            To keep your balance, you must keep moving.
            </blockquote> ------&nbsp;<i>Albert Einstein</i>
          </h4>
        </div>          
      </div>
    `

    function HomePageContent(){

        document.getElementById('homepage').innerHTML+=homePage_html;

    }

    window.addEventListener('load', HomePageContent);
}

homePageContain();

